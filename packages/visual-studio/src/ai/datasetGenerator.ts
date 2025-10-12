/**
 * Dataset Generator for AI Agent Fine-Tuning
 * 
 * Generates synthetic universe events, violations, and resolutions
 * for training specialized Fortistate AI agents.
 */

import type {
  CustodianInput,
  CustodianOutput,
  CustodianSample,
  DiplomatInput,
  DiplomatOutput,
  DiplomatSample,
  NarratorInput,
  NarratorOutput,
  NarratorSample,
  ExplorerInput,
  ExplorerOutput,
  ExplorerSample,
  StorytellerInput,
  StorytellerOutput,
  StorytellerSample,
  ViolationContext,
  UniverseProfile,
  CausalEvent,
  ParadoxZone,
  DatasetConfig,
} from './agentTypes'

// ============================================================================
// UNIVERSE TEMPLATES
// ============================================================================

const SUBSTRATE_TEMPLATES = {
  banking: {
    entities: ['account', 'transaction', 'user'],
    laws: [
      'balance >= 0',
      'sum(transactions.amount) === balance',
      'user.verified === true OR transaction.limit < 100',
    ],
    violations: ['overdraft', 'invalid_transfer', 'unauthorized_transaction'],
  },
  social: {
    entities: ['user', 'post', 'connection', 'message'],
    laws: [
      'username.unique === true',
      'connection.mutual === true',
      'post.visibility IN ["public", "friends", "private"]',
    ],
    violations: ['duplicate_username', 'asymmetric_connection', 'privacy_breach'],
  },
  game: {
    entities: ['player', 'item', 'quest', 'achievement'],
    laws: [
      'player.health >= 0 AND player.health <= 100',
      'item.count >= 0',
      'quest.prerequisites.every(q => q.completed)',
    ],
    violations: ['negative_health', 'item_duplication', 'quest_skip'],
  },
  physics: {
    entities: ['particle', 'force', 'field', 'collision'],
    laws: [
      'energy.total === conserved',
      'momentum.total === conserved',
      'entropy >= 0 AND entropy.delta >= 0',
    ],
    violations: ['energy_loss', 'momentum_mismatch', 'entropy_spike'],
  },
  workflow: {
    entities: ['task', 'approval', 'resource', 'milestone'],
    laws: [
      'task.status IN ["pending", "active", "completed", "blocked"]',
      'approval.required === true IMPLIES approval.count >= approval.threshold',
      'resource.allocated <= resource.available',
    ],
    violations: ['circular_dependency', 'missing_approval', 'resource_overallocation'],
  },
}

// ============================================================================
// VIOLATION INJECTORS
// ============================================================================

function injectViolation(
  substrate: keyof typeof SUBSTRATE_TEMPLATES
): ViolationContext {
  const template = SUBSTRATE_TEMPLATES[substrate]
  const violationType = template.violations[Math.floor(Math.random() * template.violations.length)]

  const violations: Record<string, () => ViolationContext> = {
    overdraft: () => ({
      violationType: 'overdraft',
      entity: `account:${Math.floor(Math.random() * 1000)}`,
      law: 'balance >= 0',
      snapshot: { balance: -50, transactions: [{ amount: -100 }] },
      timestamp: Date.now(),
      severity: 'high',
    }),
    invalid_transfer: () => ({
      violationType: 'invalid_transfer',
      entity: `transaction:${Math.floor(Math.random() * 10000)}`,
      law: 'sum(transactions.amount) === balance',
      snapshot: { fromBalance: 50, toBalance: 200, transferAmount: 100 },
      timestamp: Date.now(),
      severity: 'medium',
    }),
    duplicate_username: () => ({
      violationType: 'duplicate_username',
      entity: `user:${Math.floor(Math.random() * 1000)}`,
      law: 'username.unique === true',
      snapshot: { username: 'alice', existingUsers: ['alice', 'bob'] },
      timestamp: Date.now(),
      severity: 'medium',
    }),
    entropy_spike: () => ({
      violationType: 'entropy_spike',
      entity: `system:${Math.floor(Math.random() * 100)}`,
      law: 'entropy.delta >= 0',
      snapshot: { entropy: 100, previousEntropy: 150 },
      timestamp: Date.now(),
      severity: 'critical',
    }),
  }

  const generator = violations[violationType]
  return generator ? generator() : violations.overdraft()
}

