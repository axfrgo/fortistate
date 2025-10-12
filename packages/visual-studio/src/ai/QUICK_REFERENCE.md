# AI Agent System - Quick Reference

## 🚀 One-Minute Start

```typescript
import { spawnAgent } from './ai'

// Spawn an agent
const custodian = spawnAgent(universe, {
  role: 'custodian',
  model: 'local.llama3.1+custodian-lora',
  tools: ['LawProver', 'Planner'],
  outputSchema: 'Proposal'
})

// Execute
const output = await custodian.execute({
  violation: { /* ... */ },
  laws: [ /* ... */ ],
  universeState: { /* ... */ }
})

// Verify & apply
if (output.proposal.confidence > 0.9) {
  await universe.applyProposal(output.proposal)
}
```

## 📋 Agent Cheat Sheet

| Agent | Input | Output | Use Case |
|-------|-------|--------|----------|
| **Custodian** | Violation + Laws | Repair Proposal | Auto-fix law violations |
| **Diplomat** | Two Universes | Treaty | Merge/collaborate universes |
| **Narrator** | Event DAG | Story | Debug logs, audit reports |
| **Explorer** | Paradox | Scenarios | Resolve time-travel conflicts |

## 🎯 Common Patterns

### Pattern 1: Auto-Repair on Violation

```typescript
universe.on('violation', async (violation) => {
  const proposal = await custodian.execute({
    violation,
    laws: universe.laws,
    universeState: universe.getState()
  })
  
  if (proposal.proposal.confidence > 0.85) {
    await universe.applyProposal(proposal.proposal)
    console.log('✅ Auto-repaired:', proposal.reasoning)
  } else {
    console.warn('⚠️ Manual review needed:', proposal.reasoning)
  }
})
```

### Pattern 2: Universe Merge with Treaty

```typescript
async function mergeUniverses(universeA, universeB) {
  const treaty = await diplomat.execute({
    universeA: universeA.getProfile(),
    universeB: universeB.getProfile(),
    intent: 'merge'
  })
  
  if (treaty.riskAssessment.conflicts === 0) {
    return await applyTreaty(treaty.treaty)
  } else {
    console.warn('⚠️ Conflicts detected:', treaty.treaty.conflicts)
    return null
  }
}
```

### Pattern 3: Multi-Mode Storytelling

```typescript
// For users
const kidStory = await narrator.execute({
  events: causalChain,
  mode: 'kid'
})
showNotification(kidStory.summary)

// For product managers
const pmStory = await narrator.execute({
  events: causalChain,
  mode: 'pm'
})
generateReport(pmStory.story)

// For engineers
const engStory = await narrator.execute({
  events: causalChain,
  mode: 'engineer'
})
console.log(engStory.story)
```

### Pattern 4: Paradox Detection & Resolution

```typescript
universe.on('paradox_detected', async (paradox) => {
  const exploration = await explorer.execute({
    paradox,
    universeState: universe.getState(),
    explorationDepth: 3
  })
  
  // Find stable outcome
  const stableScenario = exploration.scenarios.find(s =>
    s.expectedOutcomes.includes('stable')
  )
  
  if (stableScenario) {
    await universe.fork(stableScenario)
    console.log('✅ Paradox resolved via timeline fork')
  }
})
```

## 📊 Metrics Monitoring

```typescript
// Track agent performance
setInterval(() => {
  const metrics = custodian.getMetrics()
  
  if (metrics.jsonCompliance < 0.98) {
    console.warn('⚠️ JSON compliance below target')
  }
  
  if (metrics.proposalAcceptance < 0.85) {
    console.warn('⚠️ Acceptance rate below target')
  }
  
  if (metrics.averageLatencyMs > 200) {
    console.warn('⚠️ Latency above threshold')
  }
}, 60000) // Check every minute
```

## 🎓 Training Workflow

```typescript
// 1. Generate dataset
const datasets = generateAllDatasets('./datasets')

// 2. Train model
const model = await runTrainingPipeline('custodian', datasets.custodian)

// 3. Deploy agent
const custodian = spawnAgent(universe, {
  role: 'custodian',
  model: model.name,
  tools: ['LawProver', 'Planner'],
  outputSchema: 'Proposal'
})
```

## 🔧 Configuration Examples

### High-Performance Config
```typescript
{
  role: 'custodian',
  model: 'local.llama3.1+custodian-lora',
  tools: ['LawProver', 'Planner'],
  outputSchema: 'Proposal',
  temperature: 0.3,  // Low temperature for deterministic output
  maxTokens: 512     // Shorter responses
}
```

### Creative Config (Narrator)
```typescript
{
  role: 'narrator',
  model: 'local.qwen+narrator-lora',
  tools: ['CausalGraphAnalyzer'],
  outputSchema: 'StoryFrames',
  temperature: 0.9,  // High temperature for creative stories
  maxTokens: 2048    // Longer narratives
}
```

### Balanced Config (Explorer)
```typescript
{
  role: 'explorer',
  model: 'local.llama3.1+explorer-lora',
  tools: ['ParadoxResolver', 'BranchSimulator'],
  outputSchema: 'Scenarios',
  temperature: 0.7,  // Balanced creativity
  maxTokens: 1024
}
```

## 🐛 Troubleshooting

### Low JSON Compliance
```typescript
// Increase training epochs or adjust reward weights
const config = {
  hyperparameters: {
    epochs: 5,  // More training
    loraRank: 32 // Higher capacity
  }
}
```

### Slow Inference
```typescript
// Use smaller model or more quantization
{
  model: 'local.llama3.1+custodian-lora',
  quantization: '4bit',  // More aggressive quantization
  maxTokens: 512         // Shorter responses
}
```

### Low Acceptance Rate
```typescript
// Increase DPO training with more preference pairs
const rewardTools = new RewardTools()
const dpo = new PreferenceOptimizer(rewardTools)
await dpo.optimize(model, largerDataset)
```

## 📚 Documentation Links

- **Full API**: See `README.md`
- **Type Definitions**: See `agentTypes.ts`
- **Examples**: See `demo.ts`
- **Training Guide**: See `trainingPipeline.ts`
- **Dataset Guide**: See `datasetGenerator.ts`

## 💡 Pro Tips

1. **Batch Processing**: Process multiple violations together for efficiency
2. **Caching**: Cache common proposals to avoid redundant inference
3. **Async First**: All agent calls are async—use Promise.all() for parallelism
4. **Metrics Matter**: Monitor compliance and acceptance in production
5. **Verify Always**: Always verify outputs before applying to universe
6. **Start Small**: Train on 10k samples first, then scale to full dataset
7. **Use Distillation**: For production, distill from larger models for best quality/speed tradeoff

## 🎯 Success Checklist

- [ ] Agent loads in <50ms
- [ ] Memory usage <1GB
- [ ] JSON compliance >98%
- [ ] Proposal acceptance >85%
- [ ] Inference latency <200ms
- [ ] Verification passes consistently
- [ ] Metrics tracked and monitored
- [ ] Error handling implemented
- [ ] Integration tests passing
- [ ] Production deployment plan

---

**Questions?** Check the full README or run `npm run ai:demo` for interactive examples.
