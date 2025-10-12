/**
 * AI Agent Integration Example - Complete Universe Setup
 * 
 * This file demonstrates how to integrate all four AI agents into a
 * Fortistate universe for production use.
 */

import { spawnAgent, type FortiAgent } from './agentRuntime'
import type {
  CustodianInput,
  CustodianOutput,
  DiplomatInput,
  DiplomatOutput,
  NarratorInput,
  NarratorOutput,
  ExplorerInput,
  ExplorerOutput,
} from './agentTypes'

// ============================================================================
// INTELLIGENT UNIVERSE - AI-Enhanced Universe Manager
// ============================================================================

export interface IntelligentUniverseConfig {
  universeId: string
  laws: string[]
  autoRepair: boolean
  autoNarrate: boolean
  paradoxDetection: boolean
  metricsInterval: number
}

export class IntelligentUniverse {
  private config: IntelligentUniverseConfig
  private custodian!: FortiAgent<CustodianInput, CustodianOutput>
  private diplomat!: FortiAgent<DiplomatInput, DiplomatOutput>
  private narrator!: FortiAgent<NarratorInput, NarratorOutput>
  private explorer!: FortiAgent<ExplorerInput, ExplorerOutput>
  private eventLog: any[] = []
  private metricsTimer?: ReturnType<typeof setInterval>

  constructor(config: IntelligentUniverseConfig) {
    this.config = config
    this.initializeAgents()
    this.startMetricsTracking()
  }

  // ==========================================================================
  // AGENT INITIALIZATION
  // ==========================================================================

  private initializeAgents() {
    console.log(`🚀 Initializing AI agents for universe: ${this.config.universeId}`)

    // Custodian - Auto-repair violations
    this.custodian = spawnAgent(this.config.universeId, {
      role: 'custodian',
      model: 'local.llama3.1+custodian-lora',
      tools: ['LawProver', 'Planner'],
      outputSchema: 'Proposal',
      temperature: 0.3, // Low temp for deterministic repairs
      maxTokens: 512,
    })

    // Diplomat - Universe merging
    this.diplomat = spawnAgent(this.config.universeId, {
      role: 'diplomat',
      model: 'local.mistral+diplomat-lora',
      tools: ['TreatyValidator', 'ConflictResolver'],
      outputSchema: 'Treaty',
      temperature: 0.5,
      maxTokens: 1024,
    })

    // Narrator - Event storytelling
    this.narrator = spawnAgent(this.config.universeId, {
      role: 'narrator',
      model: 'local.qwen+narrator-lora',
      tools: ['CausalGraphAnalyzer'],
      outputSchema: 'StoryFrames',
      temperature: 0.7, // Higher temp for creative narratives
      maxTokens: 2048,
    })

    // Explorer - Paradox resolution
    this.explorer = spawnAgent(this.config.universeId, {
      role: 'explorer',
      model: 'local.llama3.1+explorer-lora',
      tools: ['ParadoxResolver', 'BranchSimulator'],
      outputSchema: 'Scenarios',
      temperature: 0.7,
      maxTokens: 1024,
    })

    console.log('✅ All agents initialized')
  }

  // ==========================================================================
  // CUSTODIAN - AUTO-REPAIR
  // ==========================================================================

  async handleViolation(violation: any): Promise<void> {
    console.log(`⚠️ Violation detected: ${violation.violationType}`)

    if (!this.config.autoRepair) {
      console.log('⏸️ Auto-repair disabled, logging only')
      return
    }

    try {
      const input: CustodianInput = {
        violation,
        laws: this.config.laws,
        universeState: this.getUniverseState(),
      }

      const output = await this.custodian.execute(input)

      console.log(`💡 Custodian proposal (${(output.proposal.confidence * 100).toFixed(1)}% confidence):`)
      console.log(`   ${output.reasoning}`)

      // Verify proposal
      const verification = await this.custodian.verify(output)
      if (!verification.passed) {
        console.error('❌ Proposal verification failed:', verification.errors)
        return
      }

      // Apply if confidence is high enough
      if (output.proposal.confidence > 0.85) {
        await this.applyProposal(output.proposal)
        console.log('✅ Auto-repair applied')

        // Generate narrative
        if (this.config.autoNarrate) {
          await this.narrateEvent({
            type: 'repair',
            violation,
            proposal: output.proposal,
          })
        }
      } else {
        console.warn('⚠️ Confidence too low, manual review required')
        this.notifyHuman(violation, output)
      }
    } catch (error) {
      console.error('❌ Custodian error:', error)
    }
  }

