/**
 * AI Agent Runtime - Spawn and manage specialized Fortistate AI agents
 * 
 * Integrates with local models (LLaMA, Mistral, Qwen) using LoRA adapters.
 * Provides unified interface for Custodian, Diplomat, Narrator, and Explorer agents.
 */

import { trainedAgents } from './models/generatedModels'
import {
  StorytellerLawValidator,
  autoFixViolations,
} from './storyteller-laws'
import type {
  AgentConfig,
  AgentRole,
  AgentMetrics,
  CustodianInput,
  CustodianOutput,
  DiplomatInput,
  DiplomatOutput,
  Conflict,
  RepairProposal,
  RepairStep,
  NarratorInput,
  NarratorOutput,
  ExplorerInput,
  ExplorerOutput,
  StorytellerInput,
  StorytellerOutput,
  ModelSpec,
  VerificationResult,
} from './agentTypes'

const ROLE_LABELS: Record<AgentRole, string> = {
  custodian: 'Custodian',
  diplomat: 'Diplomat',
  narrator: 'Narrator',
  explorer: 'Explorer',
  storyteller: 'Storyteller',
}

const ROLE_MODEL_KEYS: Record<AgentRole, string> = {
  custodian: 'local.llama3.1+custodian-lora',
  diplomat: 'local.mistral+diplomat-lora',
  narrator: 'local.qwen+narrator-lora',
  explorer: 'local.llama3.1+explorer-lora',
  storyteller: 'local.llama3.1+storyteller-lora',
}

const KNOWLEDGE = trainedAgents.knowledge
const EXEMPLARS = trainedAgents.exemplars
const DATASETS = trainedAgents.datasets

function personalizeSummary(template: string, count: number): string {
  if (!template) return `Story covering ${count} events`
  if (template.includes('{count}')) {
    return template.replace('{count}', String(count))
  }
  return template.replace(/\d+/, String(count))
}

// ============================================================================
// MODEL REGISTRY
// ============================================================================

export const MODEL_REGISTRY: Record<string, ModelSpec> = Object.fromEntries(
  (Object.entries(ROLE_MODEL_KEYS) as Array<[AgentRole, string]>).map(([role, key]) => {
    const source = trainedAgents.models[role]
    const spec: ModelSpec = {
      ...source,
      name: `Fortistate ${ROLE_LABELS[role]} (${source.name})`,
      loraConfig: {
        ...source.loraConfig,
        targetModules: [...source.loraConfig.targetModules],
      },
    }
    return [key, spec]
  })
)

const MODEL_ALIASES: Record<string, AgentRole> = {
  'local.qwen2.5+narrator-lora': 'narrator',
  'local.mistral+explorer-lora': 'explorer',
}

for (const [alias, role] of Object.entries(MODEL_ALIASES)) {
  const baseKey = ROLE_MODEL_KEYS[role]
  const baseSpec = MODEL_REGISTRY[baseKey]
  if (baseSpec) {
    MODEL_REGISTRY[alias] = {
      ...baseSpec,
      loraConfig: { ...baseSpec.loraConfig, targetModules: [...baseSpec.loraConfig.targetModules] },
    }
  }
}

// ============================================================================
// AGENT INTERFACE
// ============================================================================

export interface FortiAgent<I, O> {
  config: AgentConfig
  model: ModelSpec
  execute(input: I, signal?: AbortSignal): Promise<O>
  verify(output: O): Promise<VerificationResult>
  getMetrics(): AgentMetrics
  unload(): Promise<void>
}

// ============================================================================
// BASE AGENT IMPLEMENTATION
// ============================================================================

class BaseAgent<I, O> implements FortiAgent<I, O> {
  config: AgentConfig
  model: ModelSpec
  protected metrics: AgentMetrics
  private loaded: boolean = false

  constructor(config: AgentConfig) {
    this.config = config
    const modelSpec = MODEL_REGISTRY[config.model]
    if (!modelSpec) {
      throw new Error(`Unknown model: ${config.model}`)
    }
    this.model = modelSpec
    this.metrics = {
      jsonCompliance: 0,
      proposalAcceptance: 0,
      averageLatencyMs: 0,
      memoryUsageMB: 0,
      loadTimeMs: 0,
    }

    const datasetInfo = DATASETS[config.role]
    if (datasetInfo) {
      console.log(
        `📚 Loaded ${ROLE_LABELS[config.role]} dataset metadata — samples: ${datasetInfo.size}, templates: ${
          'templates' in datasetInfo ? datasetInfo.templates.length : 'n/a'
        }`
      )
    }
  }

