import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import type http from 'http'
import { SessionStore } from '../src/sessionStore.js'
import { createRoleEnforcer, createRoleMiddleware } from '../src/inspectorAuth.js'

type MockResponse = http.ServerResponse & {
  statusCode: number
  headers: Record<string, number | string | string[]>
  body: unknown
}

type MockRequest = http.IncomingMessage & {
  headers: http.IncomingHttpHeaders
  method?: string
  url?: string
}

const makeRequest = (headers: http.IncomingHttpHeaders = {}, method = 'GET', url = '/test'): MockRequest => {
  return {
    headers,
    method,
    url,
  } as MockRequest
}

const makeResponse = (): MockResponse => {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, number | string | string[]>,
    body: undefined,
    writeHead(status: number) {
      res.statusCode = status
      return res
    },
    setHeader(name: string, value: number | string | readonly string[]) {
      res.headers[name.toLowerCase()] = Array.isArray(value) ? [...value] : value
    },
    end(payload?: any) {
      res.body = payload
      return res
    },
  }
  return res as MockResponse
}

describe('createRoleEnforcer', () => {
  let cwd: string

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(tmpdir(), 'fortistate-auth-'))
  })

  afterEach(() => {
    try {
      fs.rmSync(cwd, { recursive: true, force: true })
    } catch (e) {
      // ignore
    }
  })

  it('allows legacy tokens when allowed and denies when disallowed', () => {
    const store = new SessionStore({ rootDir: cwd, debug: true })
    const enforcer = createRoleEnforcer({
      sessionStore: store,
      requireSessions: true,
      allowAnonSessions: false,
      getLegacyToken: () => 'legacy-token',
      debug: true,
    })

    const resAllowed = makeResponse()
    const allowed = enforcer.enforceHttp(
      makeRequest({ 'x-fortistate-token': 'legacy-token' }),
      resAllowed,
      'admin',
      { allowLegacy: true },
    )
    expect(allowed.ok).toBe(true)
    expect(resAllowed.statusCode).toBe(200)

    const resDenied = makeResponse()
    const denied = enforcer.enforceHttp(
      makeRequest({ 'x-fortistate-token': 'legacy-token' }),
      resDenied,
      'admin',
      { allowLegacy: false },
    )
  expect(denied.ok).toBe(false)
  if (denied.ok) throw new Error('expected deny')
  expect(denied.decision.reason).toBe('legacy-token-required')
  expect(resDenied.statusCode).toBe(401)
  expect(resDenied.body).toBe('unauthorized')
  })

  it('requires sessions when configured but respects optional routes', () => {
    const store = new SessionStore({ rootDir: cwd })
    const enforcer = createRoleEnforcer({
      sessionStore: store,
      requireSessions: true,
      allowAnonSessions: false,
      getLegacyToken: () => undefined,
    })

    const resRequired = makeResponse()
    const required = enforcer.enforceHttp(makeRequest(), resRequired, 'observer')
  expect(required.ok).toBe(false)
  if (required.ok) throw new Error('expected deny')
  expect(required.decision.reason).toBe('session-required')
  expect(resRequired.statusCode).toBe(401)

    const resOptional = makeResponse()
    const optional = enforcer.enforceHttp(makeRequest(), resOptional, 'observer', { optional: true })
    expect(optional.ok).toBe(true)
    expect(resOptional.statusCode).toBe(200)
  })

  it('enforces role hierarchy for session tokens via check()', () => {
    const store = new SessionStore({ rootDir: cwd })
    const { token } = store.createSession({ role: 'editor' })

    const enforcer = createRoleEnforcer({
      sessionStore: store,
      requireSessions: true,
      allowAnonSessions: false,
      getLegacyToken: () => undefined,
    })

    const auth = enforcer.resolve({ 'x-fortistate-token': token })
    expect(auth.sessionContext?.session.role).toBe('editor')

    const deny = enforcer.check(auth, 'admin')
    expect(deny.ok).toBe(false)
    expect(deny.reason).toBe('insufficient-role')

    const allow = enforcer.check(auth, 'observer')
    expect(allow.ok).toBe(true)
  })
})

describe('createRoleMiddleware', () => {
  let cwd: string

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(tmpdir(), 'fortistate-auth-mw-'))
  })

  afterEach(() => {
    try {
      fs.rmSync(cwd, { recursive: true, force: true })
    } catch (e) {
      // ignore
    }
  })

  it('allows legacy tokens for admin guard by default', () => {
    const store = new SessionStore({ rootDir: cwd })
    const enforcer = createRoleEnforcer({
      sessionStore: store,
      requireSessions: true,
      allowAnonSessions: false,
      getLegacyToken: () => 'legacy-token',
    })
    const middleware = createRoleMiddleware(enforcer)

    const req = makeRequest({ 'x-fortistate-token': 'legacy-token' }, 'GET', '/admin')
    const res = makeResponse()

    const auth = middleware.http.admin(req, res)
    expect(auth).not.toBeNull()
    expect(auth?.legacyToken).toBe(true)
    expect(res.statusCode).toBe(200)
  })

  it('rejects insufficient roles via editor guard', () => {
    const store = new SessionStore({ rootDir: cwd })
    const { token } = store.createSession({ role: 'observer' })
    const enforcer = createRoleEnforcer({
      sessionStore: store,
      requireSessions: true,
      allowAnonSessions: false,
      getLegacyToken: () => undefined,
    })
    const middleware = createRoleMiddleware(enforcer)

    const req = makeRequest({ 'x-fortistate-token': token }, 'POST', '/change')
    const res = makeResponse()

    const auth = middleware.http.editor(req, res)
    expect(auth).toBeNull()
    expect(res.statusCode).toBe(403)
    expect(res.body).toBe('forbidden')
  })

  it('treats observer guard as optional when requested', () => {
    const store = new SessionStore({ rootDir: cwd })
    const enforcer = createRoleEnforcer({
      sessionStore: store,
      requireSessions: true,
      allowAnonSessions: false,
      getLegacyToken: () => undefined,
    })
    const middleware = createRoleMiddleware(enforcer)

    const req = makeRequest({}, 'GET', '/session/current')
    const res = makeResponse()

    const auth = middleware.http.observer(req, res, { optional: true })
    expect(auth).not.toBeNull()
    expect(auth?.sessionContext).toBeUndefined()
    expect(res.statusCode).toBe(200)
  })

  it('delegates websocket checks through middleware', () => {
    const store = new SessionStore({ rootDir: cwd })
    const { token } = store.createSession({ role: 'editor' })
    const enforcer = createRoleEnforcer({
      sessionStore: store,
      requireSessions: true,
      allowAnonSessions: false,
      getLegacyToken: () => undefined,
    })
    const middleware = createRoleMiddleware(enforcer)
    const auth = enforcer.resolve({ 'x-fortistate-token': token })

    const decision = middleware.check(auth, 'observer', { optional: false })
    expect(decision.ok).toBe(true)

    const deny = middleware.check(auth, 'admin')
    expect(deny.ok).toBe(false)
    expect(deny.reason).toBe('insufficient-role')
  })
})
