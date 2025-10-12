/**
 * Meta-Laws Engine Tests
 * Week 7-8 of v3.0 Possibility Algebra
 */

import { describe, it, expect } from 'vitest'
import {
  defineLaw,
  defineMetaLaw,
  and,
  or,
  implies,
  sequence,
  type Law,
  type MetaLaw,
  type LawContext
} from '../src/index.js'

describe('defineMetaLaw - Basic Creation', () => {
  it('creates meta-law with conjunction composition', () => {
    const law1 = defineLaw({
      name: 'double',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x * 2
    })

    const law2 = defineLaw({
      name: 'add-ten',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x + 10
    })

    const metaLaw = defineMetaLaw({
      name: 'combined',
      laws: [law1, law2],
      composition: 'conjunction',
      conflictResolution: 'last-wins'
    })

    expect(metaLaw.name).toBe('combined')
    expect(metaLaw.laws).toHaveLength(2)
    expect(metaLaw.composition).toBe('conjunction')
  })

  it('validates meta-law definition', () => {
    expect(() => {
      defineMetaLaw({
        name: '',
        laws: [],
        composition: 'conjunction',
        conflictResolution: 'priority'
      })
    }).toThrow('Meta-law must have a name')

    expect(() => {
      defineMetaLaw({
        name: 'test',
        laws: [],
        composition: 'conjunction',
        conflictResolution: 'priority'
      })
    }).toThrow('Meta-law must have at least one component law')
  })

  it('requires compositionFn for custom composition', () => {
    const law1 = defineLaw({
      name: 'test',
      inputs: [],
      output: 'y',
      enforce: () => 42
    })

    expect(() => {
      defineMetaLaw({
        name: 'custom',
        laws: [law1],
        composition: 'custom',
        conflictResolution: 'priority'
      })
    }).toThrow('Custom composition requires compositionFn')
  })

  it('requires conflictResolver for custom resolution', () => {
    const law1 = defineLaw({
      name: 'test',
      inputs: [],
      output: 'y',
      enforce: () => 42
    })

    expect(() => {
      defineMetaLaw({
        name: 'custom',
        laws: [law1],
        composition: 'conjunction',
        conflictResolution: 'custom'
      })
    }).toThrow('Custom conflict resolution requires conflictResolver')
  })
})

describe('Meta-Law Composition - Conjunction (AND)', () => {
  it('executes all laws in conjunction', () => {
    const law1 = defineLaw({
      name: 'positive',
      inputs: ['x'],
      output: 'valid',
      enforce: (x: number) => x > 0,
      precondition: (x: number) => typeof x === 'number'
    })

    const law2 = defineLaw({
      name: 'less-than-100',
      inputs: ['x'],
      output: 'valid',
      enforce: (x: number) => x < 100,
      precondition: (x: number) => typeof x === 'number'
    })

    const metaLaw = defineMetaLaw({
      name: 'valid-range',
      laws: [law1, law2],
      composition: 'conjunction',
      conflictResolution: 'last-wins'
    })

    const result = metaLaw.execute([50])
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
    expect(result.lawResults.size).toBe(2)
  })

  it('fails if any law fails in strict mode', () => {
    const law1 = defineLaw({
      name: 'always-pass',
      inputs: [],
      output: 'result',
      enforce: () => true
    })

    const law2 = defineLaw({
      name: 'always-fail',
      inputs: [],
      output: 'result',
      enforce: () => { throw new Error('Failed') }
    })

    const metaLaw = defineMetaLaw({
      name: 'strict-conjunction',
      laws: [law1, law2],
      composition: 'conjunction',
      conflictResolution: 'error',
      context: { mode: 'strict' }
    })

    const result = metaLaw.execute([])
    
    expect(result.success).toBe(false)
  })

  it('uses and() helper for conjunction', () => {
    const law1 = defineLaw({
      name: 'law1',
      inputs: [],
      output: 'x',
      enforce: () => 10
    })

    const law2 = defineLaw({
      name: 'law2',
      inputs: [],
      output: 'x',
      enforce: () => 20
    })

    const metaLaw = and('both', [law1, law2])
    
    expect(metaLaw.composition).toBe('conjunction')
    expect(metaLaw.conflictResolution).toBe('priority')
  })
})

