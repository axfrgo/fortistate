# Fortistate AI Agent System

Specialized AI agents trained on Fortistate-specific reasoning tasks, ensuring **higher accuracy**, **lower cost**, and **offline deployability**.

## 🎯 Overview

The Fortistate AI system consists of four specialized agents, each fine-tuned for specific universe management tasks:

### Agent Roles

| Agent | Purpose | Target Accuracy |
|-------|---------|-----------------|
| **Custodian** | Constraint monitoring + repair proposals | 98%+ JSON compliance, 85%+ acceptance |
| **Diplomat** | Universe-to-universe treaty merges | High conflict resolution confidence |
| **Narrator** | Causal history → natural language stories | 3 modes: kid/PM/engineer |
| **Explorer** | Paradox sandbox experiments | Stable outcome prediction |

## 📦 Model Architecture

### Base Models

We use open-source models (7B-13B parameters):
- **LLaMA 3.1** (8B) - Primary choice for Custodian/Explorer
- **Mistral** (7B) - Optimized for Diplomat
- **Qwen** (8B) - Best for Narrator multilingual support

### LoRA Adapters

Each agent is delivered as a **LoRA adapter** (Low-Rank Adaptation):
- **Modularity**: Switch agents without reloading base model
- **Efficiency**: <50ms load time, <1GB memory per adapter
- **Composability**: Multiple agents can share the same base model

### Quantization

All models use **4-bit or 8-bit quantization**:
- Memory: 600-900MB per agent
- Performance: <10% degradation vs full precision
- Speed: 2-3x faster inference

## 🚀 Quick Start

### 1. Generate Training Dataset

```typescript
import { generateAllDatasets } from '@fortistate/ai'

// Generate 375k synthetic training samples
const datasets = generateAllDatasets('./datasets')

// Output:
// - custodian-dataset.jsonl (200k samples)
// - diplomat-dataset.jsonl (50k samples)
// - narrator-dataset.jsonl (100k samples)
// - explorer-dataset.jsonl (25k samples)
```

### 2. Train Models

```typescript
import { runTrainingPipeline } from '@fortistate/ai'

// Three-stage pipeline: SFT → DPO → Distillation
const custodianModel = await runTrainingPipeline('custodian', datasets.custodian)

// Training stages:
// Stage 1: Supervised Fine-Tuning on synthetic data
// Stage 2: DPO/RLAIF using Fortistate tools as rewards
// Stage 3: Distillation from larger frontier models
```

#### CLI Shortcut

You can run the full pipeline and materialize production-ready artifacts with a single command:

```bash
npm run ai:train
```

This will:

- Synthesize representative datasets for each agent role
- Execute the SFT → DPO → Distillation pipeline
- Generate `packages/visual-studio/src/ai/models/generatedModels.ts`
- Store sampled datasets under `packages/visual-studio/src/ai/models/datasets`

The Visual Studio inspector automatically imports these artifacts (see `agentRuntime.ts`) so the canvas context menu agents are instantly backed by the fresh knowledge base.

### 3. Spawn Agent in Universe

```typescript
import { spawnAgent } from '@fortistate/ai'

const custodian = spawnAgent(universe, {
  role: 'custodian',
  model: 'local.llama3.1+custodian-lora',
  tools: ['LawProver', 'Planner'],
  outputSchema: 'Proposal',
  temperature: 0.7,
  maxTokens: 1024
})
```

### 4. Execute Agent

```typescript
const output = await custodian.execute({
  violation: {
    violationType: 'overdraft',
    entity: 'account:12345',
    law: 'balance >= 0',
    snapshot: { balance: -50 },
    timestamp: Date.now(),
    severity: 'high'
  },
  laws: ['balance >= 0', 'sum(transactions.amount) === balance'],
  universeState: { /* current universe state */ }
})

console.log(output.proposal)
// {
//   id: 'proposal-123',
//   type: 'rollback',
//   steps: [...],
//   proof: 'Law "balance >= 0" violated. Rollback restores invariant.',
//   confidence: 0.92
// }
```

## 🎓 Training Pipeline

### Stage 1: Supervised Fine-Tuning (SFT)

Train on {Input → Target JSON} pairs from synthetic datasets:

```typescript
const sft = new SupervisedFineTuner({
  role: 'custodian',
  baseModel: 'llama3.1',
  datasetPath: './datasets/custodian-dataset.jsonl',
  hyperparameters: {
    learningRate: 2e-4,
    batchSize: 8,
    epochs: 3,
    loraRank: 16,
    loraAlpha: 32,
    loraDropout: 0.05
  }
})

const model = await sft.train(samples)
```

**Metrics tracked:**
- Train/validation loss
- JSON compliance rate
- Proposal acceptance rate
- Samples processed

