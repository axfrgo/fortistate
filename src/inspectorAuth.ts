import type http from 'http'
import type { SessionStore, SessionRole, SessionContext } from './sessionStore.js'

export type AuthInfo = {
  providedToken: string | null
  sessionContext?: SessionContext
  legacyToken?: boolean
}

export type EnsureOptions = {
  optional?: boolean
  allowLegacy?: boolean
  requireSession?: boolean
  description?: string
}

export type AuthDecision = {
  ok: boolean
  statusCode?: number
  message?: string
  reason?: string
}

export interface RoleEnforcer {
  resolve(headers: http.IncomingHttpHeaders, explicitToken?: string | null): AuthInfo
  enforceHttp(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requiredRole: SessionRole,
    options?: EnsureOptions,
  ): { ok: true; auth: AuthInfo } | { ok: false; decision: AuthDecision; auth: AuthInfo }
  check(auth: AuthInfo, requiredRole: SessionRole, options?: EnsureOptions): AuthDecision
}

const AUTH_CACHE_SYMBOL = Symbol('fortistate.authCache')

export interface RoleEnforcerOptions {
  sessionStore: SessionStore
  requireSessions: boolean
  allowAnonSessions: boolean
  getLegacyToken: () => string | undefined
  debug?: boolean
}

export function createRoleEnforcer(options: RoleEnforcerOptions): RoleEnforcer {
  const { sessionStore, requireSessions, getLegacyToken, debug } = options

  const resolve = (headers: http.IncomingHttpHeaders, explicitToken?: string | null): AuthInfo => {
    let providedToken: string | null = explicitToken ? String(explicitToken).trim() : null
    if (!providedToken) {
      const headerToken = headers['x-fortistate-token']
      if (typeof headerToken === 'string') providedToken = headerToken.trim()
      else if (Array.isArray(headerToken) && headerToken.length > 0 && typeof headerToken[0] === 'string') {
        providedToken = headerToken[0].trim()
      }
    }
    if (!providedToken) {
      const authHeader = headers['authorization']
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        providedToken = authHeader.slice(7).trim()
      }
    }
    if (!providedToken || providedToken.length === 0) providedToken = null

    const info: AuthInfo = { providedToken }
    const legacyToken = getLegacyToken()
    if (providedToken && legacyToken && providedToken === legacyToken) {
      info.legacyToken = true
      return info
    }
    if (providedToken) {
      const ctx = sessionStore.validateToken(providedToken)
      if (ctx) info.sessionContext = ctx
    }
    return info
  }

  const evaluate = (auth: AuthInfo, requiredRole: SessionRole, ensureOptions?: EnsureOptions): AuthDecision => {
    const allowLegacy = Boolean(ensureOptions?.allowLegacy)
    const optional = Boolean(ensureOptions?.optional)
    const legacyConfigured = Boolean(getLegacyToken())
    const requireSession = typeof ensureOptions?.requireSession === 'boolean'
      ? ensureOptions.requireSession
      : (!optional && requireSessions)

    if (auth.legacyToken && allowLegacy) {
      return { ok: true }
    }

    if (auth.sessionContext) {
      const role = auth.sessionContext.session.role
      if (!sessionStore.canAct(role, requiredRole)) {
        return { ok: false, statusCode: 403, message: 'forbidden', reason: 'insufficient-role' }
      }
      return { ok: true }
    }

    if (legacyConfigured && !optional) {
      return { ok: false, statusCode: 401, message: 'unauthorized', reason: 'legacy-token-required' }
    }

    if (!requireSession || optional) {
      return { ok: true }
    }

    return { ok: false, statusCode: 401, message: 'unauthorized', reason: 'session-required' }
  }

  const emitDebug = (details: string) => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[fortistate][auth]', details)
    }
  }

  const enforceHttp = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    requiredRole: SessionRole,
    ensureOptions?: EnsureOptions,
  ) => {
    const cached = (req as any)[AUTH_CACHE_SYMBOL] as AuthInfo | undefined
    const auth = cached ?? resolve(req.headers)
    if (!cached) (req as any)[AUTH_CACHE_SYMBOL] = auth

    const decision = evaluate(auth, requiredRole, ensureOptions)
    if (!decision.ok) {
      const status = decision.statusCode ?? 401
      const message = decision.message ?? 'unauthorized'
      emitDebug(`deny ${ensureOptions?.description || req.url || ''} status=${status} reason=${decision.reason ?? 'unknown'}`)
      res.writeHead(status)
      res.end(message)
      return { ok: false as const, decision, auth }
    }

    emitDebug(`allow ${ensureOptions?.description || req.url || ''} role=${requiredRole} legacy=${Boolean(auth.legacyToken)} session=${auth.sessionContext?.session.id ?? 'none'}`)
    return { ok: true as const, auth }
  }

  const check = (auth: AuthInfo, requiredRole: SessionRole, ensureOptions?: EnsureOptions): AuthDecision => {
    const decision = evaluate(auth, requiredRole, ensureOptions)
    if (debug) {
      const label = ensureOptions?.description ?? 'ws'
      emitDebug(`${decision.ok ? 'allow' : 'deny'} ${label} role=${requiredRole} legacy=${Boolean(auth.legacyToken)} session=${auth.sessionContext?.session.id ?? 'none'} reason=${decision.reason ?? 'none'}`)
    }
    return decision
  }

  return { resolve, enforceHttp, check }
}

export { AUTH_CACHE_SYMBOL }

export type HttpRoleGuard = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  options?: EnsureOptions,
) => AuthInfo | null

export interface RoleMiddleware {
  http: {
    observer: HttpRoleGuard
    editor: HttpRoleGuard
    admin: HttpRoleGuard
  }
  enforce(requiredRole: SessionRole, req: http.IncomingMessage, res: http.ServerResponse, options?: EnsureOptions): AuthInfo | null
  check(auth: AuthInfo, requiredRole: SessionRole, options?: EnsureOptions): AuthDecision
}

export function createRoleMiddleware(roleEnforcer: RoleEnforcer): RoleMiddleware {
  const normalizeOptions = (req: http.IncomingMessage, options?: EnsureOptions): EnsureOptions => ({
    optional: options?.optional,
    allowLegacy: options?.allowLegacy ?? true,
    requireSession: options?.requireSession,
    description: options?.description ?? `${req.method || ''} ${req.url || ''}`.trim(),
  })

  const createGuard = (requiredRole: SessionRole): HttpRoleGuard => {
    return (req, res, options) => {
      const result = roleEnforcer.enforceHttp(req, res, requiredRole, normalizeOptions(req, options))
      if (!result.ok) return null
      return result.auth
    }
  }

  const enforce = (requiredRole: SessionRole, req: http.IncomingMessage, res: http.ServerResponse, options?: EnsureOptions) => {
    const result = roleEnforcer.enforceHttp(req, res, requiredRole, normalizeOptions(req, options))
    if (!result.ok) return null
    return result.auth
  }

  return {
    http: {
      observer: createGuard('observer'),
      editor: createGuard('editor'),
      admin: createGuard('admin'),
    },
    enforce,
    check: (auth, requiredRole, options) => roleEnforcer.check(auth, requiredRole, options),
  }
}