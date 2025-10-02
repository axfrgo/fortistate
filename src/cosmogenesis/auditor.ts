/**
 * Cosmogenesis: Constraint Auditor
 *
 * Watches causal stores, evaluates registered laws, and applies repairs while
 * emitting structured telemetry for the inspector and CLI.
 */

import type { EventId, CausalEvent } from '../temporal/causalEvent.js';
import type { CausalStore } from '../temporal/causalStore.js';
import type { Substrate } from '../algebra/substrate.js';
import type { UniverseLaw } from './laws.js';
import { executeLaw, LawRegistry, type LawContext } from './laws.js';
import type { LawTelemetry, TelemetrySink } from './telemetry.js';

export interface ConstraintAuditorOptions {
  substrate: Substrate;
  stores: Map<string, CausalStore<any>>;
  lawRegistry?: LawRegistry;
  laws?: Map<string, UniverseLaw<any>[]>;
  autoRepair?: boolean;
  applyReactions?: boolean;
  telemetrySink?: TelemetrySink;
}

interface TrackedStore {
  store: CausalStore<any>;
  unsubscribe: () => void;
}

export class ConstraintAuditor {
  private readonly substrate: Substrate;
  private readonly stores: Map<string, CausalStore<any>>;
  private readonly laws: Map<string, UniverseLaw<any>[]>;
  private readonly autoRepair: boolean;
  private readonly applyReactions: boolean;
  private readonly telemetrySink?: TelemetrySink;
  private readonly telemetryBuffer: LawTelemetry[] = [];
  private readonly processedEvents = new Map<string, EventId | undefined>();
  private readonly trackedStores = new Map<string, TrackedStore>();
  private active = false;

  constructor(options: ConstraintAuditorOptions) {
    this.substrate = options.substrate;
    this.stores = options.stores;
    this.autoRepair = options.autoRepair ?? true;
    this.applyReactions = options.applyReactions ?? true;
    this.telemetrySink = options.telemetrySink;

    if (options.laws) {
      this.laws = new Map(options.laws);
    } else if (options.lawRegistry) {
      this.laws = options.lawRegistry.toMap();
    } else if (options.substrate.laws) {
      this.laws = new Map(options.substrate.laws);
    } else {
      this.laws = new Map();
    }
  }

  start(): void {
    if (this.active) return;
    this.active = true;

    for (const [storeKey, laws] of this.laws.entries()) {
      if (laws.length === 0) continue;
      const store = this.stores.get(storeKey);
      if (!store) {
        this.emitTelemetry({
          timestamp: Date.now(),
          type: 'audit-error',
          lawName: 'unknown',
          storeKey,
          severity: 'error',
          message: `No causal store registered for ${storeKey}`,
        });
        continue;
      }

      void this.evaluateStore(storeKey, store);

      const unsubscribe = store.subscribe(() => {
        if (!this.active) return;
        void this.handleStoreUpdate(storeKey, store);
      });

      this.trackedStores.set(storeKey, { store, unsubscribe });
      this.processedEvents.set(storeKey, store.getLastEventId());
    }
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;

    for (const tracked of this.trackedStores.values()) {
      tracked.unsubscribe();
    }

    this.trackedStores.clear();
  }

  getTelemetry(): LawTelemetry[] {
    return [...this.telemetryBuffer];
  }

  async scan(): Promise<void> {
    for (const tracked of this.trackedStores.values()) {
      await this.evaluateStore(tracked.store.storeKey, tracked.store);
    }
  }

  private async handleStoreUpdate(storeKey: string, store: CausalStore<any>) {
    const lastEventId = store.getLastEventId();
    const previousEventId = this.processedEvents.get(storeKey);

    if (!lastEventId || lastEventId === previousEventId) {
      return;
    }

    this.processedEvents.set(storeKey, lastEventId);
    await this.evaluateStore(storeKey, store);
  }

