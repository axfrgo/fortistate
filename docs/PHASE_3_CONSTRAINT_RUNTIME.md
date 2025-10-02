# Phase 3 — Constraint Runtime Architecture

## Goals

- Formalize **laws of nature** as first-class modules that extend existing existence constraints.
- Provide a deterministic execution loop that evaluates constraints, applies repairs, and records enforcement events.
- Emit structured diagnostics for inspector tooling (violations, repairs, residual drift).
- Prepare orchestration hooks for universe spawning and multiverse runners.

## Key Concepts

### UniverseLaw<T>

```ts
interface UniverseLaw<T = any> {
  name: string;
  constraint: ExistenceConstraint<T>;
  reactions?: {
    [storeKey: string]: (localState: T, context: LawContext) => T | void;
  };
  onViolation?: (details: LawViolation) => void;
  onRepair?: (details: LawRepair) => void;
}
```

- Wraps an existing constraint and optional reaction functions that can mutate related stores.
- Emits callbacks for telemetry; defaults publish structured events to the constraint auditor.

### LawContext

```ts
interface LawContext {
  universeId: UniverseId;
  observerId?: ObserverId;
  timestamp: number;
  getState(storeKey: string): any;
  setState(storeKey: string, next: any, metadata?: Partial<CausalEvent['metadata']>): void;
}
```

- Provided to reactions to retrieve or update sibling stores while maintaining causal metadata.

### ConstraintAuditor

Responsibilities:

1. Subscribe to causal events for a universe.
2. Re-run relevant constraints (including UniverseLaw wrappers).
3. Apply repairs using law-defined logic.
4. Record telemetry packets describing violations, repairs, and outstanding drift.
5. Surface metrics for entropy/emergence dashboards.

Telemetry shape:

```ts
interface LawTelemetry {
  type: 'violation' | 'repair' | 'resolution';
  lawName: string;
  storeKey: string;
  universeId: UniverseId;
  eventId: EventId;
  severity: 'info' | 'warn' | 'error';
  details: Record<string, any>;
}
```

### Execution Flow

1. Auditor receives `CausalEvent` from temporal layer.
2. Determine affected laws (constraint subscriptions per store).
3. Evaluate `validateState` against each constraint.
4. If invalid and repairable, invoke `constraint.repair` + `onRepair` and emit patched causal event with `metadata.source = 'law-enforcement'`.
5. If unrepairable, emit violation telemetry and mark store as divergent for entropy calculations.
6. Run optional `reactions` for systemic effects (e.g., gravity) using the LawContext helpers.

### Storage & Caching

- Maintain per-universe cache of last known valid state to compute deltas quickly.
- Deduplicate violations across rapid successive events using event IDs and hashes.
- Persist telemetry in-memory with optional adapter for external sinks (console, inspector stream, file).

## Module Layout

```
src/
  cosmogenesis/
    laws.ts            # UniverseLaw, LawContext, helpers
    auditor.ts         # ConstraintAuditor implementation
    telemetry.ts       # LawTelemetry types and adapters
```

Existing `src/algebra/substrate.ts` remains the source of constraint primitives; laws import from there.

## Test Strategy

- Unit tests for UniverseLaw wrapper ensuring repairs fire and metadata recorded.
- Auditor integration tests using mock causal events to validate reaction + repair ordering.
- Telemetry snapshot tests verifying emitted payloads.
- Performance smoke test: enforce 1k events under <15ms overhead.

## Future Hooks

- Auditor will feed into upcoming `UniverseManager` and `Multiverse` runners.
- Telemetry stream plugs into inspector and CLI dashboards (planned Milestone B/C).
- Reactions interface designed to support async operations once worker orchestration lands.

## Implementation Status (October 2025)

- ✅ `src/cosmogenesis/laws.ts` — `defineLaw`, `executeLaw`, and `LawRegistry`
- ✅ `src/cosmogenesis/auditor.ts` — real-time constraint enforcement + telemetry sink
- ✅ `src/cosmogenesis/telemetry.ts` — shared law telemetry contracts
- ✅ Vitest coverage via `test/laws.test.ts` and `test/auditor.test.ts`
- 🔜 Performance harness and inspector wiring (tracked for later milestones)
