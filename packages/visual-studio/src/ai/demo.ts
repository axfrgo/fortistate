/**
 * AI Agent Demo Examples
 * 
 * Run this file to see all four agents in action.
 */

import { spawnAgent } from './agentRuntime'
import { runTrainingPipeline } from './trainingPipeline'
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
// DEMO 1: CUSTODIAN - Violation Detection and Repair
// ============================================================================

async function demoCustodian() {
  console.log('\n' + '='.repeat(80))
  console.log('🛡️  DEMO 1: CUSTODIAN AGENT - Constraint Monitoring')
  console.log('='.repeat(80) + '\n')

  const custodian = spawnAgent<CustodianInput, CustodianOutput>('banking-universe', {
    role: 'custodian',
    model: 'local.llama3.1+custodian-lora',
    tools: ['LawProver', 'Planner'],
    outputSchema: 'Proposal',
    temperature: 0.7,
    maxTokens: 1024,
  })

  const violation: CustodianInput = {
    violation: {
      violationType: 'overdraft',
      entity: 'account:alice-123',
      law: 'balance >= 0',
      snapshot: {
        balance: -250,
        transactions: [
          { id: 'tx-1', amount: -100, timestamp: Date.now() - 2000 },
          { id: 'tx-2', amount: -150, timestamp: Date.now() - 1000 },
        ],
        lastValidBalance: 50,
      },
      timestamp: Date.now(),
      severity: 'high',
    },
    laws: [
      'balance >= 0',
      'sum(transactions.amount) === balance',
      'transactions.sorted_by(timestamp)',
    ],
    universeState: {
      accounts: { 'alice-123': { balance: -250 } },
      totalAccounts: 1000,
    },
  }

  console.log('📋 Input Violation:')
  console.log(JSON.stringify(violation, null, 2))

  const output = await custodian.execute(violation)

  console.log('\n💡 Custodian Proposal:')
  console.log(JSON.stringify(output, null, 2))

  const verification = await custodian.verify(output)
  console.log('\n✅ Verification:', verification.passed ? 'PASSED' : 'FAILED')

  const metrics = custodian.getMetrics()
  console.log('\n📊 Performance Metrics:')
  console.log(`  JSON Compliance: ${(metrics.jsonCompliance * 100).toFixed(2)}%`)
  console.log(`  Proposal Acceptance: ${(metrics.proposalAcceptance * 100).toFixed(2)}%`)
  console.log(`  Latency: ${metrics.averageLatencyMs.toFixed(2)}ms`)
  console.log(`  Memory: ${metrics.memoryUsageMB}MB`)

  await custodian.unload()
}

// ============================================================================
// DEMO 2: DIPLOMAT - Universe Treaty Negotiation
// ============================================================================

async function demoDiplomat() {
  console.log('\n' + '='.repeat(80))
  console.log('🤝 DEMO 2: DIPLOMAT AGENT - Universe Merging')
  console.log('='.repeat(80) + '\n')

  const diplomat = spawnAgent<DiplomatInput, DiplomatOutput>('multiverse', {
    role: 'diplomat',
    model: 'local.mistral+diplomat-lora',
    tools: ['TreatyValidator', 'ConflictResolver'],
    outputSchema: 'Treaty',
  })

  const input: DiplomatInput = {
    universeA: {
      id: 'banking-prod',
      laws: ['balance >= 0', 'transactions.atomic', 'daily_limit <= 5000'],
      entities: { accounts: 10000, transactions: 50000 },
      constraints: ['law_compliance', 'data_integrity'],
      invariants: ['monotonic_time', 'causality', 'double_entry_bookkeeping'],
      substrate: 'banking',
    },
    universeB: {
      id: 'banking-staging',
      laws: ['balance >= 0', 'transactions.atomic', 'daily_limit <= 1000'], // Different limit
      entities: { accounts: 500, transactions: 2000 },
      constraints: ['law_compliance', 'data_integrity'],
      invariants: ['monotonic_time', 'causality', 'double_entry_bookkeeping'],
      substrate: 'banking',
    },
    intent: 'merge',
  }

  console.log('📋 Input Universes:')
  console.log(`  Universe A: ${input.universeA.id} (${input.universeA.entities.accounts} accounts)`)
  console.log(`  Universe B: ${input.universeB.id} (${input.universeB.entities.accounts} accounts)`)
  console.log(`  Intent: ${input.intent}`)

  const output = await diplomat.execute(input)

  console.log('\n💡 Treaty Proposal:')
  console.log(JSON.stringify(output, null, 2))

  console.log('\n⚠️  Risk Assessment:')
  console.log(`  Conflicts: ${output.riskAssessment.conflicts}`)
  console.log(`  Resolution Confidence: ${(output.riskAssessment.resolutionConfidence * 100).toFixed(2)}%`)
  console.log(`  Complexity: ${output.riskAssessment.estimatedComplexity}/10`)

  await diplomat.unload()
}

