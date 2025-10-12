/**
 * Fortistate v3.0 - Relativistic Substrate: Causal Ordering
 * 
 * Implements happens-before relationships and causal ordering of events.
 * Different observers may see different event orders for spacelike-separated events.
 */

import type {
  CausalEvent,
  CausalOrdering,
  ObserverFrame
} from './types'
import { properTime, lightConeRegion } from './defineObserverFrame'

/**
 * Determine causal ordering between two events from an observer's perspective
 * 
 * @example
 * ```typescript
 * const ordering = determineCausalOrder(eventA, eventB, aliceFrame)
 * console.log(ordering.relationship)  // 'before', 'after', 'simultaneous', or 'spacelike'
 * ```
 */
export function determineCausalOrder(
  eventA: CausalEvent,
  eventB: CausalEvent,
  observer: ObserverFrame
): CausalOrdering {
  // Transform events to observer's frame
  const transformedA = observer.transformEvent(eventA, observer)
  const transformedB = observer.transformEvent(eventB, observer)

  const dt = transformedB.coordinates.t - transformedA.coordinates.t
  
  // Calculate proper time (frame-invariant)
  const tau = properTime(transformedA, transformedB, observer.speedOfCausality)
  
  // Determine light cone region
  const cone = lightConeRegion(transformedA, transformedB, observer.speedOfCausality)
  
  // Determine relationship
  let relationship: CausalOrdering['relationship']
  
  if (cone === 'elsewhere') {
    // Spacelike separated - no definite ordering
    relationship = 'spacelike'
  } else {
    // Timelike separated - has definite causal order
    if (Math.abs(dt) < 0.0001) {
      relationship = 'simultaneous'
    } else if (dt > 0) {
      relationship = 'before'
    } else {
      relationship = 'after'
    }
  }

  return {
    eventA: eventA.id,
    eventB: eventB.id,
    relationship,
    lightCone: cone,
    properTime: tau
  }
}

/**
 * Sort events in causal order for a given observer
 * Respects happens-before relationships
 */
export function sortEventsCausally(
  events: CausalEvent[],
  observer: ObserverFrame
): CausalEvent[] {
  // Build dependency graph
  const graph = new Map<string, Set<string>>()
  const inDegree = new Map<string, number>()
  
  // Initialize
  for (const event of events) {
    graph.set(event.id, new Set())
    inDegree.set(event.id, 0)
  }
  
  // Add causal dependencies
  for (const event of events) {
    if (event.causes) {
      for (const causeId of event.causes) {
        if (graph.has(causeId)) {
          graph.get(causeId)!.add(event.id)
          inDegree.set(event.id, (inDegree.get(event.id) || 0) + 1)
        }
      }
    }
  }
  
  // Add implicit temporal ordering
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const ordering = determineCausalOrder(events[i], events[j], observer)
      
      if (ordering.relationship === 'before' && ordering.lightCone !== 'elsewhere') {
        // events[i] happens before events[j]
        if (!events[j].causes?.includes(events[i].id)) {
          graph.get(events[i].id)!.add(events[j].id)
          inDegree.set(events[j].id, (inDegree.get(events[j].id) || 0) + 1)
        }
      }
    }
  }
  
  // Topological sort (Kahn's algorithm)
  const queue: CausalEvent[] = []
  const result: CausalEvent[] = []
  
  // Add events with no dependencies
  for (const event of events) {
    if (inDegree.get(event.id) === 0) {
      queue.push(event)
    }
  }
  
  while (queue.length > 0) {
    // Sort queue by time for consistent ordering of simultaneous events
    queue.sort((a, b) => {
      const transformedA = observer.transformEvent(a, observer)
      const transformedB = observer.transformEvent(b, observer)
      return transformedA.coordinates.t - transformedB.coordinates.t
    })
    
    const event = queue.shift()!
    result.push(event)
    
    // Process dependencies
    const dependencies = graph.get(event.id)!
    for (const depId of dependencies) {
      const newInDegree = (inDegree.get(depId) || 0) - 1
      inDegree.set(depId, newInDegree)
      
      if (newInDegree === 0) {
        const depEvent = events.find(e => e.id === depId)
        if (depEvent) {
          queue.push(depEvent)
        }
      }
    }
  }
  
  return result
}