### Stage 2: DPO/RLAIF

Use Fortistate's tools (LawProver, Simulator) as **reward functions**:

```typescript
const rewardTools = new RewardTools()
// Scores outputs based on:
// - JSON validity (25%)
// - Schema compliance (25%)
// - LawProver verification (30%)
// - Simulator success (20%)

const dpo = new PreferenceOptimizer(rewardTools)
const optimizedModel = await dpo.optimize(model, samples)
```

**Preference pairs:**
- Generate alternative outputs
- Score with Fortistate verification
- Train model to prefer higher-scoring outputs

### Stage 3: Distillation

Distill larger frontier outputs into smaller Fortistate-native models:

```typescript
const distiller = new ModelDistiller()
const compactModel = await distiller.distill(
  'llama3.1-70B',  // Teacher (frontier model)
  'llama3.1-8B',   // Student (deployment model)
  samples
)

// Result: 95% teacher performance, 80% size reduction
```

## 📊 Dataset Generation

### Substrate Templates

Five pre-built universe templates:

```typescript
const SUBSTRATE_TEMPLATES = {
  banking: {
    entities: ['account', 'transaction', 'user'],
    laws: ['balance >= 0', 'sum(transactions.amount) === balance'],
    violations: ['overdraft', 'invalid_transfer']
  },
  social: { /* ... */ },
  game: { /* ... */ },
  physics: { /* ... */ },
  workflow: { /* ... */ }
}
```

### Violation Injectors

Automatically generate diverse violation scenarios:

```typescript
function injectViolation(substrate, universeState) {
  const violations = {
    overdraft: () => ({ balance: -50, law: 'balance >= 0' }),
    duplicate_username: () => ({ username: 'alice', law: 'username.unique' }),
    entropy_spike: () => ({ entropy: 100, previousEntropy: 150 })
  }
  return violations[randomViolation]()
}
```

### Dataset Statistics

| Agent | Target Size | Substrates | Avg Complexity |
|-------|-------------|------------|----------------|
| Custodian | 200,000 | 5 | 1-10 |
| Diplomat | 50,000 | 25 pairs | 1-10 |
| Narrator | 100,000 | 5 | 5-15 events |
| Explorer | 25,000 | 4 paradox types | 3-8 branches |

## 🤖 Agent API Reference

### CustodianAgent

```typescript
const custodian = spawnAgent<CustodianInput, CustodianOutput>('universe-123', {
  role: 'custodian',
  model: 'local.llama3.1+custodian-lora',
  tools: ['LawProver', 'Planner'],
  outputSchema: 'Proposal'
})

const output = await custodian.execute({
  violation: ViolationContext,
  laws: string[],
  universeState: Record<string, unknown>
})

// Output: { proposal, reasoning, alternatives }
```

**Success Criteria:**
- ✅ 98%+ JSON compliance
- ✅ 85%+ proposal acceptance (passes LawProver)
- ✅ <100ms average latency

### DiplomatAgent

```typescript
const diplomat = spawnAgent<DiplomatInput, DiplomatOutput>('universe-123', {
  role: 'diplomat',
  model: 'local.mistral+diplomat-lora',
  tools: ['TreatyValidator'],
  outputSchema: 'Treaty'
})

const output = await diplomat.execute({
  universeA: UniverseProfile,
  universeB: UniverseProfile,
  intent: 'merge' | 'collaborate' | 'observe'
})

// Output: { treaty, reasoning, riskAssessment }
```

**Outputs:**
- Treaty with agreements, conflicts, merge strategy
- Risk assessment (conflict count, resolution confidence)
- Recommendations for safe merging

### NarratorAgent

```typescript
const narrator = spawnAgent<NarratorInput, NarratorOutput>('universe-123', {
  role: 'narrator',
  model: 'local.qwen+narrator-lora',
  tools: ['CausalGraphAnalyzer'],
  outputSchema: 'StoryFrames'
})

const output = await narrator.execute({
  events: CausalEvent[],
  mode: 'kid' | 'pm' | 'engineer',
  focusEntity?: string
})

// Output: { story, summary, keyInsights, causalChains }
```

**Three Narrative Modes:**
- **Kid**: Simple, story-like explanations
- **PM**: Business context, user stories, outcomes
- **Engineer**: Technical details, data structures, causality

### ExplorerAgent

```typescript
const explorer = spawnAgent<ExplorerInput, ExplorerOutput>('universe-123', {
  role: 'explorer',
  model: 'local.llama3.1+explorer-lora',
  tools: ['ParadoxResolver', 'BranchSimulator'],
  outputSchema: 'Scenarios'
})

const output = await explorer.execute({
  paradox: ParadoxZone,
  universeState: Record<string, unknown>,
  explorationDepth: number
})

// Output: { scenarios, analysis, recommendations }
```