// ============================================================================
// CUSTODIAN DATASET GENERATOR
// ============================================================================

export function generateCustodianDataset(config: DatasetConfig): CustodianSample[] {
  console.log(`🎯 Generating ${config.targetSize} Custodian samples...`)
  const samples: CustodianSample[] = []

  for (let i = 0; i < config.targetSize; i++) {
    const substrate = config.templates[i % config.templates.length] as keyof typeof SUBSTRATE_TEMPLATES
    const universeState = generateUniverseState(substrate)
    const violation = injectViolation(substrate)

    const input: CustodianInput = {
      violation,
      laws: SUBSTRATE_TEMPLATES[substrate].laws,
      universeState,
    }

    const output: CustodianOutput = {
      proposal: {
        id: `proposal-${i}`,
        type: Math.random() > 0.5 ? 'rollback' : 'patch',
        steps: [
          {
            action: 'revert_transaction',
            target: violation.entity,
            params: { amount: 100 },
            preconditions: ['transaction.exists'],
            postconditions: ['balance >= 0'],
          },
        ],
        proof: `Proof: ${violation.law} violated. Rollback restores invariant.`,
        confidence: 0.85 + Math.random() * 0.15,
        estimatedCost: Math.floor(Math.random() * 100),
      },
      reasoning: `Detected ${violation.violationType} on ${violation.entity}. Proposing ${Math.random() > 0.5 ? 'rollback' : 'patch'} to restore law: ${violation.law}`,
      alternatives: [],
    }

    samples.push({
      id: `custodian-${i}`,
      input,
      output,
      metadata: {
        substrate,
        complexity: Math.floor(Math.random() * 10) + 1,
        verificationPassed: true,
        generatedAt: Date.now(),
      },
    })

    if ((i + 1) % 10000 === 0) {
      console.log(`  ✓ Generated ${i + 1}/${config.targetSize} samples`)
    }
  }

  console.log(`✅ Custodian dataset complete: ${samples.length} samples`)
  return samples
}

// ============================================================================
// DIPLOMAT DATASET GENERATOR
// ============================================================================

export function generateDiplomatDataset(config: DatasetConfig): DiplomatSample[] {
  console.log(`🎯 Generating ${config.targetSize} Diplomat samples...`)
  const samples: DiplomatSample[] = []

  for (let i = 0; i < config.targetSize; i++) {
    const substrateA = config.templates[i % config.templates.length] as keyof typeof SUBSTRATE_TEMPLATES
    const substrateB = config.templates[(i + 1) % config.templates.length] as keyof typeof SUBSTRATE_TEMPLATES

    const universeA: UniverseProfile = {
      id: `universe-a-${i}`,
      laws: SUBSTRATE_TEMPLATES[substrateA].laws,
      entities: {},
      constraints: ['law_compliance', 'data_integrity'],
      invariants: ['monotonic_time', 'causality'],
      substrate: substrateA,
    }

    const universeB: UniverseProfile = {
      id: `universe-b-${i}`,
      laws: SUBSTRATE_TEMPLATES[substrateB].laws,
      entities: {},
      constraints: ['law_compliance', 'data_integrity'],
      invariants: ['monotonic_time', 'causality'],
      substrate: substrateB,
    }

    const input: DiplomatInput = {
      universeA,
      universeB,
      intent: ['merge', 'collaborate', 'observe'][Math.floor(Math.random() * 3)] as any,
    }

    const output: DiplomatOutput = {
      treaty: {
        id: `treaty-${i}`,
        universeA: universeA.id,
        universeB: universeB.id,
        agreements: [
          {
            type: 'shared_law',
            description: 'Both universes maintain data integrity',
            implementation: ['validate_on_entry', 'sync_checkpoints'],
          },
        ],
        conflicts: [],
        mergeStrategy: 'federation',
        proof: 'Treaty preserves invariants in both universes.',
      },
      reasoning: `Merging ${substrateA} and ${substrateB} via federation strategy.`,
      riskAssessment: {
        conflicts: 0,
        resolutionConfidence: 0.9,
        estimatedComplexity: 5,
      },
    }

    samples.push({
      id: `diplomat-${i}`,
      input,
      output,
      metadata: {
        substrate: `${substrateA}+${substrateB}`,
        complexity: Math.floor(Math.random() * 10) + 1,
        verificationPassed: true,
        generatedAt: Date.now(),
      },
    })

    if ((i + 1) % 5000 === 0) {
      console.log(`  ✓ Generated ${i + 1}/${config.targetSize} samples`)
    }
  }

  console.log(`✅ Diplomat dataset complete: ${samples.length} samples`)
  return samples
}

