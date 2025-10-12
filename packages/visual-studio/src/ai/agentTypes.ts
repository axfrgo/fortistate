/**
 * AI Agent System - Type Definitions
 * 
 * Specialized AI agents trained on Fortistate-specific reasoning tasks.
 * Supports local deployment with LoRA adapters for modularity.
 */

// ============================================================================
// AGENT ROLES
// ============================================================================

export type AgentRole = 'custodian' | 'diplomat' | 'narrator' | 'explorer' | 'storyteller'

export interface AgentConfig {
  role: AgentRole
  model: string // e.g., "local.llama3.1+custodian-lora"
  tools: string[] // e.g., ["LawProver", "Planner"]
  outputSchema: string // e.g., "Proposal", "Treaty", "StoryFrames"
  temperature?: number
  maxTokens?: number
  loraPath?: string
}

// ============================================================================
// CUSTODIAN AI - Constraint Monitoring + Repair Proposals
// ============================================================================

export interface ViolationContext {
  violationType: string
  entity: string
  law: string
  snapshot: Record<string, unknown>
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface RepairProposal {
  id: string
  type: 'rollback' | 'patch' | 'compensate' | 'fork'
  steps: RepairStep[]
  proof: string
  confidence: number
  estimatedCost: number
}

export interface RepairStep {
  action: string
  target: string
  params: Record<string, unknown>
  preconditions: string[]
  postconditions: string[]
}

export interface CustodianInput {
  violation: ViolationContext
  laws: string[]
  universeState: Record<string, unknown>
}

export interface CustodianOutput {
  proposal: RepairProposal
  reasoning: string
  alternatives: RepairProposal[]
}

// ============================================================================
// DIPLOMAT AI - Universe-to-Universe Treaty Merges
// ============================================================================

export interface UniverseProfile {
  id: string
  laws: string[]
  entities: Record<string, unknown>
  constraints: string[]
  invariants: string[]
  substrate: string // 'banking' | 'social' | 'game' | 'physics' | 'workflow'
}

export interface Treaty {
  id: string
  universeA: string
  universeB: string
  agreements: Agreement[]
  conflicts: Conflict[]
  mergeStrategy: 'federation' | 'unification' | 'bridge' | 'hierarchical'
  proof: string
}

export interface Agreement {
  type: 'shared_law' | 'entity_mapping' | 'event_sync' | 'invariant_alignment'
  description: string
  implementation: string[]
}

export interface Conflict {
  type: 'law_contradiction' | 'entity_collision' | 'invariant_mismatch'
  description: string
  resolution: string
  confidence: number
}

export interface DiplomatInput {
  universeA: UniverseProfile
  universeB: UniverseProfile
  intent: 'merge' | 'collaborate' | 'observe'
}

export interface DiplomatOutput {
  treaty: Treaty
  reasoning: string
  riskAssessment: {
    conflicts: number
    resolutionConfidence: number
    estimatedComplexity: number
  }
}

// ============================================================================
// NARRATOR AI - Causal History → Natural Language Stories
// ============================================================================

export type NarrativeMode = 'kid' | 'pm' | 'engineer'

export interface CausalEvent {
  id: string
  type: string
  entity: string
  timestamp: number
  causes: string[] // IDs of causal events
  effects: string[] // IDs of effect events
  data: Record<string, unknown>
}

export interface StoryFrame {
  timestamp: number
  speaker: string
  text: string
  context: Record<string, unknown>
  causalLinks: string[]
}

export interface NarratorInput {
  events: CausalEvent[]
  mode: NarrativeMode
  focusEntity?: string
  timeRange?: { start: number; end: number }
}

export interface NarratorOutput {
  story: StoryFrame[]
  summary: string
  keyInsights: string[]
  causalChains: Array<{
    trigger: string
    chain: string[]
    outcome: string
  }>
}

// ============================================================================
// EXPLORER AI - Paradox Sandbox Experiments
// ============================================================================

export interface ParadoxZone {
  id: string
  type: 'temporal' | 'logical' | 'quantum' | 'causal'
  description: string
  conflictingLaws: string[]
  affectedEntities: string[]
}

export interface ForkScenario {
  id: string
  name: string
  initialState: Record<string, unknown>
  interventions: Intervention[]
  expectedOutcomes: string[]
}

export interface Intervention {
  time: number
  action: string
  target: string
  params: Record<string, unknown>
}

export interface ExplorerInput {
  paradox: ParadoxZone
  universeState: Record<string, unknown>
  explorationDepth: number
}

export interface ExplorerOutput {
  scenarios: ForkScenario[]
  analysis: {
    stableOutcomes: number
    paradoxResolutions: number
    emergentBehaviors: string[]
  }
  recommendations: string[]
}

// ============================================================================
// STORYTELLER AI - Natural Language → Universe Pipeline Translation
// ============================================================================

export interface StorytellerInput {
  naturalLanguageStory: string
  context?: {
    existingNodes?: Array<{ id: string; type: string; data: Record<string, unknown> }>
    existingEdges?: Array<{ id: string; source: string; target: string }>
    domain?: 'banking' | 'social' | 'game' | 'physics' | 'workflow' | 'generic'
  }
  userIntent?: 'create' | 'extend' | 'refine' | 'explore'
  preferences?: {
    verbosity?: 'minimal' | 'balanced' | 'detailed'
    autoConnect?: boolean
    suggestConstraints?: boolean
    autoFix?: boolean
  }
}

export interface UniversePipeline {
  id: string
  name: string
  description: string
  nodes: Array<{
    id: string
    type: 'begin' | 'become' | 'cease' | 'transcend' | 'resolve'
    position: { x: number; y: number }
    data: Record<string, unknown>
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    label?: string
  }>
  constraints: string[]
  narrative: string
  metadata: {
    complexity: number
    estimatedExecutionTime: number
    suggestedDomain: string
  }
}

export interface StorytellerOutput {
  pipeline: UniversePipeline
  reasoning: string
  interpretations: Array<{
    concept: string
    mappedTo: string
    confidence: number
  }>
  suggestions: Array<{
    type: 'constraint' | 'node' | 'edge' | 'refinement' | 'improvement'
    description: string
    priority: 'low' | 'medium' | 'high'
  }>
  narrative: {
    original: string
    enhanced: string
    keyEntities: string[]
    relationships: Array<{ from: string; to: string; type: string }>
  }
  validation?: {
    passed: boolean
    score: number
    violations: Array<{
      lawId: string
      severity: 'critical' | 'error' | 'warning' | 'info'
      message: string
      nodeId?: string
      edgeId?: string
      suggestion?: string
    }>
    warnings: string[]
    metrics: {
      totalLaws: number
      passed: number
      failed: number
      criticalViolations: number
      errorViolations: number
      warningViolations: number
    }
  }
}

// ============================================================================
// TRAINING DATA STRUCTURES
// ============================================================================

export interface TrainingSample<I, O> {
  id: string
  input: I
  output: O
  metadata: {
    substrate: string
    complexity: number
    verificationPassed: boolean
    generatedAt: number
  }
}

export type CustodianSample = TrainingSample<CustodianInput, CustodianOutput>
export type DiplomatSample = TrainingSample<DiplomatInput, DiplomatOutput>
export type NarratorSample = TrainingSample<NarratorInput, NarratorOutput>
export type ExplorerSample = TrainingSample<ExplorerInput, ExplorerOutput>
export type StorytellerSample = TrainingSample<StorytellerInput, StorytellerOutput>

// ============================================================================
// MODEL SPECIFICATIONS
// ============================================================================

export interface ModelSpec {
  name: string
  baseModel: 'llama3.1' | 'mistral' | 'qwen' | 'gemma'
  size: '7B' | '8B' | '13B' | '70B'
  loraConfig: {
    rank: number
    alpha: number
    dropout: number
    targetModules: string[]
  }
  quantization?: '4bit' | '8bit' | 'none'
  maxMemoryMB: number
  loadTimeMs: number
}

export interface AgentMetrics {
  jsonCompliance: number // Target: 98%+
  proposalAcceptance: number // Target: 85%+
  averageLatencyMs: number
  memoryUsageMB: number
  loadTimeMs: number
}

// ============================================================================
// DATASET GENERATION CONFIG
// ============================================================================

export interface DatasetConfig {
  role: AgentRole
  targetSize: number
  templates: string[]
  violationTypes?: string[]
  complexityRange?: [number, number]
  outputPath: string
}

export const DATASET_TARGETS = {
  custodian: 200_000,
  diplomat: 50_000,
  narrator: 100_000,
  explorer: 25_000,
  storyteller: 150_000,
} as const

// ============================================================================
// VERIFICATION TOOLS
// ============================================================================

export interface VerificationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  metrics: {
    jsonValid: boolean
    schemaCompliant: boolean
    logicallySound: boolean
    executionTime: number
  }
}

export interface LawProver {
  verify(proposal: RepairProposal, laws: string[]): VerificationResult
  generateProof(proposal: RepairProposal): string
}

export interface Simulator {
  simulate(state: Record<string, unknown>, actions: RepairStep[]): {
    finalState: Record<string, unknown>
    violations: ViolationContext[]
    success: boolean
  }
}
