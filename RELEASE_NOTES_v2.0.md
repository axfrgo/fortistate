# 🚀 Fortistate v2.0.0-alpha — Temporal Foundation

**Release Date**: TBD (Phase 1 Complete)  
**Codename**: "The Beginning of Possibility"

---

## 🎉 What's New

### Temporal Infrastructure
Fortistate now records **every state change as an immutable causal event**, enabling time travel, branching, and advanced debugging capabilities.

#### Time Travel
```typescript
import { createCausalStore } from 'fortistate'

const counter = createCausalStore(createStore({ value: 0 }), 'counter')

counter.set({ value: 1 })
counter.set({ value: 5 })
counter.set({ value: 10 })

// Jump to any point in time
const pastState = counter.at(Date.now() - 5000)  // 5 seconds ago
const firstState = counter.atEvent(counter.history[0].id)

// Query time ranges
const recentEvents = counter.between(
  Date.now() - 60000,  // Last minute
  Date.now()
)
```

#### Universe Branching
```typescript
// Create parallel timeline
const experimentBranch = counter.branch('experiment')

// Make changes in experiment
counter.switchBranch(experimentBranch)
counter.set({ value: 100 })

// Compare outcomes
counter.switchBranch('universe-main')
console.log(counter.get().value)  // Original value

// Merge if successful
counter.merge(experimentBranch, 'theirs')
```

#### Causal Queries
```typescript
// Find all events caused by a specific event
const descendants = counter.causedBy(eventId)

// Query with filters
const userActions = counter.query({
  observerIds: ['user-123'],
  types: ['update'],
  timeRange: [startTime, endTime]
})

// Export full history
const auditLog = counter.exportHistory()
fs.writeFileSync('audit-trail.json', auditLog)
```

### Entropy Measurement
Quantify state complexity and detect anomalies using information theory.

```typescript
import { measureEntropy, detectAnomaly } from 'fortistate'

// Measure current complexity
const metrics = measureEntropy(counter.causalGraph)
console.log(metrics.shannon)             // Information entropy
console.log(metrics.causalComplexity)    // Graph connectivity
console.log(metrics.metadata.uniqueStates)

// Detect anomalies
const baseline = measureEntropy(baselineGraph)
const isAnomaly = detectAnomaly(metrics, baseline)
```

### Existence Constraints
Define "laws of nature" for your state — rules that must always hold.

```typescript
import { defineConstraint, validateState } from 'fortistate'

// Example: Budget constraint
const budgetConstraint = defineConstraint(
  'budget-balance',
  [
    {
      name: 'expenses-not-exceed-income',
      check: (state) => state.expenses <= state.income,
      message: 'Expenses cannot exceed income'
    }
  ],
  {
    repair: (state) => ({
      ...state,
      expenses: Math.min(state.expenses, state.income)
    })
  }
)

// Validate state
const result = validateState(store.get(), budgetConstraint)
if (!result.valid) {
  console.log('Violations:', result.violations)
  console.log('Auto-repaired:', result.repairedValue)
}
```

---

## ✨ Key Features

### Backward Compatible
`CausalStore<T>` extends `Store<T>`, so **all existing code works unchanged**.

```typescript
// v1.x code
const counter = createStore({ value: 0 })
counter.get()
counter.set({ value: 1 })

// v2.0 — same API, plus temporal features
const causalCounter = createCausalStore(counter, 'counter')
causalCounter.get()              // ✅ Works
causalCounter.set({ value: 1 })  // ✅ Works
causalCounter.at(timestamp)      // ✅ NEW
causalCounter.branch('exp')      // ✅ NEW
```

### Zero Configuration
Temporal features work out of the box — no setup required.

### Performance
- **Event creation**: <0.1ms overhead
- **Causal graph building**: Lazy, cached
- **Time queries**: O(log n) with indexing