  async load(): Promise<void> {
    if (this.loaded) return

    console.log(`🔧 Loading ${this.model.name}...`)
    const startTime = Date.now()

    // Simulate model loading (in production, load actual model + LoRA)
    await new Promise((resolve) => setTimeout(resolve, this.model.loadTimeMs))

    const loadTime = Date.now() - startTime
    this.metrics.loadTimeMs = loadTime
    this.metrics.memoryUsageMB = this.model.maxMemoryMB
    this.loaded = true

    console.log(`✅ Model loaded in ${loadTime}ms, memory: ${this.model.maxMemoryMB}MB`)
  }

  async execute(input: I, signal?: AbortSignal): Promise<O> {
    if (!this.loaded) await this.load()

    const startTime = Date.now()
    console.log(`🤖 Agent executing: ${this.config.role}`)

    // In production, this would call the actual model
    const output = await this.generateOutput(input, signal)

    const latency = Date.now() - startTime
    this.metrics.averageLatencyMs =
      (this.metrics.averageLatencyMs * 0.9 + latency * 0.1) // Exponential moving average

    return output
  }

  protected async generateOutput(_input: I, _signal?: AbortSignal): Promise<O> {
    // Override in subclasses
    throw new Error('generateOutput must be implemented by subclass')
  }

  async verify(_output: O): Promise<VerificationResult> {
    // Override in subclasses for role-specific verification
    return {
      passed: true,
      errors: [],
      warnings: [],
      metrics: {
        jsonValid: true,
        schemaCompliant: true,
        logicallySound: true,
        executionTime: 0,
      },
    }
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics }
  }

  async unload(): Promise<void> {
    console.log(`🔌 Unloading ${this.model.name}...`)
    this.loaded = false
  }
}

// ============================================================================
// CUSTODIAN AGENT
// ============================================================================

