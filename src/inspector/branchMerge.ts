/**
 * ═══════════════════════════════════════════════════════════════
 *  BRANCH MERGE - Universe Convergence Tool
 * ═══════════════════════════════════════════════════════════════
 * 
 * Phase 2: Multiversal Inspector
 * 
 * The Branch Merge tool helps developers visualize, compare, and merge
 * divergent universe branches. Think "Git merge UI" but for state timelines.
 * 
 * Features:
 * - Side-by-side state comparison
 * - Automatic conflict detection
 * - Multiple merge strategies:
 *   - Auto (prefer source/target)
 *   - Manual (user resolves each conflict)
 *   - 3-way (find common ancestor)
 *   - Custom (user-provided resolver)
 * - Preview before committing merge
 * - Rollback capability
 * 
 * Visual Design:
 * - Split-pane UI: Source | Base | Target
 * - Diff highlights: Green (additions), Red (deletions), Yellow (changes)
 * - Conflict markers with resolution buttons
 * - Timeline showing divergence point
 * 
 * @module branchMerge
 */

import type { CausalEvent, EventId, UniverseId, CausalGraph } from '../temporal/causalEvent.js';
import { findCommonAncestor } from '../temporal/causalEvent.js';
import type { CausalStore, MergeResult, MergeStrategy } from '../temporal/causalStore.js';

/**
 * Diff type for state comparison
 */
export type DiffType = 'unchanged' | 'added' | 'removed' | 'changed' | 'conflict';

/**
 * State diff entry
 */
export interface StateDiff {
  path: string[]; // JSON path to the property
  type: DiffType;
  sourceValue?: any;
  targetValue?: any;
  baseValue?: any; // From common ancestor
}

/**
 * Branch info for comparison (inspector view)
 */
export interface BranchComparisonInfo {
  universeId: UniverseId;
  name: string;
  lastEvent: CausalEvent<any>;
  divergedFrom: EventId | null;
  color: string;
}

/**
 * Conflict resolution choice
 */
export type ConflictResolution = 
  | { strategy: 'accept-source' }
  | { strategy: 'accept-target' }
  | { strategy: 'accept-base' }
  | { strategy: 'manual'; value: any };

/**
 * Merge preview showing what will happen
 */
export interface MergePreview<T> {
  /** Will merge succeed automatically? */
  canAutoMerge: boolean;
  
  /** List of conflicts requiring manual resolution */
  conflicts: StateDiff[];
  
  /** Non-conflicting changes */
  changes: StateDiff[];
  
  /** Preview of merged state */
  previewState: T;
  
  /** Merge strategy being used */
  strategy: MergeStrategy;
}

/**
 * Merge session state
 */
export interface MergeSessionState {
  source: BranchComparisonInfo;
  target: BranchComparisonInfo;
  base?: BranchComparisonInfo; // Common ancestor
  
  preview: MergePreview<any>;
  
  /** User's conflict resolutions */
  resolutions: Map<string, ConflictResolution>;
  
  /** Is merge in progress? */
  inProgress: boolean;
  
  /** Merge result after completion */
  result?: MergeResult<any>;
}

/**
 * Calculate diff between two states
 * 
 * @param source - Source state
 * @param target - Target state
 * @param base - Optional base state (for 3-way merge)
 * @returns Array of diffs
 */
