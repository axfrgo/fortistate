# 🧩 Canvas Persistence Diagnostic System

## Overview
Comprehensive diagnostic logging has been added to track canvas persistence through the entire authentication and session lifecycle.

## 🔍 Diagnostic Categories

### 1. Authentication Flow
**Logs to watch:**
- `🔐 [DIAGNOSTIC] Auth status changed: {authState}`
- `👤 [DIAGNOSTIC] User signed in: {boolean}`
- `🆔 [DIAGNOSTIC] User ID: {userId}`
- `📧 [DIAGNOSTIC] User email: {email}`

**What to check:**
- Verify user authentication state transitions properly
- Confirm userId is captured correctly on login
- Check if auth state changes trigger unwanted resets

---

### 2. Session Start (Login)
**Logs to watch:**
- `🚀 [DIAGNOSTIC] startSession called`
- `👤 [DIAGNOSTIC] User ID: {userId}`
- `🆔 [DIAGNOSTIC] Clerk Session ID: {sessionId}`
- `🔐 [DIAGNOSTIC] Persistence method: localStorage`
- `🔄 [DIAGNOSTIC] Attempting to restore work state from storage...`
- `✅ [DIAGNOSTIC] Work state restoration successful`
- `📊 [DIAGNOSTIC] Restored canvas nodes: {count}`

**What to check:**
- Is `restoreWorkStateFromStorage()` being called?
- Does it find saved data in localStorage?
- Are canvas nodes being restored from storage?
- Is the data age within 24 hours?

---

### 3. State Initialization
**Logs to watch:**
- `🎨 [DIAGNOSTIC] Canvas state from workState:`
- `📊 [DIAGNOSTIC] {hasCanvasState, nodeCount, edgeCount, viewport}`

**What to check:**
- Is canvas state present in workState after login?
- Are node/edge counts matching what was saved?
- Is this state being overwritten somewhere?

---

### 4. Canvas State Changes (During Session)
**Logs to watch:**
- `🔍 [DIAGNOSTIC] persistCanvasState called`
- `📊 [DIAGNOSTIC] Current state - nodes: {X}, edges: {Y}`
- `👤 [DIAGNOSTIC] User ID: {userId}`
- `🆔 [DIAGNOSTIC] Session ID: {sessionId}`
- `💾 [DIAGNOSTIC] Serialized canvas state: {JSON}`
- `✅ [DIAGNOSTIC] updateWorkState called successfully`

**What to check:**
- Is `persistCanvasState()` being called when nodes/edges change?
- Are nodes and edges being serialized correctly?
- Is userId present when trying to save?

---

### 5. updateWorkState (State Updates)
**Logs to watch:**
- `📝 [DIAGNOSTIC] updateWorkState called`
- `📊 [DIAGNOSTIC] Updates: {hasCanvasState, canvasNodes, canvasEdges}`
- `📊 [DIAGNOSTIC] Current state before update: {currentCanvasNodes}`
- `📊 [DIAGNOSTIC] New state after update: {canvasNodes, canvasEdges}`
- `✅ [DIAGNOSTIC] Session store updated`
- `💾 [DIAGNOSTIC] Auto-saving to localStorage...`

**What to check:**
- Is the update actually containing canvas data?
- Is the session store being updated correctly?
- Is auto-save triggering immediately after update?

---

### 6. Save to localStorage
**Logs to watch:**
- `💾 [DIAGNOSTIC] saveWorkStateToStorage called`
- `👤 [DIAGNOSTIC] User ID: {userId}`
- `🔑 [DIAGNOSTIC] Storage key: fortistate_session_{userId}`
- `📦 [DIAGNOSTIC] Data to save: {canvasNodes, canvasEdges, sessionId}`
- `📝 [DIAGNOSTIC] Payload size: {X} characters`
- `✅ [DIAGNOSTIC] Successfully wrote to localStorage`
- `✅ [DIAGNOSTIC] Verification - canvas nodes in storage: {count}`
- `📊 [DIAGNOSTIC] Full persisted state: {JSON}`

**What to check:**
- Is the payload actually being written?
- Does verification confirm the data is in localStorage?
- Is the JSON structure correct?
- Are canvas nodes present in the persisted state?

---

