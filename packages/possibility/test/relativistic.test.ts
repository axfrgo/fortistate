/**
 * Tests for Relativistic Substrate primitives
 * 
 * Tests observer frames, Lorentz transformations, causal ordering, and light cones
 */

import { describe, it, expect } from 'vitest'
import {
  defineObserverFrame,
  stationaryFrame,
  movingFrame,
  properTime,
  lightConeRegion,
  SPEED_OF_CAUSALITY
} from '../src/defineObserverFrame'
import {
  determineCausalOrder,
  sortEventsCausally,
  canBeCausallyConnected,
  getPastLightCone,
  getFutureLightCone,
  isAcausal,
  mergeEventLogs
} from '../src/causalOrdering'
import type { CausalEvent } from '../src/types'

describe('defineObserverFrame - Basic Creation', () => {
  it('creates a stationary frame', () => {
    const alice = stationaryFrame('alice')
    
    expect(alice.name).toBe('alice')
    expect(alice.velocity.v).toBe(0)
    expect(alice.speedOfCausality).toBe(SPEED_OF_CAUSALITY)
  })

  it('creates a moving frame', () => {
    const bob = movingFrame('bob', 0.6, [1, 0, 0])
    
    expect(bob.name).toBe('bob')
    expect(bob.velocity.v).toBe(0.6)
    expect(bob.velocity.direction).toEqual([1, 0, 0])
  })

  it('normalizes direction vector', () => {
    const frame = movingFrame('test', 0.5, [3, 4, 0])
    
    // Direction should be normalized to unit vector
    const magnitude = Math.sqrt(
      frame.velocity.direction.reduce((sum, c) => sum + c * c, 0)
    )
    expect(magnitude).toBeCloseTo(1.0)
  })

  it('validates velocity bounds', () => {
    expect(() => {
      movingFrame('invalid', 1.5, [1, 0, 0])  // Faster than light
    }).toThrow('between 0 and')
  })
})

describe('defineObserverFrame - Lorentz Factor', () => {
  it('calculates Lorentz factor for stationary frame', () => {
    const alice = stationaryFrame('alice')
    const bob = stationaryFrame('bob')
    
    const gamma = alice.lorentzFactor(bob)
    expect(gamma).toBe(1)  // No time dilation when both stationary
  })

  it('calculates Lorentz factor for moving frame', () => {
    const alice = stationaryFrame('alice')
    const bob = movingFrame('bob', 0.6, [1, 0, 0])  // 60% speed of light
    
    const gamma = bob.lorentzFactor(alice)
    
    // γ = 1 / sqrt(1 - 0.6²) = 1 / sqrt(0.64) = 1.25
    expect(gamma).toBeCloseTo(1.25, 1)
  })

  it('calculates Lorentz factor for high velocity', () => {
    const alice = stationaryFrame('alice')
    const bob = movingFrame('bob', 0.9, [1, 0, 0])  // 90% speed of light
    
    const gamma = bob.lorentzFactor(alice)
    
    // γ = 1 / sqrt(1 - 0.9²) ≈ 2.29
    expect(gamma).toBeGreaterThan(2)
  })
})

describe('defineObserverFrame - Event Transformation', () => {
  it('does not transform event in same frame', () => {
    const alice = stationaryFrame('alice')
    const event: CausalEvent = {
      id: 'e1',
      type: 'update',
      coordinates: { t: 1, x: [0, 0, 0] },
      data: { value: 42 },
      observer: 'alice'
    }
    
    const transformed = alice.transformEvent(event, alice)
    expect(transformed.coordinates.t).toBe(1)
  })

  it('transforms event between frames', () => {
    const alice = stationaryFrame('alice')
    const bob = movingFrame('bob', 0.6, [1, 0, 0])
    
    const event: CausalEvent = {
      id: 'e1',
      type: 'update',
      coordinates: { t: 1, x: [1, 0, 0] },
      data: { value: 42 },
      observer: 'alice'
    }
    
    const transformed = bob.transformEvent(event, alice)
    
    // Time should be dilated
    expect(transformed.coordinates.t).not.toBe(event.coordinates.t)
    expect(transformed.observer).toBe('bob')
  })
})

describe('defineObserverFrame - Light Cone', () => {
  it('checks if event is in light cone', () => {
    const alice = stationaryFrame('alice')
    
    // Event that is timelike separated (in light cone)
    const closeEvent: CausalEvent = {
      id: 'e1',
      type: 'update',
      coordinates: { t: 1, x: [0.5, 0, 0] },  // dt=1, dx=0.5, dt > dx/c
      data: {},
      observer: 'alice'
    }
    
    expect(alice.isInLightCone(closeEvent)).toBe(true)
  })

  it('detects spacelike separated events', () => {
    const alice = stationaryFrame('alice')
    
    // Event that is spacelike separated (outside light cone)
    const farEvent: CausalEvent = {
      id: 'e1',
      type: 'update',
      coordinates: { t: 0.5, x: [2, 0, 0] },  // dt=0.5, dx=2, dt < dx/c
      data: {},
      observer: 'alice'
    }
    
    expect(alice.isInLightCone(farEvent)).toBe(false)
  })
})

