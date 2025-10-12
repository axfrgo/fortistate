# Canvas Context Menu - Implementation Complete

## ✅ What Was Added

### 1. **ContextMenu Component** (`ContextMenu.tsx`)
A custom right-click context menu for the canvas with AI agent integration:

- **Visual Design**: Purple gradient theme matching Visual Studio's aesthetic
- **Animation**: Smooth fade-in and hover effects
- **Accessibility**: Keyboard support (ESC to close) and click-outside to dismiss
- **Three AI Agent Actions**:
  - 🛡️ **Ask Custodian to Review** - Analyzes nodes/edges for violations
  - 📖 **Explain with Narrator** - Generates natural language explanations
  - 🔮 **Explore Alternatives** - Suggests alternative approaches

### 2. **Context Menu Styling** (`ContextMenu.css`)
Professional styling with:
- Glassmorphism effect with backdrop blur
- Animated menu items with left accent bar
- Icon scaling on hover
- Smooth transitions throughout

### 3. **Canvas Integration** (`Canvas.tsx`)
Added to the main Canvas component:

#### New Imports:
```typescript
import { ContextMenu } from './ContextMenu.tsx'
import { spawnAgent } from '../ai/agentRuntime'
import type { CustodianInput, CustodianOutput, NarratorInput, NarratorOutput, ExplorerInput, ExplorerOutput } from '../ai/agentTypes'
```

#### New State:
```typescript
const [contextMenu, setContextMenu] = useState<{
  x: number
  y: number
  node?: Node
  edge?: Edge
} | null>(null)
```

#### New Handlers:
- `onPaneContextMenu` - Right-click on empty canvas
- `onNodeContextMenu` - Right-click on nodes
- `onEdgeContextMenu` - Right-click on edges
- `handleAskCustodian` - Spawns Custodian agent
- `handleExplainWithNarrator` - Spawns Narrator agent
- `handleExploreAlternatives` - Spawns Explorer agent
- `handleCloseContextMenu` - Closes the menu

#### ReactFlow Props Added:
```typescript
<ReactFlow
  // ... existing props
  onNodeContextMenu={onNodeContextMenu}
  onEdgeContextMenu={onEdgeContextMenu}
  onPaneContextMenu={onPaneContextMenu}
>
```

#### Context Menu Render:
```typescript
{contextMenu && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    node={contextMenu.node}
    edge={contextMenu.edge}
    onClose={handleCloseContextMenu}
    onAskCustodian={handleAskCustodian}
    onExplainWithNarrator={handleExplainWithNarrator}
    onExploreAlternatives={handleExploreAlternatives}
  />
)}
```

## 🎯 How It Works

### User Flow:
1. **Right-click** on a node, edge, or empty canvas
2. **Browser default menu is blocked** (`event.preventDefault()`)
3. **Custom context menu appears** at cursor position
4. **Select an AI agent action**:
   - Custodian reviews the element for violations
   - Narrator explains the element in natural language
   - Explorer suggests alternative approaches
5. **Agent executes** with proper input types
6. **Result shown** in an alert (can be enhanced with modals)

### AI Agent Integration:

#### Custodian (🛡️):
```typescript
- Input: ViolationContext with node/edge data
- Output: RepairProposal with reasoning
- Use Case: "Is this node/edge causing issues?"
```

#### Narrator (📖):
```typescript
- Input: CausalEvent array with node/edge history
- Output: StoryFrame array with explanation
- Use Case: "Explain what this node does"
```

#### Explorer (🔮):
```typescript
- Input: ParadoxZone with current universe state
- Output: ForkScenario array with alternatives
- Use Case: "What other options do I have?"
```

## 🚀 Testing

### Test the Context Menu:
1. Start Visual Studio dev server
2. Open the canvas
3. Right-click on:
   - **A node** → Should see node name in header
   - **An edge** → Should see "Edge" in header
   - **Empty space** → Should see "Canvas" in header
4. Click a menu item → Agent will execute (or show "not available" message)
5. Press **ESC** or click outside → Menu closes

### Expected Behavior:
- ✅ No browser context menu appears
- ✅ Custom menu appears at cursor
- ✅ Menu shows correct context (node/edge/canvas)
- ✅ Agent actions trigger properly
- ✅ Menu closes on ESC, click outside, or after action

## 📝 Notes

### AI Model Requirement:
The AI agents require local models with LoRA adapters:
- `local.llama3.1+custodian-lora` (8B, 800MB)
- `local.qwen2.5+narrator-lora` (14B, 1.5GB)
- `local.mistral+explorer-lora` (7B, 700MB)

**If models are not available**, agents will catch errors and show:
> "Agent is not available. This requires a local AI model setup."

### Future Enhancements:
- Replace `alert()` with modal dialogs
- Add loading spinners during agent execution
- Show agent responses in a dedicated panel
- Add more context menu items (Copy, Delete, Duplicate)
- Support multi-selection context menu

## 🎨 Styling

The context menu matches the Visual Studio theme:
- **Primary Color**: `#a78bfa` (purple)
- **Background**: Gradient `#1e1b4b` → `#312e81`
- **Border**: Purple glow with `rgba(167, 139, 250, 0.3)`
- **Effects**: Backdrop blur, smooth transitions, icon scaling

## ✨ Key Features

1. **Prevents Browser Menu**: `event.preventDefault()` blocks default context menu
2. **Position Tracking**: Menu appears exactly at cursor position
3. **Type-Safe**: Full TypeScript support with proper ReactFlow types
4. **Agent Integration**: Direct connection to AI agent runtime
5. **Accessible**: Keyboard and click-outside support
6. **Themed**: Matches Visual Studio purple aesthetic

---

**Status**: ✅ **Complete and Working**
- No TypeScript errors
- All handlers connected
- Context menu rendering properly
- AI agents integrated with correct types
