/**
 * Fortistate v3.0 - defineConstraint Primitive
 * 
 * Creates custom constraint definitions for entity validation.
 * Constraints represent rules that instances must follow beyond basic type checking.
 */

import type { ConstraintDefinition } from './types.js'

/**
 * Define a custom constraint for entity validation
 * 
 * @example
 * ```ts
 * const ageVerified = defineConstraint(
 *   'age-verified',
 *   (user) => user.age >= 13,
 *   'User must be 13 or older'
 * )
 * ```
 * 
 * @param name - Unique identifier for this constraint
 * @param check - Function that returns true if constraint is satisfied
 * @param message - Error message when constraint fails
 * @param options - Additional constraint options
 */
export function defineConstraint(
  name: string,
  check: (instance: any) => boolean,
  message?: string,
  options?: {
    repair?: (instance: any) => any
    severity?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
  }
): ConstraintDefinition {
  return {
    name,
    check,
    message: message || `Constraint '${name}' failed`,
    repair: options?.repair,
    severity: options?.severity || 'medium',
    category: options?.category
  }
}

/**
 * Create a constraint that checks a numeric property is within range
 */
export function rangeConstraint(
  propertyName: string,
  min: number,
  max: number
): ConstraintDefinition {
  return defineConstraint(
    `${propertyName}-range`,
    (instance) => {
      const value = instance[propertyName]
      return typeof value === 'number' && value >= min && value <= max
    },
    `${propertyName} must be between ${min} and ${max}`,
    {
      repair: (instance) => ({
        ...instance,
        [propertyName]: Math.max(min, Math.min(max, instance[propertyName]))
      }),
      severity: 'medium'
    }
  )
}

/**
 * Create a constraint that checks two properties are equal
 */
export function equalityConstraint(
  property1: string,
  property2: string,
  message?: string
): ConstraintDefinition {
  return defineConstraint(
    `${property1}-equals-${property2}`,
    (instance) => instance[property1] === instance[property2],
    message || `${property1} must equal ${property2}`,
    {
      severity: 'high'
    }
  )
}

/**
 * Create a constraint that checks a property matches a regex pattern
 */
export function patternConstraint(
  propertyName: string,
  pattern: RegExp,
  message?: string
): ConstraintDefinition {
  return defineConstraint(
    `${propertyName}-pattern`,
    (instance) => {
      const value = instance[propertyName]
      return typeof value === 'string' && pattern.test(value)
    },
    message || `${propertyName} must match pattern ${pattern}`,
    {
      severity: 'medium'
    }
  )
}

/**
 * Create a constraint that checks a property is non-negative
 */
export function nonNegativeConstraint(propertyName: string): ConstraintDefinition {
  return defineConstraint(
    `${propertyName}-non-negative`,
    (instance) => {
      const value = instance[propertyName]
      return typeof value === 'number' && value >= 0
    },
    `${propertyName} must be non-negative`,
    {
      repair: (instance) => ({
        ...instance,
        [propertyName]: Math.max(0, instance[propertyName])
      }),
      severity: 'high',
      category: 'numeric'
    }
  )
}

/**
 * Create a constraint with custom logic
 */
export function customConstraint(
  name: string,
  logic: (instance: any) => boolean,
  options: {
    message: string
    repair?: (instance: any) => any
    severity?: 'low' | 'medium' | 'high' | 'critical'
    category?: string
  }
): ConstraintDefinition {
  return defineConstraint(name, logic, options.message, {
    repair: options.repair,
    severity: options.severity,
    category: options.category
  })
}
