# Temporal Migration Guide

## Overview

Fortistate v2.0 introduces **temporal infrastructure** — the foundation for time-travel debugging, branching universes, and the cosmogenesis engine. This guide helps you migrate from `Store<T>` to `CausalStore<T>`.

## Key Concepts

### Before (v1.x): Simple State
```typescript
import { createStore, useStore } from 'fortistate'

const counter = createStore({ value: 0 })
counter.set({ value: 1 })  // Simple state change
```

### After (v2.0): Causal State
```typescript
import { createStore } from 'fortistate'
import { createCausalStore } from 'fortistate/temporal'

const baseStore = createStore({ value: 0 })
const counter = createCausalStore(baseStore, 'counter')

counter.set({ value: 1 })  // Recorded as CausalEvent

// Time travel
const pastValue = counter.at(Date.now() - 1000)  // State 1 second ago

// Branching
const experimentBranch = counter.branch('experiment')

// Query history
const recentEvents = counter.between(Date.now() - 5000, Date.now())
```

## Migration Strategies

### Strategy 1: Gradual Migration (Recommended)

**No breaking changes** — `CausalStore<T>` extends `Store<T>`, so existing code works unchanged.

```typescript
// Before
import { createStore } from 'fortistate'
const counter = createStore({ value: 0 })

// After (backward compatible)
import { createStore } from 'fortistate'
import { createCausalStore } from 'fortistate/temporal'

const baseStore = createStore({ value: 0 })
const counter = createCausalStore(baseStore, 'counter')

// All existing code still works!
counter.get()  // ✅
counter.set({ value: 5 })  // ✅
counter.subscribe(fn)  // ✅
```

### Strategy 2: Opt-in Temporal Features

Add temporal capabilities only where needed:

```typescript
import { createStore } from 'fortistate'
import { createCausalStore, isCausalStore } from 'fortistate/temporal'

// Regular stores for simple state
const theme = createStore({ mode: 'dark' })

// Causal stores for complex state
const gameState = createCausalStore(
  createStore({ score: 0, level: 1 }),
  'gameState'
)

// Use type guards
if (isCausalStore(gameState)) {
  const history = gameState.history  // ✅ TypeScript knows this exists
}
```

### Strategy 3: Global Factory Upgrade

Wrap the global store factory to make all stores causal by default:

```typescript
// fortistate.config.ts
import { globalStoreFactory } from 'fortistate'
import { createCausalStore } from 'fortistate/temporal'

const originalCreate = globalStoreFactory.create.bind(globalStoreFactory)

globalStoreFactory.create = function<T>(key: string, config: any) {
  const baseStore = originalCreate(key, config)
  return createCausalStore(baseStore, key) as any
}

// Now all stores are automatically causal!
```

## Feature-by-Feature Migration

### 1. Time Travel

**Before**: Manual undo/redo stack
```typescript
const history: any[] = []
const historyIndex = 0

function undo() {
  if (historyIndex > 0) {
    historyIndex--
    counter.set(history[historyIndex])
  }
}
```

**After**: Built-in time travel
```typescript
const counter = createCausalStore(createStore({ value: 0 }), 'counter')

// Jump to any timestamp
const pastState = counter.at(Date.now() - 5000)

// Jump to specific event
const stateAtEvent = counter.atEvent(eventId)

// Query time range
const last5Minutes = counter.between(
  Date.now() - 5 * 60 * 1000,
  Date.now()
)
```

### 2. Branching & Experimentation

**Before**: Manual cloning
```typescript
const originalState = counter.get()
const experimentState = { ...originalState }

// Try something
experimentState.value = 100

// Revert manually
counter.set(originalState)
```

**After**: Universe branching
```typescript
const counter = createCausalStore(createStore({ value: 0 }), 'counter')

// Create parallel universe
const experimentUniverse = counter.branch('experiment')

// Make changes in experiment
counter.switchBranch(experimentUniverse)
counter.set({ value: 100 })

// Compare results
const mainState = counter.at(Date.now())  // In experiment branch
counter.switchBranch('universe-main')
const originalState = counter.get()  // Back to main

// Merge if successful
counter.merge(experimentUniverse, 'theirs')
```

### 3. Causality Tracking

**Before**: No built-in causality
```typescript
// Manual logging
function logChange(source: string) {
  console.log(`Changed by: ${source}`)
  counter.set({ value: counter.get().value + 1 })
}
```

**After**: Automatic causality
```typescript
const counter = createCausalStore(
  createStore({ value: 0 }),
  'counter',
  { observerId: 'user-123' }
)

counter.set({ value: 1 })  // Auto-records observer

// Query who caused what
const userEvents = counter.query({
  observerIds: ['user-123']
})

// Trace causal chain
const descendants = counter.causedBy(eventId)
```

### 4. Audit & Compliance

