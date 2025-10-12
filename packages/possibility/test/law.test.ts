/**
 * Tests for defineLaw primitive
 */

import { describe, it, expect } from 'vitest'
import {
  defineLaw,
  composeLaws,
  executeComposition,
  detectConflicts,
  constantLaw,
  transformLaw,
  combineLaw,
  conditionalLaw,
  validatedLaw
} from '../src/defineLaw'

describe('defineLaw - Basic Law Creation', () => {
  it('creates a simple law', () => {
    const doubleValue = defineLaw({
      name: 'double-value',
      inputs: ['value'],
      output: 'result',
      enforce: (value: number) => value * 2
    })

    expect(doubleValue.name).toBe('double-value')
    expect(doubleValue.inputs).toEqual(['value'])
    expect(doubleValue.output).toBe('result')
  })

  it('executes a law successfully', () => {
    const doubleValue = defineLaw({
      name: 'double-value',
      inputs: ['value'],
      output: 'result',
      enforce: (value: number) => value * 2
    })

    const result = doubleValue.execute(5)
    expect(result.success).toBe(true)
    expect(result.value).toBe(10)
  })

  it('handles multiple inputs', () => {
    const addValues = defineLaw({
      name: 'add-values',
      inputs: ['a', 'b'],
      output: 'sum',
      enforce: (a: number, b: number) => a + b
    })

    const result = addValues.execute(3, 7)
    expect(result.success).toBe(true)
    expect(result.value).toBe(10)
  })
})

describe('defineLaw - Preconditions', () => {
  it('checks precondition before execution', () => {
    const divideValues = defineLaw({
      name: 'divide',
      inputs: ['numerator', 'denominator'],
      output: 'quotient',
      precondition: (n: number, d: number) => d !== 0,
      enforce: (n: number, d: number) => n / d
    })

    const successResult = divideValues.execute(10, 2)
    expect(successResult.success).toBe(true)
    expect(successResult.value).toBe(5)

    const failResult = divideValues.execute(10, 0)
    expect(failResult.success).toBe(false)
    expect(failResult.preconditionMet).toBe(false)
  })

  it('canApply checks precondition', () => {
    const positivesOnly = defineLaw({
      name: 'positives-only',
      inputs: ['value'],
      output: 'result',
      precondition: (value: number) => value > 0,
      enforce: (value: number) => value * 2
    })

    expect(positivesOnly.canApply(5)).toBe(true)
    expect(positivesOnly.canApply(-5)).toBe(false)
    expect(positivesOnly.canApply(0)).toBe(false)
  })
})

describe('defineLaw - Postconditions', () => {
  it('validates output with postcondition', () => {
    const ensurePositive = defineLaw({
      name: 'ensure-positive',
      inputs: ['value'],
      output: 'result',
      enforce: (value: number) => value * 2,
      postcondition: (result: number) => result > 0
    })

    const successResult = ensurePositive.execute(5)
    expect(successResult.success).toBe(true)
    expect(successResult.postconditionMet).toBe(true)

    const failResult = ensurePositive.execute(-5)
    expect(failResult.success).toBe(false)
    expect(failResult.postconditionMet).toBe(false)
  })

  it('reports postcondition failures', () => {
    const strictValidation = defineLaw({
      name: 'strict',
      inputs: ['value'],
      output: 'result',
      enforce: (value: number) => value,
      postcondition: (result: number) => result === 42
    })

    const result = strictValidation.execute(10)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Postcondition failed')
  })
})

describe('defineLaw - Error Handling', () => {
  it('catches execution errors', () => {
    const throwingLaw = defineLaw({
      name: 'throwing',
      inputs: ['value'],
      output: 'result',
      enforce: (value: number) => {
        throw new Error('Intentional error')
      }
    })

    const result = throwingLaw.execute(5)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Law execution failed')
  })
})

describe('defineLaw - Real-World Examples', () => {
  it('calculates shopping cart total', () => {
    type CartItem = {
      id: string
      qty: number
    }

    type Cart = {
      items: CartItem[]
      total?: number
    }

    const calculateTotal = defineLaw({
      name: 'calculate-total',
      inputs: ['cart', 'prices'],
      output: 'cart',
      enforce: (cart: any, prices: any) => ({
        ...cart,
        total: cart.items.reduce((sum: number, item: CartItem) => 
          sum + (prices[item.id] || 0) * item.qty, 0
        )
      })
    })

    const cart = {
      items: [
        { id: 'apple', qty: 3 },
        { id: 'banana', qty: 2 }
      ]
    }

    const prices = {
      apple: 1.5,
      banana: 0.75
    }

    const result = calculateTotal.execute(cart, prices)
    expect(result.success).toBe(true)
    expect(result.value?.total).toBe(6)
  })

  it('enforces non-negative balance', () => {
    const enforceBalance = defineLaw({
      name: 'enforce-balance',
      inputs: ['account'],
      output: 'account',
      enforce: (account: { balance: number }) => ({
        ...account,
        balance: Math.max(0, account.balance)
      }),
      postcondition: (account: { balance: number }) => account.balance >= 0
    })

    const result = enforceBalance.execute({ balance: -100 })
    expect(result.success).toBe(true)
    expect(result.value?.balance).toBe(0)
  })
})

