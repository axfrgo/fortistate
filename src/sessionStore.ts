import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type SessionRole = 'observer' | 'editor' | 'admin'

export interface SessionRecord {
  id: string
  role: SessionRole
  createdAt: number
  expiresAt?: number
  label?: string
  issuedBy?: string
  ip?: string
  userAgent?: string
}

export interface SessionContext {
  session: SessionRecord
  tokenType: 'opaque' | 'jwt'
}

interface PersistedData {
  version?: number
  sessions?: Record<string, SessionRecord>
  tokens?: Record<string, string>
}

export interface SessionStoreOptions {
  rootDir: string
  secret?: string
  jwtSecret?: string
  debug?: boolean
  defaultTtlMs?: number
  maxSessions?: number
}

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
const DEFAULT_MAX_SESSIONS = 500

const ROLE_ORDER: Record<SessionRole, number> = {
  observer: 0,
  editor: 1,
  admin: 2,
}

const SESSION_FILE = '.fortistate-sessions.json'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): Buffer {
  const padLength = (4 - (str.length % 4)) % 4
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength)
  return Buffer.from(padded, 'base64')
}

export class SessionStore {
  private readonly filePath: string
  private readonly secret: Buffer
  private readonly jwtSecret?: Buffer
  private readonly defaultTtlMs: number
  private readonly maxSessions: number
  private readonly debug: boolean

  private sessions = new Map<string, SessionRecord>()
  private tokens = new Map<string, string>()

  constructor(options: SessionStoreOptions) {
    this.filePath = path.resolve(options.rootDir, SESSION_FILE)
    this.defaultTtlMs = options.defaultTtlMs ?? DEFAULT_TTL_MS
    this.maxSessions = options.maxSessions ?? DEFAULT_MAX_SESSIONS
    this.debug = Boolean(options.debug)

    const envSecret = options.secret || process.env.FORTISTATE_SESSION_SECRET
    if (envSecret && envSecret.length >= 16) {
      this.secret = Buffer.from(envSecret)
    } else {
      const generated = crypto.randomBytes(48)
      this.secret = generated
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.warn('[fortistate][sessions] Generated ephemeral session secret – set FORTISTATE_SESSION_SECRET to persist tokens across restarts')
      }
    }

    if (options.jwtSecret || process.env.FORTISTATE_JWT_SECRET) {
      const raw = options.jwtSecret || process.env.FORTISTATE_JWT_SECRET || ''
      this.jwtSecret = Buffer.from(raw)
    }

