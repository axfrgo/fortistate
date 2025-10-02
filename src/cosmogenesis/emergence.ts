/**
 * Emergence Detection System
 * 
 * Detects and analyzes emergent patterns across multiple stores in a universe.
 * Emergent behavior occurs when interactions between simple components produce
 * complex, unexpected patterns at higher levels of organization.
 */

import type { CausalStore } from '../temporal/causalStore.js';
import type { UniverseManager } from './universe.js';

/**
 * Pattern types that can be detected
 */
export type PatternType =
  | 'synchronization'      // Multiple stores changing in lockstep
  | 'oscillation'          // Periodic behavior across stores
  | 'cascade'              // Changes propagating through stores
  | 'convergence'          // Stores moving toward similar states
  | 'divergence'           // Stores moving toward different states
  | 'clustering'           // Groups of stores with similar behavior
  | 'feedback-loop'        // Cyclic dependencies between stores
  | 'phase-transition'     // Sudden system-wide state change
  | 'equilibrium'          // System settling into stable state
  | 'chaos';               // Unpredictable, sensitive to initial conditions

/**
 * Detected pattern information
 */
export interface EmergentPattern {
  type: PatternType;
  confidence: number;        // 0-1, how confident we are in this pattern
  storesInvolved: string[];  // Store IDs participating in the pattern
  detectedAt: number;        // Timestamp when detected
  description: string;       // Human-readable description
  metrics: Record<string, number>; // Quantitative metrics
  evidence: string[];        // Supporting observations
}

/**
 * Configuration for emergence detection
 */
export interface EmergenceDetectorOptions {
  windowSize?: number;       // How many events to analyze (default: 100)
  minConfidence?: number;    // Minimum confidence to report (default: 0.7)
  samplingInterval?: number; // How often to sample in ms (default: 1000)
  enabledPatterns?: PatternType[]; // Which patterns to detect (default: all)
}

/**
 * Time series data point
 */
interface DataPoint {
  timestamp: number;
  storeId: string;
  value: any;
  changeCount: number;
}

/**
 * Emergence Detector analyzes patterns across multiple stores
 */
export class EmergenceDetector {
  private universe: UniverseManager;
  private options: Required<EmergenceDetectorOptions>;
  private history: DataPoint[] = [];
  private patterns: EmergentPattern[] = [];
  private samplingTimer?: NodeJS.Timeout;
  private changeCounters: Map<string, number> = new Map();

  constructor(universe: UniverseManager, options: EmergenceDetectorOptions = {}) {
    this.universe = universe;
    this.options = {
      windowSize: options.windowSize ?? 100,
      minConfidence: options.minConfidence ?? 0.7,
      samplingInterval: options.samplingInterval ?? 1000,
      enabledPatterns: options.enabledPatterns ?? [
        'synchronization',
        'oscillation',
        'cascade',
        'convergence',
        'divergence',
        'clustering',
        'feedback-loop',
        'phase-transition',
        'equilibrium',
        'chaos',
      ],
    };
  }

  /**
   * Start monitoring for emergent patterns
   */
  start(): void {
    if (this.samplingTimer) return;

    // Subscribe to store changes
    const storeKeys = this.universe.getStoreKeys();
    for (const key of storeKeys) {
      const store = this.universe.getStore(key);
      if (!store) continue;
      
      this.changeCounters.set(key, 0);
      store.subscribe(() => {
        const count = this.changeCounters.get(key) ?? 0;
        this.changeCounters.set(key, count + 1);
      });
    }

    // Start sampling
    this.samplingTimer = setInterval(() => {
      this.sample();
      this.analyze();
    }, this.options.samplingInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = undefined;
    }
  }