### 7. Manual Save Button
**Logs to watch:**
- `🚀 [DIAGNOSTIC] Save Canvas button clicked`
- `👤 [DIAGNOSTIC] Current user: {userId}`
- `🆔 [DIAGNOSTIC] Current session: {sessionId}`
- `💾 [DIAGNOSTIC] Calling persistCanvasState...`
- `📝 [DIAGNOSTIC] Calling saveNow...`
- `✅ [DIAGNOSTIC] Canvas saved successfully - nodes: {X}, edges: {Y}`

**What to check:**
- Does clicking the button trigger the full save flow?
- Are all intermediate functions being called?
- Is the success notification appearing?

---

### 8. Session End (Logout)
**Logs to watch:**
- `🛑 [DIAGNOSTIC] endSession called`
- `🔄 [DIAGNOSTIC] Running pre-save callback...`
- `✅ [DIAGNOSTIC] Pre-save callback completed`
- `⏳ [DIAGNOSTIC] Waiting for state updates to settle...`
- `✅ [DIAGNOSTIC] State settled`
- `📊 [DIAGNOSTIC] Latest session state: {userId, sessionId, canvasNodes, canvasEdges}`
- `💾 [DIAGNOSTIC] Saving work state before logout...`
- `✅ [DIAGNOSTIC] Session ended successfully`

**What to check:**
- Is the pre-save callback running before logout?
- Does the "latest state" show canvas nodes?
- Is `saveWorkStateToStorage()` being called with data?

---

### 9. Canvas Restoration (After Login)
**Logs to watch:**
- `🔄 [DIAGNOSTIC] Restoration effect triggered`
- `🔍 [DIAGNOSTIC] workState.canvasState exists: {boolean}`
- `🔍 [DIAGNOSTIC] restoreSessionFn exists: {boolean}`
- `📊 [DIAGNOSTIC] Canvas state to restore: {sessionKey, nodeCount, edgeCount, viewport}`
- `🎉 [DIAGNOSTIC] PERFORMING CANVAS RESTORATION`
- `📝 [DIAGNOSTIC] Node details: [{id, type, pos}]`
- `✅ [DIAGNOSTIC] Canvas restoration complete`

**What to check:**
- Does workState have canvas data after login?
- Is the restoration function registered?
- Are nodes being passed to the restore function?
- Is the restoration actually being performed?

---

### 10. Error Handling
**Logs to watch:**
- `❌ [DIAGNOSTIC] Failed to save/load state: {error}`
- `🔍 [DIAGNOSTIC] Error stack: {stack trace}`
- `⚠️ [DIAGNOSTIC] No userId - skipping save`
- `⚠️ [DIAGNOSTIC] No saved data found in localStorage`
- `⚠️ [DIAGNOSTIC] Cannot restore - missing canvasState or restoreFn`

**What to check:**
- Are errors being caught and logged?
- Is userId missing when it should be present?
- Are there any exceptions being thrown?

---

## 🎯 Testing Workflow

### Test 1: Fresh Login (No Previous Data)
1. Clear localStorage in DevTools
2. Sign in
3. **Expected logs:**
   - `🚀 [DIAGNOSTIC] startSession called`
   - `⚠️ [DIAGNOSTIC] No saved data found in localStorage`
   - Canvas should be empty

### Test 2: Add Nodes and Save
1. Add 3-4 nodes to canvas
2. Click "💾 Save Canvas" button
3. **Expected logs:**
   - `🚀 [DIAGNOSTIC] Save Canvas button clicked`
   - `🔍 [DIAGNOSTIC] persistCanvasState called`
   - `📊 [DIAGNOSTIC] Current state - nodes: 3+`
   - `📝 [DIAGNOSTIC] updateWorkState called`
   - `💾 [DIAGNOSTIC] saveWorkStateToStorage called`
   - `✅ [DIAGNOSTIC] Verification - canvas nodes in storage: 3+`
4. Check Application > Local Storage in DevTools
5. Find key `fortistate_session_{your-user-id}`
6. Verify `workState.canvasState.nodes` array has 3+ items

### Test 3: Sign Out and Verify Persistence
1. With nodes on canvas, click sign out
2. **Expected logs:**
   - `🛑 [DIAGNOSTIC] endSession called`
   - `🔄 [DIAGNOSTIC] Running pre-save callback...`
   - `📊 [DIAGNOSTIC] Latest session state:` showing nodes count
   - `💾 [DIAGNOSTIC] Saving work state before logout...`
   - `✅ [DIAGNOSTIC] Verification - canvas nodes in storage: X`
3. Verify localStorage still has data after logout