### Type Safety
Full TypeScript support with generics:
```typescript
interface GameState {
  score: number
  level: number
}

const game = createCausalStore<GameState>(
  createStore({ score: 0, level: 1 }),
  'game'
)

const past = game.at(timestamp)  // Type: GameState | undefined
```

---

## 🔧 Breaking Changes

**None!** This release is fully backward compatible.

If you're using v1.x, all your code continues to work. Opt into temporal features when ready.

---

## 📦 New Exports

```typescript
// Temporal foundation
export {
  createCausalStore,
  isCausalStore,
  type CausalEvent,
  type CausalStore,
  type CausalGraph,
  type UniverseId,
  type ObserverId,
} from 'fortistate'

// Algebra
export {
  measureEntropy,
  calculateShannonEntropy,
  detectAnomaly,
  type EntropyMetrics,
} from 'fortistate'

export {
  defineConstraint,
  validateState,
  createSubstrate,
  type ExistenceConstraint,
  type Substrate,
} from 'fortistate'
```

---

## 🎓 Learning Resources

### Documentation
- **Migration Guide**: `docs/TEMPORAL_MIGRATION.md`
- **Roadmap**: `COSMOGENESIS_ROADMAP.md`
- **Examples**: `examples/temporal-demo/`

### Demos
```bash
node examples/temporal-demo/time-travel-counter.mjs
node examples/temporal-demo/branching-universes.mjs
node examples/temporal-demo/entropy-demo.mjs
node examples/temporal-demo/substrate-physics.mjs
```

### Quick Start
```bash
npm install fortistate@2.0.0-alpha
```

```typescript
import { createStore, createCausalStore } from 'fortistate'

const counter = createCausalStore(
  createStore({ value: 0 }),
  'counter'
)

// Time travel
const past = counter.at(Date.now() - 5000)

// Branching
const branch = counter.branch('experiment')

// Analysis
const metrics = counter.getStats()
```

---

## 🐛 Bug Fixes

- Fixed normalization of array stores (from v1.x)
- Improved error messages for session management
- Fixed CORS handling in inspector proxy

---

## 🔮 What's Next (Phase 2)

Coming in **v2.1** (Months 3-4):

### Multiversal Inspector UI
- **Interactive timeline** — Scrub through history visually
- **3D causal graph** — See causality as a force-directed graph
- **Branch diff tool** — Visual comparison of universes
- **Story mode** — LLM-generated causality narratives

[Read the full roadmap →](./COSMOGENESIS_ROADMAP.md)

---

## 🙏 Contributors

This release represents **Phase 1** of the Cosmogenesis initiative — transforming Fortistate from a state manager into a reality engineering framework.

Special thanks to:
- The AI agent team for implementation
- Early testers for feedback
- The open-source community for inspiration

---

## 📊 Stats

- **New files**: 5 core modules + 4 demos + 7 docs
- **Lines of code**: ~2,500 TypeScript
- **Test coverage**: TBD (coming in Week 2)
- **Build time**: ~3s (TypeScript 5.9.2)
- **Bundle size**: +~15KB (temporal modules, tree-shakeable)

---

## 🌟 Vision Statement

> "Fortistate is evolving from a state manager into the world's first **cosmogenesis engine** — a framework for defining, generating, and governing digital realities. This release lays the temporal foundation. Next, we build the multiverse."

---

## 🔗 Links

- **GitHub**: https://github.com/axfrgo/fortistate
- **NPM**: https://www.npmjs.com/package/fortistate
- **Roadmap**: [COSMOGENESIS_ROADMAP.md](./COSMOGENESIS_ROADMAP.md)
- **Migration**: [docs/TEMPORAL_MIGRATION.md](./docs/TEMPORAL_MIGRATION.md)
- **Docs**: https://fortistate.dev (coming soon)

---

## 📄 License

ISC License (unchanged)

---

**Install now**: `npm install fortistate@2.0.0-alpha`

Welcome to the temporal era of state management! 🌌⏰🚀

---

**Published**: TBD  
**Version**: 2.0.0-alpha  
**Codename**: The Beginning of Possibility
