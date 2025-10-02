import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { WebSocketServer, WebSocket } from 'ws'
import { spawn, spawnSync } from 'child_process'
import { globalStoreFactory } from './storeFactory.js'
import inspectorClientHtml from './client/inspectorClient.js'
import { applyPreset, listPresets, listPresetObjects, installPresetCss } from './presets.js'
import { duplicateStore, swapStores, moveStore } from './stateUtils.js'
import { loadPlugins } from './loader.js'
import { getRegistered } from './plugins.js'
import { AuditLog } from './audit.js'
import { SessionStore, SessionRole } from './sessionStore.js'
import { createRoleEnforcer, createRoleMiddleware, type AuthInfo, type EnsureOptions } from './inspectorAuth.js'
import { PresenceManager, type PresenceUpdateMessage } from './presence.js'

const DURATION_UNITS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
  w: 1000 * 60 * 60 * 24 * 7,
}

const MAX_JSON_BODY_BYTES = 1024 * 1024 // 1 MiB safety limit for JSON payloads

const readJsonBody = (req: http.IncomingMessage, limit = MAX_JSON_BODY_BYTES): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = ''
    let received = 0
    let completed = false
    let tooLarge = false
    const noop = () => {}

    const cleanup = () => {
      req.off('data', onData)
      req.off('end', onEnd)
      req.off('error', onError)
      req.off('data', noop)
    }

    const finish = (fn: () => void) => {
      if (completed) return
      completed = true
      cleanup()
      fn()
    }

    const onData = (chunk: Buffer | string) => {
      if (tooLarge || completed) return
      const piece = typeof chunk === 'string' ? chunk : chunk.toString('utf-8')
      received += piece.length
      if (received > limit) {
        tooLarge = true
        req.on('data', noop)
        req.resume()
        finish(() => reject(new Error('payload too large')))
        return
      }
      body += piece
    }

    const onEnd = () => {
      if (completed) return
      if (tooLarge) {
        finish(() => reject(new Error('payload too large')))
        return
      }
      if (!body) {
        finish(() => resolve({}))
        return
      }
      try {
        const parsed = JSON.parse(body)
        finish(() => resolve(parsed))
      } catch (err) {
        finish(() => reject(err instanceof Error ? err : new Error('invalid json')))
      }
    }

    const onError = (err: unknown) => {
      finish(() => reject(err instanceof Error ? err : new Error('invalid json')))
    }

    req.on('data', onData)
    req.on('end', onEnd)
    req.on('error', onError)
  })
}

function parseDuration(value?: string | null): number | undefined {
  if (!value) return undefined
  if (/^\d+$/.test(value)) return Number(value)
  const match = String(value).trim().match(/^([0-9]+(?:\.[0-9]+)?)([a-zA-Z]+)$/)
  if (!match) return undefined
  const amount = Number(match[1])
  const unit = match[2].toLowerCase()
  const base = DURATION_UNITS[unit]
  if (!base || Number.isNaN(amount)) return undefined
  return amount * base
}

