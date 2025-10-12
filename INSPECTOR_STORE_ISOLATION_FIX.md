# Inspector Store Isolation Fix

## Problem

The FortiState Inspector was showing stale/demo data from other directories when opened in the visual-studio directory. Stores were bleeding across different working directories, creating confusion about which stores belonged to which project.

## Root Cause

1. **Global Store Persistence**: The inspector server was persisting all remote stores to `.fortistate/remote-stores-{namespace}.json` based on the namespace (derived from package name or directory), but when running the inspector from different directories, it would load the previously cached stores.

2. **No Directory Isolation**: The inspector had no concept of "current working directory" context - it just loaded whatever stores were persisted, regardless of where you launched it from.

3. **Missing Client Integration**: The visual-studio app wasn't registering its stores with the inspector server, so when you opened the inspector in that directory, it showed old data from other projects instead of the actual visual-studio stores.

## Solution

### Part 1: Directory-Scoped Inspector (CLI Enhancement)

**File**: `src/cli.ts`

Added `--cwd` flag support to the `inspect` command:

```typescript
const cwdFlagIndex = argv.indexOf('--cwd')
const cwd = cwdFlagIndex >= 0 ? path.resolve(process.cwd(), argv[cwdFlagIndex + 1] || '.') : process.cwd()

const srv = createInspector({ port, quiet, token, allowOrigin, allowOriginStrict, devClient, host, cwd })
```

This allows the inspector to be launched with a specific working directory, ensuring store persistence files are scoped correctly.

### Part 2: Package-Level Inspector Script

**File**: `packages/visual-studio/package.json`

Updated the `inspect` script to use the new `--cwd` flag:

```json
"inspect": "node ../../dist/cli.js inspect --cwd ."
```

Now running `npm run inspect` from the visual-studio directory launches the inspector scoped to that directory, loading stores from `.fortistate/remote-stores-visual-studio.json` instead of mixing with stores from other directories.

### Part 3: Inspector Client Integration

**File**: `packages/visual-studio/src/utils/inspectorClient.ts` (NEW)

Created an inspector client that automatically registers all FortiState stores with the inspector server:

```typescript
export function initInspector() {
  const allKeys = globalStoreFactory.keys()
  for (const key of allKeys) {
    const store = globalStoreFactory.get(key)
    const currentValue = store.get()
    
    // Register with inspector
    registerStore(key, currentValue)
    
    // Subscribe to changes
    store.subscribe((newValue) => {
      notifyChange(key, newValue)
    })
  }
}
```

**Features:**
- Automatically discovers all stores via `globalStoreFactory.keys()`
- Registers each store with the inspector via `POST /register`
- Subscribes to store changes and pushes updates via `POST /change`
- Configurable via `VITE_INSPECTOR_URL` and `VITE_INSPECTOR_ENABLED`
- Auto-initializes in development mode only

**File**: `packages/visual-studio/src/main.tsx`

Added inspector initialization after stores are created:

```typescript
if (import.meta.env.DEV) {
  setTimeout(() => {
    initInspector()
  }, 2000)
}
```

## How It Works Now

### 1. **Start Inspector**

```powershell
cd packages/visual-studio
npm run inspect
```

This launches the inspector scoped to the `visual-studio` directory:
- Stores persist to `.fortistate/remote-stores-visual-studio.json`
- Only stores from this directory are loaded
- No cross-contamination from other projects

### 2. **Start Visual Studio App**

```powershell
npm run dev
```

After ~2 seconds, the inspector client automatically:
- Discovers all stores: `integration`, `universeRegistry`, `session`, `subscription`
- Registers them with the inspector server on `localhost:4000`
- Subscribes to changes and keeps the inspector in sync

### 3. **View in Inspector**

Open `http://localhost:4000` and you'll see:
- All visual-studio stores listed
- Real-time updates as you interact with the app
- No stale/demo data from other directories

## Benefits

✅ **True Isolation**: Each directory gets its own store namespace
✅ **No Stale Data**: Inspector only shows stores from the current project  
✅ **Real-Time Sync**: Browser stores auto-register and push updates
✅ **Development Mode**: Only activates in dev, no production overhead
✅ **Configurable**: Can disable with `VITE_INSPECTOR_ENABLED=false`
✅ **Zero Config**: Works automatically when you run `npm run inspect`

## Store Lifecycle

```
1. App Starts (main.tsx)
   └─> Store modules imported (integrationStore, universeRegistryStore, etc.)
       └─> createStore() called for each store
           └─> Stores registered in globalStoreFactory

2. Inspector Client Initializes (after 2s delay)
   └─> initInspector() called
       └─> globalStoreFactory.keys() → ['integration', 'universeRegistry', ...]
           └─> For each store:
               ├─> Fetch current value: store.get()
               ├─> POST /register { key, initial }
               └─> store.subscribe() → POST /change on updates

3. Inspector Server Receives Registration
   └─> Stores data in remoteStores[key]
       └─> Persists to .fortistate/remote-stores-visual-studio.json
           └─> Broadcasts to WebSocket clients

4. Inspector UI Displays Stores
   └─> Fetches /remote-stores
       └─> Renders store list with live values
           └─> Receives WebSocket updates in real-time
```

