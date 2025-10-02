# Universe Manager

The Universe Manager is Fortistate's orchestration layer for managing multiple causal stores as a cohesive universe with shared laws of physics, coordinated event processing, and lifecycle management.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Multiverse Coordination](#multiverse-coordination)
- [Best Practices](#best-practices)

## Overview

The Universe Manager provides:

- **Unified Substrate**: All stores in a universe share the same laws and constraints
- **Lifecycle Management**: Start, pause, resume, and destroy operations
- **Constraint Enforcement**: Automatic auditing and repair via `ConstraintAuditor`
- **Snapshots & Time Travel**: Capture and restore complete universe state
- **Forking & Branching**: Create alternate timelines with divergent state
- **Telemetry Integration**: Built-in observability and debugging support
- **Multiverse Coordination**: Manage multiple universes simultaneously

## Core Concepts

### Universe

A **universe** is a collection of causal stores governed by a shared substrate (set of constraints and laws). Each universe has:

- **Unique ID**: Identifies the universe across your system
- **Substrate**: Defines the physical laws and constraints
- **Stores**: Named causal stores containing application state
- **State**: `initializing`, `running`, `paused`, or `destroyed`
- **Metadata**: Custom tags and properties

### Substrate

A **substrate** defines the fundamental rules:

```typescript
interface Substrate {
  id: string;
  name: string;
  constraints: Map<string, ExistenceConstraint<any>>;
  laws: Map<string, UniverseLaw<any>[]>;
}
```

### Lifecycle States

| State | Description |
|-------|-------------|
| `initializing` | Universe created but not started |
| `running` | Constraint enforcement active |
| `paused` | Temporarily disabled enforcement |
| `destroyed` | Cleaned up and removed |

## API Reference

### UniverseManager

#### Constructor

```typescript
new UniverseManager(config: UniverseConfig)
```

**Config Properties:**

- `id` (required): Unique universe identifier
- `substrate` (required): The laws and constraints
- `name`: Human-readable name
- `initialStores`: Map of store keys to initial values
- `laws`: Override substrate laws
- `autoRepair`: Enable automatic constraint repair (default: `true`)
- `applyReactions`: Enable law reactions (default: `true`)
- `observerId`: Observer ID for generated events
- `telemetrySink`: Custom telemetry handler
- `metadata`: Additional properties

#### Methods

##### Lifecycle Management

```typescript
start(): void           // Start the universe (enable enforcement)
pause(): void           // Pause constraint enforcement
resume(): void          // Resume from paused state
destroy(): void         // Cleanup and destroy universe
```

##### Store Management

```typescript
createStore<T>(key: string, initial: T): CausalStore<T>
getStore<T>(key: string): CausalStore<T> | undefined
hasStore(key: string): boolean
removeStore(key: string): boolean
getStoreKeys(): string[]
```

##### State & Statistics

```typescript
getState(): UniverseState
getStats(): {
  id: UniverseId;
  name?: string;
  state: UniverseState;
  storeCount: number;
  eventCount: number;
  createdAt: number;
  lastEventAt?: number;
  uptime: number;
}
```

##### Snapshots

```typescript
snapshot(): UniverseSnapshot
restore(snapshot: UniverseSnapshot): void
```

##### Forking

```typescript
fork(newId: UniverseId, config?: Partial<UniverseConfig>): UniverseManager
clone(suffix?: string): UniverseManager
```

##### Telemetry & Auditing

```typescript
getTelemetry(): LawTelemetry[]
scan(): Promise<void>
```

### Helper Functions

```typescript
createUniverse(config: UniverseConfig): UniverseManager
```

Creates and automatically starts a universe.

### Multiverse

Coordinator for managing multiple universes.

```typescript
class Multiverse {
  add(universe: UniverseManager): void
  remove(id: UniverseId): boolean
  get(id: UniverseId): UniverseManager | undefined
  getIds(): UniverseId[]
  getAll(): UniverseManager[]
  
  pauseAll(): void
  resumeAll(): void
  destroyAll(): void
  
  getStats(): {
    universeCount: number;
    totalStores: number;
    totalEvents: number;
    byState: Record<UniverseState, number>;
  }
}
```

## Usage Examples

### Basic Universe Creation

```typescript
import { createUniverse } from 'fortistate/cosmogenesis/universe';

const substrate = {
  id: 'app-v1',
  name: 'Application Rules',
  constraints: new Map([
    ['positive', {
      name: 'positive',
      invariants: [],
      validate: (value) => ({
        valid: value > 0,
        message: value > 0 ? undefined : 'Must be positive',
      }),
    }],
  ]),
  laws: new Map(),
};

const universe = createUniverse({
  id: 'my-app',
  name: 'My Application',
  substrate,
  metadata: { environment: 'production' },
});

// Create stores
const counter = universe.createStore('counter', 0);
const user = universe.createStore('user', { name: 'Alice' });

// Use stores normally
counter.set(42);
user.set({ name: 'Bob' });
```

### Energy Conservation Example

```typescript
import { defineLaw } from 'fortistate/cosmogenesis/laws';

const physicsSubstrate = {
  id: 'physics',
  name: 'Classical Physics',
  constraints: new Map([
    ['positive-energy', {
      name: 'positive-energy',
      invariants: [],
      validate: (v) => ({ valid: v >= 0, message: 'Energy cannot be negative' }),
    }],
  ]),
  laws: new Map([
    ['conservation', [
      defineLaw({
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
      }),
    ]],
  ]),
};

const sim = createUniverse({
  id: 'physics-sim',
  substrate: physicsSubstrate,
});

const kinetic = sim.createStore('kinetic', 100);
const potential = sim.createStore('potential', 50);
const total = sim.createStore('total', 150);

// Change energy distribution
kinetic.set(120);
potential.set(30);

// Total automatically corrected to 150 by conservation law
```

### Snapshots and Time Travel

```typescript
const universe = createUniverse({ id: 'app', substrate });

const counter = universe.createStore('counter', 0);

counter.set(10);
counter.set(20);

// Capture current state
const snapshot = universe.snapshot();
console.log(snapshot.stores.get('counter')); // 20

// Make more changes
counter.set(99);

// Restore previous state
universe.restore(snapshot);
console.log(counter.get()); // 20
```

### Universe Forking

```typescript
const original = createUniverse({
  id: 'simulation-1',
  name: 'Original Simulation',
  substrate,
});

const counter = original.createStore('counter', 100);

// Fork creates independent copy
const fork = original.fork('simulation-2', {
  name: 'Alternate Simulation',
  metadata: { experiment: 'variant-A' },
});

// Changes in fork don't affect original
fork.getStore('counter')?.set(999);

console.log(original.getStore('counter')?.get()); // 100
console.log(fork.getStore('counter')?.get());     // 999
```

### Lifecycle Management

```typescript
const universe = createUniverse({ id: 'app', substrate });

console.log(universe.getState()); // 'running'

// Pause constraint enforcement
universe.pause();
console.log(universe.getState()); // 'paused'

// Make changes (laws won't enforce)
counter.set(-999); // Negative value allowed while paused

// Resume enforcement
universe.resume();
// Auditor now enforces constraints

// Cleanup
universe.destroy();
console.log(universe.getState()); // 'destroyed'
```

## Multiverse Coordination

Manage multiple universes simultaneously:

```typescript
import { Multiverse } from 'fortistate/cosmogenesis/universe';

const multiverse = new Multiverse();

// Create and add universes
const earth = createUniverse({ id: 'earth', substrate: physicsSubstrate });
const mars = createUniverse({ id: 'mars', substrate: physicsSubstrate });

multiverse.add(earth);
multiverse.add(mars);

// Coordinate operations
multiverse.pauseAll();    // Freeze all universes
multiverse.resumeAll();   // Resume all

// Query aggregate stats
const stats = multiverse.getStats();
console.log(`${stats.universeCount} universes`);
console.log(`${stats.totalStores} total stores`);
console.log(`${stats.totalEvents} events processed`);

// Cleanup
multiverse.destroyAll();
```

## Best Practices

### 1. Define Clear Substrates

Create focused substrates with well-defined constraints:

```typescript
const userSubstrate = {
  id: 'user-domain',
  name: 'User Management Rules',
  constraints: new Map([
    ['valid-email', emailConstraint],
    ['age-restriction', ageConstraint],
    ['unique-username', usernameConstraint],
  ]),
  laws: new Map([
    ['authentication', authLaws],
    ['authorization', authzLaws],
  ]),
};
```

### 2. Use Meaningful Universe IDs

Choose descriptive, hierarchical IDs:

```typescript
// Good
'app-prod-us-east-1'
'simulation-physics-v2'
'test-user-auth-scenario-1'

// Avoid
'universe1'
'test'
'tmp'
```

### 3. Snapshot Before Risky Operations

Capture state before potentially destructive changes:

```typescript
const checkpoint = universe.snapshot();

try {
  // Risky operation
  performComplexUpdate();
} catch (error) {
  // Restore on failure
  universe.restore(checkpoint);
}
```

### 4. Monitor Telemetry

Wire telemetry to your observability stack:

```typescript
const universe = createUniverse({
  id: 'app',
  substrate,
  telemetrySink: (event) => {
    // Send to Datadog, Prometheus, etc.
    metrics.increment('law_violations', {
      law: event.lawName,
      severity: event.severity,
    });
  },
});
```

### 5. Clean Up Properly

Always destroy universes when done:

```typescript
// Manual cleanup
universe.destroy();

// Or use multiverse for bulk operations
multiverse.destroyAll();

// In production, use lifecycle hooks
process.on('SIGTERM', () => {
  multiverse.destroyAll();
  process.exit(0);
});
```

### 6. Leverage Forking for A/B Testing

Test variants without affecting production:

```typescript
const production = getProductionUniverse();

// Create test variant
const variant = production.fork('ab-test-variant-a', {
  metadata: { experiment: 'new-algorithm' },
});

// Run experiment
runExperiment(variant);

// Compare results
const prodStats = production.getStats();
const variantStats = variant.getStats();

// Decide whether to promote variant
if (variantStats.performanceBetter) {
  migrateToNewAlgorithm();
}

// Clean up test
variant.destroy();
```

## Related Documentation

- [Constraint Auditor](./AUDITOR.md) - Automatic constraint enforcement
- [Laws & Reactions](./LAWS.md) - Defining universe laws
- [Telemetry](./TELEMETRY.md) - Observability and debugging
- [Causal Stores](./CAUSAL_STORES.md) - Time-traveling stores

## See Also

- Examples: `examples/universe-demo.mjs`
- Tests: `test/universe.test.ts`
- API: `src/cosmogenesis/universe.ts`