describe('Meta-Law Composition - Disjunction (OR)', () => {
  it('returns first successful law result', () => {
    const law1 = defineLaw({
      name: 'option-a',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x * 2,
      precondition: (x: number) => x > 0
    })

    const law2 = defineLaw({
      name: 'option-b',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x + 100,
      precondition: (x: number) => x < 0
    })

    const metaLaw = defineMetaLaw({
      name: 'either-or',
      laws: [law1, law2],
      composition: 'disjunction',
      conflictResolution: 'first-wins'
    })

    const result1 = metaLaw.execute([5])
    expect(result1.success).toBe(true)
    expect(result1.value).toBe(10) // law1 succeeded

    const result2 = metaLaw.execute([-5])
    expect(result2.success).toBe(true)
    expect(result2.value).toBe(95) // law2 succeeded
  })

  it('uses or() helper for disjunction', () => {
    const law1 = defineLaw({
      name: 'law1',
      inputs: [],
      output: 'x',
      enforce: () => 10
    })

    const law2 = defineLaw({
      name: 'law2',
      inputs: [],
      output: 'x',
      enforce: () => 20
    })

    const metaLaw = or('either', [law1, law2])
    
    expect(metaLaw.composition).toBe('disjunction')
    expect(metaLaw.conflictResolution).toBe('first-wins')
  })
})

describe('Meta-Law Composition - Implication (IF-THEN)', () => {
  it('executes consequent if antecedent succeeds', () => {
    const antecedent = defineLaw({
      name: 'is-positive',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x * 1 // Return the input if positive
    })

    const consequent = defineLaw({
      name: 'double-it',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x * 2
    })

    const metaLaw = defineMetaLaw({
      name: 'if-positive-then-double',
      laws: [antecedent, consequent],
      composition: 'implication',
      conflictResolution: 'error'
    })

    const result = metaLaw.execute([5])
    
    // Antecedent should succeed (returns 5), consequent should execute (returns 10)
    expect(result.lawResults.get('is-positive')?.success).toBe(true)
    expect(result.lawResults.get('double-it')?.success).toBe(true)
    expect(result.value).toBe(10)
  })

  it('vacuously true if antecedent fails', () => {
    const antecedent = defineLaw({
      name: 'is-negative',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x, // Return the value
      precondition: (x: number) => x < 0 // Only applies if negative
    })

    const consequent = defineLaw({
      name: 'double-it',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x * 2,
      precondition: (x: number) => typeof x === 'number'
    })

    const metaLaw = defineMetaLaw({
      name: 'if-negative-then-double',
      laws: [antecedent, consequent],
      composition: 'implication',
      conflictResolution: 'error'
    })

    const result = metaLaw.execute([5])
    
    // Antecedent precondition fails (5 is not negative), so implication is vacuously true
    expect(result.lawResults.get('is-negative')?.success).toBe(false)
  })

  it('uses implies() helper', () => {
    const law1 = defineLaw({
      name: 'condition',
      inputs: [],
      output: 'result',
      enforce: () => 1 // Return number to match law2
    })

    const law2 = defineLaw({
      name: 'action',
      inputs: [],
      output: 'result',
      enforce: () => 42
    })

    const metaLaw = implies('if-then', law1, law2)
    
    expect(metaLaw.composition).toBe('implication')
    expect(metaLaw.laws).toHaveLength(2)
  })
})

describe('Meta-Law Composition - Sequence', () => {
  it('threads output through laws in sequence', () => {
    const law1 = defineLaw({
      name: 'add-5',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x + 5
    })

    const law2 = defineLaw({
      name: 'multiply-2',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x * 2
    })

    const law3 = defineLaw({
      name: 'subtract-3',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x - 3
    })

    const metaLaw = defineMetaLaw({
      name: 'pipeline',
      laws: [law1, law2, law3],
      composition: 'sequence',
      conflictResolution: 'last-wins'
    })

    // (10 + 5) * 2 - 3 = 27
    const result = metaLaw.execute([10])
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(27)
  })

  it('uses sequence() helper', () => {
    const law1 = defineLaw({
      name: 'step1',
      inputs: [],
      output: 'x',
      enforce: () => 1
    })

    const law2 = defineLaw({
      name: 'step2',
      inputs: [],
      output: 'x',
      enforce: () => 2
    })

    const metaLaw = sequence('steps', [law1, law2])
    
    expect(metaLaw.composition).toBe('sequence')
    expect(metaLaw.conflictResolution).toBe('last-wins')
  })
})

describe('Meta-Law Composition - Parallel', () => {
  it('executes all laws in parallel and collects results', () => {
    const law1 = defineLaw({
      name: 'double',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x * 2
    })

    const law2 = defineLaw({
      name: 'square',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x * x
    })

    const law3 = defineLaw({
      name: 'cube',
      inputs: ['x'],
      output: 'result',
      enforce: (x: number) => x * x * x
    })

    const metaLaw = defineMetaLaw({
      name: 'parallel',
      laws: [law1, law2, law3],
      composition: 'parallel',
      conflictResolution: 'merge'
    })

    const result = metaLaw.execute([3])
    
    expect(result.success).toBe(true)
    expect(result.value).toEqual([6, 9, 27]) // All results collected
  })
})

