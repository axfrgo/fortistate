/**
 * Fortistate v3.0 - defineLaw Primitive
 * 
 * Creates law definitions for state transition rules.
 * Laws describe HOW state changes in response to events.
 */

import type {
  LawDefinition,
  Law,
  LawExecutionResult,
  PossibilityMetadata,
  LawComposition,
  LawConflict
} from './types.js'

/**
 * Define a law that governs state transitions
 * 
 * @example
 * ```ts
 * const calculateTotal = defineLaw({
 *   name: 'calculate-total',
 *   inputs: ['cart', 'prices'],
 *   output: 'cart',
 *   enforce: (cart, prices) => ({
 *     ...cart,
 *     total: cart.items.reduce((sum, item) => 
 *       sum + prices[item.id] * item.qty, 0
 *     )
 *   })
 * })
 * ```
 */
export function defineLaw<TInput = any, TOutput = any>(
  definition: LawDefinition<TInput, TOutput>
): Law<TInput, TOutput> {
  // Create metadata
  const metadata: PossibilityMetadata = {
    name: definition.name,
    description: definition.metadata?.description,
    version: definition.metadata?.version || '1.0.0',
    author: definition.metadata?.author,
    tags: definition.metadata?.tags || [],
    createdAt: definition.metadata?.createdAt || new Date(),
    updatedAt: definition.metadata?.updatedAt || new Date()
  }

  // canApply checks precondition
  const canApply = (...inputs: TInput[]): boolean => {
    if (!definition.precondition) return true
    
    try {
      return definition.precondition(...inputs)
    } catch (err) {
      return false
    }
  }

  // execute runs the law with pre/post condition checks
  const execute = (...inputs: TInput[]): LawExecutionResult<TOutput> => {
    // Check precondition
    const preconditionMet = canApply(...inputs)
    if (!preconditionMet && definition.precondition) {
      return {
        success: false,
        error: `Precondition failed for law '${definition.name}'`,
        preconditionMet: false
      }
    }

    // Execute the law
    try {
      const value = definition.enforce(...inputs)

      // Check postcondition
      if (definition.postcondition) {
        const postconditionMet = definition.postcondition(value)
        if (!postconditionMet) {
          return {
            success: false,
            error: `Postcondition failed for law '${definition.name}'`,
            preconditionMet: true,
            postconditionMet: false
          }
        }
      }

      return {
        success: true,
        value,
        preconditionMet: true,
        postconditionMet: definition.postcondition ? true : undefined
      }
    } catch (err) {
      return {
        success: false,
        error: `Law execution failed: ${err}`,
        preconditionMet: true
      }
    }
  }

  return {
    name: definition.name,
    inputs: definition.inputs,
    output: definition.output,
    execute,
    canApply,
    metadata,
    complexity: definition.complexity
  }
}

/**
 * Compose multiple laws into a single law
 * Laws are executed in order, with each law's output feeding into the next
 */
export function composeLaws(
  name: string,
  laws: Law[],
  options?: {
    conflictStrategy?: 'first-wins' | 'last-wins' | 'merge' | 'error'
  }
): LawComposition {
  return {
    name,
    laws,
    conflictStrategy: options?.conflictStrategy || 'last-wins'
  }
}

/**
 * Execute a law composition
 */
export function executeComposition<TOutput = any>(
  composition: LawComposition,
  inputs: Record<string, any>
): LawExecutionResult<TOutput> {
  let currentState = { ...inputs }
  const errors: string[] = []

  for (const law of composition.laws) {
    // Gather inputs for this law
    const lawInputs = law.inputs.map(key => currentState[key])

    // Execute the law
    const result = law.execute(...lawInputs)

    if (!result.success) {
      errors.push(`Law '${law.name}' failed: ${result.error}`)
      
      if (composition.conflictStrategy === 'error') {
        return {
          success: false,
          error: errors.join('; ')
        }
      }
      continue
    }

    // Update state with the result
    if (result.value !== undefined) {
      currentState[law.output] = result.value
    }
  }

  if (errors.length > 0 && composition.conflictStrategy === 'error') {
    return {
      success: false,
      error: errors.join('; ')
    }
  }

  return {
    success: true,
    value: currentState as TOutput
  }
}

