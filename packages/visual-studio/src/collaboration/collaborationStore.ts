/**
 * Collaboration Store using Fortistate Primitives
 * Models presence, sync, and conflicts as ontogenetic laws
 */

import { runtimeConfig } from '../runtimeConfig'

import type {
  User,
  UserId,
  SessionId,
  ProjectId,
  Presence,
  CollaborationEvent,
  SyncOperation,
  CollaborationState,
  ConflictResolution,
} from './types'

type Listener<T = any> = (data: T) => void

export class CollaborationStore {
  private state: CollaborationState
  private listeners: Map<string, Set<Listener>> = new Map()
  private ws: WebSocket | null = null
  private heartbeatInterval: number | null = null
  private currentUser: User | null = null
  private sessionId: SessionId = crypto.randomUUID()

  constructor(projectId: ProjectId) {
    this.state = {
      projectId,
      users: new Map(),
      presence: new Map(),
      operations: [],
      vectorClock: {},
    }
  }

  // BEGIN: Initialize collaboration session
  async begin(user: User, wsUrl: string = runtimeConfig.collaborationWsUrl): Promise<void> {
    this.currentUser = user
    this.state.users.set(user.id, user)
    this.state.vectorClock[user.id] = 0

    // Establish WebSocket connection
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('🔗 Collaboration session began', { user: user.name, project: this.state.projectId })

          // Send JOIN event
          this.send({
            type: 'join',
            userId: user.id,
            timestamp: Date.now(),
            payload: {
              user,
              sessionId: this.sessionId,
              projectId: this.state.projectId,
            },
          })

          // Start heartbeat
          this.startHeartbeat()
          resolve()
        }