**Before**: Manual audit logs
```typescript
const auditLog: any[] = []

function auditedSet(value: any) {
  auditLog.push({
    timestamp: Date.now(),
    value,
    user: getCurrentUser()
  })
  counter.set(value)
}
```

**After**: Built-in audit trail
```typescript
const counter = createCausalStore(createStore({ value: 0 }), 'counter')

// Full immutable history
const fullHistory = counter.history

// Export for compliance
const auditExport = counter.exportHistory()
fs.writeFileSync('audit-trail.json', auditExport)

// Prove state at specific time
const stateAt = counter.at(complianceTimestamp)
```

## React Integration

### Hooks with Temporal Features

```typescript
import { useStore } from 'fortistate'
import { createCausalStore } from 'fortistate/temporal'
import { useState, useEffect } from 'react'

const counter = createCausalStore(createStore({ value: 0 }), 'counter')

function TimeTravelCounter() {
  const [state, setState] = useStore(counter)
  const [scrubPosition, setScrubPosition] = useState(Date.now())
  
  // Show state at scrub position
  const scrubValue = counter.at(scrubPosition)
  
  return (
    <div>
      <div>Current: {state.value}</div>
      <div>At scrub: {scrubValue?.value}</div>
      
      <input
        type="range"
        min={counter.history[0]?.timestamp || 0}
        max={Date.now()}
        value={scrubPosition}
        onChange={(e) => setScrubPosition(Number(e.target.value))}
      />
      
      <button onClick={() => setState(s => ({ value: s.value + 1 }))}>
        Increment
      </button>
    </div>
  )
}
```

### Branching UI

```typescript
function BranchingApp() {
  const [state, setState] = useStore(counter)
  const [branches, setBranches] = useState(counter.listBranches())
  
  const createExperiment = () => {
    const branchId = counter.branch('experiment-' + Date.now())
    setBranches(counter.listBranches())
    counter.switchBranch(branchId)
  }
  
  return (
    <div>
      <h2>Current Universe: {counter.currentUniverse}</h2>
      
      <select onChange={(e) => counter.switchBranch(e.target.value)}>
        {branches.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      
      <button onClick={createExperiment}>Create Experiment</button>
      
      <div>Value: {state.value}</div>
      <button onClick={() => setState(s => ({ value: s.value + 1 }))}>
        Increment
      </button>
    </div>
  )
}
```

## Performance Considerations

### Memory Usage

Causal stores maintain full history. For long-running apps:

```typescript
// Option 1: Periodic cleanup (lose old history)
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000  // 24 hours
  counter.history = counter.history.filter(e => e.timestamp > cutoff)
}, 60 * 60 * 1000)  // Every hour

// Option 2: Snapshot & archive
const snapshot = counter.exportHistory()
await saveToStorage(snapshot)
counter.importHistory('[]')  // Clear local history
```

### Computational Overhead

- **Event creation**: ~0.1ms (negligible)
- **Graph building**: ~10ms per 10k events (lazy, cached)
- **Time queries**: ~1ms per 1k events (indexed)

**Recommendation**: Use causal stores for:
- ✅ Critical state (user data, transactions)
- ✅ Debugging-heavy features
- ❌ High-frequency state (e.g., mouse position at 60fps)

## Testing with Causal Stores

```typescript
import { describe, it, expect } from 'vitest'
import { createStore } from 'fortistate'
import { createCausalStore } from 'fortistate/temporal'

describe('Time travel counter', () => {
  it('should rewind to previous state', () => {
    const counter = createCausalStore(createStore({ value: 0 }), 'counter')
    
    counter.set({ value: 1 })
    const timestamp1 = Date.now()
    
    counter.set({ value: 2 })
    counter.set({ value: 3 })
    
    // Time travel back
    const stateAt1 = counter.at(timestamp1)
    expect(stateAt1?.value).toBe(1)
  })
  
  it('should support branching', () => {
    const counter = createCausalStore(createStore({ value: 0 }), 'counter')
    
    counter.set({ value: 1 })
    const branchId = counter.branch('experiment')
    
    counter.switchBranch(branchId)
    counter.set({ value: 100 })
    
    counter.switchBranch('universe-main')
    expect(counter.get().value).toBe(1)  // Main unchanged
  })
})
```

## Next Steps

1. **Try the examples**: See `examples/temporal/` for complete demos
2. **Explore entropy**: Use `measureEntropy()` to understand state complexity
3. **Define constraints**: Use `substrate.ts` to enforce "laws of nature"
4. **Await Phase 2**: Multiversal inspector UI (coming Month 3-4)

## Getting Help

- **Discord**: [Join the Fortistate community](#)
- **GitHub Discussions**: [Ask questions](https://github.com/axfrgo/fortistate/discussions)
- **Docs**: [Read the full guide](https://fortistate.dev/temporal)

---

**Welcome to the temporal era of state management!** 🌌
