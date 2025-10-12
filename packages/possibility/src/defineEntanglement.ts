/**
 * Fortistate v3.0 - Quantum Substrate: Entanglement
 * 
 * Defines quantum entanglement between properties - measuring one
 * instantly affects the other, regardless of distance.
 */

import type {
  EntanglementDefinition,
  Entanglement,
  PossibilityMetadata
} from './types'

/**
 * Create an entanglement link between two properties
 * 
 * @example
 * ```typescript
 * const spinEntanglement = defineEntanglement({
 *   name: 'particle-spin',
 *   propertyA: { entity: 'particle-1', property: 'spin' },
 *   propertyB: { entity: 'particle-2', property: 'spin' },
 *   correlation: 'opposite' // When A is 'up', B is 'down'
 * })
 * 
 * const valueB = spinEntanglement.applyCorrelation('up')
 * // → 'down'
 * ```
 */
export function defineEntanglement(
  definition: EntanglementDefinition
): Entanglement {
  // Validate correlation function for custom correlations
  if (definition.correlation === 'custom' && !definition.correlationFn) {
    throw new Error(
      `Custom correlation requires correlationFn to be provided`
    )
  }

  // Internal state
  let isEntangled = true
  let measurementCount = 0

  /**
   * Apply correlation based on type
   */
  function applyCorrelation(valueA: any): any {
    if (!isEntangled) {
      throw new Error(
        `Entanglement ${definition.name} has been broken and is no longer active`
      )
    }

    measurementCount++

    // Check if entanglement should break (non-persistent after first measurement)
    if (definition.persistent === false && measurementCount > 1) {
      isEntangled = false
      throw new Error(
        `Non-persistent entanglement ${definition.name} broke after first measurement`
      )
    }

    switch (definition.correlation) {
      case 'identical':
        return valueA

      case 'opposite':
        return applyOpposite(valueA)

      case 'complementary':
        return applyComplementary(valueA)

      case 'orthogonal':
        return applyOrthogonal(valueA)

      case 'custom':
        if (!definition.correlationFn) {
          throw new Error(`Custom correlation missing correlationFn`)
        }
        return definition.correlationFn(valueA)

      default:
        throw new Error(
          `Unknown correlation type: ${definition.correlation}`
        )
    }
  }

  /**
   * Apply opposite correlation
   */
  function applyOpposite(valueA: any): any {
    // Boolean NOT
    if (typeof valueA === 'boolean') {
      return !valueA
    }

    // Numeric negation
    if (typeof valueA === 'number') {
      return -valueA
    }

    // String opposite (for spin-like properties)
    if (typeof valueA === 'string') {
      const opposites: Record<string, string> = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left',
        'on': 'off',
        'off': 'on',
        'true': 'false',
        'false': 'true',
        'yes': 'no',
        'no': 'yes'
      }
      return opposites[valueA.toLowerCase()] || valueA
    }

    return valueA
  }

  /**
   * Apply complementary correlation (sum to constant)
   * Assumes values are numbers that should sum to 1
   */
  function applyComplementary(valueA: any): any {
    if (typeof valueA === 'number') {
      return 1 - valueA
    }
    throw new Error(
      `Complementary correlation requires numeric values, got ${typeof valueA}`
    )
  }

  /**
   * Apply orthogonal correlation (perpendicular vectors)
   * For 2D vectors, if A = (x, y), B = (-y, x)
   */
  function applyOrthogonal(valueA: any): any {
    if (Array.isArray(valueA) && valueA.length === 2) {
      const [x, y] = valueA
      return [-y, x]
    }
    
    // For single numbers, use complementary
    if (typeof valueA === 'number') {
      return Math.sqrt(1 - valueA * valueA)
    }

    throw new Error(
      `Orthogonal correlation requires 2D vector or number, got ${typeof valueA}`
    )
  }

  /**
   * Break the entanglement
   */
  function breakEntanglement(): void {
    isEntangled = false
  }

  // Build metadata
  const metadata: PossibilityMetadata = {
    name: definition.name,
    description: definition.metadata?.description || 
      `Entanglement between ${definition.propertyA.entity}.${definition.propertyA.property} and ${definition.propertyB.entity}.${definition.propertyB.property}`,
    version: definition.metadata?.version || '1.0.0',
    author: definition.metadata?.author,
    tags: definition.metadata?.tags || ['quantum', 'entanglement'],
    createdAt: definition.metadata?.createdAt || new Date(),
    updatedAt: definition.metadata?.updatedAt || new Date()
  }

  return {
    name: definition.name,
    propertyA: definition.propertyA,
    propertyB: definition.propertyB,
    correlation: definition.correlation,
    applyCorrelation,
    isActive: () => isEntangled,
    break: breakEntanglement,
    metadata
  }
}

/**
 * Create an entangled pair with identical correlation
 */
export function identicalEntanglement(
  name: string,
  propertyA: EntanglementDefinition['propertyA'],
  propertyB: EntanglementDefinition['propertyB'],
  options?: Partial<EntanglementDefinition>
): Entanglement {
  return defineEntanglement({
    name,
    propertyA,
    propertyB,
    correlation: 'identical',
    ...options
  })
}

/**
 * Create an entangled pair with opposite correlation
 */
export function oppositeEntanglement(
  name: string,
  propertyA: EntanglementDefinition['propertyA'],
  propertyB: EntanglementDefinition['propertyB'],
  options?: Partial<EntanglementDefinition>
): Entanglement {
  return defineEntanglement({
    name,
    propertyA,
    propertyB,
    correlation: 'opposite',
    ...options
  })
}

/**
 * Create a custom entanglement with user-defined correlation
 */
export function customEntanglement<T, U>(
  name: string,
  propertyA: EntanglementDefinition['propertyA'],
  propertyB: EntanglementDefinition['propertyB'],
  correlationFn: (valueA: T) => U,
  options?: Partial<EntanglementDefinition>
): Entanglement {
  return defineEntanglement({
    name,
    propertyA,
    propertyB,
    correlation: 'custom',
    correlationFn,
    ...options
  })
}