describe('Conflict Detection', () => {
  it('detects conflicting law outputs', () => {
    const law1 = defineLaw({
      name: 'return-10',
      inputs: [],
      output: 'value',
      enforce: () => 10
    })

    const law2 = defineLaw({
      name: 'return-20',
      inputs: [],
      output: 'value',
      enforce: () => 20
    })

    const metaLaw = defineMetaLaw({
      name: 'conflicting',
      laws: [law1, law2],
      composition: 'conjunction',
      conflictResolution: 'priority'
    })

    const conflicts = metaLaw.detectConflicts([])
    
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].laws).toEqual(['return-10', 'return-20'])
    expect(conflicts[0].severity).toBe('medium')
  })

  it('does not detect conflicts for identical outputs', () => {
    const law1 = defineLaw({
      name: 'return-42-a',
      inputs: [],
      output: 'value',
      enforce: () => 42
    })

    const law2 = defineLaw({
      name: 'return-42-b',
      inputs: [],
      output: 'value',
      enforce: () => 42
    })

    const metaLaw = defineMetaLaw({
      name: 'agreeing',
      laws: [law1, law2],
      composition: 'conjunction',
      conflictResolution: 'priority'
    })

    const conflicts = metaLaw.detectConflicts([])
    
    expect(conflicts).toHaveLength(0)
  })
})

describe('Conflict Resolution - Priority', () => {
  it('resolves by priority (higher wins)', () => {
    const lowPriorityLaw = defineLaw({
      name: 'low',
      inputs: [],
      output: 'value',
      enforce: () => 'low-priority'
    })

    const highPriorityLaw = defineLaw({
      name: 'high',
      inputs: [],
      output: 'value',
      enforce: () => 'high-priority'
    })

    // Create meta-laws with different priorities
    const lowMeta = defineMetaLaw({
      name: 'low-meta',
      laws: [lowPriorityLaw],
      composition: 'conjunction',
      conflictResolution: 'priority',
      priority: 1
    })

    const highMeta = defineMetaLaw({
      name: 'high-meta',
      laws: [highPriorityLaw],
      composition: 'conjunction',
      conflictResolution: 'priority',
      priority: 10
    })

    const topLevelMeta = defineMetaLaw({
      name: 'top',
      laws: [lowMeta, highMeta],
      composition: 'conjunction',
      conflictResolution: 'priority'
    })

    const result = topLevelMeta.execute([])
    
    // Higher priority meta-law should win
    expect(result.value).toBe('high-priority')
  })
})

describe('Conflict Resolution - Voting', () => {
  it('resolves by majority vote', () => {
    const law1 = defineLaw({
      name: 'vote-a',
      inputs: [],
      output: 'choice',
      enforce: () => 'option-a'
    })

    const law2 = defineLaw({
      name: 'vote-a-2',
      inputs: [],
      output: 'choice',
      enforce: () => 'option-a'
    })

    const law3 = defineLaw({
      name: 'vote-b',
      inputs: [],
      output: 'choice',
      enforce: () => 'option-b'
    })

    const metaLaw = defineMetaLaw({
      name: 'democracy',
      laws: [law1, law2, law3],
      composition: 'conjunction',
      conflictResolution: 'voting'
    })

    const result = metaLaw.execute([])
    
    // 2 votes for option-a, 1 vote for option-b
    expect(result.value).toBe('option-a')
  })
})

describe('Conflict Resolution - First/Last Wins', () => {
  it('resolves with first-wins strategy', () => {
    const law1 = defineLaw({
      name: 'first',
      inputs: [],
      output: 'value',
      enforce: () => 'first-value'
    })

    const law2 = defineLaw({
      name: 'second',
      inputs: [],
      output: 'value',
      enforce: () => 'second-value'
    })

    const metaLaw = defineMetaLaw({
      name: 'first-wins-meta',
      laws: [law1, law2],
      composition: 'disjunction',
      conflictResolution: 'first-wins'
    })

    const result = metaLaw.execute([])
    
    expect(result.value).toBe('first-value')
  })

  it('resolves with last-wins strategy', () => {
    const law1 = defineLaw({
      name: 'first',
      inputs: [],
      output: 'value',
      enforce: () => 'first-value'
    })

    const law2 = defineLaw({
      name: 'last',
      inputs: [],
      output: 'value',
      enforce: () => 'last-value'
    })

    const metaLaw = defineMetaLaw({
      name: 'last-wins-meta',
      laws: [law1, law2],
      composition: 'conjunction',
      conflictResolution: 'last-wins'
    })

    const result = metaLaw.execute([])
    
    expect(result.value).toBe('last-value')
  })
})

