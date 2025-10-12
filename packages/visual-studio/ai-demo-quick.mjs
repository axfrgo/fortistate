/**
 * AI Agent Demo Runner - Quick Test Script
 * 
 * Run this to see all AI agents in action with minimal output.
 */

import { spawnAgent } from './src/ai/agentRuntime.js'

console.log('\n🤖 FORTISTATE AI AGENT SYSTEM - QUICK DEMO\n')
console.log('='.repeat(60))

// ============================================================================
// DEMO 1: CUSTODIAN - Auto-Repair Bank Overdraft
// ============================================================================

async function demoCustodian() {
  console.log('\n🛡️  CUSTODIAN AGENT - Violation Auto-Repair\n')
  
  const custodian = spawnAgent('demo-universe', {
    role: 'custodian',
    model: 'local.llama3.1+custodian-lora',
    tools: ['LawProver', 'Planner'],
    outputSchema: 'Proposal'
  })

  const output = await custodian.execute({
    violation: {
      violationType: 'overdraft',
      entity: 'account:alice-123',
      law: 'balance >= 0',
      snapshot: { balance: -250, lastValidBalance: 50 },
      timestamp: Date.now(),
      severity: 'high'
    },
    laws: ['balance >= 0'],
    universeState: {}
  })

  console.log(`✅ Proposal: ${output.proposal.type}`)
  console.log(`   Confidence: ${(output.proposal.confidence * 100).toFixed(1)}%`)
  console.log(`   Reasoning: ${output.reasoning}`)

  const metrics = custodian.getMetrics()
  console.log(`\n📊 Metrics: ${(metrics.jsonCompliance * 100).toFixed(1)}% compliance, ${metrics.averageLatencyMs.toFixed(0)}ms latency`)

  await custodian.unload()
}

// ============================================================================
// DEMO 2: DIPLOMAT - Merge Two Universes
// ============================================================================

async function demoDiplomat() {
  console.log('\n🤝 DIPLOMAT AGENT - Universe Merging\n')
  
  const diplomat = spawnAgent('demo-universe', {
    role: 'diplomat',
    model: 'local.mistral+diplomat-lora',
    tools: ['TreatyValidator'],
    outputSchema: 'Treaty'
  })

  const output = await diplomat.execute({
    universeA: {
      id: 'banking-prod',
      laws: ['balance >= 0', 'daily_limit <= 5000'],
      entities: {},
      constraints: ['law_compliance'],
      invariants: ['causality'],
      substrate: 'banking'
    },
    universeB: {
      id: 'banking-staging',
      laws: ['balance >= 0', 'daily_limit <= 1000'],
      entities: {},
      constraints: ['law_compliance'],
      invariants: ['causality'],
      substrate: 'banking'
    },
    intent: 'merge'
  })

  console.log(`✅ Treaty: ${output.treaty.mergeStrategy}`)
  console.log(`   Agreements: ${output.treaty.agreements.length}`)
  console.log(`   Conflicts: ${output.treaty.conflicts.length}`)
  console.log(`   Risk: ${output.riskAssessment.estimatedComplexity}/10`)

  await diplomat.unload()
}

// ============================================================================
// DEMO 3: NARRATOR - Three Storytelling Modes
// ============================================================================

async function demoNarrator() {
  console.log('\n📖 NARRATOR AGENT - Multi-Mode Storytelling\n')
  
  const narrator = spawnAgent('demo-universe', {
    role: 'narrator',
    model: 'local.qwen+narrator-lora',
    tools: ['CausalGraphAnalyzer'],
    outputSchema: 'StoryFrames'
  })

  const events = [
    {
      id: 'event-1',
      type: 'player_joined',
      entity: 'player:alice',
      timestamp: Date.now(),
      causes: [],
      effects: ['event-2'],
      data: { username: 'alice' }
    },
    {
      id: 'event-2',
      type: 'quest_completed',
      entity: 'quest:dragon-slayer',
      timestamp: Date.now() + 1000,
      causes: ['event-1'],
      effects: [],
      data: { xpGained: 500 }
    }
  ]

  for (const mode of ['kid', 'pm', 'engineer']) {
    const output = await narrator.execute({ events, mode })
    console.log(`${mode.toUpperCase()}: ${output.story[0].text}`)
  }

  await narrator.unload()
}

// ============================================================================
// DEMO 4: EXPLORER - Paradox Resolution
// ============================================================================

async function demoExplorer() {
  console.log('\n🔬 EXPLORER AGENT - Paradox Analysis\n')
  
  const explorer = spawnAgent('demo-universe', {
    role: 'explorer',
    model: 'local.llama3.1+explorer-lora',
    tools: ['ParadoxResolver'],
    outputSchema: 'Scenarios'
  })

  const output = await explorer.execute({
    paradox: {
      id: 'time-paradox-001',
      type: 'temporal',
      description: 'Time-travel causality conflict',
      conflictingLaws: ['time.forward_only', 'time_travel.allowed'],
      affectedEntities: ['timeline:main']
    },
    universeState: {},
    explorationDepth: 3
  })

  console.log(`✅ Scenarios: ${output.scenarios.length} explored`)
  console.log(`   Stable outcomes: ${output.analysis.stableOutcomes}`)
  console.log(`   Resolutions: ${output.analysis.paradoxResolutions}`)
  console.log(`   Recommendation: ${output.recommendations[0]}`)

  await explorer.unload()
}

// ============================================================================
// RUN ALL DEMOS
// ============================================================================

async function runAll() {
  try {
    await demoCustodian()
    await demoDiplomat()
    await demoNarrator()
    await demoExplorer()
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL AGENT DEMOS COMPLETE!')
    console.log('='.repeat(60) + '\n')
  } catch (error) {
    console.error('❌ Demo failed:', error.message)
  }
}

runAll()
