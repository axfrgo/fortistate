/**
 * Fortistate v3.0 - Quantum Substrate: Superposition
 * 
 * Defines properties that can exist in multiple states simultaneously
 * until observed, at which point they collapse to a single value.
 */

import type {
  SuperpositionDefinition,
  Superposition,
  SuperpositionState,
  PossibilityMetadata
} from './types'

/**
 * Create a superposition property that can hold multiple simultaneous values
 * 
 * @example
 * ```typescript
 * const electronSpin = defineSuperposition({
 *   name: 'electron-spin',
 *   initialStates: [
 *     { value: 'up', amplitude: 0.7 },
 *     { value: 'down', amplitude: 0.3 }
 *   ]
 * })
 * 
 * const spin = electronSpin.observe() // 70% chance 'up', 30% chance 'down'
 * ```
 */
export function defineSuperposition<T = any>(
  definition: SuperpositionDefinition<T>
): Superposition<T> {
  // Validate all amplitudes are between 0 and 1 first
  for (const state of definition.initialStates) {
    if (state.amplitude < 0 || state.amplitude > 1) {
      throw new Error(
        `Amplitude must be between 0 and 1, got ${state.amplitude}`
      )
    }
  }

  // Validate amplitudes sum to 1
  const totalAmplitude = definition.initialStates.reduce(
    (sum, state) => sum + state.amplitude,
    0
  )
  
  if (Math.abs(totalAmplitude - 1) > 0.0001) {
    throw new Error(
      `Superposition amplitudes must sum to 1, got ${totalAmplitude}`
    )
  }

  // Internal state
  let currentState: SuperpositionState<T> = {
    states: [...definition.initialStates],
    isCollapsed: false
  }

  // Decoherence timer
  let decoherenceTimer: NodeJS.Timeout | null = null

  // Start decoherence timer if specified
  if (definition.decoherenceTime) {
    decoherenceTimer = setTimeout(() => {
      if (!currentState.isCollapsed) {
        // Auto-collapse due to decoherence
        observe()
      }
    }, definition.decoherenceTime)
  }

  /**
   * Observe the superposition and collapse it to a single value
   * Uses the Born rule: probability = amplitude²
   */
  function observe(): T {
    if (currentState.isCollapsed && currentState.collapsedValue !== undefined) {
      return currentState.collapsedValue
    }

    // Calculate probabilities using Born rule (amplitude²)
    const probabilities = currentState.states.map(state => ({
      value: state.value,
      probability: state.amplitude * state.amplitude
    }))

    // Normalize probabilities (should already sum to 1, but ensure it)
    const totalProb = probabilities.reduce((sum, p) => sum + p.probability, 0)
    const normalizedProbs = probabilities.map(p => ({
      value: p.value,
      probability: p.probability / totalProb
    }))

    // Collapse to single value using weighted random selection
    const random = Math.random()
    let cumulative = 0
    
    for (const prob of normalizedProbs) {
      cumulative += prob.probability
      if (random <= cumulative) {
        // Collapse!
        currentState = {
          ...currentState,
          isCollapsed: true,
          collapsedValue: prob.value,
          collapsedAt: Date.now()
        }

        // Clear decoherence timer
        if (decoherenceTimer) {
          clearTimeout(decoherenceTimer)
          decoherenceTimer = null
        }

        return prob.value
      }
    }

    // Fallback to last state (shouldn't happen with proper probabilities)
    const fallback = normalizedProbs[normalizedProbs.length - 1].value
    currentState = {
      ...currentState,
      isCollapsed: true,
      collapsedValue: fallback,
      collapsedAt: Date.now()
    }
    return fallback
  }

  /**
   * Reset to superposition state
   */
  function resuperpose(newStates?: SuperpositionState<T>['states']): void {
    if (!definition.allowResuperposition && currentState.isCollapsed) {
      throw new Error(
        `Resuperposition not allowed for ${definition.name}. Set allowResuperposition: true to enable.`
      )
    }

    if (newStates) {
      // Validate new states
      const totalAmplitude = newStates.reduce((sum, state) => sum + state.amplitude, 0)
      if (Math.abs(totalAmplitude - 1) > 0.0001) {
        throw new Error(`Amplitudes must sum to 1, got ${totalAmplitude}`)
      }
    }

    currentState = {
      states: newStates || [...definition.initialStates],
      isCollapsed: false
    }

    // Restart decoherence timer
    if (definition.decoherenceTime) {
      if (decoherenceTimer) {
        clearTimeout(decoherenceTimer)
      }
      decoherenceTimer = setTimeout(() => {
        if (!currentState.isCollapsed) {
          observe()
        }
      }, definition.decoherenceTime)
    }
  }

  // Build metadata
  const metadata: PossibilityMetadata = {
    name: definition.name,
    description: definition.metadata?.description,
    version: definition.metadata?.version || '1.0.0',
    author: definition.metadata?.author,
    tags: definition.metadata?.tags || ['quantum', 'superposition'],
    createdAt: definition.metadata?.createdAt || new Date(),
    updatedAt: definition.metadata?.updatedAt || new Date()
  }

  return {
    name: definition.name,
    getState: () => ({ ...currentState }),
    observe,
    isCollapsed: () => currentState.isCollapsed,
    resuperpose,
    metadata
  }
}

/**
 * Create a simple binary superposition (50/50)
 */
export function binarySuperposition<T>(
  name: string,
  trueValue: T,
  falseValue: T,
  options?: Partial<SuperpositionDefinition<T>>
): Superposition<T> {
  return defineSuperposition({
    name,
    initialStates: [
      { value: trueValue, amplitude: 0.5 },
      { value: falseValue, amplitude: 0.5 }
    ],
    ...options
  })
}

/**
 * Create a weighted superposition
 */
export function weightedSuperposition<T>(
  name: string,
  states: Array<{ value: T; weight: number }>,
  options?: Partial<SuperpositionDefinition<T>>
): Superposition<T> {
  // Normalize weights to amplitudes that sum to 1
  const totalWeight = states.reduce((sum, s) => sum + s.weight, 0)
  const initialStates = states.map(s => ({
    value: s.value,
    amplitude: s.weight / totalWeight
  }))

  return defineSuperposition({
    name,
    initialStates,
    ...options
  })
}

/**
 * Create uniform superposition (all states equally likely)
 */
export function uniformSuperposition<T>(
  name: string,
  values: T[],
  options?: Partial<SuperpositionDefinition<T>>
): Superposition<T> {
  const amplitude = 1 / values.length
  const initialStates = values.map(value => ({
    value,
    amplitude
  }))

  return defineSuperposition({
    name,
    initialStates,
    ...options
  })
}
