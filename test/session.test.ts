import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import http from 'http'
import net from 'net'
import { tmpdir } from 'os'
import { WebSocket } from 'ws'
import { createInspectorServer } from '../src/inspector.js'

type HttpResponse = { status: number; body: string; headers: http.IncomingHttpHeaders }

type InspectorServer = ReturnType<typeof createInspectorServer>

const httpRequest = (opts: { port: number; method?: string; path?: string; body?: any; headers?: http.OutgoingHttpHeaders }): Promise<HttpResponse> => {
  return new Promise<HttpResponse>((resolve, reject) => {
    const body = opts.body === undefined
      ? undefined
      : (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body))

    const req = http.request({
      hostname: '127.0.0.1',
      port: opts.port,
      method: opts.method ?? 'GET',
      path: opts.path ?? '/',
      headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers ?? {}),
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk.toString() })
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data, headers: res.headers }))
    })

    req.on('error', reject)
    req.setTimeout(5000, () => req.destroy(new Error('timeout')))
    if (body) req.write(body)
    req.end()
  })
}

const findFreePort = (): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const address = srv.address()
      srv.close()
      if (!address || typeof address !== 'object') return reject(new Error('no address'))
      resolve(address.port)
    })
    srv.on('error', reject)
  })
}

describe('inspector sessions, audit, and websocket auth', () => {
  let server: InspectorServer
  let port: number
  let cwd: string
  let adminToken: string
  let editorToken: string

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(tmpdir(), 'fortistate-session-'))
    process.env.FORTISTATE_REQUIRE_SESSIONS = '1'
    delete process.env.FORTISTATE_ALLOW_ANON_SESSIONS

    port = await findFreePort()
    server = createInspectorServer({ port, quiet: true, cwd })
    await server.start()

    const adminRes = await httpRequest({ port, method: 'POST', path: '/session/create', body: { role: 'admin' } })
    expect(adminRes.status).toBe(200)
    adminToken = JSON.parse(adminRes.body).token
    expect(typeof adminToken).toBe('string')

    const editorRes = await httpRequest({
      port,
      method: 'POST',
      path: '/session/create',
      body: { role: 'editor' },
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(editorRes.status).toBe(200)
    editorToken = JSON.parse(editorRes.body).token
    expect(typeof editorToken).toBe('string')

    const registerRes = await httpRequest({
      port,
      method: 'POST',
      path: '/register',
      body: { key: 'session.test', initial: { hello: 'world' } },
      headers: { 'x-fortistate-token': editorToken },
    })
    expect(registerRes.status).toBe(200)
  }, 30000)

  afterAll(async () => {
    try {
      await server.stop()
    } catch (e) {
      // ignore
    }
    delete process.env.FORTISTATE_REQUIRE_SESSIONS
    delete process.env.FORTISTATE_ALLOW_ANON_SESSIONS
    try {
      fs.rmSync(cwd, { recursive: true, force: true })
    } catch (e) {
      // ignore cleanup errors
    }
  })

  it('rejects audit log access without admin session', async () => {
    const res = await httpRequest({ port, path: '/audit/log?limit=10' })
    expect(res.status).toBe(401)
  })

  it('rejects session revoke without admin role', async () => {
    const res = await httpRequest({
      port,
      method: 'POST',
      path: '/session/revoke',
      body: { sessionId: 'noop' },
      headers: { 'x-fortistate-token': editorToken },
    })
    expect(res.status).toBe(403)
  })

  it('revokes sessions by id and token', async () => {
    const viaIdRes = await httpRequest({
      port,
      method: 'POST',
      path: '/session/create',
      body: { role: 'observer', label: 'revoke-id' },
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(viaIdRes.status).toBe(200)
    const viaIdJson = JSON.parse(viaIdRes.body)
    const viaIdSession = viaIdJson.session
    expect(viaIdSession?.id).toBeTruthy()

    const revokeById = await httpRequest({
      port,
      method: 'POST',
      path: '/session/revoke',
      body: { sessionId: viaIdSession.id },
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(revokeById.status).toBe(200)
    const revokeByIdJson = JSON.parse(revokeById.body)
    expect(revokeByIdJson.revoked).toBe(true)
    expect(revokeByIdJson.sessionId).toBe(viaIdSession.id)

    const listAfterId = await httpRequest({
      port,
      path: '/session/list',
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(listAfterId.status).toBe(200)
    const listAfterIdJson = JSON.parse(listAfterId.body)
    const remainingIds = (listAfterIdJson.sessions as Array<{ id: string }>).map((s) => s.id)
    expect(remainingIds).not.toContain(viaIdSession.id)

    const viaTokenRes = await httpRequest({
      port,
      method: 'POST',
      path: '/session/create',
      body: { role: 'observer', label: 'revoke-token' },
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(viaTokenRes.status).toBe(200)
    const viaTokenJson = JSON.parse(viaTokenRes.body)
    const viaTokenSession = viaTokenJson.session
    const viaTokenToken = viaTokenJson.token
    expect(viaTokenSession?.id).toBeTruthy()
    expect(typeof viaTokenToken).toBe('string')

    const revokeByToken = await httpRequest({
      port,
      method: 'POST',
      path: '/session/revoke',
      body: { token: viaTokenToken },
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(revokeByToken.status).toBe(200)
    const revokeByTokenJson = JSON.parse(revokeByToken.body)
    expect(revokeByTokenJson.revoked).toBe(true)
    expect(revokeByTokenJson.sessionId).toBe(viaTokenSession.id)

    const listAfterToken = await httpRequest({
      port,
      path: '/session/list',
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(listAfterToken.status).toBe(200)
    const listAfterTokenJson = JSON.parse(listAfterToken.body)
    const remainingAfterToken = (listAfterTokenJson.sessions as Array<{ id: string }>).map((s) => s.id)
    expect(remainingAfterToken).not.toContain(viaTokenSession.id)

    const auditPath = path.resolve(cwd, '.fortistate-audit.log')
    const auditLines = fs.readFileSync(auditPath, 'utf-8').trim().split(/\r?\n/)
    expect(auditLines.some((line) => line.includes('"action":"session:revoke"'))).toBe(true)
  })

  it('allows admin to read audit log and returns recent entries', async () => {
    const res = await httpRequest({
      port,
      path: '/audit/log?limit=25',
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(res.status).toBe(200)
    const payload = JSON.parse(res.body)
    expect(Array.isArray(payload.entries)).toBe(true)
    expect(payload.entries.length).toBeGreaterThan(0)
    expect(payload.limit).toBe(25)
    const actions = payload.entries.map((entry: any) => entry?.action).filter(Boolean)
    expect(actions).toContain('session:create')
    expect(actions).toContain('store:register')

    const auditPath = path.resolve(cwd, '.fortistate-audit.log')
    expect(fs.existsSync(auditPath)).toBe(true)
    const logLines = fs.readFileSync(auditPath, 'utf-8').trim().split(/\r?\n/)
    expect(logLines.some((line) => line.includes('"action":"audit:read"'))).toBe(true)
  })

  it('returns 400 for invalid JSON bodies when creating sessions', async () => {
    const res = await httpRequest({
      port,
      method: 'POST',
      path: '/session/create',
      body: '{"role":"observer"',
      headers: { 'Content-Type': 'application/json', 'x-fortistate-token': adminToken },
    })
    expect(res.status).toBe(400)
    expect(res.body).toBe('invalid json')
  })

  it('enforces payload size limits for session creation', async () => {
    const bigLabel = 'a'.repeat(1024 * 1024 + 100)
    const res = await httpRequest({
      port,
      method: 'POST',
      path: '/session/create',
      body: { role: 'observer', label: bigLabel },
      headers: { 'x-fortistate-token': adminToken },
    })
    expect(res.status).toBe(413)
    expect(res.body).toBe('payload too large')
  })

  it('enforces websocket authentication when sessions are required', async () => {
    await new Promise<void>((resolve) => {
      const unauth = new WebSocket(`ws://127.0.0.1:${port}`)
      let closed = false
      const finish = () => {
        if (closed) return
        closed = true
        resolve()
      }
      unauth.on('close', (code) => {
        expect(code).toBe(4401)
        finish()
      })
      unauth.on('error', () => finish())
    })

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`, {
        headers: { 'x-fortistate-token': editorToken },
      })
      const timer = setTimeout(() => {
        ws.terminate()
        reject(new Error('timeout waiting for snapshot'))
      }, 8000)

      ws.on('message', (raw) => {
        try {
          const parsed = JSON.parse(raw.toString())
          if (parsed.type === 'snapshot' && parsed.stores && parsed.stores['session.test']) {
            clearTimeout(timer)
            ws.close()
            resolve()
          }
        } catch (e) {
          // ignore non-JSON payloads
        }
      })

      ws.on('open', () => {
        try { ws.send('req:snapshot') } catch (e) { /* ignore */ }
      })

      ws.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
  })
})