### Test 4: Sign In and Restore
1. Sign in again
2. **Expected logs:**
   - `🚀 [DIAGNOSTIC] startSession called`
   - `🔄 [DIAGNOSTIC] Attempting to restore work state from storage...`
   - `✅ [DIAGNOSTIC] Work state restoration successful`
   - `📊 [DIAGNOSTIC] Restored canvas nodes: X`
   - `🔄 [DIAGNOSTIC] Restoration effect triggered`
   - `🎉 [DIAGNOSTIC] PERFORMING CANVAS RESTORATION`
   - `✅ [DIAGNOSTIC] Canvas restoration complete`
3. Verify nodes appear on canvas

### Test 5: Page Refresh (Without Logout)
1. Add nodes to canvas
2. Refresh the page (F5)
3. **Expected logs:**
   - Same as Test 4 (should restore from localStorage)

---

## 🚨 Common Issues and Solutions

### Issue: "No saved data found in localStorage"
**Possible causes:**
- User never saved or logged out
- localStorage was cleared
- Wrong userId being used as key
- Data expired (>24 hours old)

**Solution:**
- Check if `fortistate_session_{userId}` exists in localStorage
- Verify userId is consistent between save and load

### Issue: "Canvas nodes in storage: 0"
**Possible causes:**
- `persistCanvasState()` not being called before save
- `nodesRef.current` is empty
- Canvas state not being serialized correctly

**Solution:**
- Check logs for `🔍 [DIAGNOSTIC] persistCanvasState called`
- Verify `nodesRef.current.length` shows nodes
- Check `serializedState` in logs

### Issue: "Cannot restore - missing canvasState or restoreFn"
**Possible causes:**
- `workState.canvasState` is null/undefined
- Canvas component hasn't registered restore function
- Race condition in component mounting

**Solution:**
- Check if `startSession` logs show restored data
- Verify Canvas component is mounting and calling `onRestoreSession`
- Check restoration effect logs for timing issues

### Issue: Data saves but doesn't restore
**Possible causes:**
- localStorage has data but `restoreWorkStateFromStorage()` returns null
- `workState` is being overwritten after restoration
- Canvas restoration effect not triggering
- Wrong sessionKey comparison

**Solution:**
- Check localStorage JSON structure matches expected format
- Verify `wasRestored` flag is set correctly
- Check `lastRestoredSessionRef` vs current sessionId

---

## 📊 Storage Structure

Expected localStorage JSON structure:
```json
{
  "workState": {
    "canvasState": {
      "nodes": [
        {
          "id": "node-1",
          "type": "begin",
          "position": {"x": 100, "y": 100},
          "data": {...}
        }
      ],
      "edges": [
        {
          "id": "edge-1",
          "source": "node-1",
          "target": "node-2"
        }
      ],
      "viewport": {"x": 0, "y": 0, "zoom": 1}
    },
    "currentUniverseId": null,
    "openModals": [],
    ...
  },
  "sessionId": "sess_...",
  "savedAt": 1704326400000
}
```

---

## 🔧 Quick Debug Commands

Open browser console and run:

```javascript
// Check if localStorage has saved data
const userId = 'user_...'; // Get from logs
const key = `fortistate_session_${userId}`;
const data = JSON.parse(localStorage.getItem(key) || '{}');
console.log('Saved nodes:', data.workState?.canvasState?.nodes?.length);
console.log('Full data:', data);

// Clear saved data (for testing)
localStorage.removeItem(key);
```

---

## 📝 Log Interpretation Guide

| Emoji | Meaning |
|-------|---------|
| 🔍 | Diagnostic checkpoint |
| 📊 | Data snapshot |
| 👤 | User information |
| 🆔 | Session/ID information |
| 🚀 | Starting a major operation |
| 💾 | Saving to localStorage |
| 🔄 | Loading/restoring data |
| ✅ | Success |
| ❌ | Error/failure |
| ⚠️ | Warning (non-fatal issue) |
| 🎉 | Major success (restoration) |
| 🔐 | Authentication related |
| 📝 | Write operation |
| 📦 | Data package/payload |
| 🔑 | Key/identifier |
| ⏳ | Waiting/async operation |
| 🛑 | Stop/end operation |

---

## 📞 Support

If persistence still isn't working after checking all diagnostics:

1. Copy ALL console logs from the session
2. Export localStorage data from DevTools
3. Note the exact steps to reproduce
4. Share the diagnostic output for analysis

The comprehensive logging should pinpoint exactly where the persistence flow is breaking!
