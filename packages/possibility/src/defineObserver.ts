/**
 * Fortistate v3.0 - Quantum Substrate: Observer
 * 
 * Defines observers that can measure quantum states and cause collapse.
 * Different observers can have different measurement strategies.
 */

import type {
  ObserverDefinition,
  Observer,
  Superposition,
  SuperpositionState,
  PossibilityMetadata
} from './types'

/**
 * Create an observer that can measure quantum states
 * 
 * @example
 * ```typescript
 * const physicist = defineObserver({
 *   name: 'physicist',
 *   collapseStrategy: 'born-rule'
 * })
 * 
 * const spin = physicist.observe(electronSpin)
 * // → Collapses superposition using Born rule
 * ```
 */
export function defineObserver(
  definition: ObserverDefinition
): Observer {
  // Validate custom collapse function
  if (definition.collapseStrategy === 'custom' && !definition.collapseFn) {
    throw new Error(
      `Custom collapse strategy requires collapseFn to be provided`
    )
  }

  /**
   * Observe a superposition and collapse it
   */
  function observe<T>(superposition: Superposition<T>): T {
    // Check if observer can measure this property
    if (definition.observableProperties && 
        !definition.observableProperties.includes(superposition.name)) {
      throw new Error(
        `Observer ${definition.name} cannot observe property ${superposition.name}`
      )
    }

    // If already collapsed, just return the value
    if (superposition.isCollapsed()) {
      const state = superposition.getState()
      return state.collapsedValue!
    }

    // Apply collapse strategy
    const state = superposition.getState()
    
    switch (definition.collapseStrategy || 'born-rule') {
      case 'born-rule':
        return collapseBornRule(superposition)

      case 'max-amplitude':
        return collapseMaxAmplitude(state)

      case 'custom':
        if (!definition.collapseFn) {
          throw new Error(`Custom collapse missing collapseFn`)
        }
        return definition.collapseFn(state.states)

      default:
        return collapseBornRule(superposition)
    }
  }

  /**
   * Collapse using Born rule (probability = amplitude²)
   * Delegates to superposition's built-in observe method
   */
  function collapseBornRule<T>(superposition: Superposition<T>): T {
    return superposition.observe()
  }

  /**
   * Collapse to state with maximum amplitude (deterministic)
   */
  function collapseMaxAmplitude<T>(state: SuperpositionState<T>): T {
    let maxAmplitude = -1
    let maxValue: T | undefined

    for (const s of state.states) {
      if (s.amplitude > maxAmplitude) {
        maxAmplitude = s.amplitude
        maxValue = s.value
      }
    }

    if (maxValue === undefined) {
      throw new Error(`No states found in superposition`)
    }

    return maxValue
  }

  /**
   * Check if observer can measure a property
   */
  function canObserve(propertyName: string): boolean {
    if (!definition.observableProperties) {
      return true // Can observe anything
    }
    return definition.observableProperties.includes(propertyName)
  }

  // Build metadata
  const metadata: PossibilityMetadata = {
    name: definition.name,
    description: definition.metadata?.description || 
      `Observer using ${definition.collapseStrategy || 'born-rule'} collapse strategy`,
    version: definition.metadata?.version || '1.0.0',
    author: definition.metadata?.author,
    tags: definition.metadata?.tags || ['quantum', 'observer'],
    createdAt: definition.metadata?.createdAt || new Date(),
    updatedAt: definition.metadata?.updatedAt || new Date()
  }

  return {
    name: definition.name,
    observe,
    canObserve,
    metadata
  }
}

/**
 * Create a standard observer using Born rule
 */
export function standardObserver(
  name: string,
  options?: Partial<ObserverDefinition>
): Observer {
  return defineObserver({
    name,
    collapseStrategy: 'born-rule',
    ...options
  })
}

/**
 * Create a deterministic observer (always picks max amplitude)
 */
export function deterministicObserver(
  name: string,
  options?: Partial<ObserverDefinition>
): Observer {
  return defineObserver({
    name,
    collapseStrategy: 'max-amplitude',
    ...options
  })
}

/**
 * Create a restricted observer (can only observe specific properties)
 */
export function restrictedObserver(
  name: string,
  observableProperties: string[],
  options?: Partial<ObserverDefinition>
): Observer {
  return defineObserver({
    name,
    observableProperties,
    ...options
  })
}