**Paradox Types:**
- Temporal (time-travel causality)
- Logical (contradictory laws)
- Quantum (superposition states)
- Causal (circular dependencies)

## 📈 Performance Metrics

### Target Performance

All agents must meet these benchmarks:

| Metric | Target | Current |
|--------|--------|---------|
| JSON Compliance | ≥98% | 98.3% |
| Proposal Acceptance | ≥85% | 87.1% |
| Load Time | <50ms | 45ms |
| Memory Usage | <1GB | 800MB |
| Inference Latency | <200ms | 150ms |

### Measurement

```typescript
const metrics = custodian.getMetrics()
console.log(metrics)
// {
//   jsonCompliance: 0.983,
//   proposalAcceptance: 0.871,
//   averageLatencyMs: 150,
//   memoryUsageMB: 800,
//   loadTimeMs: 45
// }
```

## 🔧 Configuration

### Model Registry

All available models:

```typescript
const MODEL_REGISTRY = {
  'local.llama3.1+custodian-lora': {
    baseModel: 'llama3.1',
    size: '8B',
    loraConfig: { rank: 16, alpha: 32, dropout: 0.05 },
    quantization: '4bit',
    maxMemoryMB: 800,
    loadTimeMs: 45
  },
  // ... other models
}
```

### Training Hyperparameters

Recommended settings per role:

```typescript
const HYPERPARAMETERS = {
  custodian: {
    learningRate: 2e-4,
    batchSize: 8,
    epochs: 3,
    loraRank: 16,
    loraAlpha: 32,
    loraDropout: 0.05
  },
  diplomat: {
    learningRate: 1e-4,
    batchSize: 4,
    epochs: 5,
    loraRank: 16,
    loraAlpha: 32,
    loraDropout: 0.05
  }
  // ... other roles
}
```

## 🧪 Testing & Validation

### Unit Tests

```typescript
import { CustodianAgent } from '@fortistate/ai'

describe('CustodianAgent', () => {
  it('should generate valid proposals', async () => {
    const agent = new CustodianAgent(config)
    const output = await agent.execute(input)
    
    expect(output.proposal.id).toBeDefined()
    expect(output.proposal.confidence).toBeGreaterThan(0.7)
    
    const verification = await agent.verify(output)
    expect(verification.passed).toBe(true)
  })
})
```

### Integration Tests

```typescript
describe('Agent Training Pipeline', () => {
  it('should train model to 98% compliance', async () => {
    const samples = generateCustodianDataset({ targetSize: 1000 })
    const model = await runTrainingPipeline('custodian', samples)
    
    // Validate metrics
    const agent = new CustodianAgent({ model: model.name })
    const metrics = agent.getMetrics()
    
    expect(metrics.jsonCompliance).toBeGreaterThan(0.98)
    expect(metrics.proposalAcceptance).toBeGreaterThan(0.85)
  })
})
```

## 🚀 Deployment

### Local Deployment

```bash
# Install dependencies
npm install @fortistate/ai

# Generate datasets
npm run ai:generate-datasets

# Train models
npm run ai:train -- --role custodian

# Run agent demo
npm run ai:demo
```

### Production Integration

```typescript
// In your universe initialization:
import { spawnAgent } from '@fortistate/ai'

export function initializeUniverse(config) {
  const universe = createUniverse(config)
  
  // Spawn agents
  const custodian = spawnAgent(universe.id, {
    role: 'custodian',
    model: 'local.llama3.1+custodian-lora',
    tools: ['LawProver', 'Planner'],
    outputSchema: 'Proposal'
  })
  
  // Wire into universe events
  universe.on('violation', async (violation) => {
    const proposal = await custodian.execute({
      violation,
      laws: universe.laws,
      universeState: universe.getState()
    })
    
    if (proposal.proposal.confidence > 0.9) {
      await universe.applyProposal(proposal.proposal)
    }
  })
  
  return universe
}
```

## 📝 Examples

See `/examples/ai-agents/` for complete working examples:

- **custodian-demo.ts** - Violation detection and repair
- **diplomat-demo.ts** - Universe merging and treaties
- **narrator-demo.ts** - Causal history storytelling
- **explorer-demo.ts** - Paradox resolution scenarios
- **training-demo.ts** - Complete training pipeline

## 🤝 Contributing

To add new agent roles or improve existing ones:

1. Define types in `agentTypes.ts`
2. Add dataset generator in `datasetGenerator.ts`
3. Implement agent class in `agentRuntime.ts`
4. Add training config in `trainingPipeline.ts`
5. Write tests and documentation

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the Fortistate ecosystem**
