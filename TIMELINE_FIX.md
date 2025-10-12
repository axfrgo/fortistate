# Timeline Not Showing Updates - Fix Applied

## Problem
The timeline wasn't displaying store changes even after values were updated in the demo app.

## Root Cause
The `/history` endpoint requires authentication (Observer role), but the `loadHistory()` function wasn't sending the inspector token in the request headers.

## Fixes Applied

### 1. Added Authentication to loadHistory()
**File**: `src/client/inspectorClient.ts`

**Before**:
```javascript
async function loadHistory() {
  try {
    const res = await fetch('/history')
    if (!res.ok) return
    historyEntries = await res.json()
    renderHistory()
  } catch (e) { console.debug('history load', e && e.message) }
}
```

**After**:
```javascript
async function loadHistory() {
  try {
    const headers = {}
    if (inspectorToken) {
      headers['x-fortistate-token'] = inspectorToken
      headers['Authorization'] = 'Bearer ' + inspectorToken
    }
    const res = await fetch('/history', { headers })
    if (!res.ok) {
      console.debug('history load failed:', res.status, res.statusText)
      return
    }
    historyEntries = await res.json()
    renderHistory()
  } catch (e) { 
    console.debug('history load error:', e && e.message) 
  }
}
```

### 2. Enhanced renderHistory() Function

**Improvements**:
- Added empty state message when no history entries exist
- Better styling for history entries (matching inspector theme)
- Hover effects on timeline items
- Entry counter in status display
- Console logging for debugging

**Features**:
```javascript
function renderHistory() {
  // Shows empty state if no entries
  if (historyEntries.length === 0) {
    container.innerHTML = '<div class="empty-state">
      <div class="empty-state-icon">⏱️</div>
      <div class="empty-state-title">No history yet</div>
      <div class="empty-state-description">Store changes will appear here</div>
    </div>'
    return
  }
  
  // Styled entries with hover effects
  // Status counter shows total entries
  // Click handlers for replay
}
```

### 3. Enhanced WebSocket Handler

**Added Debug Logging**:
```javascript
if (msg.type === 'history:add' && msg.entry) {
  console.debug('[inspector.client] History update received:', msg.entry)
  historyEntries.push(msg.entry)
  // ...
  if (timelinePanel && timelinePanel.style.display !== 'none') {
    console.debug('[inspector.client] Timeline visible, re-rendering')
    renderHistory()
  }
}
```

## How to Verify the Fix

### Step 1: Start Services
```powershell
# Terminal 1: Start inspector
npm run inspect

# Terminal 2: Start demo app
cd examples\my-nextjs-app
npm run dev
```

### Step 2: Open Both Apps
- Inspector: `http://localhost:4000`
- Demo: `http://localhost:3000`

### Step 3: Test Timeline
1. Open inspector
2. Click "⏱️ Timeline" button
3. You should see either:
   - Empty state: "No history yet" (if no updates yet)
   - History entries (if inspector was already receiving updates)

### Step 4: Generate Updates
1. Go to Space Shooter demo
2. Click buttons to move player, spawn enemies, etc.
3. Watch the timeline in real-time

### Step 5: Check Console
Open browser console (F12) and look for:
```
[inspector.client] History update received: {action: "change", ts: 1696607923000, ...}
[inspector.client] Timeline visible, re-rendering
[inspector.client] Rendering history: 5 entries
```

## Debugging Checklist

### If Timeline is Still Empty

1. **Check Authentication**:
   ```javascript
   // In browser console
   localStorage.getItem('fortistate-inspector-token')
   ```
   Should show a token value.

2. **Check /history Endpoint**:
   ```javascript
   // In browser console
   fetch('http://localhost:4000/history', {
     headers: {
       'x-fortistate-token': localStorage.getItem('fortistate-inspector-token')
     }
   }).then(r => r.json()).then(console.log)
   ```
   Should return an array of history entries.

3. **Check WebSocket Connection**:
   - Open browser console
   - Look for: `[inspector.client] ws open localhost:4000`
   - If not present, WebSocket isn't connecting

4. **Check Server-Side History Recording**:
   ```javascript
   // Make a change
   fetch('http://localhost:4000/change', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-fortistate-token': localStorage.getItem('fortistate-inspector-token')
     },
     body: JSON.stringify({key: 'test', value: {foo: 'bar'}})
   })
   
   // Then check history
   fetch('http://localhost:4000/history', {
     headers: {
       'x-fortistate-token': localStorage.getItem('fortistate-inspector-token')
     }
   }).then(r => r.json()).then(console.log)
   ```

5. **Check Inspector Server Logs**:
   Look for errors in the terminal running `npm run inspect`

### Common Issues

#### Issue: "401 Unauthorized" when loading history
**Solution**: Token not set or expired. Try:
1. Restart inspector: `npm run inspect`
2. Refresh browser
3. Check if `.fortistate-inspector-token` file exists

#### Issue: Timeline opens but shows "No history yet" forever
**Possible Causes**:
- WebSocket not connected (check console for ws errors)
- Server not recording history (check if `recordHistory()` is being called)
- Demo app not sending updates to inspector

**Solution**:
1. Check browser console for WebSocket connection
2. Verify demo app is using `/api/fortistate/change` endpoint
3. Check network tab for POST requests to `/change`

#### Issue: History loads initially but doesn't update in real-time
**Possible Causes**:
- WebSocket disconnected
- Timeline panel was closed when updates arrived

**Solution**:
1. Close and reopen timeline panel (triggers loadHistory())
2. Check WebSocket connection in console
3. Reload page to reconnect WebSocket

## Technical Details

### Authentication Flow
```
Client Opens Timeline
  ↓
loadHistory() called
  ↓
Fetch with token headers
  ↓
Server validates token (Observer role)
  ↓
Returns history buffer
  ↓
renderHistory() displays entries
```

### Real-Time Updates
```
Demo App Updates Store
  ↓
POST /change with value
  ↓
Server: recordHistory('change', ...)
  ↓
Server: Broadcast via WebSocket
  ↓
Client: ws.onmessage receives history:add
  ↓
Client: historyEntries.push(entry)
  ↓
Client: renderHistory() if timeline visible
```

### History Entry Format
```json
{
  "action": "change" | "register",
  "ts": 1696607923000,
  "key": "gameState",
  "value": { ... } // for change
  "initial": { ... } // for register
}
```

## Files Changed

- `src/client/inspectorClient.ts`:
  - `loadHistory()` - Added authentication headers
  - `renderHistory()` - Added empty state and better styling
  - `ws.onmessage` - Added debug logging
  
- Build completed successfully with `npm run build`

## Next Steps

1. Restart both inspector and demo app
2. Open timeline panel
3. Perform actions in demo
4. Watch history entries appear in real-time
5. Check console for debug messages

If issues persist, check the troubleshooting section above or examine the browser console for specific error messages.
