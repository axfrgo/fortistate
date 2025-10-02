/**
 * Algebra: Entropy Measurement
 * 
 * Measures information entropy, causal complexity, and consistency
 * of state across universes. This provides quantitative metrics for
 * understanding system behavior.
 */

import type { CausalGraph, CausalEvent } from '../temporal/causalEvent.js';

/**
 * Comprehensive entropy metrics for a state system
 */
export interface EntropyMetrics {
  /** Shannon entropy (information content) */
  shannon: number;
  
  /** Causal graph complexity (connectivity measure) */
  causalComplexity: number;
  
  /** Divergence from baseline/sibling universes */
  divergenceScore: number;
  
  /** Constraint satisfaction level (0-1) */
  consistencyIndex: number;
  
  /** Additional metadata */
  metadata: {
    /** Total number of unique states observed */
    uniqueStates: number;
    
    /** Average branching factor */
    avgBranchingFactor: number;
    
    /** Cyclomatic complexity of causal graph */
    cyclomaticComplexity: number;
  };
}

/**
 * Calculate Shannon entropy for a set of values
 * H(X) = -Σ p(x) * log₂(p(x))
 * 
 * Higher entropy = more uncertainty/information
 */
export function calculateShannonEntropy<T>(values: T[]): number {
  if (values.length === 0) return 0;

  // Count frequency of each unique value
  const frequencies = new Map<string, number>();
  for (const value of values) {
    const key = JSON.stringify(value);
    frequencies.set(key, (frequencies.get(key) || 0) + 1);
  }

  // Calculate probabilities and entropy
  const total = values.length;
  let entropy = 0;

  for (const count of frequencies.values()) {
    const probability = count / total;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  }

  return entropy;
}

/**
 * Calculate causal complexity from a causal graph
 * 
 * Measures:
 * - Graph density (edges / possible edges)
 * - Average path length
 * - Clustering coefficient
 */
export function calculateCausalComplexity(graph: CausalGraph): number {
  const nodeCount = graph.events.size;
  if (nodeCount === 0) return 0;

  // Count total edges
  let edgeCount = 0;
  for (const children of graph.forward.values()) {
    edgeCount += children.size;
  }

  // Graph density: actual edges / possible edges
  const maxPossibleEdges = nodeCount * (nodeCount - 1);
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

  // Average degree (connections per node)
  const avgDegree = nodeCount > 0 ? edgeCount / nodeCount : 0;

  // Cyclomatic complexity: M = E - N + 2P (P = strongly connected components, simplified to 1)
  const cyclomaticComplexity = Math.max(0, edgeCount - nodeCount + 2);

  // Combine metrics (normalized 0-1 range, then scale)
  const normalizedDensity = Math.min(1, density * 10); // Scale density
  const normalizedDegree = Math.min(1, avgDegree / 5); // Assume max degree ~5 for normalization
  const normalizedCyclomatic = Math.min(1, cyclomaticComplexity / 50); // Assume max ~50

  return (normalizedDensity + normalizedDegree + normalizedCyclomatic) / 3;
}

/**
 * Calculate divergence between two sets of events
 * 
 * Uses Kullback-Leibler divergence for state distributions
 */
export function calculateDivergence<T>(
  baseline: CausalEvent<T>[],
  comparison: CausalEvent<T>[]
): number {
  if (baseline.length === 0 || comparison.length === 0) return 0;

  // Build probability distributions
  const baselineDist = buildDistribution(baseline.map(e => e.value));
  const comparisonDist = buildDistribution(comparison.map(e => e.value));

  // Calculate KL divergence: D_KL(P||Q) = Σ P(x) * log(P(x)/Q(x))
  let divergence = 0;
  const allKeys = new Set([...baselineDist.keys(), ...comparisonDist.keys()]);

  for (const key of allKeys) {
    const p = baselineDist.get(key) || 1e-10; // Avoid log(0)
    const q = comparisonDist.get(key) || 1e-10;
    
    divergence += p * Math.log2(p / q);
  }

  // Normalize to 0-1 range (KL divergence is unbounded)
  return Math.min(1, Math.abs(divergence) / 10);
}

/**
 * Build probability distribution from values
 */
