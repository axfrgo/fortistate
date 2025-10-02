/**
 * Constraint Enforcement Performance Benchmarks
 * 
 * Measures overhead of constraint auditing and law enforcement
 * Target: <15ms overhead for 1000 events
 */

import { describe, it, expect } from 'vitest';
import { benchmark, compareBenchmarks, formatResults, assertPerformance } from './benchmark.js';
import { createStore } from '../../src/storeFactory.js';
import { createCausalStore } from '../../src/temporal/causalStore.js';
import { createUniverse } from '../../src/cosmogenesis/universe.js';
import { defineLaw } from '../../src/cosmogenesis/laws.js';
import type { Substrate } from '../../src/algebra/substrate.js';

// Test substrate with simple constraint
const createTestSubstrate = (): Substrate => ({
  id: 'perf-test',
  name: 'Performance Test Substrate',
  constraints: new Map([
    ['positive', {
      name: 'positive',
      invariants: [],
      validate: (value: number) => ({
        valid: value >= 0,
        message: value >= 0 ? undefined : `Value must be non-negative`,
      }),
    }],
  ]),
  laws: new Map(),
});

describe('Constraint Enforcement Performance', () => {
  it('should benchmark vanilla store (baseline)', async () => {
    const result = await benchmark(
      'Vanilla Store - 1000 updates',
      () => {
        const store = createStore('counter', { value: 0 });
        for (let i = 0; i < 1000; i++) {
          store.set(i);
        }
      },
      { iterations: 100, warmupIterations: 10 }
    );

    console.log(formatResults(result));
    
    // Baseline should be very fast
    expect(result.avgTime).toBeLessThan(10);
  }, 30000);

  it('should benchmark causal store (temporal overhead)', async () => {
    const result = await benchmark(
      'Causal Store - 1000 updates',
      () => {
        const base = createStore('counter', { value: 0 });
        const causal = createCausalStore(base, 'counter');
        for (let i = 0; i < 1000; i++) {
          causal.set(i);
        }
      },
      { iterations: 100, warmupIterations: 10 }
    );

    console.log(formatResults(result));
    
    // Causal store should add minimal overhead
    expect(result.avgTime).toBeLessThan(50);
  }, 30000);

  it('should benchmark universe with constraint enforcement', async () => {
    const result = await benchmark(
      'Universe + Constraints - 1000 updates',
      () => {
        const substrate = createTestSubstrate();
        const universe = createUniverse({
          id: 'perf-test',
          substrate,
        });
        
        const counter = universe.createStore('counter', 0);
        
        for (let i = 0; i < 1000; i++) {
          counter.set(i);
        }
        
        universe.destroy();
      },
      { iterations: 100, warmupIterations: 10 }
    );

    console.log(formatResults(result));
    
    // Target: <15ms for 1000 events
    assertPerformance(result, {
      maxAvgTime: 15,
    });
  }, 30000);

  it('should compare all implementations', async () => {
    const results = await compareBenchmarks([
      {
        name: 'Vanilla Store',
        fn: () => {
          const store = createStore('counter', { value: 0 });
          for (let i = 0; i < 1000; i++) {
            store.set(i);
          }
        },
      },
      {
        name: 'Causal Store',
        fn: () => {
          const base = createStore('counter', { value: 0 });
          const causal = createCausalStore(base, 'counter');
          for (let i = 0; i < 1000; i++) {
            causal.set(i);
          }
        },
      },
      {
        name: 'Universe + Constraints',
        fn: () => {
          const substrate = createTestSubstrate();
          const universe = createUniverse({
            id: 'perf-test',
            substrate,
          });
          const counter = universe.createStore('counter', 0);
          for (let i = 0; i < 1000; i++) {
            counter.set(i);
          }
          universe.destroy();
        },
      },
    ], { iterations: 100, warmupIterations: 10 });

    console.log(formatResults(results));

    // All should complete in reasonable time
    results.forEach(result => {
      expect(result.avgTime).toBeLessThan(100);
    });
  }, 60000);

  it('should benchmark constraint violation repairs', async () => {
    const result = await benchmark(
      'Constraint Violations - 1000 repairs',
      () => {
        const substrate = createTestSubstrate();
        const universe = createUniverse({
          id: 'perf-test',
          substrate,
          autoRepair: true,
        });
        
        const counter = universe.createStore('counter', 0);
        
        // Trigger violations that need repair
        for (let i = 0; i < 1000; i++) {
          counter.set(-i); // Negative values violate constraint
        }
        
        universe.destroy();
      },
      { iterations: 50, warmupIterations: 5 }
    );

    console.log(formatResults(result));
    
    // Repairs should still be fast
    expect(result.avgTime).toBeLessThan(30);
  }, 30000);

  it('should benchmark multiple stores with cross-store laws', async () => {
    const substrate: Substrate = {
      id: 'multi-store-test',
      name: 'Multi-Store Test',
      constraints: new Map([
        ['positive', {
          name: 'positive',
          invariants: [],
          validate: (value: number) => ({
            valid: value >= 0,
            message: value >= 0 ? undefined : 'Must be positive',
          }),
        }],
      ]),
      laws: new Map(),
    };

    const result = await benchmark(
      'Cross-Store Laws - 1000 updates',
      () => {
        const universe = createUniverse({
          id: 'multi-test',
          substrate,
        });
        
        const a = universe.createStore('a', 0);
        const b = universe.createStore('b', 0);
        const sum = universe.createStore('sum', 0);
        
        for (let i = 0; i < 1000; i++) {
          a.set(i);
          b.set(i * 2);
        }
        
        universe.destroy();
      },
      { iterations: 50, warmupIterations: 5 }
    );

    console.log(formatResults(result));
    
    // Cross-store coordination should still be performant
    expect(result.avgTime).toBeLessThan(50);
  }, 30000);

  it('should benchmark universe forking', async () => {
    const substrate = createTestSubstrate();
    const universe = createUniverse({
      id: 'fork-test',
      substrate,
    });
    
    const counter = universe.createStore('counter', 0);
    
    // Build up some state
    for (let i = 0; i < 100; i++) {
      counter.set(i);
    }

    const result = await benchmark(
      'Universe Forking',
      () => {
        const fork = universe.fork('fork-' + Math.random());
        fork.destroy();
      },
      { iterations: 1000, warmupIterations: 100 }
    );

    console.log(formatResults(result));
    
    universe.destroy();
    
    // Forking should be fast
    expect(result.avgTime).toBeLessThan(1);
  }, 30000);

  it('should benchmark snapshot/restore', async () => {
    const substrate = createTestSubstrate();
    const universe = createUniverse({
      id: 'snapshot-test',
      substrate,
    });
    
    const counter = universe.createStore('counter', 0);
    
    // Build up state
    for (let i = 0; i < 100; i++) {
      counter.set(i);
    }

    const result = await benchmark(
      'Snapshot + Restore',
      () => {
        const snapshot = universe.snapshot();
        universe.restore(snapshot);
      },
      { iterations: 1000, warmupIterations: 100 }
    );

    console.log(formatResults(result));
    
    universe.destroy();
    
    // Snapshot/restore should be fast
    expect(result.avgTime).toBeLessThan(1);
  }, 30000);
});