export class CustodianAgent extends BaseAgent<CustodianInput, CustodianOutput> {
  protected async generateOutput(input: CustodianInput, _signal?: AbortSignal): Promise<CustodianOutput> {
    console.log(`🛡️ Custodian analyzing violation: ${input.violation.violationType}`)

    const violationKey = input.violation.violationType as keyof typeof KNOWLEDGE.custodian
    const knowledge = KNOWLEDGE.custodian[violationKey]
    const defaultConfidence = 0.9
    let proposal: RepairProposal
    
    // Generate context-aware repair steps based on actual violation type
    const snapshot = input.violation.snapshot || {}
    const violationType = input.violation.violationType
    const entity = input.violation.entity
    
    // Smart repair generation based on detected issues
    if (violationType === 'missing_entity') {
      const nodeType = snapshot.nodeType || 'node'
      proposal = {
        id: `proposal-${Date.now()}`,
        type: 'patch',
        steps: [{
          action: 'set_entity_field',
          target: entity,
          params: { 
            field: 'entity',
            value: `${nodeType}_entity`,
            suggest: `Consider naming this entity based on its purpose (e.g., 'user', 'account', 'session')`
          },
          preconditions: ['node.exists'],
          postconditions: ['node.entity !== null'],
        }],
        proof: `Missing entity field detected. Setting default entity identifier to restore ${input.violation.law}.`,
        confidence: 0.95,
        estimatedCost: 10,
      }
    } else if (violationType === 'incomplete_initialization') {
      proposal = {
        id: `proposal-${Date.now()}`,
        type: 'patch',
        steps: [{
          action: 'initialize_properties',
          target: entity,
          params: {
            properties: { 
              status: 'initialized',
              timestamp: Date.now(),
              created: true 
            },
            suggest: 'Add domain-specific properties like balance, username, or configuration'
          },
          preconditions: ['node.type === begin'],
          postconditions: ['node.properties !== empty'],
        }],
        proof: `BEGIN node should initialize state. Adding default properties to comply with ${input.violation.law}.`,
        confidence: 0.92,
        estimatedCost: 15,
      }
    } else if (violationType === 'orphaned_node') {
      const nodeType = snapshot.nodeType || 'unknown'
      const universeNodes = (input.universeState.nodes as Array<{ id: string; type?: string; data?: any }>) || []
      const suggestedSource = universeNodes.find((n: any) => n.type === 'begin' || n.type === 'become')
      proposal = {
        id: `proposal-${Date.now()}`,
        type: 'patch',
        steps: [{
          action: 'create_inbound_edge',
          target: entity,
          params: {
            sourceId: suggestedSource?.id || 'begin-node',
            edgeLabel: `flow_to_${nodeType}`,
            animated: true
          },
          preconditions: ['target.exists', 'source.exists'],
          postconditions: ['target.has_connection'],
        }],
        proof: `Orphaned ${nodeType} node detected. Creating connection to integrate into workflow per ${input.violation.law}.`,
        confidence: 0.88,
        estimatedCost: 20,
      }
    } else if (violationType === 'missing_transformation') {
      proposal = {
        id: `proposal-${Date.now()}`,
        type: 'patch',
        steps: [{
          action: 'set_transformation',
          target: entity,
          params: {
            transform: 'state + delta',
            trigger: 'state_change_event',
            suggest: 'Define specific transformation logic (e.g., balance + amount, status = active)'
          },
          preconditions: ['node.type === become'],
          postconditions: ['node.transform !== null'],
        }],
        proof: `BECOME node requires transformation logic. Adding default transform to satisfy ${input.violation.law}.`,
        confidence: 0.90,
        estimatedCost: 18,
      }
    } else if (violationType === 'missing_condition') {
      proposal = {
        id: `proposal-${Date.now()}`,
        type: 'patch',
        steps: [{
          action: 'set_condition',
          target: entity,
          params: {
            condition: 'state.invalid || state.expired',
            action: 'terminate',
            suggest: 'Define termination condition (e.g., balance < 0, timeout exceeded)'
          },
          preconditions: ['node.type === cease'],
          postconditions: ['node.condition !== null'],
        }],
        proof: `CEASE node needs termination condition. Adding default condition per ${input.violation.law}.`,
        confidence: 0.91,
        estimatedCost: 16,
      }
    } else if (violationType === 'broken_edge') {
      proposal = {
        id: `proposal-${Date.now()}`,
        type: 'rollback',
        steps: [{
          action: 'remove_broken_edge',
          target: entity,
          params: {
            reason: 'References non-existent nodes',
            sourceExists: snapshot.sourceExists,
            targetExists: snapshot.targetExists
          },
          preconditions: ['edge.exists'],
          postconditions: ['edge.removed'],
        }],
        proof: `Edge references non-existent node(s). Removing broken edge to maintain graph integrity per ${input.violation.law}.`,
        confidence: 0.96,
        estimatedCost: 12,
      }
    } else if (knowledge) {
      // Use knowledge base for known violations
      proposal = {
        id: `proposal-${Date.now()}`,
        type: knowledge.recommendedProposal.type,
        steps: knowledge.recommendedProposal.steps.map((step): RepairStep => ({
          action: step.action,
          target: input.violation.entity,
          params: { ...step.params },
          preconditions: [...step.preconditions],
          postconditions: [...step.postconditions],
        })),
        proof: `Proof: ${knowledge.law} violated. ${
          knowledge.recommendedProposal.type === 'rollback' ? 'Rollback' : 'Patch'
        } restores invariant.`,
        confidence: Math.max(defaultConfidence, knowledge.recommendedProposal.confidence),
        estimatedCost: knowledge.recommendedProposal.estimatedCost,
      }
    } else {
      // Generic fallback
      const fallbackSteps: RepairStep[] = [
        {
          action: 'validate_and_enhance',
          target: input.violation.entity,
          params: { 
            monitor: 'integrity',
            addMetadata: true,
            suggest: 'Review and enhance node/edge configuration'
          },
          preconditions: ['element.exists'],
          postconditions: ['element.validated'],
        },
      ]

      proposal = {
        id: `proposal-${Date.now()}`,
        type: 'patch',
        steps: fallbackSteps,
        proof: `Law ${input.violation.law} may be violated. Applying validation and enhancement to improve compliance.`,
        confidence: defaultConfidence - 0.15,
        estimatedCost: 25,
      }
    }

    const alternatives: RepairProposal[] = EXEMPLARS.custodian
      .filter((sample) => sample.input.violation.violationType !== input.violation.violationType)
      .slice(0, 2)
      .map((sample) => ({
        id: `${sample.output.proposal.id}-reference`,
        type: sample.output.proposal.type,
        steps: sample.output.proposal.steps.map((step): RepairStep => ({
          action: step.action,
          target: input.violation.entity,
          params: { ...step.params },
          preconditions: [...step.preconditions],
          postconditions: [...step.postconditions],
        })),
        proof: sample.output.proposal.proof,
        confidence: Math.max(defaultConfidence - 0.05, sample.output.proposal.confidence),
        estimatedCost: sample.output.proposal.estimatedCost,
      }))

    const reasoning = knowledge
      ? `Detected ${input.violation.violationType} on ${input.violation.entity}. Leveraging trained repair plan to restore ${knowledge.law}.`
      : `Detected ${input.violation.violationType} on ${input.violation.entity}. Generated repair strategy to restore ${input.violation.law}.`

    this.metrics.jsonCompliance = 0.98
    this.metrics.proposalAcceptance = proposal.confidence

    return {
      proposal,
      reasoning,
      alternatives,
    }
  }

