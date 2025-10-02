# Performance Testing Framework

Comprehensive benchmarking utilities for measuring Fortistate performance.

## Quick Start

```bash
# Run all performance tests
npm test -- performance

# Run specific benchmark
npm test -- constraints.perf.test.ts

# Run with detailed output
npm test -- constraints.perf.test.ts --reporter=verbose
```

## Writing Benchmarks

### Basic Benchmark

```typescript
import { benchmark, formatResults } from './benchmark';

const result = await benchmark(
  'My Operation',
  () => {
    // Code to benchmark
    for (let i = 0; i < 1000; i++) {
      doSomething(i);
    }
  },
  { iterations: 100, warmupIterations: 10 }
);

console.log(formatResults(result));
```

### Comparison Benchmark

```typescript
import { compareBenchmarks, formatResults } from './benchmark';

const results = await compareBenchmarks([
  {
    name: 'Approach A',
    fn: () => { /* implementation A */ }
  },
  {
    name: 'Approach B',
    fn: () => { /* implementation B */ }
  },
], { iterations: 1000 });

console.log(formatResults(results));
```

### Performance Assertions

```typescript
import { benchmark, assertPerformance } from './benchmark';

const result = await benchmark('Fast Operation', fastFn);

// Assert performance targets
assertPerformance(result, {
  maxAvgTime: 10,           // Max 10ms average
  maxP95Time: 15,           // Max 15ms at 95th percentile
  maxMemoryMB: 50,          // Max 50MB memory usage
  minOpsPerSecond: 100,     // Min 100 operations per second
});
```

## Benchmark Options

```typescript
interface BenchmarkOptions {
  iterations?: number;          // Number of times to run (default: 1000)
  warmupIterations?: number;    // Warmup runs (default: 100)
  minDuration?: number;         // Minimum total duration in ms
  maxDuration?: number;         // Maximum total duration in ms (default: 30000)
  measureMemory?: boolean;      // Track memory usage (default: true)
  beforeEach?: () => void;      // Setup before each iteration
  afterEach?: () => void;       // Cleanup after each iteration
}
```

## Benchmark Results

```typescript
interface BenchmarkResult {
  name: string;
  totalTime: number;       // Total time across all iterations
  avgTime: number;         // Average time per iteration
  minTime: number;         // Fastest iteration
  maxTime: number;         // Slowest iteration
  medianTime: number;      // Median time
  p95Time: number;         // 95th percentile
  p99Time: number;         // 99th percentile
  opsPerSecond: number;    // Operations per second
  iterations: number;      // Actual iterations run
  memoryUsage?: {          // Memory delta
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}
```

## Memory Measurement

```typescript
import { measureMemory } from './benchmark';

const { result, memoryDelta } = await measureMemory(() => {
  // Code to measure
  const data = generateLargeDataset();
  return processData(data);
});

console.log(`Memory used: ${memoryDelta.heapUsed / 1024 / 1024} MB`);
console.log(`Result:`, result);
```

## Best Practices

### 1. Use Sufficient Iterations

```typescript
// ❌ Too few iterations
const result = await benchmark('operation', fn, { iterations: 10 });

// ✅ Enough for statistical significance
const result = await benchmark('operation', fn, { iterations: 1000 });
```

### 2. Always Include Warmup

```typescript
// ❌ No warmup (JIT not optimized)
const result = await benchmark('operation', fn, { warmupIterations: 0 });

// ✅ Proper warmup
const result = await benchmark('operation', fn, { warmupIterations: 100 });
```

### 3. Cleanup Resources

```typescript
const result = await benchmark('operation', fn, {
  beforeEach: () => {
    // Setup fresh state
    setupTest();
  },
  afterEach: () => {
    // Cleanup resources
    cleanupTest();
  },
});
```

### 4. Use Realistic Workloads