describe('Conflict Resolution - Error', () => {
  it('throws error on conflict', () => {
    const law1 = defineLaw({
      name: 'law1',
      inputs: ['x'],
      output: 'value',
      enforce: (x: number) => 1
    })

    const law2 = defineLaw({
      name: 'law2',
      inputs: ['x'],
      output: 'value',
      enforce: (x: number) => 2
    })

    const metaLaw = defineMetaLaw({
      name: 'strict',
      laws: [law1, law2],
      composition: 'conjunction',
      conflictResolution: 'error'
    })

    expect(() => {
      metaLaw.execute([5]) // Provide input so laws can execute
    }).toThrow(/conflicts detected/)
  })
})

describe('Meta-Law Context', () => {
  it('passes context through execution', () => {
    const contextLaw = defineLaw({
      name: 'context-aware',
      inputs: [],
      output: 'value',
      enforce: () => 'executed',
      precondition: () => true
    })

    const metaLaw = defineMetaLaw({
      name: 'with-context',
      laws: [contextLaw],
      composition: 'conjunction',
      conflictResolution: 'priority',
      context: {
        mode: 'lenient',
        priority: 5,
        data: { key: 'value' }
      }
    })

    const result = metaLaw.execute([], { timestamp: 123456 })
    
    expect(result.context.mode).toBe('lenient')
    expect(result.context.priority).toBe(5)
    expect(result.context.timestamp).toBe(123456)
    expect(result.context.data).toEqual({ key: 'value' })
  })
})

describe('Meta-Law Mutability', () => {
  it('adds new laws dynamically', () => {
    const law1 = defineLaw({
      name: 'initial',
      inputs: [],
      output: 'value',
      enforce: () => 1
    })

    const metaLaw = defineMetaLaw({
      name: 'dynamic',
      laws: [law1],
      composition: 'conjunction',
      conflictResolution: 'priority'
    })

    expect(metaLaw.laws).toHaveLength(1)

    const law2 = defineLaw({
      name: 'added',
      inputs: [],
      output: 'value',
      enforce: () => 2
    })

    metaLaw.addLaw(law2)
    
    expect(metaLaw.laws).toHaveLength(2)
    expect(metaLaw.laws.find(l => l.name === 'added')).toBeDefined()
  })

  it('removes laws dynamically', () => {
    const law1 = defineLaw({
      name: 'keep',
      inputs: [],
      output: 'value',
      enforce: () => 1
    })

    const law2 = defineLaw({
      name: 'remove',
      inputs: [],
      output: 'value',
      enforce: () => 2
    })

    const metaLaw = defineMetaLaw({
      name: 'dynamic',
      laws: [law1, law2],
      composition: 'conjunction',
      conflictResolution: 'priority'
    })

    expect(metaLaw.laws).toHaveLength(2)

    metaLaw.removeLaw('remove')
    
    expect(metaLaw.laws).toHaveLength(1)
    expect(metaLaw.laws.find(l => l.name === 'remove')).toBeUndefined()
  })

  it('does not add duplicate laws', () => {
    const law1 = defineLaw({
      name: 'unique',
      inputs: [],
      output: 'value',
      enforce: () => 1
    })

    const metaLaw = defineMetaLaw({
      name: 'no-duplicates',
      laws: [law1],
      composition: 'conjunction',
      conflictResolution: 'priority'
    })

    metaLaw.addLaw(law1)
    metaLaw.addLaw(law1)
    
    expect(metaLaw.laws).toHaveLength(1)
  })
})

describe('Nested Meta-Laws', () => {
  it('composes meta-laws within meta-laws', () => {
    const law1 = defineLaw({
      name: 'law1',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x + 1
    })

    const law2 = defineLaw({
      name: 'law2',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x * 2
    })

    const innerMeta = defineMetaLaw({
      name: 'inner',
      laws: [law1, law2],
      composition: 'sequence',
      conflictResolution: 'last-wins'
    })

    const law3 = defineLaw({
      name: 'law3',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x - 5
    })

    const outerMeta = defineMetaLaw({
      name: 'outer',
      laws: [innerMeta, law3],
      composition: 'sequence',
      conflictResolution: 'last-wins'
    })

    // ((10 + 1) * 2) - 5 = 17
    const result = outerMeta.execute([10])
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(17)
  })
})

describe('canApply', () => {
  it('checks if meta-law can be applied', () => {
    const law1 = defineLaw({
      name: 'requires-positive',
      inputs: ['x'],
      output: 'y',
      enforce: (x: number) => x * 2,
      precondition: (x: number) => x > 0
    })

    const metaLaw = defineMetaLaw({
      name: 'conditional',
      laws: [law1],
      composition: 'conjunction',
      conflictResolution: 'priority'
    })

    expect(metaLaw.canApply([5])).toBe(true)
    expect(metaLaw.canApply([-5])).toBe(false)
  })
})