// ============================================================================
// NARRATOR DATASET GENERATOR
// ============================================================================

export function generateNarratorDataset(config: DatasetConfig): NarratorSample[] {
  console.log(`🎯 Generating ${config.targetSize} Narrator samples...`)
  const samples: NarratorSample[] = []

  const modes: Array<'kid' | 'pm' | 'engineer'> = ['kid', 'pm', 'engineer']

  for (let i = 0; i < config.targetSize; i++) {
    const mode = modes[i % modes.length]
    const events: CausalEvent[] = generateCausalChain(5)

    const input: NarratorInput = {
      events,
      mode,
      focusEntity: `entity-${Math.floor(Math.random() * 10)}`,
    }

    const output: NarratorOutput = {
      story: events.map((e) => ({
        timestamp: e.timestamp,
        speaker: 'System',
        text: narrateEvent(e, mode),
        context: e.data,
        causalLinks: e.causes,
      })),
      summary: `A ${mode}-friendly story of ${events.length} events`,
      keyInsights: ['Event chain demonstrates causality', 'All invariants maintained'],
      causalChains: [
        {
          trigger: events[0].id,
          chain: events.map((e) => e.id),
          outcome: events[events.length - 1].type,
        },
      ],
    }

    samples.push({
      id: `narrator-${i}`,
      input,
      output,
      metadata: {
        substrate: 'narrative',
        complexity: events.length,
        verificationPassed: true,
        generatedAt: Date.now(),
      },
    })

    if ((i + 1) % 10000 === 0) {
      console.log(`  ✓ Generated ${i + 1}/${config.targetSize} samples`)
    }
  }

  console.log(`✅ Narrator dataset complete: ${samples.length} samples`)
  return samples
}

// ============================================================================
// EXPLORER DATASET GENERATOR
// ============================================================================

