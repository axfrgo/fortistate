/**
 * Temporal Foundation: Causal Event System
 * 
 * This module provides the core temporal infrastructure for Fortistate's
 * cosmogenesis engine. It introduces causality tracking, event sourcing,
 * and the foundation for branching universes.
 */

export type UniverseId = string;
export type ObserverId = string;
export type EventId = string;

/**
 * CausalEvent represents a single state change with full causality metadata.
 * This is the fundamental unit of temporal tracking.
 */
export interface CausalEvent<T = any> {
  /** Unique identifier (UUID v4) */
  id: EventId;
  
  /** High-precision timestamp (ms since epoch, with sub-ms precision) */
  timestamp: number;
  
  /** Which store this event belongs to */
  storeKey: string;
  
  /** Type of operation */
  type: 'create' | 'update' | 'delete' | 'reset';
  
  /** The actual value after this event */
  value: T;
  
  /** Previous value (for diffing and rollback) */
  previousValue?: T;
  
  /** Parent event IDs - forms the causal graph */
  causedBy: EventId[];
  
  /** Which universe branch this event belongs to */
  universeId: UniverseId;
  
  /** Who/what initiated this event */
  observerId?: ObserverId;
  
  /** Optional metadata for debugging/auditing */
  metadata?: {
    source?: string;        // e.g., "user-action", "law-enforcement", "sync"
    stackTrace?: string[];  // For dev mode debugging
    tags?: string[];        // For filtering/querying
    [key: string]: any;
  };
}

/**
 * Causal graph structure for efficient traversal
 */
export interface CausalGraph {
  /** Event ID -> Child event IDs */
  forward: Map<EventId, Set<EventId>>;
  
  /** Event ID -> Parent event IDs */
  backward: Map<EventId, Set<EventId>>;
  
  /** Event ID -> CausalEvent */
  events: Map<EventId, CausalEvent<any>>;
  
  /** Universe ID -> Root event IDs */
  universeRoots: Map<UniverseId, Set<EventId>>;
}

/**
 * Query options for temporal operations
 */
export interface TemporalQuery {
  /** Filter by time range */
  timeRange?: [number, number];
  
  /** Filter by universe(s) */
  universeIds?: UniverseId[];
  
  /** Filter by observer(s) */
  observerIds?: ObserverId[];
  
  /** Filter by event type(s) */
  types?: Array<CausalEvent['type']>;
  
  /** Filter by metadata tags */
  tags?: string[];
  
  /** Limit number of results */
  limit?: number;
  
  /** Sort order */
  sortBy?: 'timestamp' | 'causal-order';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Statistics about a causal graph
 */
export interface CausalStats {
  /** Total number of events */
  totalEvents: number;
  
  /** Number of unique universes */
  universeCount: number;
  
  /** Number of branch points (events with multiple children) */
  branchPoints: number;
  
  /** Average causal depth (longest path from root) */
  averageDepth: number;
  
  /** Maximum causal depth */
  maxDepth: number;
  
