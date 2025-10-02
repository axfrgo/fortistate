# Fortistate API Reference

Complete API documentation for Fortistate v2.0+

## Table of Contents

- [Core Store API](#core-store-api)
- [Causal Store API](#causal-store-api)
- [Substrate & Constraints](#substrate--constraints)
- [Universe Manager](#universe-manager)
- [Laws & Reactions](#laws--reactions)
- [Emergence Detection](#emergence-detection)
- [Inspector API](#inspector-api)
- [Utility Functions](#utility-functions)
- [TypeScript Types](#typescript-types)

## Core Store API

### `createStore<T>(initial: T): Store<T>`

Creates a basic reactive store.

```typescript
import { createStore } from 'fortistate';

const counter = createStore(0);
```

### `Store<T>`

```typescript
interface Store<T> {
  get(): T;
  set(value: T): void;
  subscribe(fn: (state: T) => void): () => void;
  reset(): void;
}
```

#### `store.get()`

Returns current state.

```typescript
const value = counter.get(); // 0
```

#### `store.set(value: T)`

Updates state and notifies subscribers.

```typescript
counter.set(1);
```

#### `store.subscribe(fn)`

Subscribes to state changes. Returns unsubscribe function.

```typescript
const unsubscribe = counter.subscribe((state) => {
  console.log('Counter:', state);
});

// Later...
unsubscribe();
```

#### `store.reset()`

Resets to initial value.

```typescript
counter.reset(); // Back to 0
```

## Causal Store API

### `createCausalStore<T>(baseStore: Store<T>, key: string, options?): CausalStore<T>`

Wraps a store with causal event tracking.

```typescript
import { createCausalStore } from 'fortistate';

const base = createStore({ count: 0 });
const causal = createCausalStore(base, 'counter', {
  initialUniverse: 'my-app',
  observerId: 'user-123',
});
```

#### Options

```typescript
interface CausalStoreOptions {
  initialUniverse?: UniverseId;
  observerId?: ObserverId;
  parents?: CausalEventId[];
}
```

### `CausalStore<T>`

Extends `Store<T>` with causal tracking:

```typescript
interface CausalStore<T> extends Store<T> {
  // Additional methods
  getHistory(): CausalEvent[];
  getLastEvent(): CausalEvent | null;
  isCausedBy(eventId: CausalEventId): boolean;
  
  // Metadata
  key: string;
  universe: UniverseId;
}
```

#### `store.getHistory()`

Returns all causal events for this store.

```typescript
const events = causal.getHistory();
// [{ id, timestamp, value, parents, ... }]
```

#### `store.getLastEvent()`

Returns most recent event.

```typescript
const last = causal.getLastEvent();
if (last) {
  console.log('Last updated:', new Date(last.timestamp));
}
```

#### `store.isCausedBy(eventId)`

Checks if current state was caused by a specific event.

```typescript
if (causal.isCausedBy('event-123')) {
  console.log('This state includes effects from event-123');
}
```

## Substrate & Constraints

### `createSubstrate(name, constraints, globalInvariants?, options?): Substrate`

Creates a substrate (physics engine) for a universe.

```typescript
import { createSubstrate } from 'fortistate';

const substrate = createSubstrate(
  'ecommerce',
  constraints,
  globalInvariants,
  { laws: myLaws }
);
```

#### Parameters

- `name` (string): Substrate identifier
- `constraints` (Map<string, ExistenceConstraint[]>): Store-specific constraints
- `globalInvariants?` (GlobalInvariant[]): Cross-store invariants
- `options?` (SubstrateOptions): Additional options

### `ExistenceConstraint<T>`

```typescript
interface ExistenceConstraint<T> {
  name: string;
  check: (state: T) => ValidationResult;
  repair?: (state: T) => T;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
}
```

Example:

```typescript
const nonNegativeConstraint: ExistenceConstraint<number> = {
  name: 'non-negative',
  check: (value) => ({
    valid: value >= 0,
    reason: value < 0 ? 'Value must be non-negative' : undefined,
  }),
  repair: (value) => Math.max(0, value),
};
```

### `GlobalInvariant`

Cross-store constraints:

```typescript
interface GlobalInvariant {
  name: string;
  check: (allStates: Map<string, any>) => ValidationResult;
  repair?: (allStates: Map<string, any>) => Map<string, any>;
}
```

Example:

```typescript
const totalBalance: GlobalInvariant = {
  name: 'total-balance',
  check: (allStates) => {
    const accounts = allStates.get('accounts') || {};
    const total = Object.values(accounts).reduce((sum, bal) => sum + bal, 0);
    return {
      valid: total >= 0,
      reason: total < 0 ? 'Total balance cannot be negative' : undefined,
    };
  },
};
```

## Universe Manager

### `createUniverse(config): UniverseManager`

Creates a universe to manage multiple causal stores.

```typescript
import { createUniverse } from 'fortistate';

const universe = createUniverse({
  id: 'my-app',
  name: 'My Application',
  substrate,
  autoRepair: true,
  applyReactions: true,
  observerId: 'server',
});
```

#### Config

```typescript
interface UniverseConfig {
  id: UniverseId;
  name?: string;
  substrate: Substrate;
  initialStores?: Map<string, any>;
  laws?: Map<string, UniverseLaw<any>[]>;
  autoRepair?: boolean;
  applyReactions?: boolean;
  observerId?: ObserverId;
  telemetrySink?: (entry: LawTelemetry) => void;
  metadata?: Record<string, any>;
}
```

### `UniverseManager`

```typescript
class UniverseManager {
  // Lifecycle
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  
  // Store management
  createStore<T>(key: string, initial: T): CausalStore<T>;
  getStore<T>(key: string): CausalStore<T> | undefined;
  hasStore(key: string): boolean;
  removeStore(key: string): boolean;
  getStoreKeys(): string[];
  
  // State
  getState(): UniverseState;
  snapshot(): UniverseSnapshot;
  restore(snapshot: UniverseSnapshot): void;
  
  // Analysis
  getTelemetry(): LawTelemetry[];
  
  // Forking
  fork(newId: UniverseId, config?: Partial<UniverseConfig>): UniverseManager;
  clone(suffix?: string): UniverseManager;
}
```

#### Lifecycle Methods

**`start()`**: Begin constraint enforcement and law execution.

```typescript
universe.start();
```

**`pause()`**: Temporarily suspend law execution.

```typescript
universe.pause();
// Stores still work, but laws don't run
```

**`resume()`**: Resume after pause.

```typescript
universe.resume();
```

**`destroy()`**: Clean up and destroy universe.

```typescript
universe.destroy();
// Cannot be restarted
```

#### Store Management

**`createStore(key, initial)`**: Create a new causal store.

```typescript
const users = universe.createStore('users', {});
```

**`getStore(key)`**: Retrieve existing store.

```typescript
const users = universe.getStore('users');
if (users) {
  console.log(users.get());
}
```

**`removeStore(key)`**: Remove a store.

```typescript
universe.removeStore('temporary-data');
```

**`getStoreKeys()`**: List all store keys.

```typescript
const keys = universe.getStoreKeys();
// ['users', 'posts', 'comments']
```

#### State Management

**`snapshot()`**: Capture current state.

```typescript
const snapshot = universe.snapshot();
// Save to file or database
fs.writeFileSync('backup.json', JSON.stringify(snapshot));
```

**`restore(snapshot)`**: Restore from snapshot.

```typescript
const snapshot = JSON.parse(fs.readFileSync('backup.json'));
universe.restore(snapshot);
```

#### Forking

**`fork(newId, config?)`**: Create independent copy.

```typescript
const testUniverse = universe.fork('test-scenario', {
  autoRepair: false,
});

// Modify test universe without affecting original
testUniverse.getStore('users').set({ admin: { role: 'admin' } });
```

**`clone(suffix?)`**: Quick clone with auto-generated ID.

```typescript
const copy = universe.clone('backup');
// ID: 'my-app-backup'
```

## Laws & Reactions

### `UniverseLaw<T>`

Define behavioral rules for stores.

```typescript
interface UniverseLaw<T> {
  name: string;
  description?: string;
  enforce: (state: T, allStates: Map<string, any>) => T;
  reactions?: Record<string, ReactionFn<T>>;
}

type ReactionFn<T> = (
  currentState: T,
  changedStore: string,
  allStates: Map<string, any>
) => T;
```

Example:

```typescript
const calculateTotal: UniverseLaw<CartState> = {
  name: 'calculate-total',
  description: 'Sum up cart items',
  enforce: (state, allStates) => {
    const prices = allStates.get('prices') || {};
    const total = state.items.reduce(
      (sum, item) => sum + (prices[item.id] || 0) * item.qty,
      0
    );
    return { ...state, total };
  },
  reactions: {
    prices: (cartState, _, allStates) => {
      // Recalculate when prices change
      return { ...cartState, needsUpdate: true };
    },
  },
};
```

## Emergence Detection

### `EmergenceDetector`

Detect emergent patterns across stores.

```typescript
import { EmergenceDetector } from 'fortistate';

const detector = new EmergenceDetector(universe, {
  samplingInterval: 100,
  windowSize: 50,
  minConfidence: 0.7,
  enabledPatterns: ['synchronization', 'convergence'],
});

detector.start();
```

#### Options

```typescript
interface EmergenceDetectorOptions {
  windowSize?: number;          // Default: 100
  minConfidence?: number;        // Default: 0.7
  samplingInterval?: number;     // Default: 100ms
  enabledPatterns?: PatternType[];
}

type PatternType =
  | 'synchronization'
  | 'oscillation'
  | 'cascade'
  | 'convergence'
  | 'divergence'
  | 'clustering'
  | 'feedback-loop'
  | 'phase-transition'
  | 'equilibrium'
  | 'chaos';
```

#### Methods

**`start()`**: Begin pattern detection.

```typescript
detector.start();
```

**`stop()`**: Stop detection.

```typescript
detector.stop();
```

**`getPatterns(type?)`**: Retrieve detected patterns.

```typescript
// All patterns
const patterns = detector.getPatterns();

// Specific type
const syncs = detector.getPatterns('synchronization');
```

**`clearPatterns()`**: Clear pattern history.

```typescript
detector.clearPatterns();
```

#### Pattern Result

```typescript
interface EmergentPattern {
  type: PatternType;
  confidence: number;  // 0-1
  detectedAt: number;  // timestamp
  storesInvolved: string[];
  description: string;
  evidence: string[];
  metrics: Record<string, number>;
}
```

## Inspector API

### `startInspectorServer(universe, options?)`

Start development inspector server.

```typescript
import { startInspectorServer } from 'fortistate';

const server = startInspectorServer(universe, {
  port: 3456,
  requireSessions: true,
  sessionSecret: process.env.SESSION_SECRET,
});
```

#### Options

```typescript
interface InspectorOptions {
  port?: number;                // Default: 3456
  requireSessions?: boolean;    // Default: false
  sessionSecret?: string;
  adminToken?: string;
  allowedOrigins?: string[];
  rateLimit?: RateLimitConfig;
}
```

#### Server Instance

```typescript
interface InspectorServer {
  close(): Promise<void>;
  getStats(): ServerStats;
}

// Close server
await server.close();
```

## Utility Functions

### `isCausalStore(store)`

Type guard for causal stores.

```typescript
import { isCausalStore } from 'fortistate';

if (isCausalStore(store)) {
  console.log(store.getHistory());
}
```

### `validateState(value, constraint)`

Manually validate against constraint.

```typescript
import { validateState } from 'fortistate';

const result = validateState(42, nonNegativeConstraint);
if (result.valid) {
  console.log('Valid!');
}
```

### `calculateEntropy(state, schema?)`

Calculate information entropy.

```typescript
import { calculateEntropy } from 'fortistate';

const entropy = calculateEntropy({ a: 1, b: 2, c: 1 });
console.log('Entropy:', entropy); // ~1.5
```

## TypeScript Types

### Core Types

```typescript
type UniverseId = string;
type ObserverId = string;
type CausalEventId = string;

type UniverseState = 'initializing' | 'running' | 'paused' | 'destroyed';
```

### Event Types

```typescript
interface CausalEvent {
  id: CausalEventId;
  timestamp: number;
  storeKey: string;
  value: any;
  parents: CausalEventId[];
  universe: UniverseId;
  observer?: ObserverId;
  metadata?: Record<string, any>;
}
```

### Snapshot Types

```typescript
interface UniverseSnapshot {
  universeId: UniverseId;
  timestamp: number;
  stores: Map<string, any>;
  metadata: {
    eventCount: number;
    lastEventAt: number;
    customMetadata?: Record<string, any>;
  };
}
```

### Telemetry Types

```typescript
interface LawTelemetry {
  timestamp: number;
  lawName: string;
  storeName: string;
  duration: number;
  repaired: boolean;
  reactions?: number;
  error?: string;
}
```

## Usage Patterns

### Basic Store

```typescript
import { createStore } from 'fortistate';

const count = createStore(0);

count.subscribe(n => console.log(n));
count.set(1); // Logs: 1
```

### Causal Store

```typescript
import { createCausalStore, createStore } from 'fortistate';

const base = createStore(0);
const causal = createCausalStore(base, 'counter');

causal.set(1);
const history = causal.getHistory();
// [{ id: '...', value: 1, timestamp: ..., ... }]
```

### Universe with Constraints

```typescript
import { createUniverse, createSubstrate } from 'fortistate';

const constraints = new Map();
constraints.set('balance', [{
  name: 'non-negative',
  check: (n) => ({ valid: n >= 0 }),
  repair: (n) => Math.max(0, n),
}]);

const substrate = createSubstrate('bank', constraints);
const universe = createUniverse({ id: 'app', substrate, autoRepair: true });

universe.start();

const balance = universe.createStore('balance', 100);
balance.set(-50); // Auto-repaired to 0!
```

### Laws with Reactions

```typescript
const laws = new Map();
laws.set('cart', [{
  name: 'total',
  enforce: (cart, allStates) => {
    const prices = allStates.get('prices') || {};
    const total = cart.items.reduce(
      (sum, item) => sum + prices[item.id] * item.qty,
      0
    );
    return { ...cart, total };
  },
  reactions: {
    prices: (cart) => ({ ...cart, dirty: true }),
  },
}]);

const substrate = createSubstrate('shop', new Map(), undefined, { laws });
```

### Emergence Detection

```typescript
import { EmergenceDetector } from 'fortistate';

const detector = new EmergenceDetector(universe, {
  samplingInterval: 100,
  minConfidence: 0.7,
});

detector.start();

setTimeout(() => {
  const patterns = detector.getPatterns();
  console.log('Detected:', patterns.length, 'patterns');
  
  detector.stop();
}, 5000);
```

## Migration from v1.x

### Breaking Changes

1. **Substrate Required**: All universes need a substrate (can be empty)
2. **Laws API Changed**: Now part of substrate options
3. **Inspector Auth**: Sessions now required by default

### Migration Example

**v1.x:**
```typescript
const store = createStore(0);
```

**v2.0:**
```typescript
const substrate = createSubstrate('app', new Map());
const universe = createUniverse({ id: 'app', substrate });
const store = universe.createStore('counter', 0);
```

## Best Practices

1. **Always use substrates** for production apps
2. **Enable autoRepair** to handle constraint violations
3. **Monitor telemetry** for performance issues
4. **Disable inspector** in production
5. **Batch updates** when possible
6. **Limit event history** to prevent memory growth
7. **Use TypeScript** for type safety

## Support

- GitHub: https://github.com/yourusername/fortistate
- Issues: https://github.com/yourusername/fortistate/issues
- Docs: https://fortistate.dev

## License

MIT