  /**
   * Sample current state of all stores
   */
  private sample(): void {
    const timestamp = Date.now();
    const storeKeys = this.universe.getStoreKeys();

    for (const key of storeKeys) {
      const store = this.universe.getStore(key);
      if (!store) continue;
      
      const value = store.get();
      const changeCount = this.changeCounters.get(key) ?? 0;

      this.history.push({
        timestamp,
        storeId: key,
        value,
        changeCount,
      });
    }

    // Trim history to window size
    const maxPoints = this.options.windowSize * storeKeys.length;
    if (this.history.length > maxPoints) {
      this.history = this.history.slice(-maxPoints);
    }
  }

  /**
   * Analyze history for emergent patterns
   */
  private analyze(): void {
    if (this.history.length < 10) return; // Need minimum data

    const detectedPatterns: EmergentPattern[] = [];

    // Run all enabled detectors
    if (this.options.enabledPatterns.includes('synchronization')) {
      const pattern = this.detectSynchronization();
      if (pattern) detectedPatterns.push(pattern);
    }

    if (this.options.enabledPatterns.includes('oscillation')) {
      const pattern = this.detectOscillation();
      if (pattern) detectedPatterns.push(pattern);
    }

    if (this.options.enabledPatterns.includes('cascade')) {
      const pattern = this.detectCascade();
      if (pattern) detectedPatterns.push(pattern);
    }

    if (this.options.enabledPatterns.includes('convergence')) {
      const pattern = this.detectConvergence();
      if (pattern) detectedPatterns.push(pattern);
    }

    if (this.options.enabledPatterns.includes('divergence')) {
      const pattern = this.detectDivergence();
      if (pattern) detectedPatterns.push(pattern);
    }

    if (this.options.enabledPatterns.includes('clustering')) {
      const pattern = this.detectClustering();
      if (pattern) detectedPatterns.push(pattern);
    }

    if (this.options.enabledPatterns.includes('feedback-loop')) {
      const pattern = this.detectFeedbackLoop();
      if (pattern) detectedPatterns.push(pattern);
    }

    if (this.options.enabledPatterns.includes('equilibrium')) {
      const pattern = this.detectEquilibrium();
      if (pattern) detectedPatterns.push(pattern);
    }

    // Add new patterns above confidence threshold
    for (const pattern of detectedPatterns) {
      if (pattern.confidence >= this.options.minConfidence) {
        this.patterns.push(pattern);
      }
    }

    // Trim old patterns (keep last 100)
    if (this.patterns.length > 100) {
      this.patterns = this.patterns.slice(-100);
    }
  }

  /**
   * Detect synchronization: stores changing together
   */
  private detectSynchronization(): EmergentPattern | null {
    const recentWindow = this.getRecentWindow(20);
    const storeIds = [...new Set(recentWindow.map(d => d.storeId))];
    
    if (storeIds.length < 2) return null;

    // Group by timestamp
    const byTimestamp = new Map<number, string[]>();
    for (const point of recentWindow) {
      const stores = byTimestamp.get(point.timestamp) ?? [];
      stores.push(point.storeId);
      byTimestamp.set(point.timestamp, stores);
    }

    // Count timestamps where multiple stores changed
    const syncEvents = Array.from(byTimestamp.values()).filter(stores => stores.length > 1);
    const syncRatio = syncEvents.length / byTimestamp.size;

    if (syncRatio < 0.5) return null;

    const involvedStores = [...new Set(syncEvents.flat())];
    
    return {
      type: 'synchronization',
      confidence: Math.min(0.95, syncRatio),
      storesInvolved: involvedStores,
      detectedAt: Date.now(),
      description: `${involvedStores.length} stores are changing synchronously`,
      metrics: {
        syncRatio,
        storeCount: involvedStores.length,
        syncEvents: syncEvents.length,
      },
      evidence: [
        `${(syncRatio * 100).toFixed(1)}% of changes occur simultaneously`,
        `Detected in stores: ${involvedStores.join(', ')}`,
      ],
    };
  }

