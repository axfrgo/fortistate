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

  const sanitizeNamespace = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'default'

  const rawNamespace = process.env.FORTISTATE_INSPECTOR_NAMESPACE
    || process.env.FORTISTATE_REMOTE_NAMESPACE
    || process.env.npm_package_name
    || path.basename(root)
    || 'default'

  const namespace = sanitizeNamespace(rawNamespace)
  const defaultNamespace = sanitizeNamespace(path.basename(root) || 'default')
  const persistDir = path.resolve(root, '.fortistate')
  const legacyPersistFile = path.resolve(root, '.fortistate-remote-stores.json')
  let persistFile = path.join(persistDir, `remote-stores-${namespace}.json`)

  const ensurePersistDir = () => {
    try { fs.mkdirSync(persistDir, { recursive: true }) } catch (e) { /* ignore */ }
  }

  ensurePersistDir()

  if (!fs.existsSync(persistFile) && fs.existsSync(legacyPersistFile) && namespace === defaultNamespace) {
    try {
      ensurePersistDir()
      fs.renameSync(legacyPersistFile, persistFile)
    } catch (e) {
      try {
        const legacyContents = fs.readFileSync(legacyPersistFile, 'utf-8')
        fs.writeFileSync(persistFile, legacyContents)
        fs.unlinkSync(legacyPersistFile)
      } catch (copyErr) { /* ignore */ }
    }
  }

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

  // History buffer for timeline tracking
  const historyBuffer: Array<any> = []
  const MAX_HISTORY_BUFFER = 200

  const recordHistory = (action: string, details: Record<string, any>) => {
    const entry = {
      action,
      ts: Date.now(),
      ...details
    }
    historyBuffer.push(entry)
    if (historyBuffer.length > MAX_HISTORY_BUFFER) {
      historyBuffer.shift()
    }
    // Broadcast history update via WebSocket
    if (wss) {
      const msg = JSON.stringify({ type: 'history:add', entry })
      wss.clients.forEach((c: any) => {
        try {
          if (c.readyState === 1) c.send(msg)
        } catch (e) { /* ignore */ }
      })
    }
  }

  const persistRemoteStoresSafe = () => {
    try {
      ensurePersistDir()
      fs.writeFileSync(persistFile, JSON.stringify(remoteStores, null, 2))
    } catch (e) { /* ignore */ }
  }

  const broadcastStoreMessage = (msg: { type: 'store:create' | 'store:change'; key: string; initial?: any; value?: any }) => {
    if (!wss) return
    wss.clients.forEach((c: any) => {
      try { if (c.readyState === 1) c.send(JSON.stringify(msg)) } catch (e) { /* ignore */ }
    })
  }

  // Universe storage helpers
  const universesDir = path.resolve(root, '.fortistate-universes')
  const slugify = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  const ensureUniversesDir = () => {
    try {
      if (!fs.existsSync(universesDir)) {
        fs.mkdirSync(universesDir, { recursive: true })
      }
    } catch (e) { /* ignore */ }
  }

  const listUniverses = () => {
    try {
      ensureUniversesDir()
      const entries = fs.readdirSync(universesDir)
      const universes: any[] = []
      for (const entry of entries) {
        const metaPath = path.join(universesDir, entry, 'meta.json')
        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
            universes.push(meta)
          } catch (e) { /* ignore malformed meta */ }
        }
      }
      return universes
    } catch (e) {
      return []
    }
  }

  const getUniverseMeta = (universeId: string) => {
    try {
      const metaPath = path.join(universesDir, universeId, 'meta.json')
      if (fs.existsSync(metaPath)) {
        return JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      }
    } catch (e) { /* ignore */ }
    return null
  }

  const saveUniverseMeta = (universeId: string, meta: any) => {
    try {
      ensureUniversesDir()
      const universeDir = path.join(universesDir, universeId)
      if (!fs.existsSync(universeDir)) {
        fs.mkdirSync(universeDir, { recursive: true })
      }
      const metaPath = path.join(universeDir, 'meta.json')
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
      return true
    } catch (e) {
      return false
    }
  }

  const getUniverseVersion = (universeId: string, versionId: string) => {
    try {
      const versionPath = path.join(universesDir, universeId, 'versions', `${versionId}.json`)
      if (fs.existsSync(versionPath)) {
        return JSON.parse(fs.readFileSync(versionPath, 'utf-8'))
      }
    } catch (e) { /* ignore */ }
    return null
  }

  const saveUniverseVersion = (universeId: string, versionId: string, version: any) => {
    try {
      ensureUniversesDir()
      const versionsDir = path.join(universesDir, universeId, 'versions')
      if (!fs.existsSync(versionsDir)) {
        fs.mkdirSync(versionsDir, { recursive: true })
      }
      const versionPath = path.join(versionsDir, `${versionId}.json`)
      fs.writeFileSync(versionPath, JSON.stringify(version, null, 2))
      return true
    } catch (e) {
      return false
    }
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
        // If the path exists and is a directory, watch all JS/MJS/CJS files in it
        try {
          if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
            targets.add(path.join(abs, '*.js'))
            targets.add(path.join(abs, '*.mjs'))
            targets.add(path.join(abs, '*.cjs'))
          } else {
            targets.add(abs)
          }
        } catch (e) {
          // If we can't stat it, just add it as-is
          targets.add(abs)
        }
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
      configWatcher = chokidar.watch(normalized, { 
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      })
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
              try { persistRemoteStoresSafe() } catch (e) { /* ignore */ }
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
                try { persistRemoteStoresSafe() } catch (e) { /* ignore */ }
                if (wss) {
                  wss.clients.forEach((c: any) => {
                    try {
                      if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:create', key: payload.key, initial: payload.initial }))
                    } catch (e) { /* ignore */ }
                  })
                }
                auditEvent('store:register', auth, { key: payload.key, hasInitial: Object.prototype.hasOwnProperty.call(payload, 'initial') })
                // Record history
                recordHistory('register', { key: payload.key, initial: payload.initial })
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
                try { persistRemoteStoresSafe() } catch (e) { /* ignore */ }
                if (wss) {
                  wss.clients.forEach((c: any) => {
                    try {
                      if (c.readyState === 1) c.send(JSON.stringify({ type: 'store:change', key: payload.key, value: payload.value }))
                    } catch (e) { /* ignore */ }
                  })
                }
                // Record history
                recordHistory('change', { key: payload.key, value: payload.value })
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

        // expose history timeline for the timeline panel
        if (req.method === 'GET' && req.url === '/history') {
          const auth = requireObserver({ optional: !requireSessions, allowLegacy: true })
          if (auth === null) return
          const allowedOrigin = req.headers.origin as string | undefined
          setCors(allowedOrigin)
          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          res.end(JSON.stringify(historyBuffer))
          auditEvent('history:read', auth)
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
                  try { persistRemoteStoresSafe() } catch (e) { /* ignore */ }
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
                  try { persistRemoteStoresSafe() } catch (e) { /* ignore */ }
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
                try { persistRemoteStoresSafe() } catch (e) { /* ignore */ }
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
                try { persistRemoteStoresSafe() } catch (e) { /* ignore */ }
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

        // POST /open-in-vscode { storeKey, workspacePath? }
        if (req.method === 'POST' && req.url === '/open-in-vscode') {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          
          readJsonBody(req).then((payload: { storeKey: string; workspacePath?: string }) => {
            try {
              const { storeKey, workspacePath } = payload
              if (!storeKey) {
                res.writeHead(400)
                res.end('missing storeKey')
                return
              }
              
              // Try to find the store file in common locations
              const cwd = workspacePath || process.cwd()
              const commonPaths = [
                path.join(cwd, 'src', 'stores', `${storeKey}.ts`),
                path.join(cwd, 'src', 'stores', `${storeKey}Store.ts`),
                path.join(cwd, 'src', 'state', `${storeKey}.ts`),
                path.join(cwd, 'src', 'models', `${storeKey}Model.ts`),
                path.join(cwd, 'src', `${storeKey}.ts`)
              ]
              
              // Find the first existing file
              let foundPath: string | null = null
              for (const p of commonPaths) {
                if (fs.existsSync(p)) {
                  foundPath = p
                  break
                }
              }
              
              if (!foundPath) {
                // If no file found, try to search using grep
                try {
                  const searchPattern = `createStore(['"\`]${storeKey}['"\`]`
                  const result = spawnSync('grep', ['-r', '-l', searchPattern, path.join(cwd, 'src')], {
                    encoding: 'utf-8',
                    timeout: 5000
                  })
                  
                  if (result.stdout && result.stdout.trim()) {
                    const files = result.stdout.trim().split('\\n')
                    if (files.length > 0) {
                      foundPath = files[0]
                    }
                  }
                } catch (e) {
                  // grep might not be available on Windows, ignore
                }
              }
              
              if (foundPath) {
                // Try to open VS Code using the 'code' command
                try {
                  spawn('code', ['--goto', foundPath], { detached: true, stdio: 'ignore' })
                  
                  auditEvent('ide:open', auth, { storeKey, path: foundPath })
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: true, path: foundPath }))
                } catch (e) {
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: false, path: foundPath, message: 'VS Code command not found' }))
                }
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, message: 'Store file not found', searchedPaths: commonPaths }))
              }
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

        // Universe API endpoints
        const rawPath = req.url ? req.url.split('?')[0] : ''
        const normalizedPath = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath

        if (req.method === 'OPTIONS' && normalizedPath.startsWith('/api/universes')) {
          setCors()
          res.writeHead(204)
          res.end()
          return
        }

        // GET /api/universes - list all saved universes
        if (req.method === 'GET' && normalizedPath === '/api/universes') {
          const auth = requireObserver({ allowLegacy: true })
          if (!auth) return
          setCors(req.headers.origin as string | undefined)
          try {
            const universes = listUniverses()
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(200)
            res.end(JSON.stringify({ universes }))
            auditEvent('universe:list', auth, { count: universes.length })
          } catch (e) {
            auditEvent('universe:list', auth, { error: String(e) })
            res.writeHead(500)
            res.end(JSON.stringify({ error: 'Failed to list universes' }))
          }
          return
        }

        // GET /api/universes/:id/versions/:versionId - get specific version
        if (req.method === 'GET' && normalizedPath.startsWith('/api/universes/')) {
          const auth = requireObserver({ allowLegacy: true })
          if (!auth) return
          setCors(req.headers.origin as string | undefined)
          try {
            const match = normalizedPath.match(/^\/api\/universes\/([^/]+)\/versions\/([^/]+)$/)
            if (match) {
              const universeId = decodeURIComponent(match[1])
              const versionId = decodeURIComponent(match[2])
              const version = getUniverseVersion(universeId, versionId)
              if (version) {
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(200)
                res.end(JSON.stringify({ version }))
                auditEvent('universe:version:get', auth, { universeId, versionId })
              } else {
                res.writeHead(404)
                res.end(JSON.stringify({ error: 'Version not found' }))
                auditEvent('universe:version:get', auth, { universeId, versionId, error: 'not-found' })
              }
              return
            }
          } catch (e) {
            auditEvent('universe:version:get', auth, { error: String(e) })
            res.writeHead(500)
            res.end(JSON.stringify({ error: 'Failed to get version' }))
            return
          }
        }

        // POST /api/universes - create new universe
        if (req.method === 'POST' && normalizedPath === '/api/universes') {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          ;(async () => {
            try {
              const body = await readJsonBody(req)
              setCors(req.headers.origin as string | undefined)
              if (body && typeof body === 'object' && body !== null && 'metadata' in body && 'canvas' in body) {
                const metadata = (body.metadata && typeof body.metadata === 'object') ? body.metadata as Record<string, any> : {}
                const canvasState = body.canvas as Record<string, any>
                const bindings = Array.isArray(body.bindings) ? body.bindings : []

                if (!canvasState || !Array.isArray(canvasState.nodes) || !Array.isArray(canvasState.edges) || !canvasState.viewport) {
                  res.writeHead(400)
                  res.end(JSON.stringify({ error: 'Invalid canvas payload' }))
                  return
                }

                const providedId = [body.universeId, metadata.universeId, metadata.id]
                  .find(value => typeof value === 'string' && value.trim().length > 0) as string | undefined

                const label = typeof metadata.label === 'string' && metadata.label.trim().length > 0
                  ? metadata.label.trim()
                  : 'Untitled Universe'

                const baseSlug = slugify(label) || 'universe'
                let universeId = providedId ? providedId.trim() : baseSlug
                if (!providedId) {
                  let candidate = universeId
                  let suffix = 1
                  while (getUniverseMeta(candidate)) {
                    candidate = `${baseSlug}-${suffix++}`
                  }
                  universeId = candidate
                }

                const nowIso = new Date().toISOString()
                const ownerId = [body.ownerId, metadata.ownerId]
                  .find(value => typeof value === 'string' && value.trim().length > 0) as string | undefined
                const createdBy = [body.createdBy, metadata.createdBy]
                  .find(value => typeof value === 'string' && value.trim().length > 0) as string | undefined

                const existingMetaRaw = getUniverseMeta(universeId)
                const meta = existingMetaRaw ? { ...existingMetaRaw } : {
                  id: universeId,
                  createdAt: nowIso,
                  versionIds: [] as string[],
                  activeVersionId: null as string | null,
                  integrationCounts: {} as Record<string, number>,
                }

                meta.label = label
                meta.description = typeof metadata.description === 'string' ? metadata.description : ''
                meta.icon = typeof metadata.icon === 'string' && metadata.icon.trim().length > 0 ? metadata.icon : (meta.icon || '🌌')
                meta.ownerId = ownerId ?? meta.ownerId ?? 'unknown'
                meta.marketTags = Array.isArray(metadata.marketTags) ? metadata.marketTags.filter(tag => typeof tag === 'string') : (meta.marketTags ?? [])
                meta.dataSensitivity = typeof metadata.dataSensitivity === 'string' ? metadata.dataSensitivity : meta.dataSensitivity
                meta.updatedAt = nowIso

                const versionId = [body.versionId, metadata.versionId]
                  .find(value => typeof value === 'string' && value.trim().length > 0) as string | undefined
                  ?? `v${meta.versionIds.length + 1}-${Date.now().toString(36).slice(-4)}`

                const versionLabel = [body.versionLabel, metadata.versionLabel]
                  .find(value => typeof value === 'string' && value.trim().length > 0) as string | undefined
                  ?? `Snapshot ${meta.versionIds.length + 1}`

                const versionDescription = [body.versionDescription, metadata.versionDescription]
                  .find(value => typeof value === 'string' && value.trim().length > 0) as string | undefined

                const lastRunSummary = body.lastRunSummary && typeof body.lastRunSummary === 'object'
                  ? body.lastRunSummary
                  : undefined

                const version = {
                  id: versionId,
                  label: versionLabel,
                  description: versionDescription || '',
                  createdAt: nowIso,
                  createdBy: createdBy ?? meta.ownerId ?? 'system',
                  canvasState: {
                    nodes: canvasState.nodes,
                    edges: canvasState.edges,
                    viewport: canvasState.viewport,
                  },
                  bindings,
                  lastRunSummary,
                }

                const integrationCounts = { ...(meta.integrationCounts || {}) } as Record<string, number>
                bindings.forEach((binding: any) => {
                  if (binding && typeof binding.providerId === 'string') {
                    const key = binding.providerId
                    integrationCounts[key] = (integrationCounts[key] ?? 0) + 1
                  }
                })
                meta.integrationCounts = integrationCounts

                if (!meta.versionIds.includes(versionId)) {
                  meta.versionIds = [...meta.versionIds, versionId]
                }
                meta.activeVersionId = versionId

                const savedVersion = saveUniverseVersion(universeId, versionId, version)
                const savedMeta = saveUniverseMeta(universeId, meta)

                if (savedVersion && savedMeta) {
                  res.setHeader('Content-Type', 'application/json')
                  res.writeHead(201)
                  res.end(JSON.stringify({ universe: meta, version }))
                  auditEvent('universe:create', auth, { universeId, label, versionId })
                } else {
                  res.writeHead(500)
                  res.end(JSON.stringify({ error: 'Failed to persist universe data' }))
                  auditEvent('universe:create', auth, { universeId, error: 'persist-failed' })
                }
                return
              }

              const { id, label, description, icon, ownerId, marketTags, dataSensitivity } = body ?? {}
              if (!id || !label || !ownerId) {
                res.writeHead(400)
                res.end(JSON.stringify({ error: 'Missing required fields: id, label, ownerId' }))
                return
              }

              const now = new Date().toISOString()
              const meta = {
                id,
                label,
                description: description || '',
                icon: icon || '🌌',
                createdAt: now,
                updatedAt: now,
                ownerId,
                marketTags: marketTags || [],
                activeVersionId: null,
                versionIds: [],
                integrationCounts: {},
                dataSensitivity: dataSensitivity || 'internal',
              }

              const saved = saveUniverseMeta(id, meta)
              if (saved) {
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(201)
                res.end(JSON.stringify({ universe: meta }))
                auditEvent('universe:create', auth, { universeId: id, label })
              } else {
                res.writeHead(500)
                res.end(JSON.stringify({ error: 'Failed to save universe' }))
                auditEvent('universe:create', auth, { universeId: id, error: 'save-failed' })
              }
            } catch (e) {
              auditEvent('universe:create', auth, { error: String(e) })
              res.writeHead(500)
              res.end(JSON.stringify({ error: 'Failed to create universe' }))
            }
          })()
          return
        }

        // POST /api/universes/:id/versions - create new version
        if (req.method === 'POST' && normalizedPath.match(/^\/api\/universes\/[^/]+\/versions$/)) {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          ;(async () => {
            try {
              const match = normalizedPath.match(/^\/api\/universes\/([^/]+)\/versions$/)
              if (!match) return
              const universeId = decodeURIComponent(match[1])
              const body = await readJsonBody(req)
              setCors(req.headers.origin as string | undefined)
              
              const { id, label, description, createdBy, canvasState, bindings } = body
              if (!id || !label || !createdBy || !canvasState) {
                res.writeHead(400)
                res.end(JSON.stringify({ error: 'Missing required fields: id, label, createdBy, canvasState' }))
                return
              }
              
              const meta = getUniverseMeta(universeId)
              if (!meta) {
                res.writeHead(404)
                res.end(JSON.stringify({ error: 'Universe not found' }))
                auditEvent('universe:version:create', auth, { universeId, error: 'universe-not-found' })
                return
              }
              
              const now = new Date().toISOString()
              const version = {
                id,
                label,
                description: description || '',
                createdAt: now,
                createdBy,
                canvasState,
                bindings: bindings || [],
                lastRunSummary: body.lastRunSummary || null,
              }
              
              const saved = saveUniverseVersion(universeId, id, version)
              if (saved) {
                // Update universe meta with new version
                if (!meta.versionIds.includes(id)) {
                  meta.versionIds.push(id)
                }
                if (!meta.activeVersionId) {
                  meta.activeVersionId = id
                }
                meta.updatedAt = now
                saveUniverseMeta(universeId, meta)
                
                res.setHeader('Content-Type', 'application/json')
                res.writeHead(201)
                res.end(JSON.stringify({ version }))
                auditEvent('universe:version:create', auth, { universeId, versionId: id, label })
              } else {
                res.writeHead(500)
                res.end(JSON.stringify({ error: 'Failed to save version' }))
                auditEvent('universe:version:create', auth, { universeId, versionId: id, error: 'save-failed' })
              }
            } catch (e) {
              auditEvent('universe:version:create', auth, { error: String(e) })
              res.writeHead(500)
              res.end(JSON.stringify({ error: 'Failed to create version' }))
            }
          })()
          return
        }

        // DELETE /api/universes/:id - remove a universe and its versions
        if (req.method === 'DELETE' && normalizedPath.match(/^\/api\/universes\/[^/]+$/)) {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          const match = normalizedPath.match(/^\/api\/universes\/([^/]+)$/)
          if (!match) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Invalid universe id' }))
            return
          }

          const universeId = decodeURIComponent(match[1])
          setCors(req.headers.origin as string | undefined)
          try {
            const universeDir = path.join(universesDir, universeId)
            if (!fs.existsSync(universeDir)) {
              res.writeHead(404)
              res.end(JSON.stringify({ error: 'Universe not found' }))
              auditEvent('universe:delete', auth, { universeId, error: 'not-found' })
              return
            }

            fs.rmSync(universeDir, { recursive: true, force: true })
            res.writeHead(204)
            res.end()
            auditEvent('universe:delete', auth, { universeId, success: true })
          } catch (e) {
            auditEvent('universe:delete', auth, { universeId, error: String(e) })
            res.writeHead(500)
            res.end(JSON.stringify({ error: 'Failed to delete universe' }))
          }
          return
        }

        // POST /api/universes/:id/launch - simulate launch request
        if (req.method === 'POST' && normalizedPath.match(/^\/api\/universes\/[^/]+\/launch$/)) {
          const auth = requireEditor({ allowLegacy: true })
          if (!auth) return
          const match = normalizedPath.match(/^\/api\/universes\/([^/]+)\/launch$/)
          if (!match) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Invalid universe id' }))
            return
          }

          const universeId = decodeURIComponent(match[1])
          ;(async () => {
            setCors(req.headers.origin as string | undefined)
            try {
              const meta = getUniverseMeta(universeId)
              if (!meta) {
                res.writeHead(404)
                res.end(JSON.stringify({ error: 'Universe not found' }))
                auditEvent('universe:launch', auth, { universeId, error: 'not-found' })
                return
              }

              const body = await readJsonBody(req)
              const launchId = `launch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
              const status = 'queued'

              auditEvent('universe:launch', auth, { universeId, launchId, config: body?.config ?? null })
              res.setHeader('Content-Type', 'application/json')
              res.writeHead(202)
              res.end(JSON.stringify({ launchId, status }))
            } catch (e) {
              auditEvent('universe:launch', auth, { universeId, error: String(e) })
              res.writeHead(500)
              res.end(JSON.stringify({ error: 'Failed to initiate launch' }))
            }
          })()
          return
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