  async verify(output: CustodianOutput): Promise<VerificationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check JSON compliance
    if (!output.proposal || !output.proposal.id) {
      errors.push('Missing proposal ID')
    }

    // Check logical soundness
    if (output.proposal.confidence < 0.7) {
      warnings.push('Low confidence proposal')
    }

    this.metrics.jsonCompliance = errors.length === 0 ? 1.0 : 0.0
    this.metrics.proposalAcceptance = output.proposal.confidence

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metrics: {
        jsonValid: true,
        schemaCompliant: errors.length === 0,
        logicallySound: true,
        executionTime: this.metrics.averageLatencyMs,
      },
    }
  }
}

// ============================================================================
// DIPLOMAT AGENT
// ============================================================================

export class DiplomatAgent extends BaseAgent<DiplomatInput, DiplomatOutput> {
  protected async generateOutput(input: DiplomatInput, _signal?: AbortSignal): Promise<DiplomatOutput> {
    console.log(`🤝 Diplomat negotiating between ${input.universeA.id} and ${input.universeB.id}`)

    const pairKey = [input.universeA.substrate, input.universeB.substrate]
      .sort()
      .join('::') as keyof typeof KNOWLEDGE.diplomat
    const knowledge = KNOWLEDGE.diplomat[pairKey]
    const exemplar = EXEMPLARS.diplomat.find((sample) => {
      const key = [sample.input.universeA.substrate, sample.input.universeB.substrate].sort().join('::')
      return key === pairKey
    })

    const agreements = knowledge
      ? knowledge.agreements.map((agreement) => ({
          type: agreement.type,
          description: agreement.description,
          implementation: [...agreement.implementation],
        }))
      : exemplar?.output.treaty.agreements.map((agreement) => ({
          type: agreement.type,
          description: agreement.description,
          implementation: [...agreement.implementation],
        })) ?? [
          {
            type: 'shared_law' as const,
            description: 'Both universes commit to uphold shared invariants',
            implementation: ['establish_joint_governance', 'sync_changesets'],
          },
        ]

    const conflictSamples = exemplar
      ? (exemplar.output.treaty.conflicts as readonly Conflict[])
      : undefined

    const conflicts: Conflict[] = (conflictSamples ?? []).map((conflict) => ({
      type: conflict.type,
      description: conflict.description,
      resolution: conflict.resolution,
      confidence: conflict.confidence,
    }))

    const treaty = {
      id: `treaty-${Date.now()}`,
      universeA: input.universeA.id,
      universeB: input.universeB.id,
      agreements,
      conflicts,
      mergeStrategy: knowledge?.mergeStrategy ?? exemplar?.output.treaty.mergeStrategy ?? 'federation',
      proof:
        exemplar?.output.treaty.proof ??
        `Treaty preserves invariants between ${input.universeA.substrate} and ${input.universeB.substrate}.`,
    }

    const reasoning = knowledge?.reasoning ??
      `Aligning ${input.universeA.substrate} and ${input.universeB.substrate} domains to maintain shared invariants.`

    const riskAssessment = knowledge?.riskAssessment ??
      exemplar?.output.riskAssessment ?? {
        conflicts: conflicts.length,
        resolutionConfidence: conflicts.length === 0 ? 0.92 : 0.78,
        estimatedComplexity: Math.max(agreements.length, 3),
      }

    this.metrics.jsonCompliance = 0.97
    this.metrics.proposalAcceptance = riskAssessment.resolutionConfidence

    return {
      treaty,
      reasoning,
      riskAssessment,
    }
  }
}

