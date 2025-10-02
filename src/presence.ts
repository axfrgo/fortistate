import type { WebSocket } from 'ws'
import type { SessionContext } from './sessionStore.js'

export interface PresenceUser {
  sessionId: string | null
  displayName: string
  role: 'observer' | 'editor' | 'admin' | 'anonymous'
  connectedAt: string
  lastActivity: string
  activeStore: string | null
  cursorPath: (string | number)[] | null
  remoteAddress: string | null
}

export interface PresenceUpdateMessage {
  type: 'presence:update'
  activeStore?: string | null
  cursorPath?: (string | number)[] | null
}

export interface PresenceOptions {
  debug?: boolean
}

export class PresenceManager {
  private readonly users = new Map<WebSocket, PresenceUser>()
  private readonly debug: boolean
  private anonCounter = 0

  constructor(options: PresenceOptions = {}) {
    this.debug = Boolean(options.debug)
  }

  /**
   * Register a new WebSocket connection with presence tracking
   */
  add(
    ws: WebSocket,
    sessionContext: SessionContext | null,
    remoteAddress: string | null,
  ): PresenceUser {
    const now = new Date().toISOString()
    const displayName = this.generateDisplayName(sessionContext)
    const role = sessionContext?.session.role ?? 'anonymous'

    const user: PresenceUser = {
      sessionId: sessionContext?.session.id ?? null,
      displayName,
      role,
      connectedAt: now,
      lastActivity: now,
      activeStore: null,
      cursorPath: null,
      remoteAddress,
    }

    this.users.set(ws, user)

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(`[fortistate][presence] User joined: ${displayName} (${role})`)
    }

    return user
  }

  /**
   * Remove a WebSocket connection from presence tracking
   */
  remove(ws: WebSocket): PresenceUser | null {
    const user = this.users.get(ws)
    if (!user) return null

    this.users.delete(ws)

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(`[fortistate][presence] User left: ${user.displayName}`)
    }

    return user
  }

  /**
   * Update presence information for a connection
   */
  update(
    ws: WebSocket,
    update: { activeStore?: string | null; cursorPath?: (string | number)[] | null },
  ): PresenceUser | null {
    const user = this.users.get(ws)
    if (!user) return null

    if (update.activeStore !== undefined) {
      user.activeStore = update.activeStore
    }

    if (update.cursorPath !== undefined) {
      user.cursorPath = update.cursorPath
    }

    user.lastActivity = new Date().toISOString()

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(`[fortistate][presence] Updated: ${user.displayName} → ${user.activeStore}`)
    }

    return user
  }

  /**
   * Get presence user for a specific WebSocket
   */
  get(ws: WebSocket): PresenceUser | null {
    return this.users.get(ws) ?? null
  }

  /**
   * Get all connected users
   */
  getAll(): PresenceUser[] {
    return Array.from(this.users.values())
  }

  /**
   * Get count of connected users
   */
  count(): number {
    return this.users.size
  }

  /**
   * Update last activity timestamp for a connection
   */
  touch(ws: WebSocket): void {
    const user = this.users.get(ws)
    if (user) {
      user.lastActivity = new Date().toISOString()
    }
  }

  /**
   * Get users viewing a specific store
   */
  getUsersForStore(storeKey: string): PresenceUser[] {
    return this.getAll().filter((u) => u.activeStore === storeKey)
  }

  /**
   * Clean up idle users (optional, for future heartbeat support)
   */
  removeIdleUsers(maxIdleMs: number): PresenceUser[] {
    const now = Date.now()
    const removed: PresenceUser[] = []

    for (const [ws, user] of this.users.entries()) {
      const lastActivityMs = new Date(user.lastActivity).getTime()
      if (now - lastActivityMs > maxIdleMs) {
        this.users.delete(ws)
        removed.push(user)

        if (this.debug) {
          // eslint-disable-next-line no-console
          console.log(`[fortistate][presence] Removed idle user: ${user.displayName}`)
        }
      }
    }

    return removed
  }

  /**
   * Generate a display name from session context
   */
  private generateDisplayName(sessionContext: SessionContext | null): string {
    if (!sessionContext) {
      this.anonCounter++
      return `Guest ${this.anonCounter}`
    }

    const session = sessionContext.session
    if (session.label) {
      return `${session.label} (${session.role})`
    }

    // Use short session ID as fallback
    const shortId = session.id.substring(0, 8)
    return `${session.role} ${shortId}`
  }
}