  // ==========================================================================
  // DIPLOMAT - UNIVERSE MERGING
  // ==========================================================================

  async mergeWith(otherUniverse: any): Promise<boolean> {
    console.log(`🤝 Attempting merge with universe: ${otherUniverse.id}`)

    try {
      const input: DiplomatInput = {
        universeA: this.getUniverseProfile(),
        universeB: otherUniverse.getUniverseProfile(),
        intent: 'merge',
      }

      const output = await this.diplomat.execute(input)

      console.log(`💡 Treaty proposed:`)
      console.log(`   Agreements: ${output.treaty.agreements.length}`)
      console.log(`   Conflicts: ${output.treaty.conflicts.length}`)
      console.log(`   Strategy: ${output.treaty.mergeStrategy}`)
      console.log(`   Risk: ${output.riskAssessment.estimatedComplexity}/10`)

      // Check if merge is safe
      if (output.riskAssessment.conflicts === 0 && output.riskAssessment.resolutionConfidence > 0.9) {
        await this.executeTreaty(output.treaty)
        console.log('✅ Merge successful')
        return true
      } else {
        console.warn('⚠️ Merge risky, conflicts detected:')
        output.treaty.conflicts.forEach((c: any) => {
          console.warn(`   - ${c.type}: ${c.description}`)
        })
        return false
      }
    } catch (error) {
      console.error('❌ Diplomat error:', error)
      return false
    }
  }

  // ==========================================================================
  // NARRATOR - EVENT STORYTELLING
  // ==========================================================================