    this.load()
    this.cleanupExpired()
  }

  listSessions(): SessionRecord[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.createdAt - a.createdAt)
  }

  hasSessions(): boolean {
    return this.sessions.size > 0
  }

  getSession(sessionId: string): SessionRecord | undefined {
    return this.sessions.get(sessionId)
  }

  canAct(role: SessionRole, required: SessionRole): boolean {
    return ROLE_ORDER[role] >= ROLE_ORDER[required]
  }

  createSession(opts: { role: SessionRole; ttlMs?: number; label?: string; issuedBy?: string; ip?: string; userAgent?: string }): { session: SessionRecord; token: string; tokenType: 'opaque' | 'jwt' } {
    const sessionId = crypto.randomUUID()
    const now = Date.now()
    const ttl = typeof opts.ttlMs === 'number' && opts.ttlMs > 0 ? opts.ttlMs : this.defaultTtlMs
    const expiresAt = Number.isFinite(ttl) ? now + ttl : undefined
    const session: SessionRecord = {
      id: sessionId,
      role: opts.role,
      createdAt: now,
      expiresAt,
      label: opts.label,
      issuedBy: opts.issuedBy,
      ip: opts.ip,
      userAgent: opts.userAgent,
    }

    this.sessions.set(sessionId, session)
    this.enforceLimit()

    if (this.jwtSecret) {
      const token = this.issueJwtToken(session)
      this.save()
      return { session, token, tokenType: 'jwt' }
    }

    const token = this.issueOpaqueToken(sessionId)
    this.save()
    return { session, token, tokenType: 'opaque' }
  }

  validateToken(token: string): SessionContext | null {
    if (!token) return null
    if (this.jwtSecret) {
      const ctx = this.verifyJwtToken(token)
      if (!ctx) return null
      const record = this.sessions.get(ctx.sessionId)
      if (!record) return null
      if (record.expiresAt && record.expiresAt <= Date.now()) {
        this.sessions.delete(record.id)
        this.save()
        return null
      }
      return { session: record, tokenType: 'jwt' }
    }

    const hash = this.hashToken(token)
    const sessionId = this.tokens.get(hash)
    if (!sessionId) return null
    const record = this.sessions.get(sessionId)
    if (!record) {
      this.tokens.delete(hash)
      this.save()
      return null
    }
    if (record.expiresAt && record.expiresAt <= Date.now()) {
      this.sessions.delete(sessionId)
      this.tokens.delete(hash)
      this.save()
      return null
    }
    return { session: record, tokenType: 'opaque' }
  }

  revokeSession(sessionId: string): boolean {
    const record = this.sessions.get(sessionId)
    if (!record) return false
    this.sessions.delete(sessionId)
    if (!this.jwtSecret) {
      for (const [hash, sid] of this.tokens.entries()) {
        if (sid === sessionId) this.tokens.delete(hash)
      }
    }
    this.save()
    return true
  }

  cleanupExpired(): void {
    const now = Date.now()
    let dirty = false
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt && session.expiresAt <= now) {
        this.sessions.delete(sessionId)
        dirty = true
      }
    }
    if (!this.jwtSecret) {
      for (const [hash, sessionId] of this.tokens.entries()) {
        if (!this.sessions.has(sessionId)) {
          this.tokens.delete(hash)
          dirty = true
        }
      }
    }
    if (dirty) this.save()
  }

  private enforceLimit(): void {
    const max = this.maxSessions
    if (this.sessions.size <= max) return
    const sorted = Array.from(this.sessions.values()).sort((a, b) => a.createdAt - b.createdAt)
    const removeCount = this.sessions.size - max
    for (let i = 0; i < removeCount; i++) {
      const victim = sorted[i]
      this.revokeSession(victim.id)
    }
  }

  private issueOpaqueToken(sessionId: string): string {
    const token = base64UrlEncode(crypto.randomBytes(32))
    const hash = this.hashToken(token)
    this.tokens.set(hash, sessionId)
    return token
  }

  private issueJwtToken(session: SessionRecord): string {
    if (!this.jwtSecret) throw new Error('JWT secret not configured')
    const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
    const payloadObj: Record<string, unknown> = {
      sid: session.id,
      role: session.role,
      iat: Math.floor(session.createdAt / 1000),
      iss: 'fortistate',
    }
    if (session.expiresAt) payloadObj.exp = Math.floor(session.expiresAt / 1000)
    const payload = base64UrlEncode(Buffer.from(JSON.stringify(payloadObj)))
    const signature = this.signJwt(`${header}.${payload}`)
    return `${header}.${payload}.${signature}`
  }

  private verifyJwtToken(token: string): { sessionId: string } | null {
    if (!this.jwtSecret) return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerEncoded, payloadEncoded, signature] = parts
    const expectedSig = this.signJwt(`${headerEncoded}.${payloadEncoded}`)
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null
    try {
      const payloadJson = base64UrlDecode(payloadEncoded)
      const payload = JSON.parse(textDecoder.decode(payloadJson)) as { sid?: string; role?: SessionRole; exp?: number }
      if (!payload.sid) return null
      if (payload.exp && payload.exp * 1000 <= Date.now()) return null
      return { sessionId: payload.sid }
    } catch (e) {
      return null
    }
  }

  private signJwt(data: string): string {
    if (!this.jwtSecret) throw new Error('JWT secret not configured')
    return base64UrlEncode(crypto.createHmac('sha256', this.jwtSecret).update(data).digest())
  }

  private hashToken(token: string): string {
    return crypto.createHmac('sha256', this.secret).update(token).digest('hex')
  }

  private load(): void {
    if (!fs.existsSync(this.filePath)) return
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as PersistedData
      if (parsed.sessions) {
        for (const [sessionId, record] of Object.entries(parsed.sessions)) {
          this.sessions.set(sessionId, record)
        }
      }
      if (!this.jwtSecret && parsed.tokens) {
        for (const [hash, sessionId] of Object.entries(parsed.tokens)) {
          this.tokens.set(hash, sessionId)
        }
      }
    } catch (e) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.error('[fortistate][sessions] Failed to load session store:', e)
      }
    }
  }

  private save(): void {
    const payload: PersistedData = {
      version: 1,
      sessions: Object.fromEntries(this.sessions.entries()),
    }
    if (!this.jwtSecret) payload.tokens = Object.fromEntries(this.tokens.entries())
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), 'utf-8')
    } catch (e) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.error('[fortistate][sessions] Failed to write session store:', e)
      }
    }
  }
}

export const RoleOrder = ROLE_ORDER