describe('composeLaws', () => {
  it('creates a law composition', () => {
    const law1 = defineLaw({
      name: 'law1',
      inputs: ['a'],
      output: 'b',
      enforce: (a: number) => a * 2
    })

    const law2 = defineLaw({
      name: 'law2',
      inputs: ['b'],
      output: 'c',
      enforce: (b: number) => b + 10
    })

    const composition = composeLaws('double-then-add', [law1, law2])
    
    expect(composition.name).toBe('double-then-add')
    expect(composition.laws).toHaveLength(2)
  })

  it('executes laws in sequence', () => {
    const double = defineLaw({
      name: 'double',
      inputs: ['value'],
      output: 'doubled',
      enforce: (value: number) => value * 2
    })

    const addTen = defineLaw({
      name: 'add-ten',
      inputs: ['doubled'],
      output: 'result',
      enforce: (doubled: number) => doubled + 10
    })

    const composition = composeLaws('pipeline', [double, addTen])
    const result = executeComposition(composition, { value: 5 })

    expect(result.success).toBe(true)
    expect(result.value?.result).toBe(20) // (5 * 2) + 10
  })

  it('handles conflicts with last-wins strategy', () => {
    const setA = defineLaw({
      name: 'set-a',
      inputs: [],
      output: 'value',
      enforce: () => 'A'
    })

    const setB = defineLaw({
      name: 'set-b',
      inputs: [],
      output: 'value',
      enforce: () => 'B'
    })

    const composition = composeLaws('conflict', [setA as any, setB as any], {
      conflictStrategy: 'last-wins'
    })

    const result = executeComposition(composition, {})
    expect(result.success).toBe(true)
    expect(result.value?.value).toBe('B')
  })
})

describe('detectConflicts', () => {
  it('detects output conflicts', () => {
    const law1 = defineLaw({
      name: 'law1',
      inputs: ['a'],
      output: 'result',
      enforce: (a: number) => a * 2
    })

    const law2 = defineLaw({
      name: 'law2',
      inputs: ['b'],
      output: 'result',
      enforce: (b: number) => b + 10
    })

    const conflicts = detectConflicts([law1, law2])
    
    expect(conflicts.length).toBeGreaterThan(0)
    expect(conflicts[0].laws).toContain('law1')
    expect(conflicts[0].laws).toContain('law2')
    expect(conflicts[0].reason).toContain('result')
  })

  it('detects circular dependencies', () => {
    const law1 = defineLaw({
      name: 'law1',
      inputs: ['b'],
      output: 'a',
      enforce: (b: number) => b + 1
    })

    const law2 = defineLaw({
      name: 'law2',
      inputs: ['a'],
      output: 'b',
      enforce: (a: number) => a + 1
    })

    const conflicts = detectConflicts([law1, law2])
    
    expect(conflicts.some(c => c.severity === 'critical')).toBe(true)
    expect(conflicts.some(c => c.reason.includes('Circular dependency'))).toBe(true)
  })

  it('allows non-conflicting laws', () => {
    const law1 = defineLaw({
      name: 'law1',
      inputs: ['a'],
      output: 'b',
      enforce: (a: number) => a * 2
    })

    const law2 = defineLaw({
      name: 'law2',
      inputs: ['b'],
      output: 'c',
      enforce: (b: number) => b + 10
    })

    const conflicts = detectConflicts([law1, law2])
    
    expect(conflicts.filter(c => c.severity !== 'low').length).toBe(0)
  })
})

describe('Law Helper Functions', () => {
  it('constantLaw creates constant value laws', () => {
    const pi = constantLaw('pi', 'PI', 3.14159)
    
    const result = pi.execute()
    expect(result.success).toBe(true)
    expect(result.value).toBe(3.14159)
  })

  it('transformLaw creates single-input transformations', () => {
    const double = transformLaw('double', 'input', 'output', (x: number) => x * 2)
    
    const result = double.execute(5)
    expect(result.success).toBe(true)
    expect(result.value).toBe(10)
  })

  it('combineLaw combines multiple inputs', () => {
    const sum = combineLaw(
      'sum',
      ['a', 'b', 'c'],
      'total',
      (a: number, b: number, c: number) => a + b + c
    )
    
    const result = sum.execute(1, 2, 3)
    expect(result.success).toBe(true)
    expect(result.value).toBe(6)
  })

  it('conditionalLaw only applies when condition is met', () => {
    const doubleIfPositive = conditionalLaw(
      'double-if-positive',
      ['value'],
      'result',
      (value: number) => value > 0,
      (value: number) => value * 2
    )
    
    const successResult = doubleIfPositive.execute(5)
    expect(successResult.success).toBe(true)
    expect(successResult.value).toBe(10)

    const failResult = doubleIfPositive.execute(-5)
    expect(failResult.success).toBe(false)
  })

  it('validatedLaw ensures output validity', () => {
    const ensureEven = validatedLaw(
      'ensure-even',
      ['value'],
      'result',
      (value: number) => value * 2,
      (result: number) => result % 2 === 0
    )
    
    const result = ensureEven.execute(5)
    expect(result.success).toBe(true)
    expect(result.value).toBe(10)
  })
})

describe('defineLaw - Metadata', () => {
  it('stores law metadata', () => {
    const law = defineLaw({
      name: 'example',
      inputs: ['a'],
      output: 'b',
      enforce: (a: number) => a * 2,
      complexity: 'O(1)',
      metadata: {
        description: 'Doubles a value',
        author: 'Test Author',
        tags: ['math', 'transform']
      }
    })

    expect(law.metadata.name).toBe('example')
    expect(law.metadata.description).toBe('Doubles a value')
    expect(law.metadata.author).toBe('Test Author')
    expect(law.metadata.tags).toContain('math')
    expect(law.complexity).toBe('O(1)')
  })
})