// ============================================================================
// DEMO 3: NARRATOR - Causal History Storytelling
// ============================================================================

async function demoNarrator() {
  console.log('\n' + '='.repeat(80))
  console.log('📖 DEMO 3: NARRATOR AGENT - Causal Storytelling')
  console.log('='.repeat(80) + '\n')

  const narrator = spawnAgent<NarratorInput, NarratorOutput>('game-universe', {
    role: 'narrator',
    model: 'local.qwen+narrator-lora',
    tools: ['CausalGraphAnalyzer'],
    outputSchema: 'StoryFrames',
  })

  const events = [
    {
      id: 'event-1',
      type: 'player_joined',
      entity: 'player:alice',
      timestamp: Date.now() - 5000,
      causes: [],
      effects: ['event-2'],
      data: { username: 'alice', level: 1 },
    },
    {
      id: 'event-2',
      type: 'quest_started',
      entity: 'quest:dragon-slayer',
      timestamp: Date.now() - 4000,
      causes: ['event-1'],
      effects: ['event-3', 'event-4'],
      data: { questId: 'dragon-slayer', difficulty: 'hard' },
    },
    {
      id: 'event-3',
      type: 'item_acquired',
      entity: 'item:magic-sword',
      timestamp: Date.now() - 3000,
      causes: ['event-2'],
      effects: ['event-5'],
      data: { itemId: 'magic-sword', rarity: 'legendary' },
    },
    {
      id: 'event-4',
      type: 'enemy_encountered',
      entity: 'enemy:dragon',
      timestamp: Date.now() - 2000,
      causes: ['event-2'],
      effects: ['event-5'],
      data: { enemyId: 'dragon', health: 1000 },
    },
    {
      id: 'event-5',
      type: 'battle_won',
      entity: 'player:alice',
      timestamp: Date.now() - 1000,
      causes: ['event-3', 'event-4'],
      effects: [],
      data: { xpGained: 500, levelUp: true },
    },
  ]

  // Generate stories in all three modes
  for (const mode of ['kid', 'pm', 'engineer'] as const) {
    console.log(`\n📚 ${mode.toUpperCase()} MODE:`)
    console.log('-'.repeat(80))

    const input: NarratorInput = {
      events,
      mode,
      focusEntity: 'player:alice',
    }

    const output = await narrator.execute(input)

    console.log(`\n${output.summary}`)
    console.log('\nStory:')
    output.story.forEach((frame, i) => {
      console.log(`  ${i + 1}. ${frame.text}`)
    })

    console.log('\nKey Insights:')
    output.keyInsights.forEach((insight) => {
      console.log(`  • ${insight}`)
    })
  }

  await narrator.unload()
}

// ============================================================================
// DEMO 4: EXPLORER - Paradox Resolution
// ============================================================================

