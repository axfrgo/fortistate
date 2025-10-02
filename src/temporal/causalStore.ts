/**
 * Temporal Foundation: Causal Store
 * 
 * Extends the base Store<T> with full causality tracking, time-travel,
 * and branching capabilities. This is the core temporal primitive.
 */

import type { Store } from '../storeFactory.js';
import {
  type CausalEvent,
  type UniverseId,
  type ObserverId,
  type EventId,
  type TemporalQuery,
  type CausalGraph,
  createCausalEvent,
  buildCausalGraph,
  queryEvents,
  calculateCausalStats,
  findAncestors,
  findDescendants,
} from './causalEvent.js';

/**
 * Merge strategy for combining branches
 */
export type MergeStrategy = 
  | 'ours'        // Keep our changes
  | 'theirs'      // Take their changes
  | 'manual'      // User must resolve conflicts
  | 'last-write'  // Last timestamp wins
  | 'crdt';       // Use CRDT auto-merge (future)

/**
 * Branch information
 */
export interface BranchInfo {
  id: UniverseId;
  name: string;
  parentUniverse?: UniverseId;
  forkPoint?: EventId;
  createdAt: number;
  lastEventTimestamp: number;
}

/**
 * Causal Store extends Store<T> with temporal capabilities
 */
export interface CausalStore<T> extends Store<T> {
  /** Full event history for this store */
  readonly history: CausalEvent<T>[];
  
  /** Causal graph (lazy-computed, cached) */
  readonly causalGraph: CausalGraph;
  
  /** Current universe this store belongs to */
  readonly currentUniverse: UniverseId;
  
  /** Store key (for namespacing) */
  readonly storeKey: string;
  
  // ========== Temporal Queries ==========
  
  /**
   * Get state at a specific timestamp
   * @param timestamp - Unix timestamp (ms)
   * @returns The state at that point in time
   */
  at(timestamp: number): T | undefined;
  
  /**
   * Get state at a specific event
   * @param eventId - The event ID
   * @returns The state after that event
   */
  atEvent(eventId: EventId): T | undefined;
  
  /**
   * Get events in a time range
   * @param start - Start timestamp
   * @param end - End timestamp
   * @returns Array of events in range
   */
  between(start: number, end: number): CausalEvent<T>[];
  
  /**
   * Find events caused by a specific event
   * @param eventId - The source event
   * @returns Array of descendant events
   */
  causedBy(eventId: EventId): CausalEvent<T>[];
  
  /**
   * Query events with flexible filters
   * @param query - Query options
   * @returns Matching events
   */
  query(query: TemporalQuery): CausalEvent<T>[];
  
  // ========== Branching & Merging ==========
  
  /**
   * Create a branch from current state
   * @param branchName - Name of the new branch
   * @param options - Branch options
   * @returns New universe ID
   */
  branch(branchName: string, options?: {
    forkPoint?: number | EventId;
    observerId?: ObserverId;
  }): UniverseId;
  
  /**
   * Merge another universe into this one
   * @param sourceUniverse - Universe to merge from
   * @param strategy - How to resolve conflicts
   * @returns Merge result with conflicts
   */
  merge(sourceUniverse: UniverseId, strategy: MergeStrategy): MergeResult<T>;
  
  /**
   * List all branches (universes) for this store
   * @returns Array of branch info
   */
  listBranches(): BranchInfo[];
  
  /**
   * Switch to a different universe branch
   * @param universeId - Target universe
   */
  switchBranch(universeId: UniverseId): void;
  
  // ========== Metadata & Stats ==========
  
  /**
   * Get statistics about the causal graph
   */
  getStats(): ReturnType<typeof calculateCausalStats>;
  
  /**
   * Get the last event ID for this universe
   */
  getLastEventId(): EventId | undefined;
  
  /**
   * Export event history as JSON
   */
  exportHistory(): string;
  
  /**
   * Import event history from JSON
   */
  importHistory(json: string): void;
}

/**
 * Merge result with conflict information
 */
export interface MergeResult<T> {
  success: boolean;
  conflicts: Array<{
    eventId: EventId;
    ours: T;
    theirs: T;
    resolution?: T;
  }>;
  mergedEventId?: EventId;
}

/**
 * Internal state for CausalStore implementation
 */
interface CausalStoreState<T> {
  baseStore: Store<T>;
  storeKey: string;
  currentUniverse: UniverseId;
  eventHistory: CausalEvent<T>[];
  causalGraphCache?: CausalGraph;
  branches: Map<UniverseId, BranchInfo>;
  currentObserverId?: ObserverId;
}

/**
 * Create a CausalStore from a base Store
 */