```typescript
// ❌ Trivial operation
await benchmark('add', () => 1 + 1);

// ✅ Representative workload
await benchmark('process 1000 items', () => {
  for (let i = 0; i < 1000; i++) {
    processItem(items[i]);
  }
});
```

### 5. Compare Fairly

```typescript
// ✅ Same workload for all implementations
const results = await compareBenchmarks([
  {
    name: 'Implementation A',
    fn: () => {
      const store = createStoreA();
      for (let i = 0; i < 1000; i++) store.set(i);
    }
  },
  {
    name: 'Implementation B',
    fn: () => {
      const store = createStoreB();
      for (let i = 0; i < 1000; i++) store.set(i);
    }
  },
]);
```

## Performance Targets

When writing benchmarks, consider these targets:

| Operation | Target | Notes |
|-----------|--------|-------|
| Store Update | < 0.1ms | Vanilla store overhead |
| Causal Store Update | < 10ms | For 1000 updates |
| Universe + Constraints | < 15ms | For 1000 updates |
| Constraint Repair | < 20ms | For 1000 repairs |
| Universe Fork | < 1ms | Single fork operation |
| Snapshot/Restore | < 1ms | Single operation |

## Troubleshooting

### Flaky Benchmarks

If benchmarks vary significantly:

1. **Increase iterations**
```typescript
{ iterations: 10000 }  // More iterations = more stable
```

2. **Check for async operations**
```typescript
await benchmark('async operation', async () => {
  await doSomethingAsync();  // Ensure awaits are present
});
```

3. **Disable background processes**
```bash
# Close other applications
# Disable antivirus temporarily
# Run on consistent hardware
```

### Memory Issues

If seeing OOM errors:

1. **Reduce iteration count**
```typescript
{ iterations: 100 }  // Fewer iterations for memory-intensive operations
```

2. **Add cleanup**
```typescript
{
  afterEach: () => {
    // Explicit cleanup
    largeObject = null;
    if (global.gc) global.gc();
  }
}
```

3. **Use maxDuration**
```typescript
{ maxDuration: 10000 }  // Stop after 10 seconds
```

## CI Integration

Add to CI workflow:

```yaml
- name: Run Performance Tests
  run: npm test -- performance --run
  
- name: Assert Performance Thresholds
  run: |
    npm test -- constraints.perf.test.ts --run
    # Fails if assertions not met
```

## Examples

See `test/performance/constraints.perf.test.ts` for complete examples including:

- Vanilla store benchmarks
- Causal store overhead measurement
- Universe constraint enforcement
- Cross-store law coordination
- Memory usage tracking
- Comparison benchmarks

## Advanced Usage

### Custom Reporters

```typescript
const result = await benchmark('operation', fn);

// Custom formatting
console.log(`Operation completed in ${result.avgTime.toFixed(3)}ms`);
console.log(`P95: ${result.p95Time.toFixed(3)}ms`);
console.log(`Throughput: ${result.opsPerSecond.toFixed(0)} ops/sec`);
```

### Statistical Analysis

```typescript
const result = await benchmark('operation', fn, { iterations: 10000 });

// Calculate standard deviation
const times = collectAllTimes(result);  // You'd need to track these
const mean = result.avgTime;
const variance = times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length;
const stdDev = Math.sqrt(variance);

console.log(`Mean: ${mean}ms ± ${stdDev}ms`);
```

### Performance Regression Detection

```typescript
// Baseline
const baseline = await benchmark('operation v1', oldImplementation);

// New implementation
const current = await benchmark('operation v2', newImplementation);

// Detect regression
const regression = (current.avgTime - baseline.avgTime) / baseline.avgTime;
if (regression > 0.1) {  // 10% slower
  throw new Error(`Performance regression: ${(regression * 100).toFixed(1)}% slower`);
}
```

## Further Reading

- [Performance Results](../docs/PERFORMANCE.md) - Actual benchmark results
- [Optimization Guide](../docs/OPTIMIZATION.md) - Performance tuning tips
- Vitest Documentation - Test runner configuration