        this.ws.onerror = () => {
          console.warn('⚠️ WebSocket connection unavailable:', wsUrl)
          console.info('💡 Collaboration features disabled - working in offline mode')
          // Don't reject - allow app to work without collaboration
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data))
        }

        this.ws.onclose = () => {
          console.log('🔌 WebSocket closed - collaboration session ended')
          this.stopHeartbeat()
        }
      } catch (error) {
        console.warn('⚠️ Failed to establish WebSocket connection:', error)
        console.info('💡 Collaboration features disabled - working in offline mode')
        // Don't reject - allow app to work without collaboration
        resolve()
      }
    })
  }

  // BECOME: Update presence state
  updatePresence(updates: Partial<Omit<Presence, 'userId' | 'sessionId' | 'projectId' | 'user'>>): void {
    if (!this.currentUser) return

    const currentPresence = this.state.presence.get(this.currentUser.id) || {
      userId: this.currentUser.id,
      user: this.currentUser,
      sessionId: this.sessionId,
      projectId: this.state.projectId,
      cursor: null,
      selection: { nodeIds: [], edgeIds: [] },
      viewport: { x: 0, y: 0, zoom: 1 },
      lastSeen: Date.now(),
      status: 'active' as const,
    }

    const newPresence: Presence = {
      ...currentPresence,
      ...updates,
      user: this.currentUser,
      lastSeen: Date.now(),
    }

    this.state.presence.set(this.currentUser.id, newPresence)

    // Broadcast presence update
    this.send({
      type: 'cursor',
      userId: this.currentUser.id,
      timestamp: Date.now(),
      payload: newPresence,
    })

    this.emit('presence:update', newPresence)
  }

  // BECOME: Apply remote operation
  applyOperation(operation: SyncOperation): void {
    // Update vector clock
    this.state.vectorClock[operation.userId] = Math.max(
      this.state.vectorClock[operation.userId] || 0,
      operation.vector[operation.userId] || 0
    )

    // Detect conflicts
    const conflicts = this.detectConflicts(operation)

    if (conflicts.length > 0) {
      console.warn('⚠️ Conflict detected:', conflicts)
      const resolution = this.resolveConflict(operation, conflicts)
      if (resolution.mergedData) {
        operation.data = resolution.mergedData
      }
    }

    // Store operation
    this.state.operations.push(operation)

    // Emit for UI updates
    this.emit('operation:applied', operation)
  }

  // RESOLVE: Conflict resolution using Fortistate strategies
  private resolveConflict(
    incoming: SyncOperation,
    conflicts: SyncOperation[]
  ): ConflictResolution {
    // Strategy 1: Last-Write-Wins (LWW)
    const latestOp = [incoming, ...conflicts].sort((a, b) => b.timestamp - a.timestamp)[0]

    if (latestOp === incoming) {
      return { strategy: 'last-write-wins', winner: incoming.userId }
    }

    // Strategy 2: Operational Transform for concurrent edits
    if (incoming.type.includes('update') && conflicts.some((c) => c.type.includes('update'))) {
      const merged = this.mergeOperations(incoming, conflicts[0])
      return { strategy: 'operational-transform', mergedData: merged }
    }

    return { strategy: 'last-write-wins', winner: latestOp.userId }
  }

  private mergeOperations(op1: SyncOperation, op2: SyncOperation): any {
    // Simple merge: combine data fields
    return {
      ...op2.data,
      ...op1.data,
      _mergedFrom: [op1.userId, op2.userId],
    }
  }

  private detectConflicts(operation: SyncOperation): SyncOperation[] {
    return this.state.operations.filter((op) => {
      // Same target, different user, concurrent timestamp
      return (
        op.data.id === operation.data.id &&
        op.userId !== operation.userId &&
        Math.abs(op.timestamp - operation.timestamp) < 1000
      )
    })
  }

  // CEASE: End collaboration session
  cease(): void {
    if (this.currentUser) {
      this.send({
        type: 'leave',
        userId: this.currentUser.id,
        timestamp: Date.now(),
        payload: { sessionId: this.sessionId },
      })
    }

    this.stopHeartbeat()
    this.ws?.close()
    this.state.presence.clear()
    console.log('🛑 Collaboration session ceased')
  }

  // WebSocket messaging
  private send(event: CollaborationEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event))
    }
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'join':
        this.handleUserJoin(data.payload)
        break
      case 'leave':
        this.handleUserLeave(data.payload)
        break
      case 'cursor':
        this.handlePresenceUpdate(data.payload)
        break
      case 'operation':
        this.applyOperation(data.payload)
        break
      case 'sync:initial':
        this.handleInitialSync(data.payload)
        break
      default:
        console.warn('Unknown message type:', data.type)
    }
  }

  private handleUserJoin(payload: { user: User; sessionId: SessionId }): void {
    this.state.users.set(payload.user.id, payload.user)
    this.state.vectorClock[payload.user.id] = 0
    console.log('👋 User joined:', payload.user.name)
    this.emit('user:join', payload.user)
  }

  private handleUserLeave(payload: { userId: UserId }): void {
    const user = this.state.users.get(payload.userId)
    this.state.users.delete(payload.userId)
    this.state.presence.delete(payload.userId)
    console.log('👋 User left:', user?.name)
    this.emit('user:leave', payload.userId)
  }

  private handlePresenceUpdate(presence: Presence): void {
    this.state.presence.set(presence.userId, presence)
    this.emit('presence:update', presence)
  }

  private handleInitialSync(payload: { users: User[]; operations: SyncOperation[] }): void {
    payload.users.forEach((user) => {
      this.state.users.set(user.id, user)
      this.state.vectorClock[user.id] = 0
    })

    payload.operations.forEach((op) => {
      this.applyOperation(op)
    })

    this.emit('sync:complete', payload)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.currentUser) {
        this.updatePresence({ status: 'active' })
      }
    }, 5000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Event system
  on<T = any>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event)!.add(listener)

    return () => {
      this.listeners.get(event)?.delete(listener)
    }
  }

  private emit<T = any>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  // Getters
  getPresence(): Map<UserId, Presence> {
    return new Map(this.state.presence)
  }

  getUsers(): Map<UserId, User> {
    return new Map(this.state.users)
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  getOperations(): SyncOperation[] {
    return [...this.state.operations]
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton factory
let instance: CollaborationStore | null = null

export function createCollaborationStore(projectId: ProjectId): CollaborationStore {
  if (!instance || instance.getOperations().length === 0) {
    instance = new CollaborationStore(projectId)
  }
  return instance
}

export function getCollaborationStore(): CollaborationStore | null {
  return instance
}