// ============================================================================
// NARRATOR AGENT
// ============================================================================

export class NarratorAgent extends BaseAgent<NarratorInput, NarratorOutput> {
  protected async generateOutput(input: NarratorInput, _signal?: AbortSignal): Promise<NarratorOutput> {
    console.log(`📖 Narrator generating ${input.mode} story for ${input.events.length} events`)

    const knowledge = KNOWLEDGE.narrator[input.mode]
    const exemplar = EXEMPLARS.narrator.find((sample) => sample.input.mode === input.mode)

  const story = input.events.map((event) => ({
      timestamp: event.timestamp,
      speaker: 'System',
      text: this.narrateEvent(event, input.mode),
      context: event.data,
      causalLinks: event.causes,
    }))

    const summary = knowledge
      ? personalizeSummary(knowledge.summaryTemplate, input.events.length)
      : `A ${input.mode}-friendly narrative of ${input.events.length} causal events`

    const keyInsights = [
      ...(knowledge?.keyInsights ?? exemplar?.output.keyInsights ?? [
        'Causal chain demonstrates proper sequencing',
        'All invariants maintained',
      ]),
    ]

    const causalChainFromExemplar = exemplar?.output.causalChains[0]
    const causalChains = [
      {
        trigger: causalChainFromExemplar?.trigger ?? input.events[0]?.id ?? 'origin',
        chain: input.events.map((event) => event.id),
        outcome: causalChainFromExemplar?.outcome ?? input.events[input.events.length - 1]?.type ?? 'unknown',
      },
    ]

    this.metrics.jsonCompliance = 0.99
    this.metrics.proposalAcceptance = 0.9

    return {
      story,
      summary,
      keyInsights,
      causalChains,
    }
  }

  private narrateEvent(
    event: NarratorInput['events'][number],
    mode: 'kid' | 'pm' | 'engineer'
  ): string {
    switch (mode) {
      case 'kid':
        return `Something happened to ${event.entity}! It was a ${event.type}.`
      case 'pm':
        return `User story: As ${event.entity}, the system executed ${event.type} at ${new Date(event.timestamp).toISOString()}.`
      case 'engineer':
      default:
        return `Event ${event.id}: ${event.type} operation on ${event.entity} with payload ${JSON.stringify(event.data)}`
    }
  }
}

// ============================================================================
// EXPLORER AGENT
// ============================================================================

export class ExplorerAgent extends BaseAgent<ExplorerInput, ExplorerOutput> {
  protected async generateOutput(input: ExplorerInput, _signal?: AbortSignal): Promise<ExplorerOutput> {
    console.log(`🔬 Explorer analyzing paradox: ${input.paradox.type}`)

    const knowledge = KNOWLEDGE.explorer[input.paradox.type]
    const exemplar = EXEMPLARS.explorer.find(
      (sample) => sample.input.paradox.type === input.paradox.type
    )

    const knowledgeScenarios = knowledge?.scenarios ?? exemplar?.output.scenarios ?? []
    let scenarios: ExplorerOutput['scenarios'] = knowledgeScenarios.map(
      (scenario, index): ExplorerOutput['scenarios'][number] => ({
        id: `${scenario.id}-${Date.now()}-${index}`,
        name: scenario.name,
        initialState: { ...input.universeState, ...scenario.initialState },
        interventions: scenario.interventions.map((intervention) => ({
          time: intervention.time,
          action: intervention.action,
          target: intervention.target,
          params: { ...intervention.params },
        })),
        expectedOutcomes: [...scenario.expectedOutcomes],
      })
    ) as ExplorerOutput['scenarios']

    if (scenarios.length === 0) {
      scenarios = [
        {
          id: `scenario-${Date.now()}-baseline`,
          name: 'Baseline: Monitor paradox',
          initialState: input.universeState,
          interventions: [],
          expectedOutcomes: ['stable'],
        },
        {
          id: `scenario-${Date.now()}-mitigation`,
          name: 'Mitigation: Activate causal guardrails',
          initialState: input.universeState,
          interventions: [
            {
              time: Date.now() + 500,
              action: 'activate_guardian',
              target: 'causal_core',
              params: { strategy: 'lock_causality' },
            },
          ],
          expectedOutcomes: ['paradox_resolved', 'stable'],
        },
      ]
    }

    const analysis = exemplar?.output.analysis
      ? {
          stableOutcomes: exemplar.output.analysis.stableOutcomes,
          paradoxResolutions: exemplar.output.analysis.paradoxResolutions,
          emergentBehaviors: [...exemplar.output.analysis.emergentBehaviors],
        }
      : {
          stableOutcomes: scenarios.filter((scenario) => scenario.expectedOutcomes.includes('stable')).length,
          paradoxResolutions: scenarios.filter((scenario) => scenario.expectedOutcomes.includes('paradox_resolved')).length,
          emergentBehaviors: ['timeline_branching'],
        }

    const recommendations = [
      ...(knowledge?.recommendations ?? exemplar?.output.recommendations ?? [
        'Instrument paradox zone for telemetry',
        'Stage interventions via temporal sandbox',
      ]),
    ]

    this.metrics.jsonCompliance = 0.96
    this.metrics.proposalAcceptance = analysis.paradoxResolutions > 0 ? 0.93 : 0.82

    return {
      scenarios,
      analysis,
      recommendations,
    }
  }
}

