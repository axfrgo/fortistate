/**
 * AI Agent Integration - Main Export
 * 
 * Unified interface for spawning and managing Fortistate AI agents.
 */

export * from './agentTypes'
export * from './agentRuntime'
export { type FortiAgent } from './agentRuntime'
export * from './datasetGenerator'
export * from './trainingPipeline'

// Re-export commonly used functions
export { spawnAgent, runAgentExample } from './agentRuntime'
export { generateAllDatasets, exportToJSONL } from './datasetGenerator'
export { runTrainingPipeline } from './trainingPipeline'

/**
 * Quick Start Example:
 * 
 * ```typescript
 * import { spawnAgent, generateAllDatasets, runTrainingPipeline } from '@fortistate/ai'
 * 
 * // 1. Generate training dataset
 * const datasets = generateAllDatasets('./datasets')
 * 
 * // 2. Train models
 * const custodianModel = await runTrainingPipeline('custodian', datasets.custodian)
 * 
 * // 3. Spawn agent in production
 * const custodian = spawnAgent(universe, {
 *   role: 'custodian',
 *   model: 'local.llama3.1+custodian-lora',
 *   tools: ['LawProver', 'Planner'],
 *   outputSchema: 'Proposal'
 * })
 * 
 * // 4. Execute
 * const output = await custodian.execute({
 *   violation: { ... },
 *   laws: [ ... ],
 *   universeState: { ... }
 * })
 * ```
 */