function buildDistribution<T>(values: T[]): Map<string, number> {
  const counts = new Map<string, number>();
  const total = values.length;

  for (const value of values) {
    const key = JSON.stringify(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const distribution = new Map<string, number>();
  for (const [key, count] of counts) {
    distribution.set(key, count / total);
  }

  return distribution;
}

/**
 * Calculate consistency index (how well constraints are satisfied)
 * 
 * @param events - Events to check
 * @param constraints - Constraint functions
 * @returns Score from 0 (no constraints met) to 1 (all constraints met)
 */
export function calculateConsistency<T>(
  events: CausalEvent<T>[],
  constraints: Array<(value: T) => boolean>
): number {
  if (events.length === 0 || constraints.length === 0) return 1;

  let satisfiedCount = 0;
  let totalChecks = 0;

  for (const event of events) {
    for (const constraint of constraints) {
      totalChecks++;
      if (constraint(event.value)) {
        satisfiedCount++;
      }
    }
  }

  return totalChecks > 0 ? satisfiedCount / totalChecks : 1;
}

/**
 * Measure comprehensive entropy for a causal graph
 */
export function measureEntropy<T = any>(
  graph: CausalGraph,
  options: {
    /** Baseline events for divergence calculation */
    baseline?: CausalEvent<T>[];
    
    /** Constraints to check consistency */
    constraints?: Array<(value: T) => boolean>;
  } = {}
): EntropyMetrics {
  const events = Array.from(graph.events.values()) as CausalEvent<T>[];
  const values = events.map(e => e.value);

  // Shannon entropy
  const shannon = calculateShannonEntropy(values);

  // Causal complexity
  const causalComplexity = calculateCausalComplexity(graph);

  // Divergence (if baseline provided)
  const divergenceScore = options.baseline
    ? calculateDivergence(options.baseline, events)
    : 0;

  // Consistency (if constraints provided)
  const consistencyIndex = options.constraints
    ? calculateConsistency(events, options.constraints)
    : 1;

  // Metadata
  const uniqueStates = new Set(values.map(v => JSON.stringify(v))).size;
  
  let totalBranching = 0;
  let branchingNodes = 0;
  for (const children of graph.forward.values()) {
    if (children.size > 0) {
      totalBranching += children.size;
      branchingNodes++;
    }
  }
  const avgBranchingFactor = branchingNodes > 0 ? totalBranching / branchingNodes : 0;

  // Cyclomatic complexity
  const edgeCount = Array.from(graph.forward.values()).reduce(
    (sum, children) => sum + children.size,
    0
  );
  const cyclomaticComplexity = Math.max(0, edgeCount - graph.events.size + 2);

  return {
    shannon,
    causalComplexity,
    divergenceScore,
    consistencyIndex,
    metadata: {
      uniqueStates,
      avgBranchingFactor,
      cyclomaticComplexity,
    },
  };
}

/**
 * Compare entropy between two graphs
 */
export function compareEntropy(
  metrics1: EntropyMetrics,
  metrics2: EntropyMetrics
): {
  shannonDelta: number;
  complexityDelta: number;
  divergenceDelta: number;
  consistencyDelta: number;
} {
  return {
    shannonDelta: metrics2.shannon - metrics1.shannon,
    complexityDelta: metrics2.causalComplexity - metrics1.causalComplexity,
    divergenceDelta: metrics2.divergenceScore - metrics1.divergenceScore,
    consistencyDelta: metrics2.consistencyIndex - metrics1.consistencyIndex,
  };
}

/**
 * Entropy-based anomaly detection
 * 
 * Returns true if current entropy deviates significantly from baseline
 */
export function detectAnomaly(
  current: EntropyMetrics,
  baseline: EntropyMetrics,
  thresholds: {
    shannonThreshold?: number;
    complexityThreshold?: number;
    divergenceThreshold?: number;
  } = {}
): boolean {
  const {
    shannonThreshold = 2.0,      // 2x baseline
    complexityThreshold = 0.5,   // 50% increase
    divergenceThreshold = 0.7,   // 70% divergence
  } = thresholds;

  const shannonRatio = baseline.shannon > 0 
    ? current.shannon / baseline.shannon 
    : 1;

  const complexityDiff = Math.abs(
    current.causalComplexity - baseline.causalComplexity
  );

  return (
    shannonRatio > shannonThreshold ||
    complexityDiff > complexityThreshold ||
    current.divergenceScore > divergenceThreshold
  );
}
