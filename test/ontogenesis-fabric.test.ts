/**
 * 🧪 Law Fabric Engine Tests
 * 
 * Unit tests for the execution substrate
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFabric, LawFabricEngine } from '../src/ontogenesis/fabric.js'
import { BEGIN, BECOME, CEASE, TRANSCEND } from '../src/ontogenesis/operators.js'

describe('Law Fabric Engine', () => {
  let fabric: LawFabricEngine

  beforeEach(() => {
    fabric = createFabric('test:universe')
  })

  describe('Initialization', () => {
    it('should create a fabric with empty reality', () => {
      const reality = fabric.getReality()

      expect(reality.universeId).toBe('test:universe')
      expect(reality.entities.size).toBe(0)
    })

    it('should initialize with default universe if none provided', () => {
      const defaultFabric = createFabric()
      const reality = defaultFabric.getReality()

      expect(reality.universeId).toBe('universe:main')
    })
  })

  describe('BEGIN Operator Execution', () => {
    it('should create a new entity', () => {
      fabric.add(BEGIN('user:alice', { balance: 100, tier: 'gold' }))
      const result = fabric.execute()

      const alice = result.reality.entities.get('user:alice')
      expect(alice).toBeDefined()
      expect(alice!.properties.balance).toBe(100)
      expect(alice!.properties.tier).toBe('gold')
    })

    it('should record execution trace', () => {
      fabric.add(BEGIN('user:alice', { balance: 100 }))
      const result = fabric.execute()

      expect(result.trace).toHaveLength(1)
      expect(result.trace[0].operator.type).toBe('BEGIN')
      expect(result.trace[0].after?.id).toBe('user:alice')
    })

    it('should set timestamps on entities', () => {
      fabric.add(BEGIN('user:alice', { balance: 100 }))
      const result = fabric.execute()

      const alice = result.reality.entities.get('user:alice')
      expect(alice!.createdAt).toBeGreaterThan(0)
      expect(alice!.updatedAt).toBeGreaterThan(0)
    })
  })

  describe('BECOME Operator Execution', () => {
    beforeEach(() => {
      fabric.add(BEGIN('user:alice', { balance: 100 }))
      fabric.execute()
      fabric.clear()
    })

    it('should transform existing entity immediately', () => {
      fabric.add(BECOME('user:alice', 
        (state: any) => ({ ...state, balance: state.balance + 50 }),
        'IMMEDIATE'
      ))
      const result = fabric.execute()

      const alice = result.reality.entities.get('user:alice')
      expect(alice!.properties.balance).toBe(150)
    })

    it('should skip transformation if trigger not met', () => {
      fabric.add(BECOME('user:alice',
        (state: any) => ({ ...state, balance: state.balance + 50 }),
        (state: any) => state.event === 'deposit'
      ))
      const result = fabric.execute()

      const alice = result.reality.entities.get('user:alice')
      expect(alice!.properties.balance).toBe(100) // Unchanged
    })

    it('should apply transformation when trigger is met', () => {
      fabric.add(BECOME('user:alice',
        (state: any) => ({ ...state, balance: state.balance + 50 }),
        (state: any) => state.balance === 100
      ))
      const result = fabric.execute()

      const alice = result.reality.entities.get('user:alice')
      expect(alice!.properties.balance).toBe(150)
    })

    it('should update timestamps on transformation', () => {
      const before = fabric.getEntity('user:alice')!.updatedAt
      
      fabric.add(BECOME('user:alice',
        (state: any) => ({ ...state, balance: state.balance + 50 })
      ))
      fabric.execute()

      const after = fabric.getEntity('user:alice')!.updatedAt
      expect(after).toBeGreaterThanOrEqual(before)
    })

    it('should handle non-existent entity gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      try {
        fabric.add(BECOME('user:nonexistent',
          (state: any) => ({ ...state, value: 'changed' })
        ))
        const result = fabric.execute()

        expect(result.reality.entities.has('user:nonexistent')).toBe(false)
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('BECOME: Entity user:nonexistent'))
      } finally {
        warnSpy.mockRestore()
      }
    })
  })

  describe('CEASE Operator Execution', () => {
    beforeEach(() => {
      fabric.add(BEGIN('user:alice', { balance: 100 }))
      fabric.execute()
      fabric.clear()
    })

    it('should terminate entity when condition met', () => {
      fabric.add(CEASE('user:alice',
        (state: any) => state.balance === 100,
        'terminate'
      ))
      const result = fabric.execute()

      expect(result.reality.entities.has('user:alice')).toBe(false)
    })

    it('should not terminate if condition not met', () => {
      fabric.add(CEASE('user:alice',
        (state: any) => state.balance < 0,
        'terminate'
      ))
      const result = fabric.execute()

      expect(result.reality.entities.has('user:alice')).toBe(true)
    })

    it('should repair entity when action is repair', () => {
      // Set balance to negative
      fabric.add(BECOME('user:alice',
        (state: any) => ({ ...state, balance: -50 })
      ))
      fabric.execute()
      fabric.clear()

      // Repair to 0
      fabric.add(CEASE('user:alice',
        (state: any) => state.balance < 0,
        'repair',
        (state: any) => ({ ...state, balance: 0 })
      ))
      const result = fabric.execute()

      const alice = result.reality.entities.get('user:alice')
      expect(alice!.properties.balance).toBe(0)
    })

    it('should fork universe when action is fork', () => {
      // Set balance to negative
      fabric.add(BECOME('user:alice',
        (state: any) => ({ ...state, balance: -50 })
      ))
      fabric.execute()
      fabric.clear()

      // Fork on violation
      fabric.add(CEASE('user:alice',
        (state: any) => state.balance < 0,
        'fork',
        (state: any) => ({ ...state, balance: 0 })
      ))
      const result = fabric.execute()

      expect(result.branches).toHaveLength(2)
      expect(result.paradoxes).toHaveLength(1)
      expect(result.paradoxes[0].entity).toBe('user:alice')
    })
  })

  describe('TRANSCEND Operator Execution', () => {
    beforeEach(() => {
      fabric.add(BEGIN('user:alice', { balance: 100, tier: 'basic' }))
      fabric.execute()
      fabric.clear()
    })

    it('should not transcend if condition not met', () => {
      fabric.add(TRANSCEND('user:alice',
        'universe:vip',
        (state: any) => state.balance > 10000
      ))
      const result = fabric.execute()

      expect(result.reality.entities.has('user:alice')).toBe(true)
      expect(result.branches).toHaveLength(0)
    })

    it('should transcend to new universe when condition met', () => {
      // Increase balance
      fabric.add(BECOME('user:alice',
        (state: any) => ({ ...state, balance: 15000 })
      ))
      fabric.execute()
      fabric.clear()

      // Transcend
      fabric.add(TRANSCEND('user:alice',
        'universe:vip',
        (state: any) => state.balance > 10000
      ))
      const result = fabric.execute()

      expect(result.reality.entities.has('user:alice')).toBe(false)
      expect(result.branches).toHaveLength(1)
      expect(result.branches[0].universeId).toBe('universe:vip')
    })

    it('should apply mapping during transcendence', () => {
      fabric.add(BECOME('user:alice',
        (state: any) => ({ ...state, balance: 15000 })
      ))
      fabric.execute()
      fabric.clear()

      fabric.add(TRANSCEND('user:alice',
        'universe:vip',
        (state: any) => state.balance > 10000,
        (state: any) => ({ ...state, tier: 'platinum' })
      ))
      const result = fabric.execute()

      const alice = result.branches[0].entities.get('user:alice')
      expect(alice!.properties.tier).toBe('platinum')
    })
  })

  describe('Subscriptions', () => {
    it('should notify subscribers on entity changes', () => {
      const changes: any[] = []
      
      fabric.subscribe('user:alice', (state) => {
        changes.push(state.properties)
      })

      fabric.add(BEGIN('user:alice', { balance: 100 }))
      fabric.execute()

      expect(changes).toHaveLength(1)
      expect(changes[0].balance).toBe(100)
    })

    it('should unsubscribe when function is called', () => {
      const changes: any[] = []
      
      const unsubscribe = fabric.subscribe('user:alice', (state) => {
        changes.push(state.properties)
      })

      fabric.add(BEGIN('user:alice', { balance: 100 }))
      fabric.execute()

      unsubscribe()
      fabric.clear()

      fabric.add(BECOME('user:alice',
        (state: any) => ({ ...state, balance: 200 })
      ))
      fabric.execute()

      expect(changes).toHaveLength(1) // Only first change
    })
  })

  describe('Telemetry', () => {
    it('should emit telemetry on execution', () => {
      const traces: any[] = []
      
      fabric.onTelemetry((trace) => {
        traces.push(trace)
      })

      fabric.add(BEGIN('user:alice', { balance: 100 }))
      fabric.execute()

      expect(traces.length).toBeGreaterThan(0)
    })
  })

  describe('Queries', () => {
    beforeEach(() => {
      fabric.add(BEGIN('user:alice', { balance: 100 }))
      fabric.add(BEGIN('user:bob', { balance: 200 }))
      fabric.execute()
    })

    it('should get entity by id', () => {
      const alice = fabric.getEntity('user:alice')
      
      expect(alice).toBeDefined()
      expect(alice!.properties.balance).toBe(100)
    })

    it('should get all entities', () => {
      const entities = fabric.getAllEntities()
      
      expect(entities).toHaveLength(2)
      expect(entities.map(e => e.id)).toContain('user:alice')
      expect(entities.map(e => e.id)).toContain('user:bob')
    })

    it('should get execution trace', () => {
      const trace = fabric.getTrace()
      
      expect(trace).toHaveLength(2)
      expect(trace[0].operator.type).toBe('BEGIN')
      expect(trace[1].operator.type).toBe('BEGIN')
    })

    it('should get current reality', () => {
      const reality = fabric.getReality()
      
      expect(reality.entities.size).toBe(2)
      expect(reality.universeId).toBe('test:universe')
    })
  })

  describe('Performance', () => {
    it('should execute operators efficiently', () => {
      // Add 100 entities
      for (let i = 0; i < 100; i++) {
        fabric.add(BEGIN(`user:${i}`, { balance: i * 100 }))
      }

      const startTime = performance.now()
      const result = fabric.execute()
      const endTime = performance.now()

      expect(result.performance.propagationMs).toBeLessThan(100)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle full user lifecycle', () => {
      fabric
        .add(BEGIN('user:alice', { balance: 0, tier: 'basic' }))
        .add(BECOME('user:alice',
          (state: any) => ({ ...state, balance: state.balance + 100 })
        ))
        .add(CEASE('user:alice',
          (state: any) => state.balance < 0,
          'repair',
          (state: any) => ({ ...state, balance: 0 })
        ))

      const result = fabric.execute()

      const alice = result.reality.entities.get('user:alice')
      expect(alice!.properties.balance).toBe(100)
      expect(result.trace).toHaveLength(2) // BEGIN + BECOME (CEASE not triggered)
    })

    it('should handle paradox with universe forking', () => {
      fabric
        .add(BEGIN('user:alice', { balance: 100 }))
        .add(BECOME('user:alice',
          (state: any) => ({ ...state, balance: -50 })
        ))

      fabric.execute()
      fabric.clear()

      fabric.add(CEASE('user:alice',
        (state: any) => state.balance < 0,
        'fork',
        (state: any) => ({ ...state, balance: 0 })
      ))

      const result = fabric.execute()

      expect(result.branches).toHaveLength(2)
      expect(result.paradoxes).toHaveLength(1)
      
      // Branch A should have repaired balance
      const branchA = result.branches[0]
      expect(branchA.entities.get('user:alice')!.properties.balance).toBe(0)
    })
  })
})