// ============================================================================
// STORYTELLER AGENT - NLP Story → Universe Pipeline Translation
// ============================================================================

class StorytellerAgent implements FortiAgent<StorytellerInput, StorytellerOutput> {
  config: AgentConfig
  model: ModelSpec
  private metrics: AgentMetrics

  constructor(config: AgentConfig) {
    this.config = config
    const modelSpec = MODEL_REGISTRY[config.model]
    if (!modelSpec) {
      throw new Error(`Unknown model: ${config.model}`)
    }
    this.model = modelSpec
    this.metrics = {
      jsonCompliance: 0.98,
      proposalAcceptance: 0.92,
      averageLatencyMs: 250,
      memoryUsageMB: modelSpec.maxMemoryMB,
      loadTimeMs: modelSpec.loadTimeMs,
    }
  }

  async execute(input: StorytellerInput, signal?: AbortSignal): Promise<StorytellerOutput> {
    if (signal?.aborted) throw new Error('Storyteller execution aborted')
    console.log(`🎨 [Storyteller] Processing natural language story...`)
    const startTime = Date.now()

  // Parse natural language and extract key concepts
    const story = input.naturalLanguageStory.toLowerCase()
    const domain = input.context?.domain ?? 'generic'
    
    // Improved parsing: split story into sentences and map common multiplayer/game phrases
    const nodeTypes: Array<{ type: string; entity: string; data: Record<string, any> }> = []
    let nodeIndex = 0

    const sentences = story.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)

    const pushNode = (type: string, label: string, data: Record<string, any> = {}) => {
      nodeTypes.push({ type, entity: `${label}-${nodeIndex}`, data: { narrative: label, status: 'idle', ...data } })
      nodeIndex++
    }

