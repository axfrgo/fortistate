/**
 * Meta-Laws Engine - Compose and orchestrate multiple laws
 * Week 7-8 of v3.0 Possibility Algebra
 * 
 * Meta-laws allow composition of multiple laws with:
 * - Logical operators (AND, OR, IMPLIES)
 * - Conflict resolution strategies
 * - Context-dependent execution
 * - Frame-dependent variations
 */

import type {
  MetaLawDefinition,
  MetaLaw,
  MetaLawExecutionResult,
  Law,
  LawExecutionResult,
  LawConflict,
  LawContext,
  PossibilityMetadata
} from './types.js'

/**
 * Define a meta-law that composes multiple laws with conflict resolution
 */
export function defineMetaLaw<TInput = any, TOutput = any>(
  definition: MetaLawDefinition<TInput, TOutput>
): MetaLaw<TInput, TOutput> {
  // Validate definition
  if (!definition.name || definition.name.trim() === '') {
    throw new Error('Meta-law must have a name')
  }

  if (!definition.laws || definition.laws.length === 0) {
    throw new Error('Meta-law must have at least one component law')
  }

  if (definition.composition === 'custom' && !definition.compositionFn) {
    throw new Error('Custom composition requires compositionFn')
  }

  if (definition.conflictResolution === 'custom' && !definition.conflictResolver) {
    throw new Error('Custom conflict resolution requires conflictResolver')
  }

  const priority = definition.priority ?? 0
  const context = definition.context ?? {}

  // Store component laws
  let laws = [...definition.laws]

  /**
   * Execute the meta-law with given inputs
   */
  function execute(
    inputs: TInput[],
    executionContext?: Partial<LawContext>
  ): MetaLawExecutionResult<TOutput> {
    const ctx: LawContext = {
      timestamp: Date.now(),
      priority: priority,
      mode: 'strict',
      ...context,
      ...executionContext
    }

    const lawResults = new Map<string, LawExecutionResult<TOutput>>()
    const conflicts: LawConflict[] = []

    // Execute based on composition operator
    try {
      let value: TOutput | undefined

      switch (definition.composition) {
        case 'conjunction':
          value = executeConjunction(laws, inputs, ctx, lawResults)
          break

        case 'disjunction':
          value = executeDisjunction(laws, inputs, ctx, lawResults)
          break

        case 'implication':
          value = executeImplication(laws, inputs, ctx, lawResults)
          break

        case 'sequence':
          value = executeSequence(laws, inputs, ctx, lawResults)
          break

        case 'parallel':
          value = executeParallel(laws, inputs, ctx, lawResults)
          break

        case 'custom':
          if (definition.compositionFn) {
            value = definition.compositionFn(laws as Law<TInput, TOutput>[], inputs, ctx)
          }
          break

        default:
          throw new Error(`Unknown composition operator: ${definition.composition}`)
      }

      // Detect conflicts AFTER execution using populated lawResults
      const detectedConflicts = detectConflictsFromResults(lawResults)
      conflicts.push(...detectedConflicts)

      // Check for error strategy - throw if conflicts exist
      if (conflicts.length > 0 && definition.conflictResolution === 'error') {
        throw new Error(`Meta-law conflicts detected: ${conflicts.map(c => c.reason).join('; ')}`)
      }

      // Resolve conflicts if any (already checked for 'error' strategy above)
      if (conflicts.length > 0 && definition.conflictResolution !== 'error') {
        const resolved = resolveConflicts(conflicts, ctx)
        if (resolved !== undefined) {
          value = resolved
        }
      }

      return {
        success: value !== undefined,
        value,
        lawResults,
        conflicts,
        conflictResolution: conflicts.length > 0 ? definition.conflictResolution : undefined,
        context: ctx
      }
    } catch (error) {
      // Re-throw if it's a conflict error with 'error' strategy
      if (error instanceof Error && error.message.includes('conflicts detected')) {
        throw error
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        lawResults,
        conflicts,
        context: ctx
      }
    }
  }

  /**
   * AND composition - all laws must succeed
   */
  function executeConjunction(
    componentLaws: (Law<TInput, TOutput> | MetaLaw<TInput, TOutput>)[],
    inputs: TInput[],
    ctx: LawContext,
    results: Map<string, LawExecutionResult<TOutput>>
  ): TOutput | undefined {
    let lastValue: TOutput | undefined

    for (const law of componentLaws) {
      const result = isMetaLaw(law)
        ? law.execute(inputs, ctx)
        : law.execute(...inputs)

      const lawResult: LawExecutionResult<TOutput> = isMetaLaw(law)
        ? { success: result.success, value: result.value, error: result.error }
        : result

      results.set(law.name, lawResult)

      if (!lawResult.success) {
        // In strict mode, any failure means conjunction fails
        if (ctx.mode === 'strict') {
          return undefined
        }
      } else {
        lastValue = lawResult.value
      }
    }

    return lastValue
  }

  /**
   * OR composition - at least one law must succeed
   */
  function executeDisjunction(
    componentLaws: (Law<TInput, TOutput> | MetaLaw<TInput, TOutput>)[],
    inputs: TInput[],
    ctx: LawContext,
    results: Map<string, LawExecutionResult<TOutput>>
  ): TOutput | undefined {
    for (const law of componentLaws) {
      const result = isMetaLaw(law)
        ? law.execute(inputs, ctx)
        : law.execute(...inputs)

      const lawResult: LawExecutionResult<TOutput> = isMetaLaw(law)
        ? { success: result.success, value: result.value, error: result.error }
        : result

      results.set(law.name, lawResult)

      if (lawResult.success && lawResult.value !== undefined) {
        // First success wins in disjunction
        return lawResult.value
      }
    }

    return undefined
  }

  /**
   * IMPLIES composition - if first succeeds, second must succeed
   */
  function executeImplication(
    componentLaws: (Law<TInput, TOutput> | MetaLaw<TInput, TOutput>)[],
    inputs: TInput[],
    ctx: LawContext,
    results: Map<string, LawExecutionResult<TOutput>>
  ): TOutput | undefined {
    if (componentLaws.length < 2) {
      throw new Error('Implication requires at least 2 laws (antecedent and consequent)')
    }

    const antecedent = componentLaws[0]
    const consequent = componentLaws[1]

    const antecedentResult = isMetaLaw(antecedent)
      ? antecedent.execute(inputs, ctx)
      : antecedent.execute(...inputs)

    const antecedentLawResult: LawExecutionResult<TOutput> = isMetaLaw(antecedent)
      ? { success: antecedentResult.success, value: antecedentResult.value, error: antecedentResult.error }
      : antecedentResult

    results.set(antecedent.name, antecedentLawResult)

    // If antecedent fails, implication is vacuously true
    if (!antecedentLawResult.success) {
      return undefined
    }

    // Antecedent succeeded, so consequent must succeed
    const consequentResult = isMetaLaw(consequent)
      ? consequent.execute(inputs, ctx)
      : consequent.execute(...inputs)

    const consequentLawResult: LawExecutionResult<TOutput> = isMetaLaw(consequent)
      ? { success: consequentResult.success, value: consequentResult.value, error: consequentResult.error }
      : consequentResult

    results.set(consequent.name, consequentLawResult)

    return consequentLawResult.value
  }

  /**
   * SEQUENCE composition - execute laws in order, threading output
   */
  function executeSequence(
    componentLaws: (Law<TInput, TOutput> | MetaLaw<TInput, TOutput>)[],
    inputs: TInput[],
    ctx: LawContext,
    results: Map<string, LawExecutionResult<TOutput>>
  ): TOutput | undefined {
    let lastValue: TOutput | undefined
    let currentInputs: any[] = inputs

    for (const law of componentLaws) {
      const result = isMetaLaw(law)
        ? law.execute(currentInputs as TInput[], ctx)
        : law.execute(...(currentInputs as TInput[]))

      const lawResult: LawExecutionResult<TOutput> = isMetaLaw(law)
        ? { success: result.success, value: result.value, error: result.error }
        : result

      results.set(law.name, lawResult)

      if (!lawResult.success) {
        return undefined
      }

      if (lawResult.value !== undefined) {
        lastValue = lawResult.value
        // Thread the output as input to the next law
        currentInputs = [lawResult.value as any]
      }
    }

    return lastValue
  }

  /**
   * PARALLEL composition - execute all laws, collect results
   */
  function executeParallel(
    componentLaws: (Law<TInput, TOutput> | MetaLaw<TInput, TOutput>)[],
    inputs: TInput[],
    ctx: LawContext,
    results: Map<string, LawExecutionResult<TOutput>>
  ): TOutput | undefined {
    const allResults: TOutput[] = []

    for (const law of componentLaws) {
      const result = isMetaLaw(law)
        ? law.execute(inputs, ctx)
        : law.execute(...inputs)

      const lawResult: LawExecutionResult<TOutput> = isMetaLaw(law)
        ? { success: result.success, value: result.value, error: result.error }
        : result

      results.set(law.name, lawResult)

      if (lawResult.success && lawResult.value !== undefined) {
        allResults.push(lawResult.value)
      }
    }

    // Return array of results as output
    return allResults as any
  }

  /**
   * Check if meta-law can be applied
   */
  function canApply(inputs: TInput[], executionContext?: Partial<LawContext>): boolean {
    const ctx: LawContext = {
      ...context,
      ...executionContext
    }

    // Check if all component laws can apply
    for (const law of laws) {
      if (isMetaLaw(law)) {
        if (!law.canApply(inputs, ctx)) {
          return false
        }
      } else {
        if (!law.canApply(...inputs)) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Detect conflicts from already-executed law results
   */
  function detectConflictsFromResults(results: Map<string, LawExecutionResult<TOutput>>): LawConflict[] {
    const conflicts: LawConflict[] = []

    // For implication and sequence, values are expected to differ (pipeline/conditional logic)
    // For conjunction, disjunction, parallel - check for conflicts
    if (definition.composition === 'implication' || definition.composition === 'sequence') {
      return conflicts
    }

    // Compare results pairwise
    const lawNames = Array.from(results.keys())
    for (let i = 0; i < lawNames.length; i++) {
      for (let j = i + 1; j < lawNames.length; j++) {
        const result1 = results.get(lawNames[i])!
        const result2 = results.get(lawNames[j])!

        // Check for conflicting successful results
        if (
          result1.success &&
          result2.success &&
          result1.value !== undefined &&
          result2.value !== undefined &&
          !deepEqual(result1.value, result2.value)
        ) {
          conflicts.push({
            laws: [lawNames[i], lawNames[j]],
            reason: `Laws produce different outputs: ${JSON.stringify(result1.value)} vs ${JSON.stringify(result2.value)}`,
            severity: 'medium'
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Detect conflicts among component laws (legacy method that re-executes)
   */
  function detectConflicts(
    inputs: TInput[],
    executionContext?: Partial<LawContext>
  ): LawConflict[] {
    const conflicts: LawConflict[] = []
    const ctx: LawContext = { ...context, ...executionContext }

    // Execute all laws and compare results
    const results = new Map<string, LawExecutionResult<TOutput>>()

    for (const law of laws) {
      const result = isMetaLaw(law)
        ? law.execute(inputs, ctx)
        : law.execute(...inputs)

      const lawResult: LawExecutionResult<TOutput> = isMetaLaw(law)
        ? { success: result.success, value: result.value, error: result.error }
        : result

      results.set(law.name, lawResult)
    }

    // Compare results pairwise
    const lawNames = Array.from(results.keys())
    for (let i = 0; i < lawNames.length; i++) {
      for (let j = i + 1; j < lawNames.length; j++) {
        const result1 = results.get(lawNames[i])!
        const result2 = results.get(lawNames[j])!

        // Check for conflicting successful results
        if (
          result1.success &&
          result2.success &&
          result1.value !== undefined &&
          result2.value !== undefined &&
          !deepEqual(result1.value, result2.value)
        ) {
          conflicts.push({
            laws: [lawNames[i], lawNames[j]],
            reason: `Laws produce different outputs: ${JSON.stringify(result1.value)} vs ${JSON.stringify(result2.value)}`,
            severity: 'medium'
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Resolve conflicts using the configured strategy
   */
  function resolveConflicts(conflicts: LawConflict[], ctx: LawContext): TOutput {
    if (conflicts.length === 0) {
      return undefined as any
    }

    switch (definition.conflictResolution) {
      case 'priority':
        return resolveByPriority(ctx)

      case 'voting':
        return resolveByVoting(ctx)

      case 'first-wins':
        return resolveFirstWins(ctx)

      case 'last-wins':
        return resolveLastWins(ctx)

      case 'frame-dependent':
        return resolveFrameDependent(ctx)

      case 'error':
        // Error is thrown in execute() before calling this
        return undefined as any

      case 'custom':
        if (definition.conflictResolver) {
          return definition.conflictResolver(conflicts, ctx)
        }
        return undefined as any

      default:
        return undefined as any
    }
  }

  /**
   * Resolve by priority - higher priority law wins
   */
  function resolveByPriority(ctx: LawContext): TOutput {
    // Sort laws by priority (higher first)
    const sortedLaws = [...laws].sort((a, b) => {
      const priorityA = isMetaLaw(a) ? a.priority : 0
      const priorityB = isMetaLaw(b) ? b.priority : 0
      return priorityB - priorityA
    })

    // Execute highest priority law
    const highestPriorityLaw = sortedLaws[0]
    const result = isMetaLaw(highestPriorityLaw)
      ? highestPriorityLaw.execute([], ctx)
      : highestPriorityLaw.execute()

    return (isMetaLaw(highestPriorityLaw) ? result.value : result.value) as TOutput
  }

  /**
   * Resolve by voting - majority value wins
   */
  function resolveByVoting(ctx: LawContext): TOutput {
    const votes = new Map<string, number>()

    // Count votes for each distinct value
    for (const law of laws) {
      const result = isMetaLaw(law)
        ? law.execute([], ctx)
        : law.execute()

      const value = isMetaLaw(law) ? result.value : result.value

      if (value !== undefined) {
        const key = JSON.stringify(value)
        votes.set(key, (votes.get(key) || 0) + 1)
      }
    }

    // Find value with most votes
    let maxVotes = 0
    let winningValue: TOutput | undefined

    for (const [valueKey, voteCount] of votes.entries()) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount
        winningValue = JSON.parse(valueKey)
      }
    }

    return winningValue as TOutput
  }

  /**
   * Resolve first-wins - first law's result wins
   */
  function resolveFirstWins(ctx: LawContext): TOutput {
    const firstLaw = laws[0]
    const result = isMetaLaw(firstLaw)
      ? firstLaw.execute([], ctx)
      : firstLaw.execute()

    return (isMetaLaw(firstLaw) ? result.value : result.value) as TOutput
  }

  /**
   * Resolve last-wins - last law's result wins
   */
  function resolveLastWins(ctx: LawContext): TOutput {
    const lastLaw = laws[laws.length - 1]
    const result = isMetaLaw(lastLaw)
      ? lastLaw.execute([], ctx)
      : lastLaw.execute()

    return (isMetaLaw(lastLaw) ? result.value : result.value) as TOutput
  }

  /**
   * Resolve frame-dependent - use frame-specific law
   */
  function resolveFrameDependent(ctx: LawContext): TOutput {
    if (!ctx.frame) {
      throw new Error('Frame-dependent resolution requires frame in context')
    }

    // Find law matching current frame
    for (const law of laws) {
      if (law.name.includes(ctx.frame.name)) {
        const result = isMetaLaw(law)
          ? law.execute([], ctx)
          : law.execute()

        return (isMetaLaw(law) ? result.value : result.value) as TOutput
      }
    }

    // Default to first law
    return resolveFirstWins(ctx)
  }

  /**
   * Add a new law to the meta-law
   */
  function addLaw(law: Law<TInput, TOutput> | MetaLaw<TInput, TOutput>): void {
    if (!laws.find(l => l.name === law.name)) {
      laws.push(law)
    }
  }

  /**
   * Remove a law from the meta-law
   */
  function removeLaw(lawName: string): void {
    const index = laws.findIndex(l => l.name === lawName)
    if (index !== -1) {
      laws.splice(index, 1)
    }
  }

  // Build metadata
  const metadata: PossibilityMetadata = {
    name: definition.name,
    description: definition.metadata?.description ||
      `Meta-law composing ${laws.length} laws with ${definition.composition} operator`,
    version: definition.metadata?.version || '1.0.0',
    author: definition.metadata?.author,
    tags: definition.metadata?.tags || ['meta-law', definition.composition, definition.conflictResolution],
    createdAt: definition.metadata?.createdAt || new Date(),
    updatedAt: definition.metadata?.updatedAt || new Date()
  }

  return {
    name: definition.name,
    laws,
    composition: definition.composition,
    conflictResolution: definition.conflictResolution,
    priority,
    execute,
    canApply,
    detectConflicts,
    resolveConflicts,
    addLaw,
    removeLaw,
    metadata
  }
}

/**
 * Type guard for meta-law
 */
function isMetaLaw<TInput, TOutput>(
  law: Law<TInput, TOutput> | MetaLaw<TInput, TOutput>
): law is MetaLaw<TInput, TOutput> {
  return 'laws' in law && Array.isArray(law.laws)
}

/**
 * Deep equality check
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!deepEqual(a[key], b[key])) return false
    }

    return true
  }

  return false
}

/**
 * Helper: Create a conjunction meta-law (AND)
 */
export function and<TInput = any, TOutput = any>(
  name: string,
  laws: Law<TInput, TOutput>[],
  options?: Partial<MetaLawDefinition<TInput, TOutput>>
): MetaLaw<TInput, TOutput> {
  return defineMetaLaw({
    name,
    laws,
    composition: 'conjunction',
    conflictResolution: 'priority',
    ...options
  })
}

/**
 * Helper: Create a disjunction meta-law (OR)
 */
export function or<TInput = any, TOutput = any>(
  name: string,
  laws: Law<TInput, TOutput>[],
  options?: Partial<MetaLawDefinition<TInput, TOutput>>
): MetaLaw<TInput, TOutput> {
  return defineMetaLaw({
    name,
    laws,
    composition: 'disjunction',
    conflictResolution: 'first-wins',
    ...options
  })
}

/**
 * Helper: Create an implication meta-law (IF-THEN)
 */
export function implies<TInput = any, TOutput = any>(
  name: string,
  antecedent: Law<TInput, TOutput>,
  consequent: Law<TInput, TOutput>,
  options?: Partial<MetaLawDefinition<TInput, TOutput>>
): MetaLaw<TInput, TOutput> {
  return defineMetaLaw({
    name,
    laws: [antecedent, consequent],
    composition: 'implication',
    conflictResolution: 'error',
    ...options
  })
}

/**
 * Helper: Create a sequence meta-law
 */
export function sequence<TInput = any, TOutput = any>(
  name: string,
  laws: Law<TInput, TOutput>[],
  options?: Partial<MetaLawDefinition<TInput, TOutput>>
): MetaLaw<TInput, TOutput> {
  return defineMetaLaw({
    name,
    laws,
    composition: 'sequence',
    conflictResolution: 'last-wins',
    ...options
  })
}
