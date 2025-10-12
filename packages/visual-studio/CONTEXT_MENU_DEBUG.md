# Context Menu Click Debugging Guide

## ✅ Fixes Applied

### Problem: Buttons visible but nothing happens when clicked

### Root Causes Found:
1. **No logging** - Couldn't track if clicks were registering
2. **Silent failures** - Errors weren't being reported properly
3. **Target checks** - Empty canvas clicks were silently ignored
4. **Missing error details** - Generic error messages without specifics

### Solutions Implemented:

#### 1. **Comprehensive Logging** (ContextMenu.tsx)
```typescript
// Every button click now logs:
🛡️ Custodian button clicked
🔘 Menu item clicked { hasTarget: true, target: {...} }
✅ Calling action with target
```

#### 2. **Better Error Handling** (ContextMenu.tsx)
```typescript
handleMenuClick now:
- Logs every click
- Shows alert if no target (empty canvas)
- Catches and displays all errors
- Always closes menu after action
```

#### 3. **Detailed Agent Logging** (Canvas.tsx)
```typescript
Each agent handler now logs:
🛡️ [CUSTODIAN] Handler called with target
🛡️ [CUSTODIAN] Spawning agent...
🛡️ [CUSTODIAN] Agent spawned successfully
🛡️ [CUSTODIAN] Executing agent...
🛡️ [CUSTODIAN] Agent executed, result: {...}
```

#### 4. **Error Messages with Details**
All error alerts now show the actual error message:
```
Custodian agent is not available. This requires a local AI model setup.

Error: [actual error message here]
```

---

## 🧪 Testing Instructions

### Step 1: Open Browser Console
1. Start dev server: `npm run dev` in `packages/visual-studio`
2. Open browser to Visual Studio
3. Press **F12** to open DevTools
4. Go to **Console** tab

### Step 2: Test Context Menu
1. **Right-click on empty canvas**
   
   Expected logs:
   ```
   🎯 ContextMenu rendered: { x: 123, y: 456, hasNode: false, hasEdge: false, hasTarget: false, ... }
   ```

2. **Right-click on a node**
   
   Expected logs:
   ```
   🎯 ContextMenu rendered: { x: 123, y: 456, hasNode: true, hasEdge: false, hasTarget: true, nodeLabel: "law-1", ... }
   ```

### Step 3: Click a Menu Item

#### Test 1: Click "Ask Custodian to Review"
Expected console output:
```
🛡️ Custodian button clicked
🔘 Menu item clicked { hasTarget: true, target: {...} }
✅ Calling action with target
🛡️ [CUSTODIAN] Handler called with target: { id: "law-1", ... }
🛡️ [CUSTODIAN] Target type: law-1 hasData: true
🛡️ [CUSTODIAN] Spawning agent...
🛡️ [CUSTODIAN] Agent spawned successfully
🛡️ [CUSTODIAN] Executing agent...
🛡️ [CUSTODIAN] Agent executed, result: {...}
```

Then you should see an **alert dialog** with either:
- Success: "Custodian Analysis:\n\n[reasoning text]"
- Error: "Custodian agent is not available. This requires a local AI model setup.\n\nError: [error details]"

#### Test 2: Click "Explain with Narrator"
Expected console output:
```
📖 Narrator button clicked
🔘 Menu item clicked { hasTarget: true, target: {...} }
✅ Calling action with target
📖 [NARRATOR] Handler called with target: { id: "law-1", ... }
📖 [NARRATOR] Target type: law-1 hasData: true
📖 [NARRATOR] Spawning agent...
📖 [NARRATOR] Agent spawned successfully
📖 [NARRATOR] Executing agent...
📖 [NARRATOR] Agent executed, result: {...}
```

#### Test 3: Click "Explore Alternatives"
Expected console output:
```
🔮 Explorer button clicked
🔘 Menu item clicked { hasTarget: true, target: {...} }
✅ Calling action with target
🔮 [EXPLORER] Handler called with target: { id: "law-1", ... }
🔮 [EXPLORER] Target type: law-1 hasData: true
🔮 [EXPLORER] Spawning agent...
🔮 [EXPLORER] Agent spawned successfully
🔮 [EXPLORER] Executing agent...
🔮 [EXPLORER] Agent executed, result: {...}
```

---

## 🔍 Troubleshooting

### Issue: No logs appear when clicking
**Diagnosis**: Click not registering
**Check**:
1. Menu is visible on screen
2. Button has `className="context-menu-item"`
3. No CSS `pointer-events: none`
4. No element blocking clicks (z-index issue)

**Quick Test**:
```javascript
// In console
document.querySelector('.context-menu-item')?.click()
```
If this shows logs, CSS is blocking clicks.