export function createInspectorServer(opts: { port?: number; quiet?: boolean; token?: string; allowOrigin?: string; allowOriginStrict?: boolean; devClient?: boolean; host?: string; cwd?: string } = {}) {
  const port = opts.port || 4000
  const quiet = Boolean(opts.quiet)
  const host = typeof opts.host === 'string' ? opts.host : undefined
  const root = typeof opts.cwd === 'string' ? opts.cwd : process.cwd()
  // mutable token value (can be updated via /set-token)
  let token = typeof opts.token === 'string' ? opts.token : undefined
  const tokenFile = path.resolve(root, '.fortistate-inspector-token')
  try {
    if (!token && fs.existsSync(tokenFile)) {
      const raw = fs.readFileSync(tokenFile, 'utf-8')
      try { token = JSON.parse(raw).token } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
  const allowOriginOption = typeof opts.allowOrigin === 'string' ? opts.allowOrigin : process.env.FORTISTATE_INSPECTOR_ALLOW_ORIGIN
  const allowOriginStrict = Boolean(opts.allowOriginStrict || process.env.FORTISTATE_INSPECTOR_ALLOW_ORIGIN_STRICT === '1')
  let server: http.Server | null = null
  let wss: WebSocketServer | null = null
  // stores registered remotely (from other processes / browser)
  const remoteStores: Record<string, any> = {}
  const persistFile = path.resolve(root, '.fortistate-remote-stores.json')

  const base = path.dirname(fileURLToPath(import.meta.url))
  // prefer embedded module HTML; if devClient option (or env) is enabled prefer the examples copy
  const devClientEnabled = Boolean(opts.devClient) || process.env.FORTISTATE_INSPECTOR_DEV_CLIENT === '1'
  let clientHtml = inspectorClientHtml
  if (devClientEnabled) {
    try {
      const devCopy = path.resolve(base, '..', 'examples', 'inspector-client.html')
      if (fs.existsSync(devCopy)) clientHtml = fs.readFileSync(devCopy, 'utf-8')
    } catch (e) { /* ignore */ }
  }

  const pluginStoreKeys = new Set<string>()
  let configWatchPaths: string[] = []
  let configWatcher: any = null
  let chokidarUnavailable = false
  let refreshingConfig = false
  let refreshQueued = false
  let refreshQueuedReason = 'change'
  let shuttingDown = false

  // Telemetry buffer for law violations/repairs (cosmogenesis runtime)
  const telemetryBuffer: Array<any> = []
  const telemetryClients = new Set<http.ServerResponse>()
  const MAX_TELEMETRY_BUFFER = 100

  const emitTelemetry = (entry: any) => {
    telemetryBuffer.push(entry)
    if (telemetryBuffer.length > MAX_TELEMETRY_BUFFER) {
      telemetryBuffer.shift()
    }
    // Broadcast to SSE clients
    const message = `data: ${JSON.stringify(entry)}\n\n`
    for (const client of telemetryClients) {
      try {
        if (!client.writableEnded) client.write(message)
      } catch (e) {
        telemetryClients.delete(client)
      }
    }
  }

  const persistRemoteStoresSafe = () => {
    try { fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2)) } catch (e) { /* ignore */ }
  }

  const broadcastStoreMessage = (msg: { type: 'store:create' | 'store:change'; key: string; initial?: any; value?: any }) => {
    if (!wss) return
    wss.clients.forEach((c: any) => {
      try { if (c.readyState === 1) c.send(JSON.stringify(msg)) } catch (e) { /* ignore */ }
    })
  }

  const gatherConfigWatchTargets = (configPath?: string | null, config?: Record<string, unknown>) => {
    const targets = new Set<string>()
    if (configPath) targets.add(path.resolve(configPath))
    else {
      const defaults = ['fortistate.config.js', 'fortistate.config.cjs', 'fortistate.config.mjs']
      for (const name of defaults) targets.add(path.resolve(root, name))
    }
    const addEntry = (entry: unknown) => {
      if (typeof entry === 'string' && entry.trim()) {
        const abs = path.isAbsolute(entry) ? entry : path.resolve(root, entry)
        targets.add(abs)
      }
    }
    const presets = Array.isArray((config as any)?.presets) ? (config as any).presets as unknown[] : []
    for (const preset of presets) addEntry(preset)
    const plugins = Array.isArray((config as any)?.plugins) ? (config as any).plugins as unknown[] : []
    for (const plugin of plugins) addEntry(plugin)
    return Array.from(targets)
  }

  const applyPluginStores = (registered: Record<string, any>) => {
    const newKeys = Object.keys(registered || {})
    const removed = Array.from(pluginStoreKeys).filter(key => !newKeys.includes(key))
    for (const key of removed) {
      pluginStoreKeys.delete(key)
      if (Object.prototype.hasOwnProperty.call(remoteStores, key)) {
        delete remoteStores[key]
        broadcastStoreMessage({ type: 'store:change', key, value: null })
      }
    }
    for (const key of newKeys) {
      const existed = pluginStoreKeys.has(key)
      pluginStoreKeys.add(key)
      let value: any
      try {
        const store = globalStoreFactory.get(key)
        value = store ? store.get() : registered[key]
      } catch (e) {
        value = registered[key]
      }
      remoteStores[key] = value
      broadcastStoreMessage(existed ? { type: 'store:change', key, value } : { type: 'store:create', key, initial: value })
    }
    if (newKeys.length || removed.length) persistRemoteStoresSafe()
  }

  const queueConfigRefresh = (reason: string) => {
    if (shuttingDown) return
    refreshQueuedReason = reason
    if (refreshingConfig) {
      refreshQueued = true
      return
    }
    void refreshConfig(reason)
  }

  const ensureConfigWatcher = async (targets: string[]) => {
    if (shuttingDown) return
    const normalized = Array.from(new Set(targets.map(t => path.resolve(t)))).sort()
    if (normalized.length === 0) {
      if (configWatcher) {
        try { await configWatcher.close() } catch (e) { /* ignore */ }
        configWatcher = null
      }
      configWatchPaths = []
      return
    }
    if (configWatchPaths.length === normalized.length && configWatchPaths.every((v, i) => v === normalized[i])) return
    configWatchPaths = normalized
    if (configWatcher) {
      try { await configWatcher.close() } catch (e) { /* ignore */ }
      configWatcher = null
    }
    if (process.env.FORTISTATE_DISABLE_CONFIG_WATCH === '1') return
    if (chokidarUnavailable) return
    try {
      const chokidar = await import('chokidar')
      configWatcher = chokidar.watch(normalized, { ignoreInitial: true })
      const handle = (file: string) => queueConfigRefresh('config-watch:' + path.relative(root, file))
      configWatcher.on('add', handle)
      configWatcher.on('change', handle)
      configWatcher.on('unlink', handle)
      if (!quiet) {
        console.log('[fortistate][inspector] watching config files:', normalized.map(p => path.relative(root, p)).join(', '))
      }
    } catch (err) {
      chokidarUnavailable = true
      if (!quiet) console.warn('[fortistate][inspector] config watch disabled:', (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err))
    }
  }

  const refreshConfig = async (reason: string) => {
    if (shuttingDown) return
    refreshingConfig = true
    try {
      const result = await loadPlugins(root)
      const registered = getRegistered()
      applyPluginStores(registered)
      const targets = gatherConfigWatchTargets(result.configPath, result.config)
      if (!shuttingDown) await ensureConfigWatcher(targets)
      if (!quiet && !shuttingDown) {
        const count = Object.keys(registered || {}).length
        console.log('[fortistate][inspector] config loaded (' + reason + '): ' + count + ' plugin store' + (count === 1 ? '' : 's'))
      }
    } catch (err) {
      if (!quiet && !shuttingDown) console.warn('[fortistate][inspector] config load failed:', (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err))
    } finally {
      refreshingConfig = false
      if (refreshQueued) {
        refreshQueued = false
        const queuedReason = refreshQueuedReason
        refreshQueuedReason = 'change'
        if (!shuttingDown) void refreshConfig(queuedReason)
      }
    }
  }

  return {
    start: async () => {
      shuttingDown = false
      const debugEnabled = process.env.FORTISTATE_DEBUG === '1'
      const requireSessions = process.env.FORTISTATE_REQUIRE_SESSIONS === '1'
      const allowAnonSessions = process.env.FORTISTATE_ALLOW_ANON_SESSIONS === '1'
      const sessionStore = new SessionStore({
        rootDir: root,
        debug: debugEnabled,
        defaultTtlMs: parseDuration(process.env.FORTISTATE_SESSION_TTL) ?? undefined,
        maxSessions: process.env.FORTISTATE_SESSION_MAX ? Number(process.env.FORTISTATE_SESSION_MAX) : undefined,
      })
      const auditLog = new AuditLog({
        rootDir: root,
        debug: debugEnabled,
        rotationMaxSizeBytes: process.env.FORTISTATE_AUDIT_MAX_SIZE ? Number(process.env.FORTISTATE_AUDIT_MAX_SIZE) : undefined,
        rotationMaxAgeDays: process.env.FORTISTATE_AUDIT_ROTATE_DAYS ? Number(process.env.FORTISTATE_AUDIT_ROTATE_DAYS) : undefined,
      })
      const presenceManager = new PresenceManager({
        debug: debugEnabled,
      })


      const roleEnforcer = createRoleEnforcer({
        sessionStore,
        requireSessions,
        allowAnonSessions,
        getLegacyToken: () => token,
        debug: debugEnabled,
      })

      const roleMiddleware = createRoleMiddleware(roleEnforcer)

      const recordAudit = (action: string, auth: AuthInfo | null | undefined, details?: Record<string, unknown>) => {
        auditLog.append({
          action,
          sessionId: auth?.sessionContext?.session.id ?? null,
          role: auth?.sessionContext?.session.role ?? (auth?.legacyToken ? 'legacy' : null),
          details,
          time: new Date().toISOString(),
        })
      }

      server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
        const requireObserver = (options?: EnsureOptions) => roleMiddleware.http.observer(req, res, options)
        const requireEditor = (options?: EnsureOptions) => roleMiddleware.http.editor(req, res, options)
        const requireAdmin = (options?: EnsureOptions) => roleMiddleware.http.admin(req, res, options)

        const auditEvent = (action: string, auth: AuthInfo | null | undefined, details?: Record<string, unknown>) => {
          recordAudit(action, auth, details)
        }

        const setCors = (allowedOrigin?: string | undefined) => {
          if (allowOriginOption === '*') {
            res.setHeader('Access-Control-Allow-Origin', '*')
          } else {
            const origin = allowedOrigin || (req.headers.origin as string | undefined) || allowOriginOption
            if (origin) res.setHeader('Access-Control-Allow-Origin', origin)
            if (origin) res.setHeader('Access-Control-Allow-Credentials', 'true')
          }
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-fortistate-token, Authorization')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        }

        if (req.method === 'POST' && req.url === '/session/create') {
          const allowedOrigin = req.headers.origin as string | undefined
          setCors(allowedOrigin)

          const sendError = (status: number, message: string) => {
            if (!res.headersSent) {
              res.statusCode = status
              if (!res.hasHeader('Content-Type')) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8')
              }
            }
            if (!res.writableEnded) res.end(message)
          }

          void (async () => {
            try {
              const rawPayload = await readJsonBody(req)
              const payload = (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload) ? rawPayload : {}) as { role?: SessionRole; expiresIn?: string | number; label?: string }
              const requestedRole = (payload.role ?? 'observer') as SessionRole
              if (!['observer', 'editor', 'admin'].includes(requestedRole)) {
                sendError(400, 'bad role')
                return
              }
              const ttlMs = typeof payload.expiresIn === 'number' ? payload.expiresIn : parseDuration(payload.expiresIn ? String(payload.expiresIn) : undefined)
              const requiresAuth = sessionStore.hasSessions() && !allowAnonSessions
              let auth: AuthInfo | null = null
              if (requestedRole === 'admin') {
                // Allow first admin session creation without auth
                auth = requireAdmin({ optional: true, allowLegacy: true })
                if (!auth) return
              } else if (requiresAuth) {
                auth = requireEditor({ optional: false, allowLegacy: true })
                if (!auth) return
              } else {
                auth = requireObserver({ optional: true, allowLegacy: true })
                if (!auth) return
              }
              const { session, token: issuedToken, tokenType } = sessionStore.createSession({
                role: requestedRole,
                ttlMs: typeof ttlMs === 'number' ? ttlMs : undefined,
                label: payload.label,
                issuedBy: auth?.sessionContext?.session.id,
                ip: req.socket.remoteAddress,
                userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
              })
              auditEvent('session:create', auth, { createdSessionId: session.id, role: session.role })
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('X-Fortistate-Session-Id', session.id)
              res.writeHead(200)
              res.end(JSON.stringify({ session, token: issuedToken, tokenType }))
            } catch (e) {
              const message = e instanceof Error ? e.message : 'error'
              if (message === 'payload too large') {
                sendError(413, message)
              } else if (e instanceof SyntaxError || message.toLowerCase().includes('invalid json')) {
                sendError(400, 'invalid json')
              } else {
                sendError(500, 'error')
              }
            }
          })()
          return
        }

        if (req.method === 'GET' && req.url === '/session/current') {
          const auth = requireObserver({ optional: true, allowLegacy: true })
          if (auth === null) return
          setCors(req.headers.origin as string | undefined)
          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          res.end(JSON.stringify({
            session: auth?.sessionContext?.session ?? null,
            legacyToken: Boolean(auth?.legacyToken),
            requireSessions,
            allowAnonSessions,
            hasSessions: sessionStore.hasSessions(),
          }))
          return
        }

        if (req.method === 'GET' && req.url === '/session/list') {
          const auth = requireAdmin({ allowLegacy: true })
          if (!auth) return
          setCors(req.headers.origin as string | undefined)
          res.setHeader('Content-Type', 'application/json')
          sessionStore.cleanupExpired()
          res.writeHead(200)
          res.end(JSON.stringify({ sessions: sessionStore.listSessions() }))
          return
        }

        if (req.method === 'POST' && req.url === '/session/revoke') {
          const auth = requireAdmin({ allowLegacy: true })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => { body += c.toString() })
          req.on('end', () => {
            const allowedOrigin = req.headers.origin as string | undefined
            setCors(allowedOrigin)
            try {
              const payload = JSON.parse(body || '{}') as { sessionId?: string; token?: string }
              const rawSessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : ''
              const rawToken = typeof payload.token === 'string' ? payload.token.trim() : ''
              if (!rawSessionId && !rawToken) {
                res.writeHead(400)
                res.end('bad request')
                auditEvent('session:revoke', auth, { success: false, reason: 'missing-identifier' })
                return
              }

              let targetSessionId = rawSessionId || ''
              if (!targetSessionId && rawToken) {
                const ctx = sessionStore.validateToken(rawToken)
                if (ctx?.session?.id) targetSessionId = ctx.session.id
              }

              if (!targetSessionId) {
                res.writeHead(404)
                res.end('not found')
                auditEvent('session:revoke', auth, { success: false, reason: 'unknown-session', viaToken: Boolean(rawToken) })
                return
              }

              const revoked = sessionStore.revokeSession(targetSessionId)
              if (!revoked) {
                res.writeHead(404)
                res.end('not found')
                auditEvent('session:revoke', auth, { success: false, reason: 'not-found', sessionId: targetSessionId, viaToken: Boolean(rawToken) })
                return
              }

              auditEvent('session:revoke', auth, { success: true, sessionId: targetSessionId, viaToken: Boolean(rawToken) })
              res.setHeader('Content-Type', 'application/json')
              res.writeHead(200)
              res.end(JSON.stringify({ revoked: true, sessionId: targetSessionId }))
            } catch (e) {
              res.writeHead(500)
              res.end('error')
            }
          })
          return
        }

        if (req.method === 'GET' && req.url?.startsWith('/audit/log')) {
          const auth = requireAdmin({ allowLegacy: true })
          if (!auth) return
          const allowedOrigin = req.headers.origin as string | undefined
          setCors(allowedOrigin)
          try {
            const urlObj = new URL(req.url, 'http://localhost')
            const limitParam = urlObj.searchParams.get('limit')
            const formatParam = (urlObj.searchParams.get('format') || 'json').toLowerCase()
            let limit = 200
            if (limitParam) {
              const parsed = Number(limitParam)
              if (!Number.isNaN(parsed) && parsed > 0) limit = parsed
            }
            limit = Math.max(1, Math.min(limit, 1000))
            const auditPath = path.resolve(root, '.fortistate-audit.log')
            let entries: Array<Record<string, unknown>> = []
            let totalLines = 0
            if (fs.existsSync(auditPath)) {
              const raw = fs.readFileSync(auditPath, 'utf-8')
              const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0)
              totalLines = lines.length
              const recent = lines.slice(-limit)
              entries = recent.map((line) => {
                try {
                  return JSON.parse(line) as Record<string, unknown>
                } catch (e) {
                  return { raw: line, parseError: true }
                }
              })
            }

            if (formatParam === 'csv') {
              const csvLines = ['time,action,sessionId,role,details']
              for (const entry of entries) {
                const time = entry.time || ''
                const action = entry.action || ''
                const sessionId = entry.sessionId || ''
                const role = entry.role || ''
                const details = entry.details ? JSON.stringify(entry.details).replace(/"/g, '""') : ''
                csvLines.push(`"${time}","${action}","${sessionId}","${role}","${details}"`)
              }
              res.setHeader('Content-Type', 'text/csv; charset=utf-8')
              res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"')
              res.writeHead(200)
              res.end(csvLines.join('\n'))
              auditEvent('audit:read', auth, { limit, returned: entries.length, format: 'csv' })
            } else if (formatParam === 'plain') {
              const plainLines = ['time\taction\tsessionId\trole\tdetails']
              for (const entry of entries) {
                const time = entry.time || ''
                const action = entry.action || ''
                const sessionId = entry.sessionId || ''
                const role = entry.role || ''
                const details = entry.details ? JSON.stringify(entry.details) : ''
                plainLines.push(`${time}\t${action}\t${sessionId}\t${role}\t${details}`)
              }
              res.setHeader('Content-Type', 'text/plain; charset=utf-8')
              res.writeHead(200)
              res.end(plainLines.join('\n'))
              auditEvent('audit:read', auth, { limit, returned: entries.length, format: 'plain' })
            } else {
              // json format (default)
              res.setHeader('Content-Type', 'application/json')
              res.writeHead(200)
              res.end(JSON.stringify({
                entries,
                totalLines,
                returned: entries.length,
                limit,
              }))
              auditEvent('audit:read', auth, { limit, returned: entries.length, format: 'json' })
            }
          } catch (e) {
            res.writeHead(500)
            res.end('error')
          }
          return
        }

        // Telemetry SSE stream endpoint
        if (req.method === 'GET' && req.url === '/telemetry/stream') {
          const auth = requireObserver({ optional: !requireSessions, allowLegacy: true })
          if (!auth) return
          const allowedOrigin = req.headers.origin as string | undefined
          setCors(allowedOrigin)
          
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          })
          
          // Send buffered telemetry on connection
          for (const entry of telemetryBuffer) {
            res.write(`data: ${JSON.stringify(entry)}\n\n`)
          }
          
          // Add client to active set
          telemetryClients.add(res)
          auditEvent('telemetry:connect', auth, { origin: allowedOrigin })
          
          // Keep-alive ping every 30s
          const keepAlive = setInterval(() => {
            try {
              if (!res.writableEnded) res.write(': ping\n\n')
            } catch (e) {
              clearInterval(keepAlive)
              telemetryClients.delete(res)
            }
          }, 30000)
          
          req.on('close', () => {
            clearInterval(keepAlive)
            telemetryClients.delete(res)
            auditEvent('telemetry:disconnect', auth)
          })
          
          return
        }

        if (req.method === 'GET' && req.url === '/presence') {
          const auth = requireObserver({ optional: true, allowLegacy: true })
          if (!auth) return
          const allowedOrigin = req.headers.origin as string | undefined
          setCors(allowedOrigin)
          try {
            const users = presenceManager.getAll()
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(200)
            res.end(JSON.stringify({
              users,
              total: users.length,
            }))
            auditEvent('presence:read', auth, { total: users.length })
          } catch (e) {
            res.writeHead(500)
            res.end('error')
          }
          return
        }

        if (req.method === 'POST' && req.url === '/duplicate-store') {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              const allowedOrigin = req.headers.origin as string | undefined
              setCors(allowedOrigin)
              const payload = JSON.parse(body || '{}') as { sourceKey?: string; destKey?: string }
              if (!payload?.sourceKey || !payload?.destKey) {
                res.writeHead(400)
                res.end('bad request')
                return
              }
              duplicateStore(payload.sourceKey, payload.destKey)
              try { fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2)) } catch (e) { /* ignore */ }
              if (wss) {
                wss.clients.forEach((c: any) => {
                  try {
                    if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:duplicate', sourceKey: payload.sourceKey, destKey: payload.destKey }))
                  } catch (e) { /* ignore */ }
                })
              }
              auditEvent('store:duplicate', auth, { sourceKey: payload.sourceKey, destKey: payload.destKey })
              res.writeHead(200)
              res.end('ok')
            } catch (e) {
              res.writeHead(500)
              res.end('error')
            }
          })
          return
        }

        const attemptOpenInEditor = (targetPath: string, lineNum: number, colNum?: number) => {
          try {
            const target = path.resolve(root, targetPath)
            const pos = typeof colNum === 'number' ? `${lineNum}:${colNum}` : `${lineNum}`
            let codeAvailable = false
            try {
              const s = spawnSync('code', ['--version'], { stdio: 'ignore', timeout: 1000 })
              codeAvailable = !s.error
            } catch (e) {
              codeAvailable = false
            }
            const vscodeUrl = `vscode://file/${target}:${lineNum}:${colNum || 1}`
            if (codeAvailable) {
              try {
                const child = spawn('code', ['--goto', `${target}:${pos}`], { stdio: 'ignore', detached: true })
                child.on('error', () => {})
                child.unref()
                return { opened: true, method: 'code' }
              } catch (e) { /* ignore */ }
            }
            if (process.platform === 'win32') {
              const candidates = [
                path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
                path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
                path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft VS Code', 'Code.exe'),
              ]
              for (const exe of candidates) {
                try {
                  if (exe && fs.existsSync(exe)) {
                    const c = spawn(exe, ['--goto', `${target}:${pos}`], { stdio: 'ignore', detached: true })
                    c.on('error', () => {})
                    c.unref()
                    return { opened: true, method: exe }
                  }
                } catch (e) { /* ignore */ }
              }
              try {
                const c = spawn('cmd', ['/c', 'start', '', vscodeUrl], { stdio: 'ignore', detached: true })
                c.on('error', () => {})
                c.unref()
                return { opened: true, method: 'vscode-url' }
              } catch (e) { /* ignore */ }
            } else if (process.platform === 'darwin') {
              try {
                const c = spawn('open', [vscodeUrl], { stdio: 'ignore', detached: true })
                c.on('error', () => {})
                c.unref()
                return { opened: true, method: 'open' }
              } catch (e) { /* ignore */ }
            } else {
              try {
                const c = spawn('xdg-open', [vscodeUrl], { stdio: 'ignore', detached: true })
                c.on('error', () => {})
                c.unref()
                return { opened: true, method: 'xdg-open' }
              } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
          return { opened: false }
        }
        if (req.method === 'GET' && req.url === '/favicon.ico') {
          try {
            const favFromCwd = path.resolve(root, 'favicon.ico')
            if (fs.existsSync(favFromCwd)) {
              const buf = fs.readFileSync(favFromCwd)
              res.writeHead(200, { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' })
              res.end(buf)
              return
            }
          } catch (e) { /* ignore */ }
          try {
            const packaged = path.resolve(base, 'client', 'favicon.ico')
            if (fs.existsSync(packaged)) {
              const buf = fs.readFileSync(packaged)
              res.writeHead(200, { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' })
              res.end(buf)
              return
            }
          } catch (e) { /* ignore */ }
          res.writeHead(404)
          res.end()
          return
        }

        // serve a small phone-friendly page to register a test store
        if (req.method === 'GET' && req.url === '/phone-register') {
          try {
            // prefer examples copy so it's editable during development
            const phoneHtmlPath = path.resolve(base, '..', 'examples', 'phone-register.html')
            if (fs.existsSync(phoneHtmlPath)) {
              const html = fs.readFileSync(phoneHtmlPath, 'utf-8')
              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end(html)
              return
            }
          } catch (e) { /* ignore */ }
        }
        // CORS preflight for register/change
        if (req.method === 'OPTIONS' && (req.url === '/register' || req.url === '/change')) {
          setCors()
          res.writeHead(204)
          res.end()
          return
        }

        if (req.method === 'OPTIONS' && req.url && req.url.startsWith('/session/')) {
          setCors()
          res.writeHead(204)
          res.end()
          return
        }

        // accept remote registrations and changes: POST /register { key, initial }
        if (req.method === 'POST' && req.url === '/register') {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              const allowedOrigin = req.headers.origin as string | undefined
              setCors(allowedOrigin)
              if (allowedOrigin && allowedOrigin !== 'null') {
                try {
                  const parsed = new URL(allowedOrigin)
                  if (!['http:', 'https:'].includes(parsed.protocol)) {
                    res.writeHead(403)
                    res.end('forbidden')
                    return
                  }
                } catch (e) {
                  res.writeHead(403)
                  res.end('forbidden')
                  return
                }
              }

              const payload = JSON.parse(body || '{}') as { key?: string; initial?: unknown }
              if (payload && payload.key) {
                remoteStores[payload.key] = payload.initial
                try {
                  const existing = globalStoreFactory.get(payload.key)
                  if (existing) existing.set(payload.initial)
                  else globalStoreFactory.create(payload.key, { value: payload.initial })
                } catch (e) { /* ignore */ }
                try { fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2)) } catch (e) { /* ignore */ }
                if (wss) {
                  wss.clients.forEach((c: any) => {
                    try {
                      if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:create', key: payload.key, initial: payload.initial }))
                    } catch (e) { /* ignore */ }
                  })
                }
                auditEvent('store:register', auth, { key: payload.key, hasInitial: Object.prototype.hasOwnProperty.call(payload, 'initial') })
              }
              res.writeHead(200)
              res.end('ok')
            } catch (e) {
              res.writeHead(500)
              res.end('error')
            }
          })
          return
        }

        // POST /change { key, value }
        if (req.method === 'POST' && req.url === '/change') {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              const allowedOrigin = req.headers.origin as string | undefined
              setCors(allowedOrigin)
              const payload = JSON.parse(body || '{}') as { key?: string; value?: unknown }
              if (payload && payload.key) {
                remoteStores[payload.key] = payload.value
                try {
                  const existing = globalStoreFactory.get(payload.key)
                  if (existing) existing.set(payload.value)
                  else globalStoreFactory.create(payload.key, { value: payload.value })
                } catch (e) { /* ignore */ }
                try { fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2)) } catch (e) { /* ignore */ }
                if (wss) {
                  wss.clients.forEach((c: any) => {
                    try {
                      if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:change', key: payload.key, value: payload.value }))
                    } catch (e) { /* ignore */ }
                  })
                }
                auditEvent('store:change', auth, { key: payload.key })
              }
              res.writeHead(200)
              res.end('ok')
            } catch (e) {
              res.writeHead(500)
              res.end('error')
            }
          })
          return
        }

        // dev helper: small UI + POST to set token (stored to .fortistate-inspector-token) if no token configured
        if (req.method === 'GET' && req.url === '/set-token') {
          const auth = requireAdmin({ allowLegacy: true })
          if (!auth) return
          setCors(req.headers.origin as string | undefined)
          const html = `<!doctype html><html><body><h3>Set Fortistate Inspector Token (dev)</h3><form method="post" action="/set-token"><input name="token" placeholder="token"/><button type="submit">Set</button></form></body></html>`
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(html)
          auditEvent('legacy-token:ui', auth)
          return
        }

        if (req.method === 'POST' && req.url === '/set-token') {
          const auth = requireAdmin({ allowLegacy: true })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              setCors(req.headers.origin as string | undefined)
              let payload: any = {}
              try { payload = JSON.parse(body || '{}') } catch (e) {
                const m = String(body).match(/token=([^&]+)/)
                if (m) payload = { token: decodeURIComponent(m[1]) }
              }
              if (payload && typeof payload.token === 'string' && payload.token.trim()) {
                token = payload.token.trim()
                try { fs.writeFileSync(tokenFile, JSON.stringify({ token })) } catch (e) { /* ignore */ }
                auditEvent('legacy-token:set', auth)
                res.writeHead(200)
                res.end('ok')
                return
              }
            } catch (e) { /* ignore */ }
            res.writeHead(400)
            res.end('bad')
          })
          return
        }

                // expose current remote stores (for client to fetch and render)
        if (req.method === 'GET' && req.url === '/remote-stores') {
          const auth = requireObserver({ optional: !requireSessions, allowLegacy: true })
          if (auth === null) return
          const allowedOrigin = req.headers.origin as string | undefined
          setCors(allowedOrigin)
          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          res.end(JSON.stringify(remoteStores))
          auditEvent('remote-stores:list', auth)
          return
        }

        if (req.method === 'GET' && req.url === '/presets') {
          const auth = requireObserver({ optional: !requireSessions, allowLegacy: true })
          if (auth === null) return
          try {
            setCors(req.headers.origin as string | undefined)
            const presetList = typeof listPresetObjects === 'function' ? listPresetObjects() : typeof listPresets === 'function' ? listPresets() : []
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(200)
            res.end(JSON.stringify(presetList ?? []))
            auditEvent('presets:list', auth)
            return
          } catch (e) {
            res.writeHead(500)
            res.end('error')
            return
          }
        }

        // debug helper to inspect runtime state (safe for local dev)
        if (req.method === 'GET' && req.url === '/debug') {
          const auth = requireAdmin({ allowLegacy: true })
          if (!auth) return
          try {
            setCors(req.headers.origin as string | undefined)
            const clients: Array<any> = []
            if (wss) {
              wss.clients.forEach((c: any) => {
                try {
                  const info: any = { readyState: c.readyState }
                  if (c._socket && c._socket.remoteAddress) info.remoteAddress = c._socket.remoteAddress
                  clients.push(info)
                } catch (e) { /* ignore */ }
              })
            }
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(200)
            res.end(JSON.stringify({ remoteStores, wsClients: clients.length, clients }))
            auditEvent('debug:info', auth, { clientCount: clients.length })
            return
          } catch (e) { /* ignore */ }
        }

        // CORS preflight for preset/state endpoints
        if (req.method === 'OPTIONS' && (req.url === '/apply-preset' || req.url === '/duplicate-store' || req.url === '/swap-stores' || req.url === '/move-store')) {
          setCors()
          res.writeHead(204)
          res.end()
          return
        }

        // apply a preset: POST /apply-preset { name, targetKey? }
        if (req.method === 'POST' && req.url === '/apply-preset') {
          const auth = requireEditor({ allowLegacy: true, optional: !requireSessions })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              const allowedOrigin = req.headers.origin as string | undefined
              setCors(allowedOrigin)
              const payload = JSON.parse(body || '{}') as { name?: string; targetKey?: string; installCss?: boolean }
              if (!payload || !payload.name) {
                res.writeHead(400)
                res.end('bad request')
                return
              }
              const result = applyPreset(payload.name, payload.targetKey)
              try {
                const val = globalStoreFactory.get(result.key)?.get()
                if (typeof val !== 'undefined') {
                  remoteStores[result.key] = val
                  try { fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2)) } catch (e) { /* ignore */ }
                }
              } catch (e) { /* ignore */ }
              if (payload.installCss) {
                try { installPresetCss(payload.name, process.cwd(), { overwrite: false }) } catch (e) { /* ignore */ }
              }
              if (wss) {
                wss.clients.forEach((c: any) => {
                  try {
                    if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:create', key: result.key, initial: globalStoreFactory.get(result.key)?.get() }))
                  } catch (e) { /* ignore */ }
                })
              }
              auditEvent('preset:apply', auth, { name: payload.name, targetKey: payload.targetKey ?? result.key })
              res.setHeader('Content-Type', 'application/json')
              res.writeHead(200)
              res.end(JSON.stringify(result))
            } catch (e) {
              res.writeHead(500)
              res.end('error')
            }
          })
          return
        }

        // duplicate store: POST /duplicate-store { sourceKey, destKey }
        if (req.method === 'POST' && req.url === '/duplicate-store') {
          const auth = requireEditor({ allowLegacy: true, optional: !requireSessions })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              const allowedOrigin = req.headers.origin as string | undefined
              setCors(allowedOrigin)
              const payload = JSON.parse(body || '{}') as { sourceKey?: string; destKey?: string }
              const sourceKey = payload?.sourceKey
              const destKey = payload?.destKey
              if (!sourceKey || !destKey) {
                res.writeHead(400)
                res.end('bad request')
                return
              }
              duplicateStore(sourceKey, destKey)
              try {
                const val = globalStoreFactory.get(destKey)?.get()
                if (typeof val !== 'undefined') {
                  remoteStores[destKey] = val
                  try { fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2)) } catch (e) { /* ignore */ }
                }
              } catch (e) { /* ignore */ }
              if (wss) {
                wss.clients.forEach((c: any) => {
                  try {
                    if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:create', key: destKey, initial: globalStoreFactory.get(destKey)?.get() }))
                  } catch (e) { /* ignore */ }
                })
              }
              auditEvent('store:duplicate', auth, { sourceKey, destKey })
              res.writeHead(200)
              res.end('ok')
            } catch (e) {
              res.writeHead(500)
              res.end('error')
            }
          })
          return
        }

        // swap stores: POST /swap-stores { keyA, keyB }
        if (req.method === 'POST' && req.url === '/swap-stores') {
          const auth = requireEditor({ allowLegacy: true, optional: !requireSessions })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              const allowedOrigin = req.headers.origin as string | undefined
              setCors(allowedOrigin)
              const payload = JSON.parse(body || '{}') as { keyA?: string; keyB?: string }
              const keyA = payload?.keyA
              const keyB = payload?.keyB
              if (!keyA || !keyB) {
                res.writeHead(400)
                res.end('bad request')
                return
              }
              swapStores(keyA, keyB)
              try {
                const aVal = globalStoreFactory.get(keyA)?.get()
                const bVal = globalStoreFactory.get(keyB)?.get()
                if (typeof aVal !== 'undefined') remoteStores[keyA] = aVal
                if (typeof bVal !== 'undefined') remoteStores[keyB] = bVal
                try { fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2)) } catch (e) { /* ignore */ }
              } catch (e) { /* ignore */ }
              if (wss) {
                wss.clients.forEach((c: any) => {
                  try {
                    if (c.readyState === 1) {
                      c.send(JSON.stringify({ type: 'store:change', key: keyA, value: globalStoreFactory.get(keyA)?.get() }))
                      c.send(JSON.stringify({ type: 'store:change', key: keyB, value: globalStoreFactory.get(keyB)?.get() }))
                    }
                  } catch (e) { /* ignore */ }
                })
              }
              auditEvent('store:swap', auth, { keyA, keyB })
              res.writeHead(200)
              res.end('ok')
            } catch (e) {
              res.writeHead(500)
              res.end('error')
            }
          })
          return
        }

        // move store: POST /move-store { oldKey, newKey }
        if (req.method === 'POST' && req.url === '/move-store') {
          const auth = requireEditor({ allowLegacy: true, optional: !requireSessions })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              const allowedOrigin = req.headers.origin as string | undefined
              setCors(allowedOrigin)
              const payload = JSON.parse(body || '{}') as { oldKey?: string; newKey?: string }
              const oldKey = payload?.oldKey
              const newKey = payload?.newKey
              if (!oldKey || !newKey) {
                res.writeHead(400)
                res.end('bad request')
                return
              }
              moveStore(oldKey, newKey)
              try {
                const newVal = globalStoreFactory.get(newKey)?.get()
                if (typeof newVal !== 'undefined') remoteStores[newKey] = newVal
                delete remoteStores[oldKey]
                try { fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2)) } catch (e) { /* ignore */ }
              } catch (e) { /* ignore */ }
              if (wss) {
                wss.clients.forEach((c: any) => {
                  try {
                    if (c.readyState === 1) {
                      c.send(JSON.stringify({ type: 'store:create', key: newKey, initial: globalStoreFactory.get(newKey)?.get() }))
                      c.send(JSON.stringify({ type: 'store:change', key: oldKey, value: null }))
                    }
                  } catch (e) { /* ignore */ }
                })
              }
              auditEvent('store:move', auth, { oldKey, newKey })
              res.writeHead(200)
              res.end('ok')
            } catch (e) {
              res.writeHead(500)
              res.end('error')
            }
          })
          return
        }

        // CORS preflight for open-source as well
        if (req.method === 'OPTIONS' && req.url === '/open-source') {
          setCors()
          res.writeHead(204)
          res.end()
          return
        }

        // CORS preflight for locate-source (GET from browser clients)
        if (req.method === 'OPTIONS' && req.url === '/locate-source') {
          setCors()
          res.writeHead(204)
          res.end()
          return
        }

        // open a file in an editor on the host machine (opt-in)
        if (req.method === 'POST' && req.url === '/open-source') {
          const auth = requireAdmin({ allowLegacy: true })
          if (!auth) return
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', () => {
            try {
              const allowedOrigin = req.headers.origin as string | undefined
              setCors(allowedOrigin)
              const allowOpen = Boolean(opts && (opts as any).allowOpen) || process.env.FORTISTATE_INSPECTOR_ALLOW_OPEN === '1'
              if (!allowOpen) {
                res.writeHead(403)
                res.end('open-not-allowed')
                return
              }
              const payload = JSON.parse(body || '{}') as { path?: string; line?: number }
              if (!payload?.path) {
                res.writeHead(400)
                res.end('bad request')
                return
              }
              const target = path.resolve(process.cwd(), payload.path)
              const line = typeof payload.line === 'number' ? payload.line : 1
              try {
                // prefer to run the `code` CLI if available
                let codeAvailable = false
                try {
                  const s = spawnSync('code', ['--version'], { stdio: 'ignore', timeout: 1000 })
                  // spawnSync returns an error property if it failed to spawn
                  codeAvailable = !s.error
                } catch (e) {
                  codeAvailable = false
                }

                const vscodeUrl = `vscode://file/${target}:${line}`

                if (codeAvailable) {
                  const cmd = 'code'
                  const args = ['--goto', `${target}:${line}`]
                  const child = spawn(cmd, args, { stdio: 'ignore', detached: true })
                  // attach error handler so a missing binary doesn't crash the server
                  child.on('error', (err: any) => {
                    try {
                      // fallback to URL-scheme open
                      if (process.platform === 'win32') {
                        const c = spawn('cmd', ['/c', 'start', '', vscodeUrl], { stdio: 'ignore', detached: true })
                        c.on('error', () => {})
                        c.unref()
                      } else if (process.platform === 'darwin') {
                        const c = spawn('open', [vscodeUrl], { stdio: 'ignore', detached: true })
                        c.on('error', () => {})
                        c.unref()
                      } else {
                        const c = spawn('xdg-open', [vscodeUrl], { stdio: 'ignore', detached: true })
                        c.on('error', () => {})
                        c.unref()
                      }
                    } catch (e) { /* ignore fallback errors */ }
                  })
                  child.unref()
                  auditEvent('source:open', auth, { path: target, line, method: 'code-cli' })
                  res.writeHead(200)
                  res.end('ok')
                  return
                }

                // if `code` CLI isn't available, on Windows try common exe install paths
                try {
                  if (process.platform === 'win32') {
                    const candidates = [
                      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
                      path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
                      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft VS Code', 'Code.exe'),
                      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code Insiders', 'Code - Insiders.exe'),
                    ]
                    let launched = false
                    for (const exe of candidates) {
                      try {
                        if (!exe) continue
                        if (fs.existsSync(exe)) {
                          const c = spawn(exe, ['--goto', `${target}:${line}`], { stdio: 'ignore', detached: true })
                          c.on('error', () => {})
                          c.unref()
                          launched = true
                          break
                        }
                      } catch (e) { /* ignore */ }
                    }
                    if (!launched) {
                      const c = spawn('cmd', ['/c', 'start', '', vscodeUrl], { stdio: 'ignore', detached: true })
                      c.on('error', () => {})
                      c.unref()
                    }
                  } else if (process.platform === 'darwin') {
                    const c = spawn('open', [vscodeUrl], { stdio: 'ignore', detached: true })
                    c.on('error', () => {})
                    c.unref()
                  } else {
                    const c = spawn('xdg-open', [vscodeUrl], { stdio: 'ignore', detached: true })
                    c.on('error', () => {})
                    c.unref()
                  }
                  auditEvent('source:open', auth, { path: target, line, method: 'fallback-url' })
                  res.writeHead(200)
                  res.end(JSON.stringify({ path: target, line, opened: 'vscode-url-fallback' }))
                  return
                } catch (e) {
                  // nothing worked — return helpful JSON so the UI can show instructions
                  auditEvent('source:open', auth, { path: target, line, method: 'error', error: String(e) })
                  res.writeHead(200)
                  res.end(JSON.stringify({ path: target, line, opened: false, message: "Could not spawn editor. Ensure VSCode is installed and the code CLI is on PATH (install the 'code' command in PATH) or your system supports the vscode:// URL scheme." }))
                  return
                }
              } catch (e) {
                auditEvent('source:open', auth, { path: target, line, method: 'exception', error: String(e) })
                res.writeHead(500)
                res.end('error')
                return
              }
            } catch (e) {
              auditEvent('source:open', auth, { error: String(e) })
              res.writeHead(500)
              res.end('error')
              return
            }
          })
          return
        }

        // locate source files that reference a store key (help IDE links)
        if (req.method === 'GET' && req.url && req.url.startsWith('/locate-source')) {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          try {
            const u = new URL(req.url, 'http://localhost')
            const key = String(u.searchParams.get('key') || '')
            const results: Array<{ path: string; line: number; preview: string; column?: number; openAttempt?: any }> = []
            const shouldAutoOpen = String(u.searchParams.get('open') || '') === '1'
            const origin = req.headers.origin as string | undefined
            setCors(origin)
            if (key) {

              const searchRoot = process.cwd()
              const exts = ['.ts', '.tsx', '.js', '.jsx', '.vue']
              // skip build and vendor folders
              const skipDirs = ['node_modules', '.git', 'dist', '.next', 'build', 'out', 'public']

              const maxResults = 10
              const ctx = 2 // lines of context around the matched line

              const walk = (dir: string) => {
                let entries: string[] = []
                try { entries = fs.readdirSync(dir) } catch (e) { return }
                for (const name of entries) {
                  try {
                    const full = path.join(dir, name)
                    const stat = fs.statSync(full)
                    if (stat.isDirectory()) {
                      if (skipDirs.includes(name)) continue
                      walk(full)
                      if (results.length >= maxResults) return
                      continue
                    }
                    // removed nested open-source handler (handled at top-level)
                  } catch (e) { /* ignore file errors */ }
                }
              }

              walk(searchRoot)
            }

            // if auto-open requested and allowed, attempt to open the first result in editor
            if (shouldAutoOpen && results.length > 0) {
              const first = results[0]
              const allowOpen = Boolean(opts && (opts as any).allowOpen) || process.env.FORTISTATE_INSPECTOR_ALLOW_OPEN === '1'
              if (allowOpen) {
                try {
                  const openAttempt: { opened: boolean; method?: string } = attemptOpenInEditor(first.path, first.line, (first as any).column) as { opened: boolean; method?: string }
                  // annotate the response with open attempt
                  (first as any).openAttempt = openAttempt
                } catch (e) { /* ignore */ }
              }
            }
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(200)
            res.end(JSON.stringify(results))
            auditEvent('source:locate', auth, { key, open: shouldAutoOpen, results: results.length })
            return
          } catch (e) {
            // ignore and fallthrough
          }
        }

        // serve inspector UI at root
        if (req.url === '/' || req.url === '/index.html') {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(clientHtml)
          return
        }

        res.writeHead(404)
        res.end('Not found')
      })

      // attempt to load persisted remote stores
      try {
        if (fs.existsSync(persistFile)) {
          const raw = fs.readFileSync(persistFile, 'utf-8')
          try { Object.assign(remoteStores, JSON.parse(raw || '{}')) } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }

      await refreshConfig('startup')

  wss = new WebSocketServer({ server })
  ;(wss as any).on('connection', (ws: any, request: http.IncomingMessage) => {
        let queryToken: string | null = null
        try {
          if (request.url) {
            const parsed = new URL(request.url, 'http://localhost')
            queryToken = parsed.searchParams.get('token')
              || parsed.searchParams.get('sessionToken')
              || parsed.searchParams.get('accessToken')
          }
        } catch (e) { queryToken = null }

        const authInfo = roleEnforcer.resolve(request.headers, queryToken)
        const requiresSession = requireSessions || sessionStore.hasSessions()
        const allowAnon = !requiresSession || allowAnonSessions
  const decision = roleMiddleware.check(authInfo, 'observer', {
          optional: allowAnon,
          allowLegacy: true,
          requireSession: requiresSession && !allowAnon,
          description: 'ws:connect',
        })

        const originHeader = request.headers.origin as string | undefined
        let originAllowed = true
        if (allowOriginOption && allowOriginOption !== '*') {
          if (allowOriginStrict) {
            originAllowed = originHeader ? originHeader === allowOriginOption : false
          } else {
            originAllowed = !originHeader || originHeader === allowOriginOption
          }
        }

        const connectionDetails = {
          origin: originHeader ?? null,
          remoteAddress: request.socket?.remoteAddress ?? null,
        }

        if (!originAllowed) {
          recordAudit('ws:connect', authInfo, { ...connectionDetails, success: false, reason: 'forbidden-origin' })
          try { ws.close(4403, 'forbidden origin') } catch (e) { /* ignore */ }
          return
        }

        if (!decision.ok) {
          const status = decision.statusCode ?? 401
          const reason = decision.reason ?? 'unauthorized'
          recordAudit('ws:connect', authInfo, { ...connectionDetails, success: false, reason })
          const closeCode = status === 403 ? 4403 : 4401
          try { ws.close(closeCode, decision.message ?? reason) } catch (e) { /* ignore */ }
          return
        }

  ;(ws as any)._fortistateAuth = authInfo
        recordAudit('ws:connect', authInfo, {
          ...connectionDetails,
          success: true,
          via: authInfo.legacyToken ? 'legacy-token' : authInfo.sessionContext ? 'session' : 'anonymous',
        })

        // Register with presence manager
        const presenceUser = presenceManager.add(
          ws,
          authInfo.sessionContext ?? null,
          connectionDetails.remoteAddress,
        )

        try { ws.send(JSON.stringify({ type: 'hello', version: 1 })) } catch (e) { /* ignore */ }
        try {
          const keys = globalStoreFactory.keys()
          const snapshot: Record<string, any> = {}
          for (const k of keys) {
            const st = globalStoreFactory.get(k)
            if (st) snapshot[k] = st.get()
          }
          for (const rk of Object.keys(remoteStores)) {
            snapshot[rk] = remoteStores[rk]
          }
          ws.send(JSON.stringify({ type: 'snapshot', stores: snapshot }))
        } catch (e) { /* ignore */ }

        // Send initial presence list to new client
        try {
          const allUsers = presenceManager.getAll()
          ws.send(JSON.stringify({ type: 'presence:init', users: allUsers }))
        } catch (e) { /* ignore */ }

        // Broadcast presence:join to other clients
        if (wss) {
          wss.clients.forEach((client: any) => {
            if (client !== ws && client.readyState === 1) {
              try {
                client.send(JSON.stringify({ type: 'presence:join', user: presenceUser }))
              } catch (e) { /* ignore */ }
            }
          })
        }

        ws.on('message', (msg: any) => {
          try {
            const msgStr = String(msg)
            if (msgStr === 'req:snapshot') {
              const keys = globalStoreFactory.keys()
              const snapshot: Record<string, any> = {}
              for (const k of keys) {
                const st = globalStoreFactory.get(k)
                if (st) snapshot[k] = st.get()
              }
              for (const rk of Object.keys(remoteStores)) {
                snapshot[rk] = remoteStores[rk]
              }
              try {
                ws.send(JSON.stringify({ type: 'snapshot', stores: snapshot }))
              } catch (e) { /* ignore */ }
              return
            }

            // Handle JSON messages
            try {
              const parsed = JSON.parse(msgStr)
              
              if (parsed.type === 'presence:update') {
                const update: PresenceUpdateMessage = parsed
                const updatedUser = presenceManager.update(ws, {
                  activeStore: update.activeStore,
                  cursorPath: update.cursorPath,
                })

                if (updatedUser && wss) {
                  // Broadcast presence update to other clients
                  wss.clients.forEach((client: any) => {
                    if (client !== ws && client.readyState === 1) {
                      try {
                        client.send(JSON.stringify({
                          type: 'presence:update',
                          sessionId: updatedUser.sessionId,
                          activeStore: updatedUser.activeStore,
                          cursorPath: updatedUser.cursorPath,
                        }))
                      } catch (e) { /* ignore */ }
                    }
                  })
                }
              } else if (parsed.type === 'presence:ping') {
                // Heartbeat/activity tracking
                presenceManager.touch(ws)
              }
            } catch (e) {
              // Not JSON or parse error, ignore
            }
          } catch (e) { /* ignore */ }
        })

        ws.on('close', (code: number, reason: Buffer) => {
          // Remove from presence and broadcast leave event
          const removedUser = presenceManager.remove(ws)
          
          if (removedUser && wss) {
            wss.clients.forEach((client: any) => {
              if (client.readyState === 1) {
                try {
                  client.send(JSON.stringify({
                    type: 'presence:leave',
                    sessionId: removedUser.sessionId,
                  }))
                } catch (e) { /* ignore */ }
              }
            })
          }

          recordAudit('ws:disconnect', authInfo, {
            ...connectionDetails,
            code,
            reason: reason ? reason.toString() : '',
          })
        })
      })

      const unsubCreate = globalStoreFactory.subscribeCreate((key, initial) => {
        if (!wss) return
        wss.clients.forEach((c: any) => {
          try { if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:create', key, initial })) } catch (e) { /* ignore */ }
        })
      })
      const unsubChange = globalStoreFactory.subscribeChange((key, value) => {
        if (!wss) return
        wss.clients.forEach((c: any) => {
          try { if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:change', key, value })) } catch (e) { /* ignore */ }
        })
      })

      ;(wss as any)._unsubCreate = unsubCreate
      ;(wss as any)._unsubChange = unsubChange

      await new Promise<void>((resolve) => {
        if (host) server!.listen(port, host, () => resolve())
        else server!.listen(port, () => resolve())
      })
      if (!quiet) {
        // eslint-disable-next-line no-console
        const bindHost = host || 'localhost'
        console.log('[fortistate][inspector] listening http://' + bindHost + ':' + port)
        // print LAN IPs for phone testing
        try {
          const os = await import('os')
          const nets = os.networkInterfaces()
          const ips = [] as string[]
          for (const name of Object.keys(nets || {})) {
            for (const ni of nets[name] || []) {
              if (ni.family === 'IPv4' && !ni.internal) ips.push(ni.address)
            }
          }
          if (ips.length) {
            console.log('[fortistate][inspector] Local IPs:')
            for (const ip of ips) console.log('  http://' + ip + ':' + port)
            console.log("[fortistate][inspector] Tip: to connect from a phone use one of the above URLs and start the inspector with '--host 0.0.0.0' and '--allow-origin <origin>' or '--allow-origin *' to permit cross-origin calls.")
          }
        } catch (e) { /* ignore network info errors */ }
      }
    },
    stop: async () => {
      shuttingDown = true
      if (configWatcher) {
        try { await configWatcher.close() } catch (e) { /* ignore */ }
        configWatcher = null
      }
      configWatchPaths = []
      pluginStoreKeys.clear()
      refreshQueued = false
      refreshingConfig = false
      if (!server || !wss) {
        server = null
        wss = null
        return
      }
      try {
        const unsubCreate = (wss as any)._unsubCreate
        const unsubChange = (wss as any)._unsubChange
        if (typeof unsubCreate === 'function') unsubCreate()
        if (typeof unsubChange === 'function') unsubChange()
      } catch (e) { /* ignore */ }
      // terminate active client sockets first to avoid server close hang
      try {
        wss!.clients.forEach((c: any) => {
          try {
            // terminate is more forceful than close; ensure socket is closed
            if (typeof c.terminate === 'function') c.terminate()
            else if (typeof c.close === 'function') c.close()
          } catch (e) { /* ignore */ }
        })
      } catch (e) { /* ignore */ }

      await new Promise((r) => wss!.close(() => r(undefined)))
      await new Promise((r) => server!.close(() => r(undefined)))
      server = null
      wss = null
    }
  }
}

export default createInspectorServer
