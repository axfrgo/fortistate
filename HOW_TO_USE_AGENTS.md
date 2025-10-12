# Using AI Agents in Fortistate Visual Studio

## 🎯 Quick Overview

The AI agents are currently **backend services** that can be integrated into the Visual Studio UI. Here's how to use them:

---

## 🚀 Method 1: Via IntelligentUniverse (Recommended)

The `IntelligentUniverse` class automatically integrates all agents into your universe lifecycle:

```typescript
import { IntelligentUniverse } from './ai/intelligentUniverse'

// In your App.tsx or universe initialization:
const intelligentUniverse = new IntelligentUniverse({
  universeId: sessionId,
  laws: ['balance >= 0', 'transactions.atomic'],
  autoRepair: true,        // Custodian auto-fixes violations
  autoNarrate: true,       // Narrator generates stories
  paradoxDetection: true,  // Explorer resolves paradoxes
  metricsInterval: 60000
})

// Agents now work automatically!
```

### What Happens Automatically:
- ✅ **Violations detected** → Custodian proposes repairs → Auto-applied if confidence >85%
- ✅ **Events occur** → Narrator generates explanations → Logged to console
- ✅ **Paradoxes found** → Explorer generates scenarios → Best resolution applied

---

## 🎨 Method 2: Add UI Components (Let's Build This!)

Let me create UI components to make agents accessible from the Visual Studio interface:

### A. Agent Panel Component
I'll create a sidebar panel where you can:
- View agent status
- Trigger manual agent operations
- See agent suggestions
- Review agent metrics

### B. Context Menu Integration
Right-click on canvas nodes to:
- "Ask Custodian to Review"
- "Explain with Narrator"
- "Explore Alternatives"

### C. Notification System
Agent outputs appear as notifications:
- Custodian proposals
- Narrator summaries
- Explorer recommendations

---

## 📝 Method 3: Direct API Usage

### Import and Spawn Agents:

```typescript
import { spawnAgent } from './ai/agentRuntime'

// Spawn a custodian agent
const custodian = spawnAgent(universeId, {
  role: 'custodian',
  model: 'local.llama3.1+custodian-lora',
  tools: ['LawProver', 'Planner'],
  outputSchema: 'Proposal'
})
```

### Use in Event Handlers:

```typescript
// When canvas detects an issue:
async function handleCanvasViolation(node) {
  const proposal = await custodian.execute({
    violation: {
      violationType: 'invalid_connection',
      entity: node.id,
      law: 'connections.must_be_valid',
      snapshot: { node },
      timestamp: Date.now(),
      severity: 'medium'
    },
    laws: canvasLaws,
    universeState: getCanvasState()
  })
  
  // Show proposal in UI
  showNotification({
    title: 'Custodian Suggestion',
    message: proposal.reasoning,
    actions: [
      { label: 'Apply', onClick: () => applyProposal(proposal) },
      { label: 'Dismiss', onClick: () => {} }
    ]
  })
}
```

---

## 🎬 Let Me Build the UI Integration!

I can create:

1. **AgentPanel.tsx** - Sidebar with agent controls
2. **AgentNotification.tsx** - Rich notifications for agent outputs
3. **useAgents.ts** - React hook for easy agent access
4. **Canvas integration** - Right-click context menu

Would you like me to build these UI components now?

---

## 🔧 Current Usage Options (Available Now)

### Option A: Console-Based Usage

The agents are already integrated at the **system level**. You can test them via browser console:

```javascript
// In browser DevTools console:
import { spawnAgent } from './src/ai/agentRuntime'

const custodian = spawnAgent('test', {
  role: 'custodian',
  model: 'local.llama3.1+custodian-lora',
  tools: ['LawProver'],
  outputSchema: 'Proposal'
})

const output = await custodian.execute({
  violation: { /* ... */ },
  laws: ['balance >= 0'],
  universeState: {}
})

console.log(output)
```

### Option B: Add to Universe Manager

Integrate into your existing Universe Manager component:

```typescript
// In UniverseManager.tsx:
import { IntelligentUniverse } from '../ai/intelligentUniverse'

function UniverseManager() {
  const [aiUniverse, setAiUniverse] = useState(null)
  
  useEffect(() => {
    if (sessionId) {
      const universe = new IntelligentUniverse({
        universeId: sessionId,
        laws: universeLaws,
        autoRepair: true,
        autoNarrate: true,
        paradoxDetection: true,
        metricsInterval: 60000
      })
      setAiUniverse(universe)
    }
  }, [sessionId])
  
  // AI agents now work in background!
}
```

---

## 💡 Recommended Integration Path

**Phase 1: Background Integration (5 minutes)**
- Add `IntelligentUniverse` to App.tsx
- Agents work automatically in background
- Console logs show agent activity

**Phase 2: UI Components (30 minutes)** ← *Let me build this!*
- Agent status panel
- Notification system
- Canvas context menu
- Manual trigger buttons

**Phase 3: Advanced Features (later)**
- Agent conversation history
- Confidence sliders
- Custom training data
- Multi-agent collaboration UI

---

## 🎯 What Would You Like?

**Option 1**: I'll add the `IntelligentUniverse` integration to App.tsx right now (automatic, no UI)

**Option 2**: I'll build full UI components (agent panel, notifications, context menus)

**Option 3**: I'll create a simple "Ask Agent" button in the existing UI as a starting point

Which would you prefer? 🚀
