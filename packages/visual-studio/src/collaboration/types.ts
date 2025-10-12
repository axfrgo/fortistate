/**
 * Collaboration Types
 * Using Fortistate's ontogenetic operators to model collaborative state
 */

export type UserId = string
export type SessionId = string
export type ProjectId = string

export interface User {
  id: UserId
  name: string
  email: string
  avatar: string
  color: string
  tier: 'free' | 'pro' | 'enterprise'
}

export interface Cursor {
  x: number
  y: number
  timestamp: number
}

export interface Selection {
  nodeIds: string[]
  edgeIds: string[]
}

export interface Presence {
  userId: UserId
  user: User // Include full user info
  sessionId: SessionId
  projectId: ProjectId
  cursor: Cursor | null
  selection: Selection
  viewport: {
    x: number
    y: number
    zoom: number
  }
  lastSeen: number
  status: 'active' | 'idle' | 'away'
}

export interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'edit' | 'join' | 'leave'
  userId: UserId
  timestamp: number
  payload: any
}

export interface SyncOperation {
  id: string
  type: 'node.create' | 'node.update' | 'node.delete' | 'edge.create' | 'edge.update' | 'edge.delete'
  userId: UserId
  timestamp: number
  data: any
  vector: Record<UserId, number> // Vector clock for causality
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'prompt-user' | 'operational-transform'
  winner?: UserId
  mergedData?: any
}

export interface CollaborationState {
  projectId: ProjectId
  users: Map<UserId, User>
  presence: Map<UserId, Presence>
  operations: SyncOperation[]
  vectorClock: Record<UserId, number>
}