export function createCausalStore<T>(
  baseStore: Store<T>,
  storeKey: string,
  options: {
    initialUniverse?: UniverseId;
    observerId?: ObserverId;
    preserveHistory?: CausalEvent<T>[];
  } = {}
): CausalStore<T> {
  const state: CausalStoreState<T> = {
    baseStore,
    storeKey,
    currentUniverse: options.initialUniverse || 'universe-main',
    eventHistory: options.preserveHistory || [],
    branches: new Map(),
    currentObserverId: options.observerId,
  };

  // Initialize main universe
  state.branches.set(state.currentUniverse, {
    id: state.currentUniverse,
    name: 'main',
    createdAt: Date.now(),
    lastEventTimestamp: Date.now(),
  });

  // Record initial state as a "create" event if no history
  if (state.eventHistory.length === 0) {
    const initialEvent = createCausalEvent(
      storeKey,
      'create',
      baseStore.get(),
      {
        universeId: state.currentUniverse,
        observerId: state.currentObserverId,
        metadata: { source: 'initialization' },
      }
    );
    state.eventHistory.push(initialEvent);
  }

  // Invalidate graph cache on history changes
  const invalidateCache = () => {
    state.causalGraphCache = undefined;
  };

  // Wrap the base store's set method to record events
  const originalSet = baseStore.set.bind(baseStore);
  const trackedSet = (value: T) => {
    const previousValue = baseStore.get();
    const lastEvent = state.eventHistory[state.eventHistory.length - 1];
    
    const event = createCausalEvent(
      storeKey,
      'update',
      value,
      {
        previousValue,
        causedBy: lastEvent ? [lastEvent.id] : [],
        universeId: state.currentUniverse,
        observerId: state.currentObserverId,
        metadata: { source: 'set' },
      }
    );

    state.eventHistory.push(event);
    invalidateCache();
    
    // Update branch timestamp
    const branch = state.branches.get(state.currentUniverse);
    if (branch) {
      branch.lastEventTimestamp = event.timestamp;
    }

    originalSet(value);
  };

  // Build causal store API
  const causalStore: CausalStore<T> = {
    // Delegate to base store
    get: baseStore.get.bind(baseStore),
    set: trackedSet,
    subscribe: baseStore.subscribe.bind(baseStore),
    reset: () => {
      const previousValue = baseStore.get();
      const initialValue = state.eventHistory[0]?.value;
      
      const event = createCausalEvent(
        storeKey,
        'reset',
        initialValue,
        {
          previousValue,
          causedBy: [],
          universeId: state.currentUniverse,
          observerId: state.currentObserverId,
          metadata: { source: 'reset' },
        }
      );

      state.eventHistory.push(event);
      invalidateCache();
      baseStore.reset();
    },

    // Temporal properties
    get history() {
      return state.eventHistory.filter(e => e.universeId === state.currentUniverse);
    },

    get causalGraph() {
      if (!state.causalGraphCache) {
        state.causalGraphCache = buildCausalGraph(state.eventHistory);
      }
      return state.causalGraphCache;
    },

    get currentUniverse() {
      return state.currentUniverse;
    },

    get storeKey() {
      return state.storeKey;
    },

    // Temporal queries
    at(timestamp: number): T | undefined {
      const relevantEvents = state.eventHistory.filter(
        e => e.universeId === state.currentUniverse && e.timestamp <= timestamp
      );
      
      if (relevantEvents.length === 0) return undefined;
      
      // Return the value of the last event before the timestamp
      const lastEvent = relevantEvents.reduce((latest, event) =>
        event.timestamp > latest.timestamp ? event : latest
      );
      
      return lastEvent.value;
    },

    atEvent(eventId: EventId): T | undefined {
      const event = state.eventHistory.find(e => e.id === eventId);
      return event?.value;
    },

    between(start: number, end: number): CausalEvent<T>[] {
      return queryEvents(causalStore.causalGraph, {
        timeRange: [start, end],
        universeIds: [state.currentUniverse],
      }) as CausalEvent<T>[];
    },

    causedBy(eventId: EventId): CausalEvent<T>[] {
      return findDescendants(causalStore.causalGraph, eventId) as CausalEvent<T>[];
    },

    query(query: TemporalQuery): CausalEvent<T>[] {
      return queryEvents(causalStore.causalGraph, {
        ...query,
        universeIds: query.universeIds || [state.currentUniverse],
      }) as CausalEvent<T>[];
    },

    // Branching
    branch(branchName: string, options = {}): UniverseId {
      const newUniverseId = `universe-${branchName}-${Date.now()}`;
      let forkEvent: CausalEvent<T> | undefined;

      if (options.forkPoint) {
        if (typeof options.forkPoint === 'number') {
          // Fork at timestamp
          const forkTimestamp = options.forkPoint;
          const eventsAtTime = state.eventHistory.filter(
            e => e.universeId === state.currentUniverse && e.timestamp <= forkTimestamp
          );
          forkEvent = eventsAtTime[eventsAtTime.length - 1];
        } else {
          // Fork at specific event
          const forkEventId = options.forkPoint;
          forkEvent = state.eventHistory.find(e => e.id === forkEventId);
        }
      } else {
        // Fork from current state
        forkEvent = state.eventHistory[state.eventHistory.length - 1];
      }

      if (!forkEvent) {
        throw new Error('Cannot find fork point');
      }

      // Create branch info
      const branchInfo: BranchInfo = {
        id: newUniverseId,
        name: branchName,
        parentUniverse: state.currentUniverse,
        forkPoint: forkEvent.id,
        createdAt: Date.now(),
        lastEventTimestamp: forkEvent.timestamp,
      };

      state.branches.set(newUniverseId, branchInfo);

      // Create a "create" event in the new universe
      const branchEvent = createCausalEvent(
        storeKey,
        'create',
        forkEvent.value,
        {
          causedBy: [forkEvent.id],
          universeId: newUniverseId,
          observerId: options.observerId || state.currentObserverId,
          metadata: { 
            source: 'branch',
            branchName,
            parentUniverse: state.currentUniverse,
          },
        }
      );

      state.eventHistory.push(branchEvent);
      invalidateCache();

      return newUniverseId;
    },

    merge(sourceUniverse: UniverseId, strategy: MergeStrategy): MergeResult<T> {
      // Simplified merge implementation (to be enhanced with CRDT)
      const sourceEvents = state.eventHistory.filter(e => e.universeId === sourceUniverse);
      const targetEvents = state.eventHistory.filter(e => e.universeId === state.currentUniverse);

      if (sourceEvents.length === 0) {
        return { success: false, conflicts: [] };
      }

      const lastSourceEvent = sourceEvents[sourceEvents.length - 1];
      const lastTargetEvent = targetEvents[targetEvents.length - 1];

      const conflicts: MergeResult<T>['conflicts'] = [];

      // Simple conflict detection: if values differ
      if (JSON.stringify(lastSourceEvent.value) !== JSON.stringify(lastTargetEvent.value)) {
        let resolution: T | undefined;

        switch (strategy) {
          case 'ours':
            resolution = lastTargetEvent.value;
            break;
          case 'theirs':
            resolution = lastSourceEvent.value;
            break;
          case 'last-write':
            resolution = lastSourceEvent.timestamp > lastTargetEvent.timestamp
              ? lastSourceEvent.value
              : lastTargetEvent.value;
            break;
          case 'manual':
            // User must resolve
            conflicts.push({
              eventId: lastSourceEvent.id,
              ours: lastTargetEvent.value,
              theirs: lastSourceEvent.value,
            });
            return { success: false, conflicts };
        }

        if (resolution !== undefined) {
          // Apply merge
          const mergeEvent = createCausalEvent(
            storeKey,
            'update',
            resolution,
            {
              previousValue: lastTargetEvent.value,
              causedBy: [lastTargetEvent.id, lastSourceEvent.id],
              universeId: state.currentUniverse,
              observerId: state.currentObserverId,
              metadata: { 
                source: 'merge',
                strategy,
                sourceUniverse,
              },
            }
          );

          state.eventHistory.push(mergeEvent);
          invalidateCache();
          originalSet(resolution);

          return { success: true, conflicts: [], mergedEventId: mergeEvent.id };
        }
      }

      return { success: true, conflicts: [] };
    },

    listBranches(): BranchInfo[] {
      return Array.from(state.branches.values());
    },

    switchBranch(universeId: UniverseId): void {
      if (!state.branches.has(universeId)) {
        throw new Error(`Universe ${universeId} does not exist`);
      }

      state.currentUniverse = universeId;

      // Update base store to match the last state in this universe
      const universeEvents = state.eventHistory.filter(e => e.universeId === universeId);
      if (universeEvents.length > 0) {
        const lastEvent = universeEvents[universeEvents.length - 1];
        originalSet(lastEvent.value);
      }
    },

    // Metadata & stats
    getStats() {
      return calculateCausalStats(causalStore.causalGraph);
    },

    getLastEventId(): EventId | undefined {
      const universeEvents = state.eventHistory.filter(e => e.universeId === state.currentUniverse);
      return universeEvents[universeEvents.length - 1]?.id;
    },

    exportHistory(): string {
      return JSON.stringify(state.eventHistory, null, 2);
    },

    importHistory(json: string): void {
      const imported = JSON.parse(json) as CausalEvent<T>[];
      state.eventHistory = imported;
      invalidateCache();

      // Rebuild branches
      state.branches.clear();
      for (const event of imported) {
        if (!state.branches.has(event.universeId)) {
          state.branches.set(event.universeId, {
            id: event.universeId,
            name: event.universeId,
            createdAt: event.timestamp,
            lastEventTimestamp: event.timestamp,
          });
        }
      }

      // Update base store to current universe state
      const lastEvent = imported
        .filter(e => e.universeId === state.currentUniverse)
        .pop();
      
      if (lastEvent) {
        originalSet(lastEvent.value);
      }
    },
  };

  return causalStore;
}

/**
 * Type guard to check if a store is a CausalStore
 */
export function isCausalStore<T>(store: Store<T> | CausalStore<T>): store is CausalStore<T> {
  return 'history' in store && 'causalGraph' in store;
}