### Issue: "🔘 Menu item clicked" appears but no handler logs
**Diagnosis**: Handler not connected or target is null
**Check console for**:
```
⚠️ No target available (empty canvas?)
```
**Solution**: Right-click directly on a node, not empty space.

### Issue: Handler logs appear but stops at "Spawning agent..."
**Diagnosis**: spawnAgent function failing
**Check**:
1. Is `agentRuntime.ts` file present?
2. Check error in console after "Spawning agent..."
3. Verify import: `import { spawnAgent } from '../ai/agentRuntime'`

**Quick Test**:
```typescript
// In Canvas.tsx, temporarily add:
console.log('spawnAgent function:', typeof spawnAgent)
// Should log: "spawnAgent function: function"
```

### Issue: "Agent spawned" but fails at "Executing agent..."
**Diagnosis**: Agent.execute() method failing
**Most Likely Cause**: This is expected! The agents are mocks until you set up real AI models.

**Expected Error**:
```
❌ [CUSTODIAN] Error: Agent execution not implemented (requires local model)
```

**This is NORMAL** - the agents need local AI models to actually work.

### Issue: Alert shows but with generic error
**Diagnosis**: Error not being caught properly
**Now Fixed**: All errors now show specific error messages in the alert.

### Issue: Nothing happens at all - no logs, no menu, nothing
**Diagnosis**: Context menu not rendering
**Check**:
1. `contextMenu` state is set when right-clicking
2. Add log in Canvas.tsx at context menu handlers:
   ```typescript
   const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
     console.log('🎯 onNodeContextMenu called', node)
     event.preventDefault()
     setContextMenu({ x: event.clientX, y: event.clientY, node })
   }, [])
   ```

---

## 📊 Expected Flow Diagram

```
User Right-Click
    ↓
onNodeContextMenu fires
    ↓
setContextMenu({ x, y, node })
    ↓
<ContextMenu> renders
    ↓
🎯 ContextMenu rendered (log)
    ↓
User clicks button
    ↓
🛡️ Button clicked (log)
    ↓
handleMenuClick called
    ↓
🔘 Menu item clicked (log)
    ↓
✅ Calling action (log)
    ↓
handleAskCustodian/Narrator/Explorer called
    ↓
🛡️ [AGENT] Handler called (log)
    ↓
🛡️ [AGENT] Spawning agent (log)
    ↓
spawnAgent() executes
    ↓
🛡️ [AGENT] Agent spawned (log)
    ↓
🛡️ [AGENT] Executing agent (log)
    ↓
agent.execute() runs
    ↓
Either:
  SUCCESS → Alert with result
  ERROR → Alert with error details
    ↓
Menu closes
```

---

## 🎯 What You Should See Now

### When clicking ANY menu item:

1. **Console shows complete flow**:
   - Button click log
   - Menu item clicked log
   - Handler called log
   - Agent spawning log
   - Agent execution log
   - Result/error log

2. **Alert dialog appears** with:
   - Success message (if models are set up), OR
   - Detailed error message explaining what failed

3. **Menu closes** automatically

### If you see NO logs:
- Check if dev server reloaded the new code
- Hard refresh browser (Ctrl+Shift+R)
- Check console for any React errors
- Verify files were saved

---

## 🚀 Quick Verification Script

Paste this in browser console after right-clicking:

```javascript
// Check if context menu exists
const menu = document.querySelector('.context-menu')
console.log('Menu exists:', !!menu)

// Check if buttons exist
const buttons = document.querySelectorAll('.context-menu-item')
console.log('Button count:', buttons.length)

// Check if buttons have click handlers
buttons.forEach((btn, i) => {
  console.log(`Button ${i} has onclick:`, !!btn.onclick)
})

// Try clicking first button
if (buttons[0]) {
  console.log('Simulating click on first button...')
  buttons[0].click()
}
```

Expected output:
```
Menu exists: true
Button count: 3
Button 0 has onclick: false (React uses addEventListener, this is OK)
Button 1 has onclick: false
Button 2 has onclick: false
Simulating click on first button...
🛡️ Custodian button clicked
🔘 Menu item clicked ...
```

---

## 📝 Files Modified

1. **ContextMenu.tsx**
   - Added comprehensive logging
   - Improved error handling
   - Better user feedback

2. **Canvas.tsx**
   - Added detailed agent logging
   - Enhanced error messages
   - Step-by-step execution tracking

---

## 💡 Next Steps

1. **Test the menu** - Follow testing instructions above
2. **Check console** - You should see ALL the logs now
3. **Send me the logs** - If still not working, copy/paste the console output
4. **Set up AI models** (optional) - To actually use the agents, see AI agent setup guide

---

**Status**: ✅ Debugging infrastructure added
**What to expect**: Detailed console logs showing exactly what's happening (or not happening)
**Next**: Test and send console output if issues persist