export function calculateDiff(
  source: any,
  target: any,
  base?: any
): StateDiff[] {
  const diffs: StateDiff[] = [];

  function traverse(
    src: any,
    tgt: any,
    bse: any | undefined,
    path: string[]
  ): void {
    // Handle primitives
    if (isPrimitive(src) || isPrimitive(tgt)) {
      if (src !== tgt) {
        // Check if this is a conflict (both changed from base)
        const isConflict = bse !== undefined && 
                          src !== bse && 
                          tgt !== bse && 
                          src !== tgt;
        
        diffs.push({
          path,
          type: isConflict ? 'conflict' : 'changed',
          sourceValue: src,
          targetValue: tgt,
          baseValue: bse,
        });
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(src) || Array.isArray(tgt)) {
      const srcArr = Array.isArray(src) ? src : [];
      const tgtArr = Array.isArray(tgt) ? tgt : [];
      const maxLen = Math.max(srcArr.length, tgtArr.length);

      for (let i = 0; i < maxLen; i++) {
        traverse(
          srcArr[i],
          tgtArr[i],
          Array.isArray(bse) ? bse[i] : undefined,
          [...path, `[${i}]`]
        );
      }
      return;
    }

    // Handle objects
    const srcObj = src || {};
    const tgtObj = tgt || {};
    const bseObj = bse || {};
    const allKeys = new Set([
      ...Object.keys(srcObj),
      ...Object.keys(tgtObj),
      ...Object.keys(bseObj),
    ]);

    for (const key of allKeys) {
      const srcVal = srcObj[key];
      const tgtVal = tgtObj[key];
      const bseVal = bseObj[key];

      if (!(key in srcObj)) {
        diffs.push({
          path: [...path, key],
          type: 'added',
          targetValue: tgtVal,
        });
      } else if (!(key in tgtObj)) {
        diffs.push({
          path: [...path, key],
          type: 'removed',
          sourceValue: srcVal,
        });
      } else {
        traverse(srcVal, tgtVal, bseVal, [...path, key]);
      }
    }
  }

  traverse(source, target, base, []);
  return diffs;
}

/**
 * Check if value is primitive
 */
function isPrimitive(val: any): boolean {
  return val === null || 
         val === undefined || 
         typeof val === 'string' || 
         typeof val === 'number' || 
         typeof val === 'boolean';
}

/**
 * Format diff path for display
 */
export function formatDiffPath(path: string[]): string {
  if (path.length === 0) return '(root)';
  return path.join('.');
}

/**
 * Apply conflict resolution to state
 */
export function applyResolution(
  diff: StateDiff,
  resolution: ConflictResolution
): any {
  switch (resolution.strategy) {
    case 'accept-source':
      return diff.sourceValue;
    case 'accept-target':
      return diff.targetValue;
    case 'accept-base':
      return diff.baseValue;
    case 'manual':
      return resolution.value;
  }
}

/**
 * Create merge preview
 */
export function createMergePreview<T>(
  sourceState: T,
  targetState: T,
  baseState: T | undefined,
  strategy: MergeStrategy
): MergePreview<T> {
  const diffs = calculateDiff(sourceState, targetState, baseState);
  
  const conflicts = diffs.filter(d => d.type === 'conflict');
  const changes = diffs.filter(d => d.type !== 'conflict' && d.type !== 'unchanged');

  // Try to auto-merge
  let previewState = JSON.parse(JSON.stringify(targetState));
  let canAutoMerge = conflicts.length === 0;

  if (canAutoMerge) {
    // Apply non-conflicting changes based on strategy
    for (const change of changes) {
      const value = strategy === 'ours' 
        ? change.sourceValue 
        : change.targetValue;
      
      setValueAtPath(previewState, change.path, value);
    }
  }

  return {
    canAutoMerge,
    conflicts,
    changes,
    previewState,
    strategy,
  };
}

/**
 * Set value at JSON path
 */
function setValueAtPath(obj: any, path: string[], value: any): void {
  if (path.length === 0) return;
  
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = path[path.length - 1];
  if (value === undefined) {
    delete current[lastKey];
  } else {
    current[lastKey] = value;
  }
}

/**
 * Create branch merge session
 * 
 * @example
 * ```typescript
 * const store = createCausalStore('data', { count: 0 });
 * 
 * // Create two branches
 * store.set({ count: 1 });
 * const branchA = store.branch('feature-a');
 * store.set({ count: 10 });
 * 
 * store.switchBranch(branchA);
 * store.set({ count: 5 });
 * 
 * // Start merge session
 * const session = createBranchMergeSession(store, {
 *   sourceUniverse: branchA,
 *   targetUniverse: 'universe-main',
 *   strategy: 'three-way',
 * });
 * 
 * // Preview merge
 * const preview = session.getPreview();
 * console.log('Conflicts:', preview.conflicts);
 * 
 * // Resolve conflicts
 * for (const conflict of preview.conflicts) {
 *   session.resolveConflict(conflict.path, { strategy: 'accept-target' });
 * }
 * 
 * // Execute merge
 * const result = session.executeMerge();
 * ```
 */
export function createBranchMergeSession<T>(
  store: CausalStore<T>,
  options: {
    sourceUniverse: UniverseId;
    targetUniverse: UniverseId;
    strategy: MergeStrategy;
    onPreviewUpdate?: (preview: MergePreview<T>) => void;
  }
) {
  const graph = store.causalGraph;
  
  // Get branch info
  const sourceBranch = getBranchComparisonInfo(store, options.sourceUniverse);
  const targetBranch = getBranchComparisonInfo(store, options.targetUniverse);
  
  // Find common ancestor for manual merge
  let baseBranch: BranchComparisonInfo | undefined;
  if (options.strategy === 'manual') {
    const commonAncestorId = findCommonAncestor(
      graph,
      sourceBranch.lastEvent.id,
      targetBranch.lastEvent.id
    );
    
    if (commonAncestorId) {
      const baseEvent = graph.events.get(commonAncestorId);
      if (baseEvent) {
        baseBranch = {
          universeId: baseEvent.universeId,
          name: 'Common Ancestor',
          lastEvent: baseEvent,
          divergedFrom: null,
          color: '#888888',
        };
      }
    }
  }

  // Get states
  const sourceState = sourceBranch.lastEvent.value;
  const targetState = targetBranch.lastEvent.value;
  const baseState = baseBranch?.lastEvent.value;

  // Initial preview
  const preview = createMergePreview(
    sourceState,
    targetState,
    baseState,
    options.strategy
  );

  const state: MergeSessionState = {
    source: sourceBranch,
    target: targetBranch,
    base: baseBranch,
    preview,
    resolutions: new Map(),
    inProgress: false,
  };

  /**
   * Update preview when resolutions change
   */
  function updatePreview(): void {
    // Recalculate preview with resolutions applied
    const resolvedState = JSON.parse(JSON.stringify(state.target.lastEvent.value));
    
    for (const conflict of state.preview.conflicts) {
      const pathKey = conflict.path.join('.');
      const resolution = state.resolutions.get(pathKey);
      
      if (resolution) {
        const value = applyResolution(conflict, resolution);
        setValueAtPath(resolvedState, conflict.path, value);
      }
    }

    state.preview = {
      ...state.preview,
      previewState: resolvedState,
      canAutoMerge: state.preview.conflicts.every(c => 
        state.resolutions.has(c.path.join('.'))
      ),
    };

    options.onPreviewUpdate?.(state.preview);
  }

  /**
   * Resolve a conflict
   */
  function resolveConflict(path: string[], resolution: ConflictResolution): void {
    const pathKey = path.join('.');
    state.resolutions.set(pathKey, resolution);
    updatePreview();
  }

  /**
   * Clear a resolution
   */
  function clearResolution(path: string[]): void {
    const pathKey = path.join('.');
    state.resolutions.delete(pathKey);
    updatePreview();
  }

  /**
   * Clear all resolutions
   */
  function clearAllResolutions(): void {
    state.resolutions.clear();
    updatePreview();
  }

  /**
   * Get current preview
   */
  function getPreview(): MergePreview<T> {
    return state.preview;
  }

  /**
   * Execute merge
   */
  function executeMerge(): MergeResult<T> {
    if (!state.preview.canAutoMerge) {
      throw new Error('Cannot execute merge: unresolved conflicts remain');
    }

    state.inProgress = true;

    // Perform actual merge on the store
    // If we have resolutions, use manual strategy with resolver
    let mergeStrategy: MergeStrategy = options.strategy;
    
    if (state.resolutions.size > 0) {
      mergeStrategy = 'manual';
    }
    
    const result = store.merge(options.sourceUniverse, mergeStrategy);

    state.result = result;
    state.inProgress = false;

    return result;
  }

  /**
   * Get current state
   */
  function getState(): Readonly<MergeSessionState> {
    return { ...state };
  }

  return {
    resolveConflict,
    clearResolution,
    clearAllResolutions,
    getPreview,
    executeMerge,
    getState,
  };
}

/**
 * Get branch info from store
 */
function getBranchComparisonInfo<T>(store: CausalStore<T>, universeId: UniverseId): BranchComparisonInfo {
  const branches = store.listBranches();
  const BranchComparisonInfo = branches.find(b => b.id === universeId);
  
  if (!BranchComparisonInfo) {
    throw new Error(`Branch not found: ${universeId}`);
  }

  const events = store.history.filter(e => e.universeId === universeId);
  const lastEvent = events[events.length - 1];

  return {
    universeId,
    name: BranchComparisonInfo.name,
    lastEvent,
    divergedFrom: events[0]?.causedBy[0] || null,
    color: getUniverseColor(universeId),
  };
}

/**
 * Get universe color
 */
function getUniverseColor(universeId: UniverseId): string {
  if (universeId === 'universe-main') return '#00d4ff';

  const hash = universeId.split('').reduce((acc: number, char: string) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 80%, 60%)`;
}

/**
 * Export all types
 */
export type BranchMergeSession = ReturnType<typeof createBranchMergeSession>;