  /** Events per universe */
  eventsPerUniverse: Map<UniverseId, number>;
}

/**
 * Generate a unique event ID (UUID v4)
 */
export function generateEventId(): EventId {
  // Simple UUID v4 implementation (for real use, consider 'uuid' package)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * High-precision timestamp (ms + microseconds)
 */
export function preciseTimestamp(): number {
  if (typeof performance !== 'undefined') {
    // Browser: use performance.now() + navigationStart
    return performance.timeOrigin + performance.now();
  } else if (typeof process !== 'undefined' && process.hrtime) {
    // Node.js: use process.hrtime for sub-ms precision
    const [seconds, nanoseconds] = process.hrtime();
    return seconds * 1000 + nanoseconds / 1000000;
  }
  // Fallback: Date.now()
  return Date.now();
}

/**
 * Create a new causal event
 */
export function createCausalEvent<T>(
  storeKey: string,
  type: CausalEvent['type'],
  value: T,
  options: {
    previousValue?: T;
    causedBy?: EventId[];
    universeId: UniverseId;
    observerId?: ObserverId;
    metadata?: CausalEvent['metadata'];
  }
): CausalEvent<T> {
  return {
    id: generateEventId(),
    timestamp: preciseTimestamp(),
    storeKey,
    type,
    value,
    previousValue: options.previousValue,
    causedBy: options.causedBy || [],
    universeId: options.universeId,
    observerId: options.observerId,
    metadata: options.metadata,
  };
}

/**
 * Build a causal graph from a list of events
 */
export function buildCausalGraph(events: CausalEvent<any>[]): CausalGraph {
  const graph: CausalGraph = {
    forward: new Map(),
    backward: new Map(),
    events: new Map(),
    universeRoots: new Map(),
  };

  // First pass: index all events
  for (const event of events) {
    graph.events.set(event.id, event);
    graph.forward.set(event.id, new Set());
    graph.backward.set(event.id, new Set(event.causedBy));

    // Track universe roots (events with no parents)
    if (event.causedBy.length === 0) {
      if (!graph.universeRoots.has(event.universeId)) {
        graph.universeRoots.set(event.universeId, new Set());
      }
      graph.universeRoots.get(event.universeId)!.add(event.id);
    }
  }

  // Second pass: build forward edges
  for (const event of events) {
    for (const parentId of event.causedBy) {
      const forwardSet = graph.forward.get(parentId);
      if (forwardSet) {
        forwardSet.add(event.id);
      }
    }
  }

  return graph;
}

/**
 * Query events from a causal graph
 */
export function queryEvents(
  graph: CausalGraph,
  query: TemporalQuery = {}
): CausalEvent<any>[] {
  let results = Array.from(graph.events.values());

  // Filter by time range
  if (query.timeRange) {
    const [start, end] = query.timeRange;
    results = results.filter(e => e.timestamp >= start && e.timestamp <= end);
  }

  // Filter by universe
  if (query.universeIds) {
    const universeSet = new Set(query.universeIds);
    results = results.filter(e => universeSet.has(e.universeId));
  }

  // Filter by observer
  if (query.observerIds) {
    const observerSet = new Set(query.observerIds);
    results = results.filter(e => e.observerId && observerSet.has(e.observerId));
  }

  // Filter by type
  if (query.types) {
    const typeSet = new Set(query.types);
    results = results.filter(e => typeSet.has(e.type));
  }

  // Filter by tags
  if (query.tags && query.tags.length > 0) {
    results = results.filter(e => {
      if (!e.metadata?.tags) return false;
      return query.tags!.some(tag => e.metadata!.tags!.includes(tag));
    });
  }

  // Sort
  if (query.sortBy === 'causal-order') {
    // Topological sort (BFS from roots)
    results = topologicalSort(graph, results.map(e => e.id))
      .map(id => graph.events.get(id)!)
      .filter(Boolean);
  } else {
    // Sort by timestamp (default)
    results.sort((a, b) => a.timestamp - b.timestamp);
  }

  if (query.sortDirection === 'desc') {
    results.reverse();
  }

  // Limit
  if (query.limit && query.limit > 0) {
    results = results.slice(0, query.limit);
  }

  return results;
}

/**
 * Topological sort of events (causal order)
 */
function topologicalSort(graph: CausalGraph, eventIds: EventId[]): EventId[] {
  const visited = new Set<EventId>();
  const result: EventId[] = [];
  const eventSet = new Set(eventIds);

  function visit(eventId: EventId) {
    if (visited.has(eventId)) return;
    visited.add(eventId);

    // Visit parents first
    const parents = graph.backward.get(eventId) || new Set();
    for (const parentId of parents) {
      if (eventSet.has(parentId)) {
        visit(parentId);
      }
    }

    result.push(eventId);
  }

  // Start from roots, then visit all requested events
  for (const eventId of eventIds) {
    visit(eventId);
  }

  return result;
}

/**
 * Calculate causal statistics
 */
export function calculateCausalStats(graph: CausalGraph): CausalStats {
  const eventsPerUniverse = new Map<UniverseId, number>();
  let branchPoints = 0;

  for (const [eventId, children] of graph.forward) {
    const event = graph.events.get(eventId)!;
    
    // Count events per universe
    eventsPerUniverse.set(
      event.universeId,
      (eventsPerUniverse.get(event.universeId) || 0) + 1
    );

    // Count branch points
    if (children.size > 1) {
      branchPoints++;
    }
  }

  // Calculate depth statistics
  const depths: number[] = [];
  for (const [universeId, rootIds] of graph.universeRoots) {
    for (const rootId of rootIds) {
      depths.push(calculateMaxDepth(graph, rootId));
    }
  }

  return {
    totalEvents: graph.events.size,
    universeCount: graph.universeRoots.size,
    branchPoints,
    averageDepth: depths.length > 0 
      ? depths.reduce((a, b) => a + b, 0) / depths.length 
      : 0,
    maxDepth: depths.length > 0 ? Math.max(...depths) : 0,
    eventsPerUniverse,
  };
}

/**
 * Calculate maximum depth from a given event
 */
function calculateMaxDepth(graph: CausalGraph, eventId: EventId): number {
  const children = graph.forward.get(eventId);
  if (!children || children.size === 0) return 0;

  let maxChildDepth = 0;
  for (const childId of children) {
    maxChildDepth = Math.max(maxChildDepth, calculateMaxDepth(graph, childId));
  }

  return maxChildDepth + 1;
}

/**
 * Find all events that caused a given event (ancestors)
 */
export function findAncestors(
  graph: CausalGraph,
  eventId: EventId,
  maxDepth = Infinity
): CausalEvent<any>[] {
  const ancestors: CausalEvent<any>[] = [];
  const visited = new Set<EventId>();

  function traverse(id: EventId, depth: number) {
    if (depth >= maxDepth || visited.has(id)) return;
    visited.add(id);

    const event = graph.events.get(id);
    if (!event) return;

    ancestors.push(event);

    for (const parentId of event.causedBy) {
      traverse(parentId, depth + 1);
    }
  }

  // Start from the event's parents (not the event itself)
  const startEvent = graph.events.get(eventId);
  if (startEvent) {
    for (const parentId of startEvent.causedBy) {
      traverse(parentId, 0);
    }
  }
  
  return ancestors;
}

/**
 * Find all events caused by a given event (descendants)
 */
export function findDescendants(
  graph: CausalGraph,
  eventId: EventId,
  maxDepth = Infinity
): CausalEvent<any>[] {
  const descendants: CausalEvent<any>[] = [];
  const visited = new Set<EventId>();

  function traverse(id: EventId, depth: number) {
    if (depth >= maxDepth || visited.has(id)) return;
    visited.add(id);

    const children = graph.forward.get(id);
    if (!children) return;

    for (const childId of children) {
      const event = graph.events.get(childId);
      if (event) {
        descendants.push(event);
        traverse(childId, depth + 1);
      }
    }
  }

  traverse(eventId, 0);
  return descendants;
}

/**
 * Find the common ancestor of two events (merge base)
 */
export function findCommonAncestor(
  graph: CausalGraph,
  eventId1: EventId,
  eventId2: EventId
): EventId | null {
  const ancestors1 = new Set(findAncestors(graph, eventId1).map(e => e.id));
  const ancestors2 = findAncestors(graph, eventId2);

  // Find first common ancestor in reverse chronological order
  for (const ancestor of ancestors2.reverse()) {
    if (ancestors1.has(ancestor.id)) {
      return ancestor.id;
    }
  }

  return null;
}