async function demoExplorer() {
  console.log('\n' + '='.repeat(80))
  console.log('🔬 DEMO 4: EXPLORER AGENT - Paradox Analysis')
  console.log('='.repeat(80) + '\n')

  const explorer = spawnAgent<ExplorerInput, ExplorerOutput>('temporal-universe', {
    role: 'explorer',
    model: 'local.llama3.1+explorer-lora',
    tools: ['ParadoxResolver', 'BranchSimulator'],
    outputSchema: 'Scenarios',
  })

  const input: ExplorerInput = {
    paradox: {
      id: 'grandfather-paradox-001',
      type: 'temporal',
      description: 'User attempts to travel back in time and modify a transaction that would prevent their account creation',
      conflictingLaws: [
        'time.forward_only',
        'time_travel.allowed_within_universe',
        'causality.must_be_preserved',
      ],
      affectedEntities: ['account:alice-123', 'transaction:tx-create-account', 'timeline:main'],
    },
    universeState: {
      timeline: 'main',
      currentTimestamp: Date.now(),
      accounts: { 'alice-123': { created: Date.now() - 10000, balance: 1000 } },
    },
    explorationDepth: 3,
  }

  console.log('📋 Paradox:')
  console.log(`  Type: ${input.paradox.type}`)
  console.log(`  Description: ${input.paradox.description}`)
  console.log(`  Conflicting Laws: ${input.paradox.conflictingLaws.join(', ')}`)

  const output = await explorer.execute(input)

  console.log('\n💡 Exploration Results:')
  console.log(`\nFound ${output.scenarios.length} possible scenarios:\n`)

  output.scenarios.forEach((scenario, i) => {
    console.log(`${i + 1}. ${scenario.name}`)
    console.log(`   Interventions: ${scenario.interventions.length}`)
    console.log(`   Expected Outcomes: ${scenario.expectedOutcomes.join(', ')}`)
  })

  console.log('\n📊 Analysis:')
  console.log(`  Stable Outcomes: ${output.analysis.stableOutcomes}`)
  console.log(`  Paradox Resolutions: ${output.analysis.paradoxResolutions}`)
  console.log(`  Emergent Behaviors: ${output.analysis.emergentBehaviors.join(', ')}`)

  console.log('\n💡 Recommendations:')
  output.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`)
  })

  await explorer.unload()
}

// ============================================================================
// DEMO 5: DATASET GENERATION
// ============================================================================

async function demoDatasetGeneration() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 DEMO 5: DATASET GENERATION')
  console.log('='.repeat(80) + '\n')

  console.log('Generating synthetic datasets for all agents...')
  console.log('(Using reduced sizes for demo: 100 samples per agent)\n')

  const datasets = {
    custodian: await import('./datasetGenerator').then((m) =>
      m.generateCustodianDataset({
        role: 'custodian',
        targetSize: 100,
        templates: ['banking', 'social'],
        outputPath: './datasets/custodian-demo.jsonl',
      })
    ),
    diplomat: await import('./datasetGenerator').then((m) =>
      m.generateDiplomatDataset({
        role: 'diplomat',
        targetSize: 100,
        templates: ['banking', 'social'],
        outputPath: './datasets/diplomat-demo.jsonl',
      })
    ),
    narrator: await import('./datasetGenerator').then((m) =>
      m.generateNarratorDataset({
        role: 'narrator',
        targetSize: 100,
        templates: ['game', 'workflow'],
        outputPath: './datasets/narrator-demo.jsonl',
      })
    ),
    explorer: await import('./datasetGenerator').then((m) =>
      m.generateExplorerDataset({
        role: 'explorer',
        targetSize: 100,
        templates: ['physics'],
        outputPath: './datasets/explorer-demo.jsonl',
      })
    ),
  }

  console.log('\n✅ Dataset Generation Complete!')
  console.log(`  Custodian: ${datasets.custodian.length} samples`)
  console.log(`  Diplomat: ${datasets.diplomat.length} samples`)
  console.log(`  Narrator: ${datasets.narrator.length} samples`)
  console.log(`  Explorer: ${datasets.explorer.length} samples`)
  console.log(`  Total: ${Object.values(datasets).reduce((sum, d) => sum + d.length, 0)} samples`)
}

// ============================================================================
// DEMO 6: TRAINING PIPELINE
// ============================================================================

async function demoTrainingPipeline() {
  console.log('\n' + '='.repeat(80))
  console.log('🎓 DEMO 6: TRAINING PIPELINE')
  console.log('='.repeat(80) + '\n')

  // Generate small dataset for demo
  const samples = await import('./datasetGenerator').then((m) =>
    m.generateCustodianDataset({
      role: 'custodian',
      targetSize: 50,
      templates: ['banking'],
      outputPath: './datasets/training-demo.jsonl',
    })
  )

  console.log('\nRunning three-stage training pipeline...\n')

  const model = await runTrainingPipeline('custodian', samples)

  console.log('\n✅ Training Complete!')
  console.log(`  Model: ${model.name}`)
  console.log(`  Memory: ${model.maxMemoryMB}MB`)
  console.log(`  Load Time: ${model.loadTimeMs}ms`)
}

// ============================================================================
// MAIN DEMO RUNNER
// ============================================================================

async function runAllDemos() {
  console.log('🚀 FORTISTATE AI AGENT SYSTEM - COMPLETE DEMO')
  console.log('='.repeat(80))

  try {
    await demoCustodian()
    await demoDiplomat()
    await demoNarrator()
    await demoExplorer()
    await demoDatasetGeneration()
    await demoTrainingPipeline()

    console.log('\n' + '='.repeat(80))
    console.log('🎉 ALL DEMOS COMPLETE!')
    console.log('='.repeat(80))
  } catch (error) {
    console.error('❌ Demo failed:', error)
  }
}

// Export for use in other modules
export {
  demoCustodian,
  demoDiplomat,
  demoNarrator,
  demoExplorer,
  demoDatasetGeneration,
  demoTrainingPipeline,
  runAllDemos,
}