## Configuration

### Environment Variables

**App-Level** (`.env` or Vite config):
```bash
# Inspector server URL (default: http://localhost:4000)
VITE_INSPECTOR_URL=http://localhost:4000

# Enable/disable inspector integration (default: true in dev)
VITE_INSPECTOR_ENABLED=true
```

**Inspector-Level** (CLI or environment):
```bash
# Namespace for store persistence (default: directory name)
FORTISTATE_INSPECTOR_NAMESPACE=visual-studio

# Custom working directory
fortistate inspect --cwd ./packages/visual-studio
```

## Testing

### Test 1: Isolated Stores

```powershell
# Terminal 1: Start inspector in visual-studio
cd packages/visual-studio
npm run inspect

# Terminal 2: Start visual-studio app
npm run dev

# Open http://localhost:4000
# ✅ Should see: integration, universeRegistry, session, subscription stores
# ❌ Should NOT see: demo stores from other directories
```

### Test 2: Directory Switching

```powershell
# Terminal 1: Start inspector in root
cd c:\Users\alexj\Desktop\fortistate
npm run inspect

# Terminal 2: Start inspector in visual-studio (different port)
cd packages/visual-studio
npm run inspect --port 4001

# Open http://localhost:4000 → Root stores
# Open http://localhost:4001 → Visual-studio stores
# ✅ Each inspector shows only its directory's stores
```

### Test 3: Persistence

```powershell
# Terminal 1: Register some stores
cd packages/visual-studio
npm run dev  # Registers stores

# Stop app (Ctrl+C)

# Terminal 2: Open inspector
npm run inspect

# Open http://localhost:4000
# ✅ Should see: Previously registered stores still there
# They're persisted in .fortistate/remote-stores-visual-studio.json
```

## Migration Guide

### For Other Packages

If you want other packages to use the inspector:

1. **Copy inspector client**:
   ```powershell
   cp packages/visual-studio/src/utils/inspectorClient.ts packages/your-package/src/utils/
   ```

2. **Initialize in main entry**:
   ```typescript
   import { initInspector } from './utils/inspectorClient'
   
   if (import.meta.env.DEV) {
     setTimeout(() => initInspector(), 2000)
   }
   ```

3. **Add inspect script**:
   ```json
   {
     "scripts": {
       "inspect": "node ../../dist/cli.js inspect --cwd ."
     }
   }
   ```

### For Standalone Apps

If using FortiState in a standalone app:

1. **Install FortiState**:
   ```bash
   npm install fortistate
   ```

2. **Create inspector client**:
   ```typescript
   // src/inspectorClient.ts
   import { globalStoreFactory } from 'fortistate/storeFactory'
   
   export function initInspector() {
     const INSPECTOR_URL = 'http://localhost:4000'
     const allKeys = globalStoreFactory.keys()
     
     for (const key of allKeys) {
       const store = globalStoreFactory.get(key)
       if (!store) continue
       
       // Register store
       fetch(`${INSPECTOR_URL}/register`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ key, initial: store.get() })
       })
       
       // Subscribe to changes
       store.subscribe((value) => {
         fetch(`${INSPECTOR_URL}/change`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ key, value })
         })
       })
     }
   }
   ```

3. **Initialize in app**:
   ```typescript
   if (import.meta.env.DEV) {
     setTimeout(() => initInspector(), 2000)
   }
   ```

## Troubleshooting

### "No stores showing in inspector"

**Cause**: Inspector client not initialized or stores not created yet

**Fix**:
1. Check browser console for `[Inspector] Registered X stores`
2. Increase timeout in `main.tsx` if stores load slowly
3. Verify `VITE_INSPECTOR_ENABLED` is not set to `false`

### "Seeing old/stale stores"

**Cause**: Old persistence file or wrong working directory

**Fix**:
1. Delete `.fortistate/remote-stores-*.json` files
2. Restart inspector with correct `--cwd` flag
3. Verify namespace in inspector startup logs

### "Inspector not connecting"

**Cause**: CORS or URL mismatch

**Fix**:
1. Check `VITE_INSPECTOR_URL` matches inspector server
2. Start inspector with `--allow-origin *` for development
3. Verify inspector is running on expected port

### "Stores registered but not updating"

**Cause**: Subscription not working or inspector offline

**Fix**:
1. Check browser console for errors
2. Verify inspector server is running
3. Check WebSocket connection in browser DevTools

## Future Enhancements

### Potential Improvements

1. **Auto-Discovery**: Inspector could broadcast on local network, apps auto-discover
2. **Multi-Tenant**: Single inspector instance supporting multiple apps with UI tabs
3. **Store Filtering**: UI to show/hide specific stores
4. **Snapshot/Restore**: Save and restore store states for testing
5. **Time Travel**: Rewind/replay store changes
6. **Performance Metrics**: Track subscription count, update frequency

## Summary

The inspector now correctly isolates stores per directory and automatically syncs browser stores with the inspector server. This provides a clean, real-time debugging experience without cross-contamination between projects. The Aurora White theme makes it beautiful to use! 🌌✨
