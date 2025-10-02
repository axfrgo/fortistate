import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'
import createInspector from '../dist/inspector.js'
import { WebSocket } from 'ws'
import { createStore } from '../dist/storeFactory.js'

describe('inspector server', () => {
  it('serves client and broadcasts events', async () => {
    const prevAllowAnon = process.env.FORTISTATE_ALLOW_ANON_SESSIONS
    const prevRequireSessions = process.env.FORTISTATE_REQUIRE_SESSIONS
    process.env.FORTISTATE_ALLOW_ANON_SESSIONS = '1'
    process.env.FORTISTATE_REQUIRE_SESSIONS = '0'

    const sessionFile = path.resolve(process.cwd(), '.fortistate-sessions.json')
    try {
      if (fs.existsSync(sessionFile)) fs.unlinkSync(sessionFile)
    } catch (e) { /* ignore */ }

    const srv = createInspector({ port: 4555, quiet: true })
    await srv.start()

    let ws: WebSocket | null = null
    const msgs: any[] = []

    try {
      // create a store before connecting so the snapshot includes it
      createStore('inspector:test', { value: { a: 1 } })
  ws = new WebSocket('ws://localhost:4555')
  const socket = ws

    // attach message handler immediately to avoid missed messages
  socket.on('message', (m: unknown) => {
      try { const s = typeof m === 'string' ? m : (m instanceof Buffer ? m.toString() : JSON.stringify(m)); const parsed = JSON.parse(String(s)); msgs.push(parsed); } catch (e) { msgs.push(String(m)); }
    })

    await new Promise<void>((resolve, reject) => {
      socket.on('open', () => {
        // request snapshot explicitly
        try { socket.send('req:snapshot') } catch (e) { /* ignore */ }
        resolve()
      })
      socket.on('error', reject)
    })

      // wait for a snapshot message by polling msgs (attached earlier)
      await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 5000
      const iv = setInterval(() => {
        if (msgs.some(m => m && m.type === 'snapshot' && m.stores && m.stores['inspector:test'])) {
          clearInterval(iv)
          resolve()
          return
        }
        if (Date.now() > deadline) {
          clearInterval(iv)
              // (silent in CI)
          reject(new Error('no snapshot'))
        }
      }, 50)
  socket.on('error', (e: any) => { clearInterval(iv); reject(e) })
      })

      // (silent in CI)

      // close client first so server.close doesn't hang waiting for active sockets
      await new Promise<void>((resolve) => {
  if (!socket || socket.readyState === socket.CLOSED) return resolve()
  socket.on('close', () => resolve())
  try { socket.close() } catch (e) { resolve() }
        // safety timeout
        setTimeout(() => resolve(), 2000)
      })
  ws = null
      expect(msgs.some(m => m && m.type === 'snapshot' && m.stores && m.stores['inspector:test'])).toBe(true)
    } finally {
      if (ws && ws.readyState !== ws.CLOSED) {
        try { ws.close() } catch (e) { /* ignore */ }
      }
      await srv.stop()
      if (prevAllowAnon === undefined) delete process.env.FORTISTATE_ALLOW_ANON_SESSIONS
      else process.env.FORTISTATE_ALLOW_ANON_SESSIONS = prevAllowAnon
      if (prevRequireSessions === undefined) delete process.env.FORTISTATE_REQUIRE_SESSIONS
      else process.env.FORTISTATE_REQUIRE_SESSIONS = prevRequireSessions
    }
  }, 10000)
})
