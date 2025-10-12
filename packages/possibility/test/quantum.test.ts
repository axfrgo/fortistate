/**
 * Tests for Quantum Substrate primitives
 * 
 * Tests superposition, entanglement, and observer functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  defineSuperposition,
  binarySuperposition,
  weightedSuperposition,
  uniformSuperposition
} from '../src/defineSuperposition'
import {
  defineEntanglement,
  identicalEntanglement,
  oppositeEntanglement,
  customEntanglement
} from '../src/defineEntanglement'
import {
  defineObserver,
  standardObserver,
  deterministicObserver,
  restrictedObserver
} from '../src/defineObserver'

describe('defineSuperposition - Basic Creation', () => {
  it('creates a superposition', () => {
    const spin = defineSuperposition({
      name: 'electron-spin',
      initialStates: [
        { value: 'up', amplitude: 0.7 },
        { value: 'down', amplitude: 0.3 }
      ]
    })

    expect(spin.name).toBe('electron-spin')
    expect(spin.isCollapsed()).toBe(false)
  })

  it('validates amplitudes sum to 1', () => {
    expect(() => {
      defineSuperposition({
        name: 'invalid',
        initialStates: [
          { value: 'a', amplitude: 0.5 },
          { value: 'b', amplitude: 0.3 } // Sum = 0.8, not 1
        ]
      })
    }).toThrow('must sum to 1')
  })

  it('validates amplitude bounds', () => {
    expect(() => {
      defineSuperposition({
        name: 'invalid',
        initialStates: [
          { value: 'a', amplitude: 1.5 } // > 1
        ]
      })
    }).toThrow('between 0 and 1')
  })
})

describe('defineSuperposition - Observation & Collapse', () => {
  it('collapses to a single value', () => {
    const spin = defineSuperposition({
      name: 'spin',
      initialStates: [
        { value: 'up', amplitude: 1.0 }
      ]
    })

    const result = spin.observe()
    expect(result).toBe('up')
    expect(spin.isCollapsed()).toBe(true)
  })

  it('returns same value on repeated observation', () => {
    const spin = defineSuperposition({
      name: 'spin',
      initialStates: [
        { value: 'up', amplitude: 0.5 },
        { value: 'down', amplitude: 0.5 }
      ]
    })

    const first = spin.observe()
    const second = spin.observe()
    expect(first).toBe(second)
  })

  it('respects probability amplitudes', () => {
    // Test with deterministic case (amplitude = 1.0)
    const deterministic = defineSuperposition({
      name: 'deterministic',
      initialStates: [
        { value: 'certain', amplitude: 1.0 }
      ]
    })

    expect(deterministic.observe()).toBe('certain')
  })

  it('uses Born rule for collapse', () => {
    // Run multiple times to test statistical distribution
    const results: Record<string, number> = { up: 0, down: 0 }
    
    for (let i = 0; i < 100; i++) {
      const spin = defineSuperposition({
        name: `spin-${i}`,
        initialStates: [
          { value: 'up', amplitude: 0.9 },   // 90% probability
          { value: 'down', amplitude: 0.1 }  // 10% probability
        ]
      })
      
      const result = spin.observe() as string
      results[result]++
    }

    // Should have more 'up' than 'down'
    expect(results.up).toBeGreaterThan(results.down)
    expect(results.up).toBeGreaterThan(50) // At least 50% should be 'up'
  })
})

describe('defineSuperposition - Resuperposition', () => {
  it('throws error if resuperposition not allowed', () => {
    const spin = defineSuperposition({
      name: 'spin',
      initialStates: [
        { value: 'up', amplitude: 1.0 }
      ],
      allowResuperposition: false
    })

    spin.observe()

    expect(() => {
      spin.resuperpose()
    }).toThrow('not allowed')
  })

  it('allows resuperposition when enabled', () => {
    const spin = defineSuperposition({
      name: 'spin',
      initialStates: [
        { value: 'up', amplitude: 1.0 }
      ],
      allowResuperposition: true
    })

    spin.observe()
    expect(spin.isCollapsed()).toBe(true)

    spin.resuperpose()
    expect(spin.isCollapsed()).toBe(false)
  })

  it('validates new states on resuperposition', () => {
    const spin = defineSuperposition({
      name: 'spin',
      initialStates: [
        { value: 'up', amplitude: 1.0 }
      ],
      allowResuperposition: true
    })

    spin.observe()

    expect(() => {
      spin.resuperpose([
        { value: 'left', amplitude: 0.5 },
        { value: 'right', amplitude: 0.3 } // Sum = 0.8
      ])
    }).toThrow('must sum to 1')
  })
})

describe('defineSuperposition - Decoherence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('auto-collapses after decoherence time', () => {
    const spin = defineSuperposition({
      name: 'spin',
      initialStates: [
        { value: 'up', amplitude: 1.0 }
      ],
      decoherenceTime: 1000
    })

    expect(spin.isCollapsed()).toBe(false)

    vi.advanceTimersByTime(1000)

    expect(spin.isCollapsed()).toBe(true)
  })
})

describe('Superposition Helper Functions', () => {
  it('creates binary superposition', () => {
    const coin = binarySuperposition('coin', 'heads', 'tails')
    
    expect(coin.name).toBe('coin')
    
    const result = coin.observe()
    expect(['heads', 'tails']).toContain(result)
  })

  it('creates weighted superposition', () => {
    const weather = weightedSuperposition('weather', [
      { value: 'sunny', weight: 70 },
      { value: 'rainy', weight: 30 }
    ])

    const result = weather.observe()
    expect(['sunny', 'rainy']).toContain(result)
  })

  it('creates uniform superposition', () => {
    const dice = uniformSuperposition('dice', [1, 2, 3, 4, 5, 6])
    
    const result = dice.observe()
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(6)
  })
})

describe('defineEntanglement - Basic Creation', () => {
  it('creates an entanglement', () => {
    const entanglement = defineEntanglement({
      name: 'spin-pair',
      propertyA: { entity: 'particle-1', property: 'spin' },
      propertyB: { entity: 'particle-2', property: 'spin' },
      correlation: 'opposite'
    })

    expect(entanglement.name).toBe('spin-pair')
    expect(entanglement.isActive()).toBe(true)
  })

  it('requires correlationFn for custom correlation', () => {
    expect(() => {
      defineEntanglement({
        name: 'custom',
        propertyA: { entity: 'a', property: 'x' },
        propertyB: { entity: 'b', property: 'y' },
        correlation: 'custom'
        // Missing correlationFn
      })
    }).toThrow('correlationFn')
  })
})

describe('defineEntanglement - Correlations', () => {
  it('applies identical correlation', () => {
    const entanglement = defineEntanglement({
      name: 'identical',
      propertyA: { entity: 'a', property: 'x' },
      propertyB: { entity: 'b', property: 'x' },
      correlation: 'identical'
    })

    expect(entanglement.applyCorrelation('up')).toBe('up')
    expect(entanglement.applyCorrelation(42)).toBe(42)
  })

  it('applies opposite correlation for booleans', () => {
    const entanglement = oppositeEntanglement(
      'bool-opposite',
      { entity: 'a', property: 'x' },
      { entity: 'b', property: 'y' }
    )

    expect(entanglement.applyCorrelation(true)).toBe(false)
    expect(entanglement.applyCorrelation(false)).toBe(true)
  })

  it('applies opposite correlation for numbers', () => {
    const entanglement = oppositeEntanglement(
      'num-opposite',
      { entity: 'a', property: 'x' },
      { entity: 'b', property: 'y' }
    )

    expect(entanglement.applyCorrelation(5)).toBe(-5)
    expect(entanglement.applyCorrelation(-3)).toBe(3)
  })

  it('applies opposite correlation for strings', () => {
    const entanglement = oppositeEntanglement(
      'str-opposite',
      { entity: 'a', property: 'x' },
      { entity: 'b', property: 'y' }
    )

    expect(entanglement.applyCorrelation('up')).toBe('down')
    expect(entanglement.applyCorrelation('on')).toBe('off')
    expect(entanglement.applyCorrelation('yes')).toBe('no')
  })

  it('applies complementary correlation', () => {
    const entanglement = defineEntanglement({
      name: 'complementary',
      propertyA: { entity: 'a', property: 'x' },
      propertyB: { entity: 'b', property: 'y' },
      correlation: 'complementary'
    })

    expect(entanglement.applyCorrelation(0.3)).toBeCloseTo(0.7)
    expect(entanglement.applyCorrelation(0.8)).toBeCloseTo(0.2)
  })

  it('applies orthogonal correlation for vectors', () => {
    const entanglement = defineEntanglement({
      name: 'orthogonal',
      propertyA: { entity: 'a', property: 'x' },
      propertyB: { entity: 'b', property: 'y' },
      correlation: 'orthogonal'
    })

    const result = entanglement.applyCorrelation([3, 4])
    expect(result).toEqual([-4, 3])
  })

  it('applies custom correlation', () => {
    const entanglement = customEntanglement(
      'custom',
      { entity: 'a', property: 'x' },
      { entity: 'b', property: 'y' },
      (x: number) => x * 2
    )

    expect(entanglement.applyCorrelation(5)).toBe(10)
    expect(entanglement.applyCorrelation(7)).toBe(14)
  })
})

describe('defineEntanglement - Persistence', () => {
  it('breaks non-persistent entanglement after first measurement', () => {
    const entanglement = defineEntanglement({
      name: 'non-persistent',
      propertyA: { entity: 'a', property: 'x' },
      propertyB: { entity: 'b', property: 'y' },
      correlation: 'identical',
      persistent: false
    })

    // First measurement works
    expect(entanglement.applyCorrelation('up')).toBe('up')
    expect(entanglement.isActive()).toBe(true)

    // Second measurement fails
    expect(() => {
      entanglement.applyCorrelation('down')
    }).toThrow('broke after first measurement')
  })

  it('maintains persistent entanglement', () => {
    const entanglement = defineEntanglement({
      name: 'persistent',
      propertyA: { entity: 'a', property: 'x' },
      propertyB: { entity: 'b', property: 'y' },
      correlation: 'identical',
      persistent: true
    })

    expect(entanglement.applyCorrelation('up')).toBe('up')
    expect(entanglement.applyCorrelation('down')).toBe('down')
    expect(entanglement.isActive()).toBe(true)
  })

  it('can manually break entanglement', () => {
    const entanglement = defineEntanglement({
      name: 'breakable',
      propertyA: { entity: 'a', property: 'x' },
      propertyB: { entity: 'b', property: 'y' },
      correlation: 'identical'
    })

    entanglement.break()
    expect(entanglement.isActive()).toBe(false)

    expect(() => {
      entanglement.applyCorrelation('test')
    }).toThrow('has been broken')
  })
})

describe('defineObserver - Basic Creation', () => {
  it('creates an observer', () => {
    const observer = defineObserver({
      name: 'physicist',
      collapseStrategy: 'born-rule'
    })

    expect(observer.name).toBe('physicist')
  })

  it('requires collapseFn for custom strategy', () => {
    expect(() => {
      defineObserver({
        name: 'custom',
        collapseStrategy: 'custom'
        // Missing collapseFn
      })
    }).toThrow('collapseFn')
  })
})

describe('defineObserver - Measurement', () => {
  it('observes and collapses superposition', () => {
    const spin = defineSuperposition({
      name: 'spin',
      initialStates: [
        { value: 'up', amplitude: 1.0 }
      ]
    })

    const observer = standardObserver('physicist')
    const result = observer.observe(spin)

    expect(result).toBe('up')
    expect(spin.isCollapsed()).toBe(true)
  })

  it('uses deterministic collapse strategy', () => {
    const state = defineSuperposition({
      name: 'state',
      initialStates: [
        { value: 'a', amplitude: 0.9 },
        { value: 'b', amplitude: 0.1 }
      ]
    })

    const observer = deterministicObserver('determinist')
    const result = observer.observe(state)

    // Should always pick max amplitude
    expect(result).toBe('a')
  })

  it('returns collapsed value on repeated observation', () => {
    const spin = defineSuperposition({
      name: 'spin',
      initialStates: [
        { value: 'up', amplitude: 0.5 },
        { value: 'down', amplitude: 0.5 }
      ]
    })

    const observer = standardObserver('physicist')
    const first = observer.observe(spin)
    const second = observer.observe(spin)

    expect(first).toBe(second)
  })
})

describe('defineObserver - Restrictions', () => {
  it('checks observable properties', () => {
    const observer = restrictedObserver('limited', ['spin', 'position'])

    expect(observer.canObserve('spin')).toBe(true)
    expect(observer.canObserve('momentum')).toBe(false)
  })

  it('throws error when observing restricted property', () => {
    const spin = defineSuperposition({
      name: 'momentum',
      initialStates: [
        { value: 1, amplitude: 1.0 }
      ]
    })

    const observer = restrictedObserver('limited', ['spin'])

    expect(() => {
      observer.observe(spin)
    }).toThrow('cannot observe')
  })

  it('allows unrestricted observer to observe anything', () => {
    const observer = standardObserver('unrestricted')

    expect(observer.canObserve('anything')).toBe(true)
    expect(observer.canObserve('everything')).toBe(true)
  })
})

describe('Quantum Integration - Real World Examples', () => {
  it('implements Schrödinger\'s form state', () => {
    // Form that is simultaneously valid and invalid until validated
    const formState = defineSuperposition({
      name: 'form-validation',
      initialStates: [
        { value: 'valid', amplitude: 0.6 },
        { value: 'invalid', amplitude: 0.4 }
      ]
    })

    expect(formState.isCollapsed()).toBe(false)

    // User submits form - collapses state
    const validator = standardObserver('validator')
    const result = validator.observe(formState)

    expect(['valid', 'invalid']).toContain(result)
    expect(formState.isCollapsed()).toBe(true)
  })

  it('implements entangled user sessions', () => {
    // Two users with opposite online status
    const sessionEntanglement = oppositeEntanglement(
      'session-pair',
      { entity: 'user-1', property: 'isOnline' },
      { entity: 'user-2', property: 'isOnline' }
    )

    // User 1 comes online
    const user2Status = sessionEntanglement.applyCorrelation(true)
    expect(user2Status).toBe(false) // User 2 goes offline
  })

  it('implements quantum recommendation system', () => {
    // Product can be in multiple categories until user interaction
    const productCategory = uniformSuperposition(
      'product-category',
      ['electronics', 'books', 'clothing', 'home']
    )

    expect(productCategory.isCollapsed()).toBe(false)

    // User clicks - collapses to specific category
    const category = productCategory.observe()
    expect(['electronics', 'books', 'clothing', 'home']).toContain(category)
  })
})