  /**
   * Detect oscillation: periodic behavior
   */
  private detectOscillation(): EmergentPattern | null {
    const recentWindow = this.getRecentWindow(50);
    const byStore = this.groupByStore(recentWindow);

    const oscillatingStores: string[] = [];
    let maxConfidence = 0;

    for (const [storeId, points] of byStore) {
      if (points.length < 10) continue;

      const changes = points.map(p => p.changeCount);
      const period = this.detectPeriodicity(changes);

      if (period > 0) {
        oscillatingStores.push(storeId);
        maxConfidence = Math.max(maxConfidence, 0.8);
      }
    }

    if (oscillatingStores.length === 0) return null;

    return {
      type: 'oscillation',
      confidence: maxConfidence,
      storesInvolved: oscillatingStores,
      detectedAt: Date.now(),
      description: `${oscillatingStores.length} stores exhibit periodic behavior`,
      metrics: {
        oscillatingStores: oscillatingStores.length,
      },
      evidence: [
        `Periodic patterns detected in: ${oscillatingStores.join(', ')}`,
      ],
    };
  }

  /**
   * Detect cascade: changes propagating through stores
   */
  private detectCascade(): EmergentPattern | null {
    const recentWindow = this.getRecentWindow(30);
    
    // Group by timestamp and sort
    const timestamps = [...new Set(recentWindow.map(d => d.timestamp))].sort();
    if (timestamps.length < 5) return null;

    // Check if stores are changing in sequence
    const storeSequence: string[] = [];
    for (const ts of timestamps) {
      const changedStores = recentWindow
        .filter(d => d.timestamp === ts)
        .map(d => d.storeId);
      
      for (const store of changedStores) {
        if (!storeSequence.includes(store)) {
          storeSequence.push(store);
        }
      }
    }

    if (storeSequence.length < 3) return null;

    // Check if there's a clear ordering
    const confidence = Math.min(0.9, storeSequence.length / 10);

    return {
      type: 'cascade',
      confidence,
      storesInvolved: storeSequence,
      detectedAt: Date.now(),
      description: `Changes cascading through ${storeSequence.length} stores`,
      metrics: {
        cascadeLength: storeSequence.length,
        duration: timestamps[timestamps.length - 1] - timestamps[0],
      },
      evidence: [
        `Cascade order: ${storeSequence.join(' → ')}`,
      ],
    };
  }

  /**
   * Detect convergence: stores moving toward similar states
   */
  private detectConvergence(): EmergentPattern | null {
    const recentWindow = this.getRecentWindow(30);
    const byStore = this.groupByStore(recentWindow);

    if (byStore.size < 2) return null;

    // Calculate variance over time
    const timestamps = [...new Set(recentWindow.map(d => d.timestamp))].sort();
    const variances: number[] = [];

    for (const ts of timestamps) {
      const values = recentWindow
        .filter(d => d.timestamp === ts)
        .map(d => this.extractNumericValue(d.value))
        .filter(v => v !== null) as number[];

      if (values.length >= 2) {
        variances.push(this.calculateVariance(values));
      }
    }

    if (variances.length < 5) return null;

    // Check if variance is decreasing
    const trend = this.calculateTrend(variances);
    if (trend >= -0.1) return null; // Not converging

    const storesInvolved = [...byStore.keys()];

    return {
      type: 'convergence',
      confidence: Math.min(0.9, Math.abs(trend)),
      storesInvolved,
      detectedAt: Date.now(),
      description: `${storesInvolved.length} stores converging to similar states`,
      metrics: {
        initialVariance: variances[0],
        finalVariance: variances[variances.length - 1],
        trend,
      },
      evidence: [
        `Variance decreased from ${variances[0].toFixed(2)} to ${variances[variances.length - 1].toFixed(2)}`,
        `Convergence rate: ${(trend * 100).toFixed(1)}%`,
      ],
    };
  }

