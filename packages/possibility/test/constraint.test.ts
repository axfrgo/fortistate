/**
 * Tests for defineConstraint primitive
 */

import { describe, it, expect } from 'vitest'
import {
  defineConstraint,
  rangeConstraint,
  equalityConstraint,
  patternConstraint,
  nonNegativeConstraint,
  customConstraint
} from '../src/defineConstraint'

describe('defineConstraint', () => {
  it('creates a basic constraint', () => {
    const ageVerified = defineConstraint(
      'age-verified',
      (user) => user.age >= 13,
      'User must be 13 or older'
    )

    expect(ageVerified.name).toBe('age-verified')
    expect(ageVerified.message).toBe('User must be 13 or older')
    expect(ageVerified.check({ age: 15 })).toBe(true)
    expect(ageVerified.check({ age: 10 })).toBe(false)
  })

  it('uses default message if none provided', () => {
    const constraint = defineConstraint('test', () => true)
    expect(constraint.message).toBe("Constraint 'test' failed")
  })

  it('supports repair function', () => {
    const constraint = defineConstraint(
      'positive',
      (obj) => obj.value > 0,
      'Value must be positive',
      {
        repair: (obj) => ({ ...obj, value: Math.abs(obj.value) })
      }
    )

    expect(constraint.repair).toBeDefined()
    const repaired = constraint.repair!({ value: -5 })
    expect(repaired.value).toBe(5)
  })

  it('supports severity levels', () => {
    const critical = defineConstraint('test', () => true, 'Test', {
      severity: 'critical'
    })

    expect(critical.severity).toBe('critical')
  })

  it('supports categories', () => {
    const financial = defineConstraint('test', () => true, 'Test', {
      category: 'financial'
    })

    expect(financial.category).toBe('financial')
  })
})

describe('rangeConstraint', () => {
  it('validates numeric ranges', () => {
    const ageRange = rangeConstraint('age', 0, 150)

    expect(ageRange.check({ age: 25 })).toBe(true)
    expect(ageRange.check({ age: -5 })).toBe(false)
    expect(ageRange.check({ age: 200 })).toBe(false)
  })

  it('repairs out-of-range values', () => {
    const ageRange = rangeConstraint('age', 0, 150)

    const repaired1 = ageRange.repair!({ age: -10 })
    expect(repaired1.age).toBe(0)

    const repaired2 = ageRange.repair!({ age: 200 })
    expect(repaired2.age).toBe(150)
  })

  it('preserves other properties during repair', () => {
    const ageRange = rangeConstraint('age', 0, 150)
    const repaired = ageRange.repair!({ age: -5, name: 'Alice' })

    expect(repaired.name).toBe('Alice')
    expect(repaired.age).toBe(0)
  })
})

describe('equalityConstraint', () => {
  it('validates equality between two properties', () => {
    const passwordMatch = equalityConstraint('password', 'confirmPassword')

    expect(passwordMatch.check({ password: 'secret', confirmPassword: 'secret' })).toBe(true)
    expect(passwordMatch.check({ password: 'secret', confirmPassword: 'wrong' })).toBe(false)
  })

  it('uses custom message', () => {
    const constraint = equalityConstraint('a', 'b', 'A and B must match')
    expect(constraint.message).toBe('A and B must match')
  })

  it('uses default message', () => {
    const constraint = equalityConstraint('password', 'confirmPassword')
    expect(constraint.message).toBe('password must equal confirmPassword')
  })
})

describe('patternConstraint', () => {
  it('validates regex patterns', () => {
    const usernamePattern = patternConstraint('username', /^[a-z0-9_]+$/)

    expect(usernamePattern.check({ username: 'alice_123' })).toBe(true)
    expect(usernamePattern.check({ username: 'Alice!' })).toBe(false)
  })

  it('uses custom message', () => {
    const constraint = patternConstraint('code', /^\d{4}$/, 'Code must be 4 digits')
    expect(constraint.message).toBe('Code must be 4 digits')
  })
})

describe('nonNegativeConstraint', () => {
  it('validates non-negative numbers', () => {
    const balance = nonNegativeConstraint('balance')

    expect(balance.check({ balance: 0 })).toBe(true)
    expect(balance.check({ balance: 100 })).toBe(true)
    expect(balance.check({ balance: -50 })).toBe(false)
  })

  it('repairs negative values to zero', () => {
    const balance = nonNegativeConstraint('balance')
    const repaired = balance.repair!({ balance: -100 })

    expect(repaired.balance).toBe(0)
  })

  it('has correct metadata', () => {
    const balance = nonNegativeConstraint('balance')

    expect(balance.severity).toBe('high')
    expect(balance.category).toBe('numeric')
  })
})

describe('customConstraint', () => {
  it('creates constraint with custom logic', () => {
    const complex = customConstraint(
      'complex-rule',
      (obj) => obj.x + obj.y > 10,
      {
        message: 'Sum of x and y must exceed 10',
        severity: 'low',
        category: 'math'
      }
    )

    expect(complex.check({ x: 5, y: 6 })).toBe(true)
    expect(complex.check({ x: 3, y: 4 })).toBe(false)
    expect(complex.severity).toBe('low')
    expect(complex.category).toBe('math')
  })

  it('supports repair in custom constraints', () => {
    const constraint = customConstraint(
      'min-sum',
      (obj) => obj.x + obj.y >= 10,
      {
        message: 'Sum must be at least 10',
        repair: (obj) => {
          const sum = obj.x + obj.y
          if (sum < 10) {
            const diff = 10 - sum
            return { ...obj, y: obj.y + diff }
          }
          return obj
        }
      }
    )

    const repaired = constraint.repair!({ x: 3, y: 4 })
    expect(repaired.x + repaired.y).toBe(10)
  })
})
