/**
 * Tests for substrate.ts
 * 
 * Tests existence constraints, validation, and auto-repair.
 */

import { describe, it, expect } from 'vitest'
import {
  defineConstraint,
  validateState,
  validateSubstrate,
  createSubstrate,
  nonNegativeCounter,
  budgetConstraint,
  rangeConstraint,
  typeConstraint,
  type ExistenceConstraint,
} from '../src/algebra/substrate.js'

describe('substrate', () => {
  describe('defineConstraint', () => {
    it('should create a valid constraint', () => {
      const constraint = defineConstraint(
        'positive-number',
        [
          {
            name: 'greater-than-zero',
            check: (state: number) => state > 0,
            message: 'Must be positive',
          },
        ]
      )

      expect(constraint.name).toBe('positive-number')
      expect(constraint.invariants.length).toBe(1)
    })
  })

  describe('validateState', () => {
    it('should validate correct state', () => {
      const constraint = defineConstraint<number>(
        'positive',
        [
          {
            name: 'positive',
            check: (state) => state > 0,
          },
        ]
      )

      const result = validateState(5, constraint)
      expect(result.valid).toBe(true)
      expect(result.violations.length).toBe(0)
    })

    it('should detect violations', () => {
      const constraint = defineConstraint<number>(
        'positive',
        [
          {
            name: 'positive',
            check: (state) => state > 0,
            message: 'Must be positive',
          },
        ]
      )

      const result = validateState(-5, constraint)
      expect(result.valid).toBe(false)
      expect(result.violations.length).toBe(1)
      expect(result.violations[0].message).toContain('positive')
    })

    it('should repair invalid state', () => {
      const constraint = defineConstraint<number>(
        'clamped',
        [
          {
            name: 'in-range',
            check: (state) => state >= 0 && state <= 100,
          },
        ],
        {
          repair: (state) => Math.max(0, Math.min(100, state)),
        }
      )

      const result = validateState(150, constraint)
      expect(result.valid).toBe(false)
      expect(result.repairedValue).toBe(100)
    })
  })

  describe('built-in constraints', () => {
    describe('nonNegativeCounter', () => {
      it('should validate positive values', () => {
        const result = validateState({ value: 5 }, nonNegativeCounter)
        expect(result.valid).toBe(true)
      })

      it('should reject negative values', () => {
        const result = validateState({ value: -5 }, nonNegativeCounter)
        expect(result.valid).toBe(false)
      })

      it('should repair negative values', () => {
        const result = validateState({ value: -5 }, nonNegativeCounter)
        expect(result.repairedValue).toEqual({ value: 0 })
      })
    })

    describe('budgetConstraint', () => {
      it('should validate balanced budget', () => {
        const state = { income: 5000, expenses: 3000, savings: 2000 }
        const result = validateState(state, budgetConstraint)
        expect(result.valid).toBe(true)
      })

      it('should reject expenses > income', () => {
        const state = { income: 3000, expenses: 5000, savings: -2000 }
        const result = validateState(state, budgetConstraint)
        expect(result.valid).toBe(false)
      })

      it('should reject incorrect savings', () => {
        const state = { income: 5000, expenses: 3000, savings: 1000 }
        const result = validateState(state, budgetConstraint)
        expect(result.valid).toBe(false)
      })

      it('should repair incorrect savings', () => {
        const state = { income: 5000, expenses: 3000, savings: 1000 }
        const result = validateState(state, budgetConstraint)
        expect(result.repairedValue?.savings).toBe(2000)
      })
    })
  })

  describe('rangeConstraint', () => {
    it('should validate values in range', () => {
      const constraint = rangeConstraint('temperature', 0, 100)
      const result = validateState(50, constraint)
      expect(result.valid).toBe(true)
    })

    it('should reject values out of range', () => {
      const constraint = rangeConstraint('temperature', 0, 100)
      const result = validateState(150, constraint)
      expect(result.valid).toBe(false)
    })

    it('should clamp values to range', () => {
      const constraint = rangeConstraint('temperature', 0, 100)
      const result = validateState(150, constraint)
      expect(result.repairedValue).toBe(100)
    })

    it('should work with nested paths', () => {
      const constraint = rangeConstraint('temp', 0, 100, ['sensor', 'temp'])
      const result = validateState({ sensor: { temp: 50 } }, constraint)
      expect(result.valid).toBe(true)
    })
  })

  describe('typeConstraint', () => {
    it('should validate correct types', () => {
      const stringConstraint = typeConstraint('name', 'string')
      expect(validateState('hello', stringConstraint).valid).toBe(true)

      const numberConstraint = typeConstraint('age', 'number')
      expect(validateState(42, numberConstraint).valid).toBe(true)

      const arrayConstraint = typeConstraint('items', 'array')
      expect(validateState([1, 2, 3], arrayConstraint).valid).toBe(true)
    })

    it('should reject incorrect types', () => {
      const stringConstraint = typeConstraint('name', 'string')
      expect(validateState(42, stringConstraint).valid).toBe(false)

      const numberConstraint = typeConstraint('age', 'number')
      expect(validateState('42', numberConstraint).valid).toBe(false)
    })
  })

  describe('createSubstrate', () => {
    it('should create a substrate', () => {
      const constraints = new Map<string, ExistenceConstraint<any>>([
        ['counter', nonNegativeCounter],
        ['budget', budgetConstraint],
      ])

      const substrate = createSubstrate('test-substrate', constraints)

      expect(substrate.name).toBe('test-substrate')
      expect(substrate.constraints.size).toBe(2)
    })

    it('should include global invariants', () => {
      const constraints = new Map<string, ExistenceConstraint<any>>()
      const globalInvariants = [
        {
          name: 'total-positive',
          check: (states: Map<string, any>) => {
            const total = Array.from(states.values()).reduce((sum, s) => sum + s, 0)
            return total > 0
          },
        },
      ]

      const substrate = createSubstrate('test', constraints, globalInvariants)

      expect(substrate.globalInvariants?.length).toBe(1)
    })
  })

  describe('validateSubstrate', () => {
    it('should validate all stores', () => {
      const constraints = new Map<string, ExistenceConstraint<any>>([
        ['counter', nonNegativeCounter],
        ['budget', budgetConstraint],
      ])

      const substrate = createSubstrate('test', constraints)

      const allStates = new Map<string, any>([
        ['counter', { value: 5 }],
        ['budget', { income: 5000, expenses: 3000, savings: 2000 }],
      ])

      const results = validateSubstrate(substrate, allStates)

      expect(results.get('counter')?.valid).toBe(true)
      expect(results.get('budget')?.valid).toBe(true)
    })

    it('should detect violations across stores', () => {
      const constraints = new Map<string, ExistenceConstraint<any>>([
        ['counter', nonNegativeCounter],
      ])

      const substrate = createSubstrate('test', constraints)

      const allStates = new Map<string, any>([
        ['counter', { value: -5 }],
      ])

      const results = validateSubstrate(substrate, allStates)

      expect(results.get('counter')?.valid).toBe(false)
    })

    it('should validate global invariants', () => {
      const constraints = new Map<string, ExistenceConstraint<any>>()
      const globalInvariants = [
        {
          name: 'sum-check',
          check: (states: Map<string, any>) => {
            const total = Array.from(states.values()).reduce((sum, s) => sum + s, 0)
            return total === 10
          },
          message: 'Total must equal 10',
        },
      ]

      const substrate = createSubstrate('test', constraints, globalInvariants)

      const allStates = new Map<string, any>([
        ['a', 3],
        ['b', 5],
      ])

      const results = validateSubstrate(substrate, allStates)

      expect(results.get('__global__')?.valid).toBe(false)
      expect(results.get('__global__')?.violations[0].message).toContain('10')
    })
  })

  describe('complex scenarios', () => {
    it('should handle nested object constraints', () => {
      const constraint = defineConstraint<{ player: { x: number; y: number } }>(
        'player-bounds',
        [
          {
            name: 'x-in-bounds',
            check: (state) => state.player.x >= 0 && state.player.x <= 100,
          },
          {
            name: 'y-on-ground',
            check: (state) => state.player.y <= 0,
          },
        ],
        {
          repair: (state) => ({
            player: {
              x: Math.max(0, Math.min(100, state.player.x)),
              y: Math.min(0, state.player.y),
            },
          }),
        }
      )

      const invalidState = { player: { x: 150, y: 10 } }
      const result = validateState(invalidState, constraint)

      expect(result.valid).toBe(false)
      expect(result.repairedValue?.player.x).toBe(100)
      expect(result.repairedValue?.player.y).toBe(0)
    })

    it('should handle multiple invariants', () => {
      const constraint = defineConstraint<{ value: number }>(
        'strict-range',
        [
          {
            name: 'not-negative',
            check: (state) => state.value >= 0,
            message: 'Cannot be negative',
          },
          {
            name: 'not-too-large',
            check: (state) => state.value <= 1000,
            message: 'Cannot exceed 1000',
          },
          {
            name: 'even-number',
            check: (state) => state.value % 2 === 0,
            message: 'Must be even',
          },
        ]
      )

      const result = validateState({ value: 15 }, constraint)

      expect(result.valid).toBe(false)
      expect(result.violations.length).toBe(1)
      expect(result.violations[0].invariantName).toBe('even-number')
    })
  })
})