  /**
   * Detect divergence: stores moving toward different states
   */
  private detectDivergence(): EmergentPattern | null {
    const recentWindow = this.getRecentWindow(30);
    const byStore = this.groupByStore(recentWindow);

    if (byStore.size < 2) return null;

    // Calculate variance over time
    const timestamps = [...new Set(recentWindow.map(d => d.timestamp))].sort();
    const variances: number[] = [];

    for (const ts of timestamps) {
      const values = recentWindow
        .filter(d => d.timestamp === ts)
        .map(d => this.extractNumericValue(d.value))
        .filter(v => v !== null) as number[];

      if (values.length >= 2) {
        variances.push(this.calculateVariance(values));
      }
    }

    if (variances.length < 5) return null;

    // Check if variance is increasing
    const trend = this.calculateTrend(variances);
    if (trend <= 0.1) return null; // Not diverging

    const storesInvolved = [...byStore.keys()];

    return {
      type: 'divergence',
      confidence: Math.min(0.9, trend),
      storesInvolved,
      detectedAt: Date.now(),
      description: `${storesInvolved.length} stores diverging to different states`,
      metrics: {
        initialVariance: variances[0],
        finalVariance: variances[variances.length - 1],
        trend,
      },
      evidence: [
        `Variance increased from ${variances[0].toFixed(2)} to ${variances[variances.length - 1].toFixed(2)}`,
        `Divergence rate: ${(trend * 100).toFixed(1)}%`,
      ],
    };
  }

  /**
   * Detect clustering: groups with similar behavior
   */
  private detectClustering(): EmergentPattern | null {
    const recentWindow = this.getRecentWindow(30);
    const byStore = this.groupByStore(recentWindow);

    if (byStore.size < 3) return null;

    // Calculate change rates for each store
    const changeRates = new Map<string, number>();
    for (const [storeId, points] of byStore) {
      if (points.length < 2) continue;
      const rate = (points[points.length - 1].changeCount - points[0].changeCount) / points.length;
      changeRates.set(storeId, rate);
    }

    // Find clusters of similar rates
    const rates = [...changeRates.values()].sort((a, b) => a - b);
    const clusters: string[][] = [];
    let currentCluster: string[] = [];
    let lastRate = rates[0];

    for (const [storeId, rate] of changeRates) {
      if (Math.abs(rate - lastRate) < 0.5) {
        currentCluster.push(storeId);
      } else {
        if (currentCluster.length >= 2) {
          clusters.push([...currentCluster]);
        }
        currentCluster = [storeId];
      }
      lastRate = rate;
    }

    if (currentCluster.length >= 2) {
      clusters.push(currentCluster);
    }

    if (clusters.length === 0) return null;

    const largestCluster = clusters.reduce((max, cluster) => 
      cluster.length > max.length ? cluster : max
    );

    return {
      type: 'clustering',
      confidence: Math.min(0.85, largestCluster.length / byStore.size),
      storesInvolved: largestCluster,
      detectedAt: Date.now(),
      description: `Found cluster of ${largestCluster.length} stores with similar behavior`,
      metrics: {
        clusterCount: clusters.length,
        largestClusterSize: largestCluster.length,
      },
      evidence: [
        `${clusters.length} behavioral clusters detected`,
        `Largest cluster: ${largestCluster.join(', ')}`,
      ],
    };
  }

