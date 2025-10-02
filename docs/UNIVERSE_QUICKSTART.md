# Universe Manager - Quick Reference

> **TL;DR**: Orchestrate multiple causal stores as a unified universe with shared laws, lifecycle management, and multiverse support.

## Installation

```bash
npm install fortistate
```

## Basic Usage

```typescript
import { createUniverse } from 'fortistate';

// 1. Define substrate (laws of physics)
const substrate = {
  id: 'my-app',
  name: 'Application Rules',
  constraints: new Map([
    ['positive', {
      name: 'positive',
      invariants: [],
      validate: (v) => ({ 
        valid: v > 0, 
        message: v > 0 ? undefined : 'Must be positive' 
      }),
    }],
  ]),
  laws: new Map(),
};

// 2. Create universe
const universe = createUniverse({
  id: 'my-app',
  substrate,
});

// 3. Create stores
const counter = universe.createStore('counter', 0);
const user = universe.createStore('user', { name: 'Alice' });

// 4. Use normally
counter.set(42);
user.set({ name: 'Bob' });
```

## Common Patterns

### Energy Conservation

```typescript
const physicsLaw = defineLaw({
  name: 'energy-conservation',
  constraint: 'positive-energy',
  scope: ['kinetic', 'potential', 'total'],
  reaction: ({ context }) => {
    const ke = context.stores.get('kinetic')?.get() ?? 0;
    const pe = context.stores.get('potential')?.get() ?? 0;
    return {
      type: 'repair',
      changes: [{
        storeKey: 'total',
        value: ke + pe,
        reason: 'Energy must be conserved',
      }],
    };
  },
});
```

### Pause/Resume

```typescript
universe.pause();  // Stop enforcement
// Make risky changes...
universe.resume(); // Re-enable enforcement
```

### Snapshots

```typescript
const checkpoint = universe.snapshot();
// Make changes...
universe.restore(checkpoint); // Rollback
```

### Forking

```typescript
const fork = universe.fork('experiment-a');
fork.getStore('counter')?.set(999); // Independent
```

### Multiverse

```typescript
import { Multiverse } from 'fortistate';

const multiverse = new Multiverse();
multiverse.add(universe1);
multiverse.add(universe2);

multiverse.pauseAll();
multiverse.resumeAll();
multiverse.destroyAll();
```

## API Cheat Sheet

### UniverseManager

| Method | Description |
|--------|-------------|
| `start()` | Enable constraint enforcement |
| `pause()` | Disable enforcement |
| `resume()` | Resume enforcement |
| `destroy()` | Cleanup resources |
| `createStore<T>(key, initial)` | Create new store |
| `getStore<T>(key)` | Retrieve store |
| `hasStore(key)` | Check existence |
| `removeStore(key)` | Delete store |
| `getStoreKeys()` | List all keys |
| `getState()` | Current lifecycle state |
| `getStats()` | Statistics |
| `snapshot()` | Capture state |
| `restore(snapshot)` | Restore state |
| `fork(id, config?)` | Create divergent copy |
| `clone(suffix?)` | Quick fork |
| `getTelemetry()` | Law violations |
| `scan()` | Full constraint check |

### Multiverse

| Method | Description |
|--------|-------------|
| `add(universe)` | Add universe |
| `remove(id)` | Remove & destroy |
| `get(id)` | Retrieve universe |
| `getIds()` | All universe IDs |
| `getAll()` | All universes |
| `pauseAll()` | Pause all |
| `resumeAll()` | Resume all |
| `destroyAll()` | Cleanup all |
| `getStats()` | Aggregate statistics |

## Configuration

```typescript
interface UniverseConfig {
  id: UniverseId;              // Required: unique ID
  substrate: Substrate;         // Required: laws/constraints
  name?: string;               // Human-readable name
  initialStores?: Map<string, any>; // Pre-create stores
  laws?: Map<string, UniverseLaw[]>; // Override substrate laws
  autoRepair?: boolean;        // Auto-fix violations (default: true)
  applyReactions?: boolean;    // Cross-store effects (default: true)
  observerId?: ObserverId;     // Event attribution
  telemetrySink?: (e) => void; // Custom telemetry
  metadata?: Record<string, unknown>; // Custom properties
}
```

## Lifecycle States

```
initializing → start() → running
                          ↓ pause()
                        paused
                          ↓ resume()
                        running
                          ↓ destroy()
                       destroyed
```

## Examples

See:
- `examples/universe-demo.mjs` - Full interactive demo
- `examples/telemetry-demo.mjs` - Law enforcement with telemetry
- `test/universe.test.ts` - 33 test cases

## Documentation

- [Full API Reference](./UNIVERSE_MANAGER.md)
- [Constraint Auditor](./AUDITOR.md)
- [Laws & Reactions](./LAWS.md)
- [Telemetry](./TELEMETRY.md)

## Tips

1. **Define clear substrates** with focused constraints
2. **Use descriptive IDs** like `app-prod-us-east-1`
3. **Snapshot before risky operations** for easy rollback
4. **Wire telemetry** to your monitoring stack
5. **Clean up properly** with `destroy()` or `destroyAll()`
6. **Leverage forking** for A/B testing and experiments

## Need Help?

- Documentation: `docs/UNIVERSE_MANAGER.md`
- Examples: `examples/universe-demo.mjs`
- Tests: `test/universe.test.ts`
- Issues: GitHub Issues