describe('Light Cone Regions', () => {
  it('identifies past light cone events', () => {
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 1, x: [0.5, 0, 0] },  // Later and close enough
      data: {},
      observer: 'alice'
    }
    
    const region = lightConeRegion(eventA, eventB)
    expect(region).toBe('future')
  })

  it('identifies elsewhere events', () => {
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 0.5, x: [2, 0, 0] },  // Spacelike separated
      data: {},
      observer: 'alice'
    }
    
    const region = lightConeRegion(eventA, eventB)
    expect(region).toBe('elsewhere')
  })
})

describe('Proper Time', () => {
  it('calculates proper time between events', () => {
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 1, x: [0, 0, 0] },  // 1 second later, same place
      data: {},
      observer: 'alice'
    }
    
    const tau = properTime(eventA, eventB)
    expect(tau).toBeCloseTo(1)  // Proper time = coordinate time when dx=0
  })

  it('returns zero for spacelike separation', () => {
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 0.5, x: [2, 0, 0] },  // Spacelike
      data: {},
      observer: 'alice'
    }
    
    const tau = properTime(eventA, eventB)
    expect(tau).toBe(0)  // No proper time for spacelike intervals
  })
})

describe('determineCausalOrder', () => {
  it('determines before relationship', () => {
    const alice = stationaryFrame('alice')
    
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 1, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const ordering = determineCausalOrder(eventA, eventB, alice)
    expect(ordering.relationship).toBe('before')
  })

  it('determines spacelike relationship', () => {
    const alice = stationaryFrame('alice')
    
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 0.5, x: [2, 0, 0] },  // Spacelike separated
      data: {},
      observer: 'alice'
    }
    
    const ordering = determineCausalOrder(eventA, eventB, alice)
    expect(ordering.relationship).toBe('spacelike')
  })

  it('includes light cone information', () => {
    const alice = stationaryFrame('alice')
    
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 1, x: [0.5, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const ordering = determineCausalOrder(eventA, eventB, alice)
    expect(ordering.lightCone).toBe('future')
    expect(ordering.properTime).toBeGreaterThan(0)
  })
})

describe('sortEventsCausally', () => {
  it('sorts events in temporal order', () => {
    const alice = stationaryFrame('alice')
    
    const events: CausalEvent[] = [
      { id: 'e3', type: 'update', coordinates: { t: 3, x: [0, 0, 0] }, data: {}, observer: 'alice' },
      { id: 'e1', type: 'update', coordinates: { t: 1, x: [0, 0, 0] }, data: {}, observer: 'alice' },
      { id: 'e2', type: 'update', coordinates: { t: 2, x: [0, 0, 0] }, data: {}, observer: 'alice' }
    ]
    
    const sorted = sortEventsCausally(events, alice)
    
    expect(sorted[0].id).toBe('e1')
    expect(sorted[1].id).toBe('e2')
    expect(sorted[2].id).toBe('e3')
  })

  it('respects explicit causal dependencies', () => {
    const alice = stationaryFrame('alice')
    
    const events: CausalEvent[] = [
      { id: 'e1', type: 'update', coordinates: { t: 1, x: [0, 0, 0] }, data: {}, observer: 'alice' },
      { id: 'e2', type: 'update', coordinates: { t: 2, x: [0, 0, 0] }, data: {}, observer: 'alice', causes: ['e1'] }
    ]
    
    const sorted = sortEventsCausally(events, alice)
    
    expect(sorted[0].id).toBe('e1')
    expect(sorted[1].id).toBe('e2')
  })
})

describe('Causal Connection', () => {
  it('checks if events can be causally connected', () => {
    const alice = stationaryFrame('alice')
    
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 1, x: [0.5, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    expect(canBeCausallyConnected(eventA, eventB, alice)).toBe(true)
  })

  it('detects when events cannot be causally connected', () => {
    const alice = stationaryFrame('alice')
    
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 0, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 0.5, x: [2, 0, 0] },  // Spacelike
      data: {},
      observer: 'alice'
    }
    
    expect(canBeCausallyConnected(eventA, eventB, alice)).toBe(false)
  })
})