  private async evaluateStore(storeKey: string, store: CausalStore<any>) {
    const lawsForStore = this.laws.get(storeKey);
    if (!lawsForStore || lawsForStore.length === 0) {
      return;
    }

    const history = store.history;
    const event = history[history.length - 1];

    for (const law of lawsForStore) {
      try {
        const context = this.createLawContext(storeKey, store, law, event);
        const result = await executeLaw(law, {
          state: store.get(),
          storeKey,
          event,
          attemptRepair: this.autoRepair,
          context,
          applyReactions: this.applyReactions,
        });

        if (
          this.autoRepair &&
          typeof result.repairedValue !== 'undefined' &&
          result.repairedEvaluation?.valid
        ) {
          store.set(result.repairedValue);
        }

        this.handleExecutionResult(storeKey, law.name, event, result);
      } catch (error) {
        this.emitTelemetry({
          timestamp: Date.now(),
          type: 'audit-error',
          lawName: law.name,
          storeKey,
          eventId: event?.id,
          universeId: event?.universeId,
          severity: 'error',
          message: 'Failed to execute law',
          details: { error: (error as Error).message ?? String(error) },
        });
      }
    }
  }

  private createLawContext(
    storeKey: string,
    store: CausalStore<any>,
    law: UniverseLaw<any>,
    event?: CausalEvent<any>
  ): LawContext {
    return {
      universeId: event?.universeId ?? store.currentUniverse,
      observerId: event?.observerId,
      timestamp: event?.timestamp ?? Date.now(),
      eventId: event?.id,
      getState: (targetKey: string) => {
        const target = this.stores.get(targetKey);
        if (!target) {
          throw new Error(`No store registered for ${targetKey}`);
        }
        return target.get();
      },
      setState: (targetKey: string, next: any) => {
        const target = this.stores.get(targetKey);
        if (!target) {
          throw new Error(`No store registered for ${targetKey}`);
        }
        target.set(next);
        this.emitTelemetry({
          timestamp: Date.now(),
          type: 'reaction',
          lawName: law.name,
          storeKey: targetKey,
          universeId: event?.universeId ?? store.currentUniverse,
          observerId: event?.observerId,
          eventId: event?.id,
          severity: 'info',
          message: `Law reaction applied to ${targetKey}`,
          details: { sourceStore: storeKey },
        });
      },
    };
  }

  private handleExecutionResult(
    storeKey: string,
    lawName: string,
    event: CausalEvent<any> | undefined,
    result: Awaited<ReturnType<typeof executeLaw>>
  ) {
    if (!result.evaluation.valid) {
      this.emitTelemetry({
        timestamp: Date.now(),
        type: 'violation',
        lawName,
        storeKey,
        universeId: event?.universeId,
        observerId: event?.observerId,
        eventId: event?.id,
        severity: 'warn',
        message: `Constraint violation detected in ${storeKey}`,
        details: { violations: result.evaluation.violations },
      });
    }

    if (result.repairedValue) {
      this.emitTelemetry({
        timestamp: Date.now(),
        type: 'repair',
        lawName,
        storeKey,
        universeId: event?.universeId,
        observerId: event?.observerId,
        eventId: event?.id,
        severity: result.valid ? 'info' : 'warn',
        message: `Auto-repair applied by ${lawName}`,
        details: {
          repairedValue: result.repairedValue,
          postRepairValid: result.valid,
          repairEvaluation: result.repairedEvaluation,
        },
      });
    }

    for (const reactionEffect of result.reactionEffects) {
      this.emitTelemetry({
        timestamp: Date.now(),
        type: 'reaction',
        lawName,
        storeKey: reactionEffect.targetStore,
        universeId: event?.universeId,
        observerId: event?.observerId,
        eventId: event?.id,
        severity: 'info',
        message: `Reaction emitted for ${reactionEffect.targetStore}`,
        details: { nextState: reactionEffect.nextState, sourceStore: storeKey },
      });
    }

    for (const reactionError of result.reactionErrors) {
      this.emitTelemetry({
        timestamp: Date.now(),
        type: 'reaction-error',
        lawName,
        storeKey: reactionError.targetStore,
        universeId: event?.universeId,
        observerId: event?.observerId,
        eventId: event?.id,
        severity: 'error',
        message: `Reaction failed for ${reactionError.targetStore}`,
        details: { error: reactionError.error, sourceStore: storeKey },
      });
    }
  }

  private emitTelemetry(entry: LawTelemetry): void {
    this.telemetryBuffer.push(entry);
    this.telemetrySink?.(entry);
  }
}