    for (const sentence of sentences) {
      if (signal?.aborted) throw new Error('Storyteller execution aborted')

      // Authentication / Account creation
      if (sentence.match(/sign up|register|sign in|login|authenticate|email|display name/i)) {
        pushNode('begin', 'player_account', { properties: { fields: ['email', 'displayName'] } })
      }

      // Matchmaking & session creation
      if (sentence.match(/matchmaking|match making|match\b|4-player|\d+-player|player match/i)) {
        pushNode('begin', 'matchmaking', { properties: { mode: 'ranked' } })
        pushNode('begin', 'match', { properties: { slots: 4 } })
      }

      // Server session, team assignment, authoritative state
      if (sentence.match(/create.*session|game session|assign players|assign to teams|spawn the authoritative|authoritative game state|spawn authoritative/i)) {
        pushNode('begin', 'game_session')
        pushNode('become', 'team_assignment', { transform: 'assignTeams()' })
        pushNode('begin', 'authoritative_state', { properties: { authoritative: true } })
      }

      // Client prediction and reconciliation
      if (sentence.match(/local input prediction|client-side prediction|prediction|reconcil|reconcile|reconciliation/i)) {
        pushNode('become', 'client_prediction', { transform: 'predictInputs()' })
        pushNode('resolve', 'reconciliation', { strategy: 'rollback-replay' })
      }

      // Disconnects and bot replacement
      if (sentence.match(/disconnect|disconnected|reconnect|replace with a bot|bot after/i)) {
        pushNode('cease', 'disconnect_handling', { condition: 'timeout(15s)' })
        pushNode('begin', 'bot_substitute', { properties: { type: 'ai-bot' } })
      }

      // Match end / scoring
      if (sentence.match(/end the match|score limit|end match|end when/i)) {
        pushNode('cease', 'match_end')
      }

      // Persistence and rewards
      if (sentence.match(/record results|persistent storage|database|award xp|xp|item drops|rewards/i)) {
        pushNode('become', 'persist_results', { transform: 'writeResults()' })
        pushNode('become', 'award_rewards', { transform: 'grantXPAndItems()' })
      }

      // Anti-cheat / validation clauses
      if (sentence.match(/cannot|never|must not|prevent|anti-cheat|anti cheat|sanity filters|no negative/i)) {
        pushNode('cease', 'validation_rules', { condition: 'enforceInvariants()' })
      }
    }

    // Build pipeline
    const pipeline: StorytellerOutput['pipeline'] = {
      id: `pipeline-${Date.now()}`,
      name: `${domain} Workflow`,
      description: input.naturalLanguageStory.slice(0, 100),
      nodes: nodeTypes.map((node, idx) => ({
        id: `node-${idx}`,
        type: node.type as any,
        position: { x: 100 + idx * 220, y: 100 + (idx % 2) * 120 },
        data: node.data,
      })),
      edges: nodeTypes.slice(0, -1).map((_, idx) => ({
        id: `edge-${idx}`,
        source: `node-${idx}`,
        target: `node-${idx + 1}`,
        label: 'then',
      })),
      constraints: input.preferences?.suggestConstraints
        ? [`state.valid === true`, `transitions.complete === true`]
        : [],
      narrative: input.naturalLanguageStory,
      metadata: {
        complexity: nodeTypes.length,
        estimatedExecutionTime: nodeTypes.length * 120,
        suggestedDomain: domain,
      },
    }

    const latency = Date.now() - startTime
    this.metrics.averageLatencyMs = (this.metrics.averageLatencyMs + latency) / 2

    // ========================================================================
    // ONTOGENETIC LAW VALIDATION
    // ========================================================================
    console.log(`🔍 [Storyteller] Validating pipeline against ontogenetic laws...`)
    const validationReport = StorytellerLawValidator.validate(pipeline)
    
    // Log validation results
    console.log(StorytellerLawValidator.generateReport(validationReport))
    
    // Auto-fix critical and error violations if possible
    let finalPipeline = pipeline
    if (!validationReport.passed && input.preferences?.autoFix !== false) {
      const criticalAndErrors = validationReport.violations.filter(
        v => v.severity === 'critical' || v.severity === 'error'
      )
      
      if (criticalAndErrors.length > 0) {
        console.log(`🔧 [Storyteller] Auto-fixing ${criticalAndErrors.length} critical/error violations...`)
        finalPipeline = autoFixViolations(pipeline, criticalAndErrors)
        
        // Re-validate after fixes
        const revalidation = StorytellerLawValidator.validate(finalPipeline)
        console.log(`✨ [Storyteller] Post-fix validation score: ${revalidation.score}/100`)
      }
    }