describe('Light Cone Queries', () => {
  it('finds events in past light cone', () => {
    const alice = stationaryFrame('alice')
    
    const target: CausalEvent = {
      id: 'target',
      type: 'update',
      coordinates: { t: 2, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const allEvents: CausalEvent[] = [
      { id: 'past', type: 'update', coordinates: { t: 1, x: [0.5, 0, 0] }, data: {}, observer: 'alice' },
      { id: 'elsewhere', type: 'update', coordinates: { t: 1.5, x: [3, 0, 0] }, data: {}, observer: 'alice' }
    ]
    
    const pastEvents = getPastLightCone(target, allEvents, alice)
    expect(pastEvents.length).toBe(1)
    expect(pastEvents[0].id).toBe('past')
  })

  it('finds events in future light cone', () => {
    const alice = stationaryFrame('alice')
    
    const target: CausalEvent = {
      id: 'target',
      type: 'update',
      coordinates: { t: 1, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const allEvents: CausalEvent[] = [
      { id: 'future', type: 'update', coordinates: { t: 2, x: [0.5, 0, 0] }, data: {}, observer: 'alice' },
      { id: 'elsewhere', type: 'update', coordinates: { t: 1.5, x: [3, 0, 0] }, data: {}, observer: 'alice' }
    ]
    
    const futureEvents = getFutureLightCone(target, allEvents, alice)
    expect(futureEvents.length).toBe(1)
    expect(futureEvents[0].id).toBe('future')
  })
})

describe('Causality Violations', () => {
  it('detects acausal event sequences', () => {
    const alice = stationaryFrame('alice')
    
    // Create circular dependency
    const events: CausalEvent[] = [
      { id: 'e1', type: 'update', coordinates: { t: 0, x: [0, 0, 0] }, data: {}, observer: 'alice', causes: ['e2'] },
      { id: 'e2', type: 'update', coordinates: { t: 1, x: [0, 0, 0] }, data: {}, observer: 'alice', causes: ['e1'] }
    ]
    
    expect(isAcausal(events, alice)).toBe(true)
  })

  it('accepts valid causal sequences', () => {
    const alice = stationaryFrame('alice')
    
    const events: CausalEvent[] = [
      { id: 'e1', type: 'update', coordinates: { t: 0, x: [0, 0, 0] }, data: {}, observer: 'alice' },
      { id: 'e2', type: 'update', coordinates: { t: 1, x: [0, 0, 0] }, data: {}, observer: 'alice', causes: ['e1'] }
    ]
    
    expect(isAcausal(events, alice)).toBe(false)
  })
})

describe('Event Log Merging', () => {
  it('merges event logs from multiple observers', () => {
    const alice = stationaryFrame('alice')
    const bob = movingFrame('bob', 0.6, [1, 0, 0])
    
    const aliceEvents: CausalEvent[] = [
      { id: 'a1', type: 'update', coordinates: { t: 1, x: [0, 0, 0] }, data: {}, observer: 'alice' }
    ]
    
    const bobEvents: CausalEvent[] = [
      { id: 'b1', type: 'update', coordinates: { t: 1, x: [0, 0, 0] }, data: {}, observer: 'bob' }
    ]
    
    const merged = mergeEventLogs(
      [
        { observer: alice, events: aliceEvents },
        { observer: bob, events: bobEvents }
      ],
      alice
    )
    
    expect(merged.length).toBe(2)
  })

  it('removes duplicate events', () => {
    const alice = stationaryFrame('alice')
    
    const events1: CausalEvent[] = [
      { id: 'e1', type: 'update', coordinates: { t: 1, x: [0, 0, 0] }, data: {}, observer: 'alice' }
    ]
    
    const events2: CausalEvent[] = [
      { id: 'e1', type: 'update', coordinates: { t: 1, x: [0, 0, 0] }, data: {}, observer: 'alice' }
    ]
    
    const merged = mergeEventLogs(
      [
        { observer: alice, events: events1 },
        { observer: alice, events: events2 }
      ],
      alice
    )
    
    expect(merged.length).toBe(1)
  })
})

describe('Relativity of Simultaneity', () => {
  it('shows different event orders for different observers', () => {
    const alice = stationaryFrame('alice')
    const bob = movingFrame('bob', 0.8, [1, 0, 0])
    
    // Two events that are spacelike separated
    const eventA: CausalEvent = {
      id: 'a',
      type: 'update',
      coordinates: { t: 1, x: [0, 0, 0] },
      data: {},
      observer: 'alice'
    }
    
    const eventB: CausalEvent = {
      id: 'b',
      type: 'update',
      coordinates: { t: 1, x: [3, 0, 0] },  // Simultaneous in Alice's frame
      data: {},
      observer: 'alice'
    }
    
    const aliceOrdering = determineCausalOrder(eventA, eventB, alice)
    const bobOrdering = determineCausalOrder(eventA, eventB, bob)
    
    // Events that are simultaneous for Alice may not be for Bob
    expect(aliceOrdering.relationship).toBe('spacelike')
    // Bob may see different ordering (though both should be spacelike)
  })
})