  /**
   * Detect feedback loops: cyclic dependencies
   */
  private detectFeedbackLoop(): EmergentPattern | null {
    const recentWindow = this.getRecentWindow(40);
    const byTimestamp = new Map<number, DataPoint[]>();
    
    for (const point of recentWindow) {
      const points = byTimestamp.get(point.timestamp) ?? [];
      points.push(point);
      byTimestamp.set(point.timestamp, points);
    }

    // Look for patterns where store A changes, then B, then A again
    const timestamps = [...byTimestamp.keys()].sort();
    const sequences: string[][] = [];

    for (let i = 0; i < timestamps.length - 2; i++) {
      const t1 = timestamps[i];
      const t2 = timestamps[i + 1];
      const t3 = timestamps[i + 2];

      const stores1 = byTimestamp.get(t1)!.map(p => p.storeId);
      const stores2 = byTimestamp.get(t2)!.map(p => p.storeId);
      const stores3 = byTimestamp.get(t3)!.map(p => p.storeId);

      // Check for A → B → A pattern
      for (const a of stores1) {
        for (const b of stores2) {
          if (stores3.includes(a) && a !== b) {
            sequences.push([a, b, a]);
          }
        }
      }
    }

    if (sequences.length === 0) return null;

    const involvedStores = [...new Set(sequences.flat())];

    return {
      type: 'feedback-loop',
      confidence: Math.min(0.85, sequences.length / 10),
      storesInvolved: involvedStores,
      detectedAt: Date.now(),
      description: `Detected feedback loop between ${involvedStores.length} stores`,
      metrics: {
        loopCount: sequences.length,
      },
      evidence: [
        `${sequences.length} cyclic interaction patterns detected`,
        `Stores in loop: ${involvedStores.join(' ↔ ')}`,
      ],
    };
  }

  /**
   * Detect equilibrium: system in stable state
   */
  private detectEquilibrium(): EmergentPattern | null {
    const recentWindow = this.getRecentWindow(30);
    const byStore = this.groupByStore(recentWindow);

    // Check if change rates are low across all stores
    const changeRates: number[] = [];
    
    for (const [storeId, points] of byStore) {
      if (points.length < 5) continue;
      const recentChanges = points.slice(-5);
      const rate = (recentChanges[recentChanges.length - 1].changeCount - recentChanges[0].changeCount) / recentChanges.length;
      changeRates.push(rate);
    }

    if (changeRates.length === 0) return null;

    const avgRate = changeRates.reduce((sum, r) => sum + r, 0) / changeRates.length;
    
    if (avgRate > 0.5) return null; // Still actively changing

    const storesInvolved = [...byStore.keys()];

    return {
      type: 'equilibrium',
      confidence: Math.min(0.9, 1 - avgRate),
      storesInvolved,
      detectedAt: Date.now(),
      description: `System reached equilibrium across ${storesInvolved.length} stores`,
      metrics: {
        averageChangeRate: avgRate,
        stableStores: storesInvolved.length,
      },
      evidence: [
        `Average change rate: ${avgRate.toFixed(3)} changes/sample`,
        `All ${storesInvolved.length} stores stabilized`,
      ],
    };
  }

  /**
   * Get recently detected patterns
   */
  getPatterns(limit = 10): EmergentPattern[] {
    return this.patterns.slice(-limit);
  }

  /**
   * Get patterns of a specific type
   */
  getPatternsByType(type: PatternType): EmergentPattern[] {
    return this.patterns.filter(p => p.type === type);
  }

  /**
   * Clear pattern history
   */
  clearPatterns(): void {
    this.patterns = [];
  }

  // Helper methods

  private getRecentWindow(count: number): DataPoint[] {
    return this.history.slice(-count);
  }

  private groupByStore(points: DataPoint[]): Map<string, DataPoint[]> {
    const map = new Map<string, DataPoint[]>();
    for (const point of points) {
      const arr = map.get(point.storeId) ?? [];
      arr.push(point);
      map.set(point.storeId, arr);
    }
    return map;
  }

  private extractNumericValue(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      // Try common numeric properties
      if ('value' in value && typeof value.value === 'number') return value.value;
      if ('count' in value && typeof value.count === 'number') return value.count;
      if ('x' in value && typeof value.x === 'number') return value.x;
    }
    return null;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private detectPeriodicity(values: number[]): number {
    if (values.length < 6) return 0;

    // Simple autocorrelation
    for (let lag = 2; lag < values.length / 2; lag++) {
      let correlation = 0;
      let count = 0;

      for (let i = 0; i < values.length - lag; i++) {
        correlation += values[i] === values[i + lag] ? 1 : 0;
        count++;
      }

      if (correlation / count > 0.7) {
        return lag; // Found period
      }
    }

    return 0;
  }
}