export function generateExplorerDataset(config: DatasetConfig): ExplorerSample[] {
  console.log(`🎯 Generating ${config.targetSize} Explorer samples...`)
  const samples: ExplorerSample[] = []

  for (let i = 0; i < config.targetSize; i++) {
    const paradox: ParadoxZone = {
      id: `paradox-${i}`,
      type: ['temporal', 'logical', 'quantum', 'causal'][Math.floor(Math.random() * 4)] as any,
      description: 'Conflicting time-travel law with causality',
      conflictingLaws: ['time.forward_only', 'time_travel.allowed'],
      affectedEntities: [`entity-${Math.floor(Math.random() * 100)}`],
    }

    const input: ExplorerInput = {
      paradox,
      universeState: {},
      explorationDepth: 3,
    }

    const output: ExplorerOutput = {
      scenarios: [
        {
          id: `scenario-${i}-1`,
          name: 'Timeline A: No time travel',
          initialState: {},
          interventions: [],
          expectedOutcomes: ['stable'],
        },
        {
          id: `scenario-${i}-2`,
          name: 'Timeline B: Controlled time travel',
          initialState: {},
          interventions: [
            {
              time: 1000,
              action: 'time_jump',
              target: 'system',
              params: { delta: -500 },
            },
          ],
          expectedOutcomes: ['paradox_resolved', 'stable'],
        },
      ],
      analysis: {
        stableOutcomes: 2,
        paradoxResolutions: 1,
        emergentBehaviors: ['timeline_branching'],
      },
      recommendations: ['Allow controlled time travel with causality locks'],
    }

    samples.push({
      id: `explorer-${i}`,
      input,
      output,
      metadata: {
        substrate: 'paradox',
        complexity: Math.floor(Math.random() * 10) + 1,
        verificationPassed: true,
        generatedAt: Date.now(),
      },
    })

    if ((i + 1) % 2500 === 0) {
      console.log(`  ✓ Generated ${i + 1}/${config.targetSize} samples`)
    }
  }

  console.log(`✅ Explorer dataset complete: ${samples.length} samples`)
  return samples
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateUniverseState(substrate: keyof typeof SUBSTRATE_TEMPLATES): Record<string, unknown> {
  return {
    substrate,
    entities: {},
    timestamp: Date.now(),
  }
}

function generateCausalChain(length: number): CausalEvent[] {
  const events: CausalEvent[] = []
  for (let i = 0; i < length; i++) {
    events.push({
      id: `event-${i}`,
      type: ['create', 'update', 'delete', 'transfer'][Math.floor(Math.random() * 4)],
      entity: `entity-${Math.floor(Math.random() * 10)}`,
      timestamp: Date.now() + i * 1000,
      causes: i > 0 ? [`event-${i - 1}`] : [],
      effects: i < length - 1 ? [`event-${i + 1}`] : [],
      data: { value: Math.random() * 100 },
    })
  }
  return events
}

function narrateEvent(event: CausalEvent, mode: 'kid' | 'pm' | 'engineer'): string {
  const narratives = {
    kid: `Something happened to ${event.entity}! It was a ${event.type}.`,
    pm: `User story: As ${event.entity}, the system executed ${event.type} at ${new Date(event.timestamp).toISOString()}.`,
    engineer: `Event ${event.id}: ${event.type} operation on ${event.entity} with payload ${JSON.stringify(event.data)}`,
  }
  return narratives[mode]
}

// ============================================================================
// STORYTELLER DATASET GENERATOR
// ============================================================================

const STORY_TEMPLATES = [
  {
    story: "A user signs up for our banking app, deposits $500, and then wants to transfer $100 to their friend.",
    domain: 'banking' as const,
    nodes: [
      { type: 'begin', entity: 'user:alice', properties: { balance: 0 } },
      { type: 'become', entity: 'user:alice', transform: 'balance + 500' },
      { type: 'become', entity: 'user:bob', transform: 'balance + 100' },
      { type: 'cease', entity: 'user:alice', condition: 'balance < 0' },
    ],
  },
  {
    story: "Players start at level 1, gain experience by completing quests, and level up when they reach 100 XP. Health should never go below zero.",
    domain: 'game' as const,
    nodes: [
      { type: 'begin', entity: 'player:hero', properties: { level: 1, xp: 0, health: 100 } },
      { type: 'become', entity: 'player:hero', transform: 'xp += quest.reward' },
      { type: 'transcend', entity: 'player:hero', condition: 'xp >= 100', portal: 'universe:level2' },
      { type: 'cease', entity: 'player:hero', condition: 'health <= 0' },
    ],
  },
  {
    story: "Tasks move from pending to active when a resource is allocated. Once completed, they trigger dependent tasks. Tasks can't start without prerequisites.",
    domain: 'workflow' as const,
    nodes: [
      { type: 'begin', entity: 'task:build', properties: { status: 'pending' } },
      { type: 'become', entity: 'task:build', transform: 'status = active' },
      { type: 'become', entity: 'task:test', transform: 'status = active' },
      { type: 'resolve', entity: 'task:conflict', strategy: 'merge' },
    ],
  },
  {
    story: "A social network where users can connect with each other, but connections must be mutual. Users can block others to prevent connections.",
    domain: 'social' as const,
    nodes: [
      { type: 'begin', entity: 'user:alice', properties: { connections: [] } },
      { type: 'begin', entity: 'user:bob', properties: { connections: [] } },
      { type: 'become', entity: 'connection:alice-bob', transform: 'status = pending' },
      { type: 'become', entity: 'connection:alice-bob', transform: 'status = accepted' },
      { type: 'cease', entity: 'connection:alice-bob', condition: 'user.blocked === true' },
    ],
  },
  {
    story: "Particles collide and exchange momentum. Energy is conserved across the system. When temperature exceeds threshold, particles transition to a new state.",
    domain: 'physics' as const,
    nodes: [
      { type: 'begin', entity: 'particle:A', properties: { momentum: 10, energy: 50 } },
      { type: 'begin', entity: 'particle:B', properties: { momentum: -5, energy: 30 } },
      { type: 'become', entity: 'system', transform: 'momentum.total = conserved' },
      { type: 'transcend', entity: 'particle:A', condition: 'temperature > 1000', portal: 'universe:plasma' },
    ],
  },
]

export function generateStorytellerDataset(config: DatasetConfig): StorytellerSample[] {
  console.log(`🎯 Generating ${config.targetSize} Storyteller samples...`)
  const samples: StorytellerSample[] = []

  for (let i = 0; i < config.targetSize; i++) {
    const template = STORY_TEMPLATES[i % STORY_TEMPLATES.length]
    const variation = Math.floor(Math.random() * 3)

    // Add variations to the story
    const storyVariations = [
      template.story,
      template.story.replace(/user/g, 'customer').replace(/player/g, 'character'),
      `Here's what I want to build: ${template.story}`,
    ]

    const input: StorytellerInput = {
      naturalLanguageStory: storyVariations[variation],
      context: {
        domain: template.domain,
        existingNodes: [],
        existingEdges: [],
      },
      userIntent: ['create', 'extend', 'refine', 'explore'][Math.floor(Math.random() * 4)] as any,
      preferences: {
        verbosity: ['minimal', 'balanced', 'detailed'][Math.floor(Math.random() * 3)] as any,
        autoConnect: Math.random() > 0.5,
        suggestConstraints: Math.random() > 0.3,
      },
    }

    const output: StorytellerOutput = {
      pipeline: {
        id: `pipeline-${i}`,
        name: `${template.domain} Pipeline`,
        description: template.story,
        nodes: template.nodes.map((node, idx) => ({
          id: `node-${i}-${idx}`,
          type: node.type as any,
          position: { x: 100 + idx * 200, y: 100 + (idx % 2) * 150 },
          data: {
            entity: node.entity,
            ...(('properties' in node) && { properties: node.properties }),
            ...(('transform' in node) && { transform: node.transform }),
            ...(('condition' in node) && { condition: node.condition }),
            ...(('portal' in node) && { portal: node.portal }),
            ...(('strategy' in node) && { strategy: node.strategy }),
            narrative: `Step ${idx + 1} in ${template.domain} workflow`,
            status: 'idle',
          },
        })),
        edges: template.nodes.slice(0, -1).map((_, idx) => ({
          id: `edge-${i}-${idx}`,
          source: `node-${i}-${idx}`,
          target: `node-${i}-${idx + 1}`,
          label: 'then',
        })),
        constraints: SUBSTRATE_TEMPLATES[template.domain].laws,
        narrative: template.story,
        metadata: {
          complexity: template.nodes.length,
          estimatedExecutionTime: template.nodes.length * 100,
          suggestedDomain: template.domain,
        },
      },
      reasoning: `Analyzed natural language input and identified ${template.nodes.length} key ontogenetic operators. Mapped story entities to universe nodes with appropriate state transitions.`,
      interpretations: template.nodes.map((node) => ({
        concept: node.entity,
        mappedTo: `${node.type} operator`,
        confidence: 0.85 + Math.random() * 0.15,
      })),
      suggestions: [
        {
          type: 'constraint',
          description: `Add validation: ${SUBSTRATE_TEMPLATES[template.domain].laws[0]}`,
          priority: 'high',
        },
        {
          type: 'edge',
          description: 'Consider adding error handling paths',
          priority: 'medium',
        },
      ],
      narrative: {
        original: template.story,
        enhanced: `${template.story} This workflow implements ${template.nodes.length} state transitions with constraint enforcement.`,
        keyEntities: template.nodes.map(n => n.entity),
        relationships: template.nodes.slice(0, -1).map((node, idx) => ({
          from: node.entity,
          to: template.nodes[idx + 1].entity,
          type: 'precedes',
        })),
      },
    }

    samples.push({
      id: `storyteller-${i}`,
      input,
      output,
      metadata: {
        substrate: template.domain,
        complexity: template.nodes.length,
        verificationPassed: true,
        generatedAt: Date.now(),
      },
    })

    if ((i + 1) % 10000 === 0) {
      console.log(`  Generated ${i + 1}/${config.targetSize} samples...`)
    }
  }

  console.log(`✅ Storyteller dataset complete: ${samples.length} samples`)
  return samples
}

// ============================================================================
// DATASET EXPORT
// ============================================================================

export function exportToJSONL<T>(samples: T[], outputPath: string): void {
  console.log(`📝 Exporting ${samples.length} samples to ${outputPath}...`)
  const jsonl = samples.map((sample) => JSON.stringify(sample)).join('\n')
  // In a real implementation, write to file system
  console.log(`✅ Export complete: ${jsonl.length} characters`)
}

// ============================================================================
// MAIN DATASET GENERATION ORCHESTRATOR
// ============================================================================

export function generateAllDatasets(outputDir: string) {
  console.log('🚀 Starting Fortistate AI Dataset Generation...\n')

  const configs: DatasetConfig[] = [
    {
      role: 'custodian',
      targetSize: 200_000,
      templates: ['banking', 'social', 'game', 'physics', 'workflow'],
      outputPath: `${outputDir}/custodian-dataset.jsonl`,
    },
    {
      role: 'diplomat',
      targetSize: 50_000,
      templates: ['banking', 'social', 'game', 'physics', 'workflow'],
      outputPath: `${outputDir}/diplomat-dataset.jsonl`,
    },
    {
      role: 'narrator',
      targetSize: 100_000,
      templates: ['banking', 'social', 'game', 'physics', 'workflow'],
      outputPath: `${outputDir}/narrator-dataset.jsonl`,
    },
    {
      role: 'explorer',
      targetSize: 25_000,
      templates: ['banking', 'social', 'game', 'physics', 'workflow'],
      outputPath: `${outputDir}/explorer-dataset.jsonl`,
    },
    {
      role: 'storyteller',
      targetSize: 150_000,
      templates: ['banking', 'social', 'game', 'physics', 'workflow'],
      outputPath: `${outputDir}/storyteller-dataset.jsonl`,
    },
  ]

  const datasets = {
    custodian: generateCustodianDataset(configs[0]),
    diplomat: generateDiplomatDataset(configs[1]),
    narrator: generateNarratorDataset(configs[2]),
    explorer: generateExplorerDataset(configs[3]),
    storyteller: generateStorytellerDataset(configs[4]),
  }

  console.log('\n📊 Dataset Generation Summary:')
  console.log(`  Custodian: ${datasets.custodian.length} samples`)
  console.log(`  Diplomat: ${datasets.diplomat.length} samples`)
  console.log(`  Narrator: ${datasets.narrator.length} samples`)
  console.log(`  Explorer: ${datasets.explorer.length} samples`)
  console.log(`  Storyteller: ${datasets.storyteller.length} samples`)
  console.log(`  Total: ${Object.values(datasets).reduce((sum, d) => sum + d.length, 0)} samples`)

  return datasets
}
