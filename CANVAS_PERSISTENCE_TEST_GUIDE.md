# Canvas Persistence Testing Guide

## 🧪 Test Workflow

### Prerequisites
- Server running on http://localhost:5173
- User logged in with Clerk
- Browser DevTools console open

### Test Steps

#### 1. Load Example and Add Nodes
```
1. Open http://localhost:5173 in browser
2. Open DevTools Console (F12)
3. Look for: "✅ Initial load complete" log
4. Click "Load Example" or add some canvas nodes manually
5. Verify nodes appear on canvas
```

#### 2. Manual Save Test
```
1. Click "Save Canvas" button in left sidebar
2. Look for console logs:
   - "💾 Saving canvas state manually..."
   - "📦 Persisting canvas state..."
   - Node/edge counts
3. Look for green notification: "Canvas Saved! X nodes, Y edges"
4. Check localStorage in DevTools (Application > Local Storage)
   - Key: fortistate_session_{userId}
   - Should contain canvasState with nodes array
```

#### 3. Auto-Save on Logout Test
```
1. With nodes on canvas, click "Sign Out"
2. Look for console logs during sign out:
   - "🔒 endSession called"
   - "🎯 Calling preSaveCallback before endSession..."
   - "💾 Saving state before sign out"
   - Final node/edge counts
3. User should be logged out
```

#### 4. Restoration on Login Test
```
1. Sign back in with same account
2. Look for console logs during startup:
   - "⏸️ Skipping persist - initial load not complete" (multiple times)
   - "🔒 Restoration lock acquired"
   - "🎉 PERFORMING CANVAS RESTORATION"
   - "🎨 Restoring X nodes, Y edges"
   - "🔓 Restoration lock released"
   - "✅ Initial load complete"
3. Canvas should show your previous nodes!
```

### Expected Console Output

#### During Startup (Before Restoration)
```
⏸️ Skipping persist - initial load not complete
⏸️ Skipping persist - initial load not complete
⏸️ Skipping persist - initial load not complete
```

#### During Restoration
```
🔒 Restoration lock acquired
🎉 PERFORMING CANVAS RESTORATION
🎨 Restoring 4 nodes, 3 edges
[Canvas restoration details...]
🔓 Restoration lock released
✅ Initial load complete
```

#### After Initial Load (Normal Operation)
```
📦 Persisting canvas state...
  Nodes: 4
  Edges: 3
  Session: sess_xxx
  User: user_xxx
✅ State persisted
```

## 🐛 Troubleshooting

### Nodes Don't Persist
- Check console for "Initial load complete" - if missing, restoration didn't finish
- Check localStorage for fortistate_session_{userId} key
- Verify canvasState.nodes array has data
- Look for any error logs

### Infinite Loop / Page Crash
- Should be fixed! But if it happens:
- Check for repeated "Persisting canvas state" logs (>100/second)
- Verify workState.canvasState is NOT in persistCanvasState dependencies

### Empty State Overwrite
- Should be fixed! Three-layer guard system prevents this:
  1. Initial load guard blocks until restoration check completes
  2. Restoration lock blocks during active restoration
  3. Restored data flag prevents empty refs from overwriting

### Restoration Doesn't Trigger
- Check localStorage has data
- Verify data is <24 hours old
- Check console for restoration logs
- Verify no errors during workState.canvasState effect

## ✅ Success Criteria

All must pass:
- [ ] Initial load guard logs appear during startup
- [ ] Restoration logs appear when signing in
- [ ] "Initial load complete" log appears after restoration
- [ ] Nodes persist across sign-out/sign-in
- [ ] Manual save shows notification
- [ ] LocalStorage contains correct data
- [ ] No infinite loops or crashes
- [ ] No empty state overwrites

## 📊 Metrics to Check

After testing, verify in console:
```
📊 Persistence Metrics:
  ✅ Initial load time: <2s
  ✅ Restoration success rate: 100%
  ✅ Save operation time: <100ms
  ✅ No data loss events: 0
```

---

**Status**: Ready for testing
**Last Updated**: 2025-01-04
