/**
 * 🧪 Ontogenesis Operators Tests
 * 
 * Unit tests for BEGIN, BECOME, CEASE, TRANSCEND operators
 */

import { describe, it, expect } from 'vitest'
import {
  BEGIN,
  BECOME,
  CEASE,
  TRANSCEND,
  WHEN,
  ALWAYS,
  NEVER,
  isBegin,
  isBecome,
  isCease,
  isTranscend,
  getNarrative,
} from '../src/ontogenesis/operators.js'

describe('Ontogenesis Operators', () => {
  describe('BEGIN Operator', () => {
    it('should create a BEGIN operator with properties', () => {
      const op = BEGIN('user:alice', { balance: 100, tier: 'gold' })

      expect(op.type).toBe('BEGIN')
      expect(op.entity).toBe('user:alice')
      expect(op.properties).toEqual({ balance: 100, tier: 'gold' })
      expect(op.timestamp).toBe('NOW')
    })

    it('should support custom narrative', () => {
      const op = BEGIN('user:alice', { balance: 100 }, {
        narrative: "Alice's account begins with $100"
      })

      expect(op.narrative).toBe("Alice's account begins with $100")
    })

    it('should support constraints', () => {
      const constraint = {
        name: 'positive_balance',
        predicate: (state: any) => state.balance >= 0,
        action: 'enforce' as const,
      }

      const op = BEGIN('user:alice', { balance: 100 }, {
        constraints: [constraint]
      })

      expect(op.constraints).toHaveLength(1)
      expect(op.constraints![0].name).toBe('positive_balance')
    })

    it('should be identified by type guard', () => {
      const op = BEGIN('user:alice', { balance: 100 })
      expect(isBegin(op)).toBe(true)
      expect(isBecome(op)).toBe(false)
    })
  })

  describe('BECOME Operator', () => {
    it('should create a BECOME operator with transform', () => {
      const transform = (state: any) => ({ ...state, balance: state.balance + 50 })
      const op = BECOME('user:alice', transform)

      expect(op.type).toBe('BECOME')
      expect(op.entity).toBe('user:alice')
      expect(op.transform).toBe(transform)
      expect(op.trigger).toBe('IMMEDIATE')
    })

    it('should support conditional triggers', () => {
      const transform = (state: any) => ({ ...state, balance: state.balance + 50 })
      const trigger = WHEN('deposit')
      const op = BECOME('user:alice', transform, trigger)

      expect(op.trigger).toBe(trigger)
    })

    it('should execute transform correctly', () => {
      const transform = (state: any) => ({ ...state, balance: state.balance + 50 })
      const op = BECOME('user:alice', transform)

      const result = op.transform({ balance: 100 })
      expect(result).toEqual({ balance: 150 })
    })

    it('should be identified by type guard', () => {
      const op = BECOME('user:alice', (s) => s)
      expect(isBecome(op)).toBe(true)
      expect(isBegin(op)).toBe(false)
    })
  })

  describe('CEASE Operator', () => {
    it('should create a CEASE operator with terminate action', () => {
      const condition = (state: any) => state.balance < 0
      const op = CEASE('user:alice', condition, 'terminate')

      expect(op.type).toBe('CEASE')
      expect(op.entity).toBe('user:alice')
      expect(op.action).toBe('terminate')
      expect(op.condition).toBe(condition)
    })

    it('should create a CEASE operator with repair action', () => {
      const condition = (state: any) => state.balance < 0
      const repair = (state: any) => ({ ...state, balance: 0 })
      const op = CEASE('user:alice', condition, 'repair', repair)

      expect(op.action).toBe('repair')
      expect(op.repairFn).toBe(repair)
    })

    it('should execute repair function correctly', () => {
      const condition = (state: any) => state.balance < 0
      const repair = (state: any) => ({ ...state, balance: 0 })
      const op = CEASE('user:alice', condition, 'repair', repair)

      const result = op.repairFn!({ balance: -50 })
      expect(result).toEqual({ balance: 0 })
    })

    it('should support fork action for paradox resolution', () => {
      const condition = (state: any) => state.balance < 0
      const op = CEASE('user:alice', condition, 'fork')

      expect(op.action).toBe('fork')
    })

    it('should be identified by type guard', () => {
      const op = CEASE('user:alice', () => false, 'terminate')
      expect(isCease(op)).toBe(true)
      expect(isTranscend(op)).toBe(false)
    })
  })

  describe('TRANSCEND Operator', () => {
    it('should create a TRANSCEND operator', () => {
      const condition = (state: any) => state.balance > 10000
      const op = TRANSCEND('user:alice', 'universe:vip', condition)

      expect(op.type).toBe('TRANSCEND')
      expect(op.entity).toBe('user:alice')
      expect(op.portal).toBe('universe:vip')
      expect(op.condition).toBe(condition)
    })

    it('should support state mapping during transcendence', () => {
      const condition = (state: any) => state.balance > 10000
      const mapping = (state: any) => ({ ...state, tier: 'platinum' })
      const op = TRANSCEND('user:alice', 'universe:vip', condition, mapping)

      expect(op.mapping).toBe(mapping)
      const result = op.mapping!({ balance: 15000, tier: 'gold' })
      expect(result).toEqual({ balance: 15000, tier: 'platinum' })
    })

    it('should be identified by type guard', () => {
      const op = TRANSCEND('user:alice', 'universe:vip', () => true)
      expect(isTranscend(op)).toBe(true)
      expect(isCease(op)).toBe(false)
    })
  })

  describe('Helper Functions', () => {
    it('should extract narratives from operators', () => {
      const op = BEGIN('user:alice', { balance: 100 }, {
        narrative: 'Custom narrative'
      })

      expect(getNarrative(op)).toBe('Custom narrative')
    })

    it('should generate default narrative when none provided', () => {
      const op = BEGIN('user:alice', { balance: 100 })
      const narrative = getNarrative(op)

      expect(narrative).toContain('user:alice')
      expect(narrative).toContain('begins')
    })

    it('WHEN helper should create event predicates', () => {
      const predicate = WHEN('deposit')
      
      expect(predicate({ event: 'deposit' })).toBe(true)
      expect(predicate({ event: 'withdrawal' })).toBe(false)
    })

    it('ALWAYS should always return true', () => {
      expect(ALWAYS({})).toBe(true)
      expect(ALWAYS({ any: 'value' })).toBe(true)
    })

    it('NEVER should always return false', () => {
      expect(NEVER({})).toBe(false)
      expect(NEVER({ any: 'value' })).toBe(false)
    })
  })

  describe('Integration Scenarios', () => {
    it('should compose operators for a complete user lifecycle', () => {
      const ops = [
        BEGIN('user:alice', { balance: 0, tier: 'basic' }),
        BECOME('user:alice', 
          (s: any) => ({ ...s, balance: s.balance + 100 }),
          WHEN('deposit')
        ),
        CEASE('user:alice',
          (s: any) => s.balance < 0,
          'repair',
          (s: any) => ({ ...s, balance: 0 })
        ),
        TRANSCEND('user:alice',
          'universe:vip',
          (s: any) => s.balance > 10000
        ),
      ]

      expect(ops).toHaveLength(4)
      expect(isBegin(ops[0])).toBe(true)
      expect(isBecome(ops[1])).toBe(true)
      expect(isCease(ops[2])).toBe(true)
      expect(isTranscend(ops[3])).toBe(true)
    })

    it('should handle constraint-based operations', () => {
      const constraint = {
        name: 'min_balance',
        predicate: (state: any) => state.balance >= 0,
        action: 'repair' as const,
        repairFn: (state: any) => ({ ...state, balance: 0 }),
      }

      const op = BEGIN('user:alice', { balance: 100 }, {
        constraints: [constraint]
      })

      expect(op.constraints![0].predicate({ balance: 50 })).toBe(true)
      expect(op.constraints![0].predicate({ balance: -10 })).toBe(false)
      expect(op.constraints![0].repairFn!({ balance: -10 })).toEqual({ balance: 0 })
    })
  })
})
