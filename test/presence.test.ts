import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PresenceManager } from '../src/presence.js'
import type { SessionContext } from '../src/sessionStore.js'
import { WebSocket } from 'ws'

// Mock WebSocket for testing
class MockWebSocket {
  readyState = 1
  close() {}
  send() {}
}

describe('PresenceManager', () => {
  let presenceManager: PresenceManager

  beforeEach(() => {
    presenceManager = new PresenceManager({ debug: false })
  })

  afterEach(() => {
    // Clean up
  })

  describe('add', () => {
    it('should add a user with session context', () => {
      const ws = new MockWebSocket() as any
      const sessionContext: SessionContext = {
        session: {
          id: 'sess_123',
          role: 'editor',
          createdAt: Date.now(),
          expiresAt: Date.now() + 3600000,
          label: 'Alice',
        },
        tokenType: 'jwt',
      }

      const user = presenceManager.add(ws, sessionContext, '127.0.0.1')

      expect(user.sessionId).toBe('sess_123')
      expect(user.displayName).toBe('Alice (editor)')
      expect(user.role).toBe('editor')
      expect(user.remoteAddress).toBe('127.0.0.1')
      expect(user.activeStore).toBeNull()
      expect(user.cursorPath).toBeNull()
    })

    it('should add anonymous user without session', () => {
      const ws = new MockWebSocket() as any

      const user = presenceManager.add(ws, null, '192.168.1.1')

      expect(user.sessionId).toBeNull()
      expect(user.displayName).toMatch(/^Guest \d+$/)
      expect(user.role).toBe('anonymous')
      expect(user.remoteAddress).toBe('192.168.1.1')
    })

    it('should generate unique guest names for multiple anonymous users', () => {
      const ws1 = new MockWebSocket() as any
      const ws2 = new MockWebSocket() as any

      const user1 = presenceManager.add(ws1, null, null)
      const user2 = presenceManager.add(ws2, null, null)

      expect(user1.displayName).not.toBe(user2.displayName)
      expect(user1.displayName).toMatch(/^Guest \d+$/)
      expect(user2.displayName).toMatch(/^Guest \d+$/)
    })

    it('should use session ID as fallback when no label provided', () => {
      const ws = new MockWebSocket() as any
      const sessionContext: SessionContext = {
        session: {
          id: 'sess_abcd1234',
          role: 'admin',
          createdAt: Date.now(),
          expiresAt: Date.now() + 3600000,
        },
        tokenType: 'jwt',
      }

      const user = presenceManager.add(ws, sessionContext, null)

      expect(user.displayName).toBe('admin sess_abc')
      expect(user.role).toBe('admin')
    })
  })

  describe('remove', () => {
    it('should remove an existing user', () => {
      const ws = new MockWebSocket() as any
      const sessionContext: SessionContext = {
        session: {
          id: 'sess_123',
          role: 'observer',
          createdAt: Date.now(),
          expiresAt: Date.now() + 3600000,
          label: 'Bob',
        },
        tokenType: 'jwt',
      }

      presenceManager.add(ws, sessionContext, null)
      expect(presenceManager.count()).toBe(1)

      const removed = presenceManager.remove(ws)

      expect(removed).not.toBeNull()
      expect(removed?.sessionId).toBe('sess_123')
      expect(presenceManager.count()).toBe(0)
    })

    it('should return null when removing non-existent user', () => {
      const ws = new MockWebSocket() as any
      const removed = presenceManager.remove(ws)
      expect(removed).toBeNull()
    })
  })

  describe('update', () => {
    it('should update active store', () => {
      const ws = new MockWebSocket() as any
      presenceManager.add(ws, null, null)

      const updated = presenceManager.update(ws, { activeStore: 'counter' })

      expect(updated).not.toBeNull()
      expect(updated?.activeStore).toBe('counter')
    })

    it('should update cursor path', () => {
      const ws = new MockWebSocket() as any
      presenceManager.add(ws, null, null)

      const updated = presenceManager.update(ws, { cursorPath: ['items', 0, 'name'] })

      expect(updated).not.toBeNull()
      expect(updated?.cursorPath).toEqual(['items', 0, 'name'])
    })

    it('should update both activeStore and cursorPath', () => {
      const ws = new MockWebSocket() as any
      presenceManager.add(ws, null, null)

      const updated = presenceManager.update(ws, {
        activeStore: 'todos',
        cursorPath: ['list', 2],
      })

      expect(updated?.activeStore).toBe('todos')
      expect(updated?.cursorPath).toEqual(['list', 2])
    })

    it('should update lastActivity timestamp', () => {
      const ws = new MockWebSocket() as any
      const user = presenceManager.add(ws, null, null)
      const originalActivity = user.lastActivity

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        const updated = presenceManager.update(ws, { activeStore: 'cart' })
        expect(updated?.lastActivity).not.toBe(originalActivity)
      }, 10)
    })

    it('should return null for non-existent user', () => {
      const ws = new MockWebSocket() as any
      const updated = presenceManager.update(ws, { activeStore: 'store1' })
      expect(updated).toBeNull()
    })
  })

  describe('get', () => {
    it('should retrieve user by websocket', () => {
      const ws = new MockWebSocket() as any
      const sessionContext: SessionContext = {
        session: {
          id: 'sess_xyz',
          role: 'editor',
          createdAt: Date.now(),
          expiresAt: Date.now() + 3600000,
          label: 'Charlie',
        },
        tokenType: 'jwt',
      }

      presenceManager.add(ws, sessionContext, null)
      const user = presenceManager.get(ws)

      expect(user).not.toBeNull()
      expect(user?.sessionId).toBe('sess_xyz')
      expect(user?.displayName).toBe('Charlie (editor)')
    })

    it('should return null for non-existent websocket', () => {
      const ws = new MockWebSocket() as any
      const user = presenceManager.get(ws)
      expect(user).toBeNull()
    })
  })

  describe('getAll', () => {
    it('should return empty array when no users', () => {
      const users = presenceManager.getAll()
      expect(users).toEqual([])
    })

    it('should return all connected users', () => {
      const ws1 = new MockWebSocket() as any
      const ws2 = new MockWebSocket() as any
      const ws3 = new MockWebSocket() as any

      presenceManager.add(ws1, null, null)
      presenceManager.add(ws2, null, null)
      presenceManager.add(ws3, null, null)

      const users = presenceManager.getAll()
      expect(users.length).toBe(3)
    })
  })

  describe('count', () => {
    it('should return correct count', () => {
      expect(presenceManager.count()).toBe(0)

      const ws1 = new MockWebSocket() as any
      const ws2 = new MockWebSocket() as any

      presenceManager.add(ws1, null, null)
      expect(presenceManager.count()).toBe(1)

      presenceManager.add(ws2, null, null)
      expect(presenceManager.count()).toBe(2)

      presenceManager.remove(ws1)
      expect(presenceManager.count()).toBe(1)
    })
  })

  describe('touch', () => {
    it('should update lastActivity timestamp', () => {
      const ws = new MockWebSocket() as any
      const user = presenceManager.add(ws, null, null)
      const originalActivity = user.lastActivity

      setTimeout(() => {
        presenceManager.touch(ws)
        const updated = presenceManager.get(ws)
        expect(updated?.lastActivity).not.toBe(originalActivity)
      }, 10)
    })

    it('should not throw for non-existent user', () => {
      const ws = new MockWebSocket() as any
      expect(() => presenceManager.touch(ws)).not.toThrow()
    })
  })

  describe('getUsersForStore', () => {
    it('should return users viewing specific store', () => {
      const ws1 = new MockWebSocket() as any
      const ws2 = new MockWebSocket() as any
      const ws3 = new MockWebSocket() as any

      presenceManager.add(ws1, null, null)
      presenceManager.add(ws2, null, null)
      presenceManager.add(ws3, null, null)

      presenceManager.update(ws1, { activeStore: 'counter' })
      presenceManager.update(ws2, { activeStore: 'todos' })
      presenceManager.update(ws3, { activeStore: 'counter' })

      const counterUsers = presenceManager.getUsersForStore('counter')
      const todoUsers = presenceManager.getUsersForStore('todos')

      expect(counterUsers.length).toBe(2)
      expect(todoUsers.length).toBe(1)
    })

    it('should return empty array when no users viewing store', () => {
      const users = presenceManager.getUsersForStore('nonexistent')
      expect(users).toEqual([])
    })
  })

  describe('removeIdleUsers', () => {
    it('should remove users idle beyond threshold', () => {
      const ws1 = new MockWebSocket() as any
      const ws2 = new MockWebSocket() as any

      const user1 = presenceManager.add(ws1, null, null)
      presenceManager.add(ws2, null, null)

      // Manually set old timestamp for user1
      user1.lastActivity = new Date(Date.now() - 10000).toISOString()

      const removed = presenceManager.removeIdleUsers(5000)

      expect(removed.length).toBe(1)
      expect(presenceManager.count()).toBe(1)
    })

    it('should not remove active users', () => {
      const ws = new MockWebSocket() as any
      presenceManager.add(ws, null, null)

      const removed = presenceManager.removeIdleUsers(5000)

      expect(removed.length).toBe(0)
      expect(presenceManager.count()).toBe(1)
    })
  })

  describe('multi-user scenarios', () => {
    it('should handle concurrent users with different roles', () => {
      const contexts: SessionContext[] = [
        {
          session: {
            id: 'sess_admin',
            role: 'admin',
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
            label: 'Admin User',
          },
          tokenType: 'jwt',
        },
        {
          session: {
            id: 'sess_editor',
            role: 'editor',
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
            label: 'Editor User',
          },
          tokenType: 'jwt',
        },
        {
          session: {
            id: 'sess_observer',
            role: 'observer',
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
            label: 'Observer User',
          },
          tokenType: 'jwt',
        },
      ]

      const sockets = contexts.map(() => new MockWebSocket() as any)
      contexts.forEach((ctx, i) => presenceManager.add(sockets[i], ctx, null))

      const users = presenceManager.getAll()
      expect(users.length).toBe(3)
      expect(users.find((u) => u.role === 'admin')).toBeDefined()
      expect(users.find((u) => u.role === 'editor')).toBeDefined()
      expect(users.find((u) => u.role === 'observer')).toBeDefined()
    })

    it('should handle rapid updates from multiple users', () => {
      const ws1 = new MockWebSocket() as any
      const ws2 = new MockWebSocket() as any

      presenceManager.add(ws1, null, null)
      presenceManager.add(ws2, null, null)

      // Rapid updates
      presenceManager.update(ws1, { activeStore: 'store1' })
      presenceManager.update(ws2, { activeStore: 'store2' })
      presenceManager.update(ws1, { activeStore: 'store3' })
      presenceManager.update(ws2, { cursorPath: ['a', 'b'] })

      const user1 = presenceManager.get(ws1)
      const user2 = presenceManager.get(ws2)

      expect(user1?.activeStore).toBe('store3')
      expect(user2?.activeStore).toBe('store2')
      expect(user2?.cursorPath).toEqual(['a', 'b'])
    })
  })
})
