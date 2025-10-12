# 🎨 Storyteller AI Agent

## Overview

The **Storyteller Agent** is a specialized AI that uses Natural Language Processing (NLP) to translate human-readable workflow descriptions into fully-fledged Fortistate universe pipelines. Users can describe their workflows in plain English, and the Storyteller will automatically generate the corresponding ontogenetic operators (begin, become, cease, transcend, resolve) with proper connections and constraints.

## Features

### 🧠 Natural Language Understanding
- Parses user stories written in plain language
- Extracts key entities, relationships, and state transitions
- Identifies workflow patterns and domain context

### 🔄 Automatic Pipeline Generation
- Maps concepts to ontogenetic operators:
  - **Begin**: "start", "create", "sign up", "initialize"
  - **Become**: "deposit", "transfer", "update", "gain", "level up"
  - **Cease**: "never", "cannot", "prevent", "block" (boundaries)
  - **Transcend**: "level up", "upgrade", "transition", "evolve"
  - **Resolve**: "conflict", "merge", "reconcile"

### 📊 Enhanced Output
- Generates positioned nodes ready for canvas placement
- Auto-connects nodes based on workflow logic
- Suggests constraints and validation rules
- Provides confidence scores for each interpretation
- Offers refinement suggestions

## Usage

### From the Visual Studio UI

1. **Right-click on the canvas** (or any node/edge)
2. Select **"Translate Story to Pipeline"** from the context menu
3. Enter your workflow description in natural language
4. Click **"Generate Pipeline"**

### Example Input Stories

#### Banking Workflow
```
A user signs up for our banking app, deposits $500, 
and then wants to transfer $100 to their friend. 
Balance can never go negative.
```

**Generated Pipeline:**
- `BEGIN` → User account creation (balance: 0)
- `BECOME` → Deposit $500 (balance: 500)
- `BECOME` → Transfer $100 (balance: 400)
- `CEASE` → Prevent negative balance

#### Game Workflow
```
Players start at level 1, gain experience by completing quests, 
and level up when they reach 100 XP. Health should never go below zero.
```

**Generated Pipeline:**
- `BEGIN` → Player creation (level: 1, xp: 0, health: 100)
- `BECOME` → Gain XP from quests
- `TRANSCEND` → Level up at 100 XP (→ universe:level2)
- `CEASE` → Prevent health < 0

#### Social Network
```
Users can connect with each other, but connections must be mutual. 
Users can block others to prevent connections.
```

**Generated Pipeline:**
- `BEGIN` → User Alice
- `BEGIN` → User Bob
- `BECOME` → Connection request (status: pending)
- `BECOME` → Connection accepted (status: accepted)
- `CEASE` → Block connection

## Technical Details

### Agent Configuration
```typescript
{
  role: 'storyteller',
  model: 'local.llama3.1+storyteller-lora',
  tools: ['NLPParser', 'PipelineBuilder'],
  outputSchema: 'UniversePipeline',
  temperature: 0.75,
  maxTokens: 1536,
}
```

### Input Schema
```typescript
interface StorytellerInput {
  naturalLanguageStory: string
  context?: {
    existingNodes?: Node[]
    existingEdges?: Edge[]
    domain?: 'banking' | 'social' | 'game' | 'physics' | 'workflow' | 'generic'
  }
  userIntent?: 'create' | 'extend' | 'refine' | 'explore'
  preferences?: {
    verbosity?: 'minimal' | 'balanced' | 'detailed'
    autoConnect?: boolean
    suggestConstraints?: boolean
  }
}
```

### Output Schema
```typescript
interface StorytellerOutput {
  pipeline: UniversePipeline  // Nodes, edges, constraints
  reasoning: string  // How the story was interpreted
  interpretations: Array<{
    concept: string
    mappedTo: string
    confidence: number
  }>
  suggestions: Array<{
    type: 'constraint' | 'node' | 'edge' | 'refinement'
    description: string
    priority: 'low' | 'medium' | 'high'
  }>
  narrative: {
    original: string
    enhanced: string
    keyEntities: string[]
    relationships: Array<{ from: string; to: string; type: string }>
  }
}
```

## Training Data

The Storyteller is trained on **150,000 synthetic samples** covering 5 domains:
- Banking (accounts, transactions, transfers)
- Social (users, connections, posts)
- Gaming (players, quests, achievements)
- Physics (particles, forces, collisions)
- Workflow (tasks, approvals, resources)

### Dataset Generation
Run `npm run ai:train` to regenerate training data including the Storyteller dataset.

## Integration with Agent Insights

All Storyteller outputs are routed through the **Agent Insights Panel**:
- Success metrics (nodes created, confidence scores)
- Interpretation details
- Refinement suggestions
- Enhanced narrative with workflow explanation

## Future Enhancements

- **Multi-turn refinement**: Iteratively refine pipelines through conversation
- **Domain-specific vocabularies**: Specialized parsing for banking, healthcare, etc.
- **Visual feedback**: Highlight generated nodes during creation
- **Constraint inference**: Automatically derive laws from implicit requirements
- **Collaborative mode**: Multiple users describing parts of the same workflow

## Model Specifications

- **Base Model**: LLaMA 3.1 (7B parameters)
- **LoRA Adapter**: rank=8, alpha=16, dropout=0.05
- **Quantization**: 4-bit
- **Memory**: ~600MB
- **Load Time**: ~30ms
- **Inference**: ~250ms average latency

## API Example

```typescript
import { spawnAgent } from './ai/agentRuntime'

const storyteller = spawnAgent('my-universe', {
  role: 'storyteller',
  model: 'local.llama3.1+storyteller-lora',
  tools: ['NLPParser', 'PipelineBuilder'],
  outputSchema: 'UniversePipeline',
  temperature: 0.75,
  maxTokens: 1536,
})

const result = await storyteller.execute({
  naturalLanguageStory: "Users sign up, deposit money, and transfer to friends",
  context: { domain: 'banking' },
  userIntent: 'create',
  preferences: {
    verbosity: 'balanced',
    autoConnect: true,
    suggestConstraints: true,
  },
})

console.log('Generated pipeline:', result.pipeline)
```

## FAQ

**Q: Can I extend an existing pipeline?**  
A: Yes! Set `userIntent: 'extend'` and provide `context.existingNodes` and `context.existingEdges`. The Storyteller will integrate new nodes with your existing workflow.

**Q: What if the AI misinterprets my story?**  
A: Check the `interpretations` array in the output to see how each concept was mapped. You can refine your input or manually adjust the generated nodes.

**Q: Does it support multiple languages?**  
A: Currently optimized for English. Future versions will support multilingual input.

**Q: How do I train on custom workflows?**  
A: Add your examples to `STORY_TEMPLATES` in `datasetGenerator.ts` and run `npm run ai:train`.

---

**Built for Fortistate v3 - Empowering users to think in stories, not syntax.**