/**
 * Check if two events can be causally connected
 * (i.e., one is in the other's light cone)
 */
export function canBeCausallyConnected(
  eventA: CausalEvent,
  eventB: CausalEvent,
  observer: ObserverFrame
): boolean {
  const cone = lightConeRegion(eventA, eventB, observer.speedOfCausality)
  return cone !== 'elsewhere'
}

/**
 * Find all events in the past light cone of a given event
 */
export function getPastLightCone(
  event: CausalEvent,
  allEvents: CausalEvent[],
  observer: ObserverFrame
): CausalEvent[] {
  return allEvents.filter(e => {
    if (e.id === event.id) return false
    const transformedEvent = observer.transformEvent(event, observer)
    const transformedE = observer.transformEvent(e, observer)
    const cone = lightConeRegion(transformedEvent, transformedE, observer.speedOfCausality)
    return cone === 'past'
  })
}

/**
 * Find all events in the future light cone of a given event
 */
export function getFutureLightCone(
  event: CausalEvent,
  allEvents: CausalEvent[],
  observer: ObserverFrame
): CausalEvent[] {
  return allEvents.filter(e => {
    if (e.id === event.id) return false
    const cone = lightConeRegion(event, e, observer.speedOfCausality)
    return cone === 'future'
  })
}

/**
 * Check if event ordering is consistent with causality
 * (no closed timelike curves)
 */
export function isAcausal(events: CausalEvent[], observer: ObserverFrame): boolean {
  // Build dependency graph
  const graph = new Map<string, Set<string>>()
  
  for (const event of events) {
    graph.set(event.id, new Set())
  }
  
  // Add explicit causal dependencies from the 'causes' field
  for (const event of events) {
    if (event.causes) {
      for (const causeId of event.causes) {
        if (graph.has(causeId)) {
          graph.get(causeId)!.add(event.id)
        }
      }
    }
  }
  
  // Add implicit temporal causal relationships
  for (let i = 0; i < events.length; i++) {
    for (let j = 0; j < events.length; j++) {
      if (i === j) continue
      
      const ordering = determineCausalOrder(events[i], events[j], observer)
      if (ordering.relationship === 'before' && ordering.lightCone !== 'elsewhere') {
        // Only add if not already present from explicit causes
        if (!events[j].causes?.includes(events[i].id)) {
          graph.get(events[i].id)!.add(events[j].id)
        }
      }
    }
  }
  
  // Check for cycles using DFS
  const visited = new Set<string>()
  const recStack = new Set<string>()
  
  function hasCycle(eventId: string): boolean {
    visited.add(eventId)
    recStack.add(eventId)
    
    const neighbors = graph.get(eventId) || new Set()
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        if (hasCycle(neighborId)) {
          return true
        }
      } else if (recStack.has(neighborId)) {
        return true // Cycle detected
      }
    }
    
    recStack.delete(eventId)
    return false
  }
  
  for (const event of events) {
    if (!visited.has(event.id)) {
      if (hasCycle(event.id)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Merge event logs from multiple observers while preserving causality
 */
export function mergeEventLogs(
  logs: Array<{ observer: ObserverFrame; events: CausalEvent[] }>,
  targetObserver: ObserverFrame
): CausalEvent[] {
  // Transform all events to target observer's frame
  const allEvents: CausalEvent[] = []
  
  for (const log of logs) {
    for (const event of log.events) {
      const transformed = targetObserver.transformEvent(event, log.observer)
      allEvents.push(transformed)
    }
  }
  
  // Remove duplicates (same event ID)
  const uniqueEvents = Array.from(
    new Map(allEvents.map(e => [e.id, e])).values()
  )
  
  // Sort causally
  return sortEventsCausally(uniqueEvents, targetObserver)
}