  async narrateEvent(event: any, mode: 'kid' | 'pm' | 'engineer' = 'pm'): Promise<void> {
    if (!this.config.autoNarrate) return

    try {
      // Convert event to causal format
      const causalEvent = {
        id: `event-${Date.now()}`,
        type: event.type,
        entity: event.violation?.entity || 'system',
        timestamp: Date.now(),
        causes: [],
        effects: [],
        data: event,
      }

      const input: NarratorInput = {
        events: [causalEvent],
        mode,
      }

      const output = await this.narrator.execute(input)

      console.log(`📖 Story (${mode} mode):`)
      console.log(`   ${output.summary}`)
      output.story.forEach((frame: any) => {
        console.log(`   ${frame.text}`)
      })

      // Store for audit log
      this.eventLog.push({
        event: causalEvent,
        story: output,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('❌ Narrator error:', error)
    }
  }

  // ==========================================================================
  // EXPLORER - PARADOX RESOLUTION
  // ==========================================================================

  async resolveParadox(paradox: any): Promise<void> {
    if (!this.config.paradoxDetection) {
      console.log('⏸️ Paradox detection disabled')
      return
    }

    console.log(`🔬 Paradox detected: ${paradox.type}`)

    try {
      const input: ExplorerInput = {
        paradox,
        universeState: this.getUniverseState(),
        explorationDepth: 3,
      }

      const output = await this.explorer.execute(input)

      console.log(`💡 Explorer analysis:`)
      console.log(`   Scenarios explored: ${output.scenarios.length}`)
      console.log(`   Stable outcomes: ${output.analysis.stableOutcomes}`)
      console.log(`   Resolutions found: ${output.analysis.paradoxResolutions}`)

      // Find best resolution
      const stableScenario = output.scenarios.find((s: any) => s.expectedOutcomes.includes('stable'))

      if (stableScenario) {
        console.log(`✅ Stable scenario found: ${stableScenario.name}`)
        console.log(`   Interventions: ${stableScenario.interventions.length}`)

        // Apply recommendations
        output.recommendations.forEach((rec: any, i: number) => {
          console.log(`   ${i + 1}. ${rec}`)
        })

        await this.applyScenario(stableScenario)
      } else {
        console.warn('⚠️ No stable resolution found, creating timeline fork')
        await this.forkUniverse(paradox)
      }
    } catch (error) {
      console.error('❌ Explorer error:', error)
    }
  }

  // ==========================================================================
  // METRICS TRACKING
  // ==========================================================================

  private startMetricsTracking() {
    this.metricsTimer = setInterval(() => {
      this.reportMetrics()
    }, this.config.metricsInterval)
  }

  private reportMetrics() {
    console.log('\n📊 AI Agent Metrics:')

    const custodianMetrics = this.custodian.getMetrics()
    console.log('  Custodian:')
    console.log(`    JSON Compliance: ${(custodianMetrics.jsonCompliance * 100).toFixed(2)}%`)
    console.log(`    Acceptance Rate: ${(custodianMetrics.proposalAcceptance * 100).toFixed(2)}%`)
    console.log(`    Avg Latency: ${custodianMetrics.averageLatencyMs.toFixed(2)}ms`)
    console.log(`    Memory: ${custodianMetrics.memoryUsageMB}MB`)

    // Check thresholds
    if (custodianMetrics.jsonCompliance < 0.98) {
      console.warn('  ⚠️ JSON compliance below target (98%)')
    }
    if (custodianMetrics.proposalAcceptance < 0.85) {
      console.warn('  ⚠️ Acceptance rate below target (85%)')
    }
    if (custodianMetrics.averageLatencyMs > 200) {
      console.warn('  ⚠️ Latency above threshold (200ms)')
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private getUniverseState(): Record<string, unknown> {
    return {
      id: this.config.universeId,
      laws: this.config.laws,
      timestamp: Date.now(),
    }
  }

  private getUniverseProfile(): any {
    return {
      id: this.config.universeId,
      laws: this.config.laws,
      entities: {},
      constraints: ['law_compliance', 'data_integrity'],
      invariants: ['monotonic_time', 'causality'],
      substrate: 'custom',
    }
  }

  private async applyProposal(proposal: any): Promise<void> {
    console.log(`🔧 Applying proposal: ${proposal.id}`)
    // In production, apply repair steps to actual universe
  }

  private async executeTreaty(treaty: any): Promise<void> {
    console.log(`🤝 Executing treaty: ${treaty.id}`)
    // In production, merge universes according to treaty
  }

  private async applyScenario(scenario: any): Promise<void> {
    console.log(`🔬 Applying scenario: ${scenario.id}`)
    // In production, apply interventions to resolve paradox
  }

  private async forkUniverse(paradox: any): Promise<void> {
    console.log(`🌿 Forking universe due to paradox: ${paradox.id}`)
    // In production, create timeline fork
  }

  private notifyHuman(_violation: any, _proposal: any): void {
    console.log('📧 Notifying human operator for review')
    // In production, send notification to operators
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down AI agents...')
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
    }
    await Promise.all([
      this.custodian.unload(),
      this.diplomat.unload(),
      this.narrator.unload(),
      this.explorer.unload(),
    ])
    console.log('✅ All agents unloaded')
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

export async function createIntelligentUniverse(config: IntelligentUniverseConfig) {
  const universe = new IntelligentUniverse(config)

  // Simulate some events
  console.log('\n🎬 Simulating universe events...\n')

  // 1. Violation detection
  await universe.handleViolation({
    violationType: 'overdraft',
    entity: 'account:alice-123',
    law: 'balance >= 0',
    snapshot: { balance: -100 },
    timestamp: Date.now(),
    severity: 'high',
  })

  // 2. Narrate recent events
  await universe.narrateEvent(
    {
      type: 'user_action',
      entity: 'user:alice',
      action: 'transfer',
    },
    'pm'
  )

  // 3. Paradox resolution
  await universe.resolveParadox({
    id: 'paradox-001',
    type: 'temporal',
    description: 'Time-travel causality conflict',
    conflictingLaws: ['time.forward_only', 'time_travel.allowed'],
    affectedEntities: ['timeline:main'],
  })

  return universe
}

// Run demo
if (typeof window === 'undefined') {
  createIntelligentUniverse({
    universeId: 'production-001',
    laws: ['balance >= 0', 'transactions.atomic', 'causality.preserved'],
    autoRepair: true,
    autoNarrate: true,
    paradoxDetection: true,
    metricsInterval: 60000, // 1 minute
  }).then((universe) => {
    console.log('\n✅ Intelligent universe running!')
    console.log('Universe instance:', universe)
  })
}
