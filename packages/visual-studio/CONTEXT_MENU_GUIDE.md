# Canvas Context Menu - Quick Start Guide

## 🚀 Quick Start

### How to Use:

1. **Right-click on any node** in the canvas
   ```
   [Node] → Right Click → Menu appears
   ```

2. **Right-click on any edge** connecting nodes
   ```
   [Edge] → Right Click → Menu appears
   ```

3. **Right-click on empty canvas** space
   ```
   [Canvas] → Right Click → Menu appears
   ```

### Menu Actions:

#### 🛡️ Ask Custodian to Review
**What it does**: Analyzes the selected node/edge for violations, integrity issues, or constraint problems.

**Example Use Cases:**
- "Is this node valid?"
- "Are there any law violations?"
- "Should I fix anything?"

**Agent Details:**
- Model: LLaMA 3.1 with Custodian LoRA (8B)
- Temperature: 0.7
- Max Tokens: 1024

---

#### 📖 Explain with Narrator
**What it does**: Generates a natural language explanation of the node/edge in your chosen style.

**Example Use Cases:**
- "What does this node do?"
- "Explain the purpose of this connection"
- "Tell me the story behind this element"

**Agent Details:**
- Model: Qwen 2.5 with Narrator LoRA (14B)
- Temperature: 0.85
- Max Tokens: 512
- Mode: Engineer (technical explanations)

---

#### 🔮 Explore Alternatives
**What it does**: Suggests alternative approaches, configurations, or patterns for the selected element.

**Example Use Cases:**
- "What other options do I have?"
- "Can you suggest different approaches?"
- "Show me alternative patterns"

**Agent Details:**
- Model: Mistral with Explorer LoRA (7B)
- Temperature: 0.9
- Max Tokens: 768
- Depth: 3 levels of exploration

---

## 🎯 Context Menu Behavior

### Opening:
- **Right-click** on node/edge/canvas
- Menu appears at cursor position
- Browser default menu is **blocked**

### Closing:
- Press **ESC** key
- Click **outside** the menu
- Select a **menu item** (executes then closes)

### Visual Feedback:
- Menu fades in with animation
- Hover shows purple accent bar
- Icons scale on hover
- Active item has purple background

---

## 🛠️ Technical Details

### File Structure:
```
packages/visual-studio/src/components/
├── Canvas.tsx              # Main canvas with context menu integration
├── ContextMenu.tsx         # Context menu component
└── ContextMenu.css         # Context menu styling
```

### Agent Runtime:
```
packages/visual-studio/src/ai/
├── agentRuntime.ts         # Agent spawning and execution
├── agentTypes.ts           # TypeScript types for agents
└── ... (8 other AI files)
```

### Context Menu State:
```typescript
interface ContextMenuState {
  x: number              // Cursor X position
  y: number              // Cursor Y position
  node?: Node            // Selected node (if any)
  edge?: Edge            // Selected edge (if any)
}
```

---

## 💡 Tips

### Best Practices:
1. **Right-click specific elements** to get contextual actions
2. **Use Custodian** for validation and repair suggestions
3. **Use Narrator** for understanding complex nodes
4. **Use Explorer** when stuck or looking for alternatives

### Keyboard Shortcuts:
- `ESC` - Close context menu
- `Right Click` - Open context menu
- `Left Click Outside` - Close context menu

### Visual Indicators:
- **Purple header** - Shows element name
- **Icon + Text** - Each action has an emoji icon
- **Hover effect** - Purple accent bar appears on left
- **Animated entrance** - Smooth fade-in

---

## 🔧 Troubleshooting

### Issue: Browser menu still appears
**Solution**: The context menu uses `event.preventDefault()` to block browser menu. If still appearing, check browser extensions.

### Issue: "Agent is not available" message
**Solution**: AI agents require local model setup with LoRA adapters. See `HOW_TO_USE_AGENTS.md` for setup instructions.

### Issue: Menu doesn't close
**Solution**: Click outside menu or press ESC. If stuck, refresh the page.

### Issue: No menu appears
**Solution**: 
1. Check browser console for errors
2. Verify ReactFlow is loaded
3. Ensure context menu handlers are wired up

---

## 🎨 Customization

### Change Menu Position:
The menu automatically positions at cursor. To offset:
```typescript
setContextMenu({
  x: event.clientX + 10,  // Add offset
  y: event.clientY + 10,
})
```

### Add More Menu Items:
Edit `ContextMenu.tsx` and add:
```typescript
<button
  className="context-menu-item"
  onClick={() => handleCustomAction(target)}
>
  <span className="menu-icon">🔥</span>
  Custom Action
</button>
```

### Change Colors:
Edit `ContextMenu.css`:
```css
.context-menu {
  background: linear-gradient(135deg, #your-color 0%, #your-color2 100%);
  border: 2px solid rgba(your-color, 0.3);
}
```

---

## 📚 Related Documentation

- `HOW_TO_USE_AGENTS.md` - AI agent integration guide
- `CONTEXT_MENU_IMPLEMENTATION.md` - Technical implementation details
- `packages/visual-studio/src/ai/agentTypes.ts` - Agent type definitions
- `packages/visual-studio/src/ai/agentRuntime.ts` - Agent execution

---

**Status**: ✅ Fully Implemented and Working
**Version**: 1.0.0
**Last Updated**: Canvas context menu with AI agent integration