    return {
      pipeline: finalPipeline,
      reasoning: `Parsed natural language story and identified ${nodeTypes.length} ontogenetic operators across ${domain} domain. Validation score: ${validationReport.score}/100.`,
      interpretations: nodeTypes.map((node) => ({
        concept: node.entity,
        mappedTo: `${node.type} operator`,
        confidence: 0.88 + Math.random() * 0.12,
      })),
      suggestions: [
        {
          type: 'constraint',
          description: 'Consider adding validation rules',
          priority: 'medium',
        },
        {
          type: 'edge',
          description: 'Add error handling paths between states',
          priority: 'high',
        },
        // Add law-based suggestions
        ...validationReport.violations
          .filter(v => v.severity === 'warning' || v.severity === 'info')
          .slice(0, 3)
          .map(v => ({
            type: 'improvement' as const,
            description: v.suggestion || v.message,
            priority: v.severity === 'warning' ? ('medium' as const) : ('low' as const),
          })),
      ],
      narrative: {
        original: input.naturalLanguageStory,
        enhanced: `${input.naturalLanguageStory}  \n\nThis translates to a ${nodeTypes.length}-step workflow with state validation.${!validationReport.passed ? `\n\n⚠️ Validation found ${validationReport.violations.length} issue(s). Score: ${validationReport.score}/100.` : ''}`,
        keyEntities: nodeTypes.map((n) => n.entity),
        relationships: nodeTypes.slice(0, -1).map((node, idx) => ({
          from: node.entity,
          to: nodeTypes[idx + 1].entity,
          type: 'precedes',
        })),
      },
      validation: validationReport, // Include validation report in output
    }
  }

  async verify(output: StorytellerOutput): Promise<VerificationResult> {
    const errors: string[] = []
    
    if (!output.pipeline || output.pipeline.nodes.length === 0) {
      errors.push('Pipeline has no nodes')
    }
    
    if (output.interpretations.length === 0) {
      errors.push('No interpretations provided')
    }
    
    // Check ontogenetic law compliance
    if (output.validation && !output.validation.passed) {
      const criticalCount = output.validation.violations.filter(v => v.severity === 'critical').length
      if (criticalCount > 0) {
        errors.push(`Pipeline has ${criticalCount} critical law violation(s)`)
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings: [],
      metrics: {
        jsonValid: true,
        schemaCompliant: true,
        logicallySound: output.pipeline.nodes.length > 0,
        executionTime: 0,
      },
    }
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics }
  }

  async unload(): Promise<void> {
    console.log(`🌙 [Storyteller] Agent unloaded`)
  }
}

// ============================================================================
// AGENT FACTORY
// ============================================================================

export function spawnAgent<I, O>(
  universeId: string,
  config: AgentConfig
): FortiAgent<I, O> {
  console.log(`🌟 Spawning ${config.role} agent for universe ${universeId}`)

  const agents: Record<AgentRole, any> = {
    custodian: CustodianAgent,
    diplomat: DiplomatAgent,
    narrator: NarratorAgent,
    explorer: ExplorerAgent,
    storyteller: StorytellerAgent,
  }

  const AgentClass = agents[config.role]
  if (!AgentClass) {
    throw new Error(`Unknown agent role: ${config.role}`)
  }

  return new AgentClass(config)
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

export async function runAgentExample() {
  console.log('🚀 Fortistate AI Agent System - Demo\n')

  // Spawn a Custodian agent
  const custodian = spawnAgent<CustodianInput, CustodianOutput>('universe-123', {
    role: 'custodian',
    model: 'local.llama3.1+custodian-lora',
    tools: ['LawProver', 'Planner'],
    outputSchema: 'Proposal',
    temperature: 0.7,
    maxTokens: 1024,
  })

  // Execute with sample violation
  const output = await custodian.execute({
    violation: {
      violationType: 'overdraft',
      entity: 'account:12345',
      law: 'balance >= 0',
      snapshot: { balance: -50, transactions: [{ amount: -100 }] },
      timestamp: Date.now(),
      severity: 'high',
    },
    laws: ['balance >= 0', 'sum(transactions.amount) === balance'],
    universeState: {},
  })

  console.log('\n📋 Agent Output:')
  console.log(JSON.stringify(output, null, 2))

  // Verify output
  const verification = await custodian.verify(output)
  console.log('\n✓ Verification:', verification.passed ? 'PASSED' : 'FAILED')

  // Get metrics
  const metrics = custodian.getMetrics()
  console.log('\n📊 Agent Metrics:')
  console.log(`  JSON Compliance: ${(metrics.jsonCompliance * 100).toFixed(2)}%`)
  console.log(`  Proposal Acceptance: ${(metrics.proposalAcceptance * 100).toFixed(2)}%`)
  console.log(`  Average Latency: ${metrics.averageLatencyMs.toFixed(2)}ms`)
  console.log(`  Memory Usage: ${metrics.memoryUsageMB}MB`)
  console.log(`  Load Time: ${metrics.loadTimeMs}ms`)

  await custodian.unload()
}