describe('Memory Usage Benchmarks', () => {
  it('should measure memory overhead of causal store', async () => {
    const result = await benchmark(
      'Causal Store Memory - 10000 events',
      () => {
        const base = createStore('counter', { value: 0 });
        const causal = createCausalStore(base, 'counter');
        
        for (let i = 0; i < 10000; i++) {
          causal.set(i);
        }
      },
      { iterations: 10, warmupIterations: 2, measureMemory: true }
    );

    console.log(formatResults(result));
    
    // Memory should be reasonable
    if (result.memoryUsage) {
      const memoryMB = result.memoryUsage.heapUsed / 1024 / 1024;
      console.log(`Memory usage: ${memoryMB.toFixed(2)} MB for 10k events`);
      
      // Should be less than 50MB for 10k events
      expect(memoryMB).toBeLessThan(50);
    }
  }, 30000);

  it('should measure memory overhead of universe', async () => {
    const result = await benchmark(
      'Universe Memory - 10000 events',
      () => {
        const substrate = createTestSubstrate();
        const universe = createUniverse({
          id: 'memory-test',
          substrate,
        });
        
        const counter = universe.createStore('counter', 0);
        
        for (let i = 0; i < 10000; i++) {
          counter.set(i);
        }
        
        universe.destroy();
      },
      { iterations: 10, warmupIterations: 2, measureMemory: true }
    );

    console.log(formatResults(result));
    
    if (result.memoryUsage) {
      const memoryMB = result.memoryUsage.heapUsed / 1024 / 1024;
      console.log(`Memory usage: ${memoryMB.toFixed(2)} MB for 10k events`);
      
      // Should be reasonable
      expect(memoryMB).toBeLessThan(100);
    }
  }, 30000);
});
