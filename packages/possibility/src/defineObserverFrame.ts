/**
 * Fortistate v3.0 - Relativistic Substrate: Observer Frames
 * 
 * Defines observer reference frames with relative velocities and spacetime positions.
 * Different observers can see different event orders due to relativity of simultaneity.
 */

import type {
  ObserverFrameDefinition,
  ObserverFrame,
  Velocity,
  SpacetimeCoordinates,
  CausalEvent,
  PossibilityMetadata
} from './types'

/**
 * Speed of causality constant (c = 1.0 in natural units)
 */
export const SPEED_OF_CAUSALITY = 1.0

/**
 * Create an observer reference frame
 * 
 * @example
 * ```typescript
 * const aliceFrame = defineObserverFrame({
 *   name: 'alice',
 *   velocity: { v: 0, direction: [0, 0, 0] }  // Stationary
 * })
 * 
 * const bobFrame = defineObserverFrame({
 *   name: 'bob',
 *   velocity: { v: 0.8, direction: [1, 0, 0] }  // 80% speed of light in x-direction
 * })
 * 
 * const gamma = bobFrame.lorentzFactor(aliceFrame)
 * console.log(gamma)  // → 1.67 (time dilation factor)
 * ```
 */
export function defineObserverFrame(
  definition: ObserverFrameDefinition
): ObserverFrame {
  // Default values
  const velocity: Velocity = definition.velocity || {
    v: 0,
    direction: [0, 0, 0]
  }

  const position: SpacetimeCoordinates = definition.position || {
    t: 0,
    x: [0, 0, 0]
  }

  const speedOfCausality = definition.speedOfCausality || SPEED_OF_CAUSALITY

  // Validate velocity
  if (velocity.v < 0 || velocity.v > speedOfCausality) {
    throw new Error(
      `Velocity must be between 0 and ${speedOfCausality}, got ${velocity.v}`
    )
  }

  // Normalize direction vector
  const directionMagnitude = Math.sqrt(
    velocity.direction.reduce((sum, component) => sum + component * component, 0)
  )
  const normalizedDirection = directionMagnitude > 0
    ? velocity.direction.map(c => c / directionMagnitude)
    : [0, 0, 0]

  const normalizedVelocity: Velocity = {
    v: velocity.v,
    direction: normalizedDirection
  }

  /**
   * Calculate Lorentz factor (gamma) relative to another frame
   * γ = 1 / sqrt(1 - v²/c²)
   */
  function lorentzFactor(otherFrame: ObserverFrame): number {
    // Calculate relative velocity
    const relativeV = calculateRelativeVelocity(normalizedVelocity, otherFrame.velocity)
    
    const beta = relativeV / speedOfCausality
    const gamma = 1 / Math.sqrt(1 - beta * beta)
    
    return gamma
  }

  /**
   * Calculate relative velocity between two frames
   * Uses relativistic velocity addition
   */
  function calculateRelativeVelocity(v1: Velocity, v2: Velocity): number {
    // Simplified: assume same direction for now
    const v1Mag = v1.v
    const v2Mag = v2.v
    
    // Relativistic velocity addition formula
    const relativeV = Math.abs(v1Mag - v2Mag) / (1 - (v1Mag * v2Mag) / (speedOfCausality * speedOfCausality))
    
    return relativeV
  }

  /**
   * Transform event coordinates from another frame to this frame
   * Uses Lorentz transformation
   */
  function transformEvent(event: CausalEvent, fromFrame: ObserverFrame): CausalEvent {
    if (fromFrame.name === definition.name) {
      return event // Same frame, no transformation needed
    }

    const gamma = lorentzFactor(fromFrame)
    const beta = calculateRelativeVelocity(normalizedVelocity, fromFrame.velocity) / speedOfCausality

    // Lorentz transformation for time and position
    const { t, x } = event.coordinates
    
    // Assume motion in x-direction for simplicity
    const transformedT = gamma * (t - beta * x[0] / speedOfCausality)
    const transformedX = gamma * (x[0] - beta * speedOfCausality * t)
    
    return {
      ...event,
      coordinates: {
        t: transformedT,
        x: [transformedX, x[1], x[2]]
      },
      observer: definition.name
    }
  }

  /**
   * Check if event is in this observer's light cone
   * An event is in the light cone if it's timelike separated (|Δt| > |Δx|/c)
   */
  function isInLightCone(event: CausalEvent): boolean {
    const dt = event.coordinates.t - position.t
    const dx = Math.sqrt(
      event.coordinates.x.reduce((sum, xi, i) => 
        sum + Math.pow(xi - position.x[i], 2), 0
      )
    )
    
    // Timelike if dt² > dx²/c²
    const timelikeSeparation = dt * dt - (dx * dx) / (speedOfCausality * speedOfCausality)
    
    return timelikeSeparation > 0
  }

  // Build metadata
  const metadata: PossibilityMetadata = {
    name: definition.name,
    description: definition.metadata?.description || 
      `Observer frame for ${definition.name} with velocity ${velocity.v}c`,
    version: definition.metadata?.version || '1.0.0',
    author: definition.metadata?.author,
    tags: definition.metadata?.tags || ['relativistic', 'observer-frame'],
    createdAt: definition.metadata?.createdAt || new Date(),
    updatedAt: definition.metadata?.updatedAt || new Date()
  }

  return {
    name: definition.name,
    velocity: normalizedVelocity,
    position,
    speedOfCausality,
    lorentzFactor,
    transformEvent,
    isInLightCone,
    metadata
  }
}

/**
 * Create a stationary observer frame
 */
export function stationaryFrame(name: string, options?: Partial<ObserverFrameDefinition>): ObserverFrame {
  return defineObserverFrame({
    name,
    velocity: { v: 0, direction: [0, 0, 0] },
    ...options
  })
}

/**
 * Create a moving observer frame
 */
export function movingFrame(
  name: string,
  velocity: number,
  direction: number[],
  options?: Partial<ObserverFrameDefinition>
): ObserverFrame {
  return defineObserverFrame({
    name,
    velocity: { v: velocity, direction },
    ...options
  })
}

/**
 * Calculate proper time between two events (frame-invariant)
 * τ² = Δt² - Δx²/c²
 */
export function properTime(eventA: CausalEvent, eventB: CausalEvent, c: number = SPEED_OF_CAUSALITY): number {
  const dt = eventB.coordinates.t - eventA.coordinates.t
  const dx = Math.sqrt(
    eventA.coordinates.x.reduce((sum, xi, i) => 
      sum + Math.pow(eventB.coordinates.x[i] - xi, 2), 0
    )
  )
  
  const properTimeSq = dt * dt - (dx * dx) / (c * c)
  
  return properTimeSq > 0 ? Math.sqrt(properTimeSq) : 0
}

/**
 * Determine light cone region of eventB relative to eventA
 */
export function lightConeRegion(
  eventA: CausalEvent,
  eventB: CausalEvent,
  c: number = SPEED_OF_CAUSALITY
): 'past' | 'future' | 'elsewhere' {
  const dt = eventB.coordinates.t - eventA.coordinates.t
  const dx = Math.sqrt(
    eventA.coordinates.x.reduce((sum, xi, i) => 
      sum + Math.pow(eventB.coordinates.x[i] - xi, 2), 0
    )
  )
  
  const timelikeSeparation = dt * dt - (dx * dx) / (c * c)
  
  if (timelikeSeparation > 0) {
    // Timelike separated - can be causally connected
    return dt > 0 ? 'future' : 'past'
  } else {
    // Spacelike separated - no causal connection possible
    return 'elsewhere'
  }
}