/**
 * Detect conflicts between laws
 * Two laws conflict if they write to the same output with different results
 */
export function detectConflicts(laws: Law[]): LawConflict[] {
  const conflicts: LawConflict[] = []
  
  // Group laws by output
  const lawsByOutput = new Map<string, Law[]>()
  for (const law of laws) {
    const existing = lawsByOutput.get(law.output) || []
    existing.push(law)
    lawsByOutput.set(law.output, existing)
  }

  // Check for conflicts
  for (const [output, outputLaws] of lawsByOutput) {
    if (outputLaws.length > 1) {
      // Multiple laws write to the same output - potential conflict
      for (let i = 0; i < outputLaws.length; i++) {
        for (let j = i + 1; j < outputLaws.length; j++) {
          conflicts.push({
            laws: [outputLaws[i].name, outputLaws[j].name],
            reason: `Both laws write to output '${output}'`,
            severity: 'medium'
          })
        }
      }
    }
  }

  // Check for circular dependencies
  const dependencyGraph = new Map<string, Set<string>>()
  for (const law of laws) {
    const deps = new Set(law.inputs)
    dependencyGraph.set(law.output, deps)
  }

  // Simple cycle detection
  for (const law of laws) {
    const visited = new Set<string>()
    const checkCycle = (node: string): boolean => {
      if (visited.has(node)) return true
      visited.add(node)
      
      const deps = dependencyGraph.get(node)
      if (!deps) return false
      
      for (const dep of deps) {
        if (checkCycle(dep)) return true
      }
      
      visited.delete(node)
      return false
    }

    if (checkCycle(law.output)) {
      conflicts.push({
        laws: [law.name, law.name],
        reason: `Circular dependency detected involving '${law.output}'`,
        severity: 'critical'
      })
    }
  }

  return conflicts
}

/**
 * Create a law that always returns a constant value
 */
export function constantLaw<T>(name: string, output: string, value: T): Law<never, T> {
  return defineLaw<never, T>({
    name,
    inputs: [],
    output,
    enforce: () => value
  })
}

/**
 * Create a law that transforms a single input
 */
export function transformLaw<TInput, TOutput>(
  name: string,
  input: string,
  output: string,
  transform: (input: TInput) => TOutput
): Law<TInput, TOutput> {
  return defineLaw({
    name,
    inputs: [input],
    output,
    enforce: transform
  })
}

/**
 * Create a law that combines multiple inputs
 */
export function combineLaw<TOutput>(
  name: string,
  inputs: string[],
  output: string,
  combine: (...inputs: any[]) => TOutput
): Law<any, TOutput> {
  return defineLaw({
    name,
    inputs,
    output,
    enforce: combine
  })
}

/**
 * Create a conditional law that only applies when a condition is met
 */
export function conditionalLaw<TInput, TOutput>(
  name: string,
  inputs: string[],
  output: string,
  condition: (...inputs: TInput[]) => boolean,
  enforce: (...inputs: TInput[]) => TOutput
): Law<TInput, TOutput> {
  return defineLaw({
    name,
    inputs,
    output,
    precondition: condition,
    enforce
  })
}

/**
 * Create a law with validation (postcondition)
 */
export function validatedLaw<TInput, TOutput>(
  name: string,
  inputs: string[],
  output: string,
  enforce: (...inputs: TInput[]) => TOutput,
  validate: (output: TOutput) => boolean,
  errorMessage?: string
): Law<TInput, TOutput> {
  return defineLaw({
    name,
    inputs,
    output,
    enforce,
    postcondition: validate,
    metadata: {
      description: errorMessage || `Validated law: ${name}`
    }
  })
}
