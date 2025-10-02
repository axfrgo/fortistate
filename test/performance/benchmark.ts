/**
 * Performance Benchmarking Framework
 * 
 * Provides utilities for measuring performance of Fortistate operations
 * with statistical analysis and comparison capabilities.
 */

export interface BenchmarkResult {
  name: string;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  medianTime: number;
  p95Time: number;
  p99Time: number;
  opsPerSecond: number;
  iterations: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  minDuration?: number; // Minimum duration in ms
  maxDuration?: number; // Maximum duration in ms
  measureMemory?: boolean;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
}

/**
 * Run a benchmark with the given function
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 1000,
    warmupIterations = 100,
    minDuration = 0,
    maxDuration = 30000,
    measureMemory = true,
    beforeEach,
    afterEach,
  } = options;

  // Warmup phase
  for (let i = 0; i < warmupIterations; i++) {
    if (beforeEach) await beforeEach();
    await fn();
    if (afterEach) await afterEach();
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const memoryBefore = measureMemory ? process.memoryUsage() : undefined;
  const times: number[] = [];
  const startTime = Date.now();

  // Run benchmark iterations
  for (let i = 0; i < iterations; i++) {
    // Check if we've exceeded max duration
    if (Date.now() - startTime > maxDuration) {
      console.warn(`Benchmark "${name}" stopped early after ${i} iterations (maxDuration exceeded)`);
      break;
    }

    if (beforeEach) await beforeEach();
    
    const iterStart = performance.now();
    await fn();
    const iterEnd = performance.now();
    
    if (afterEach) await afterEach();
    
    times.push(iterEnd - iterStart);
  }

  const totalTime = times.reduce((sum, t) => sum + t, 0);

  // Check if we met minimum duration
  if (totalTime < minDuration) {
    console.warn(`Benchmark "${name}" completed in ${totalTime}ms (below minDuration of ${minDuration}ms)`);
  }

  const memoryAfter = measureMemory ? process.memoryUsage() : undefined;

  // Calculate statistics
  const sortedTimes = [...times].sort((a, b) => a - b);
  const avgTime = totalTime / times.length;
  const minTime = sortedTimes[0];
  const maxTime = sortedTimes[sortedTimes.length - 1];
  const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p99Index = Math.floor(sortedTimes.length * 0.99);
  const p95Time = sortedTimes[p95Index];
  const p99Time = sortedTimes[p99Index];
  const opsPerSecond = 1000 / avgTime;

  return {
    name,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    medianTime,
    p95Time,
    p99Time,
    opsPerSecond,
    iterations: times.length,
    memoryUsage: memoryBefore && memoryAfter ? {
      heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
      heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
      external: memoryAfter.external - memoryBefore.external,
    } : undefined,
  };
}

/**
 * Run multiple benchmarks and compare results
 */
export async function compareBenchmarks(
  benchmarks: Array<{ name: string; fn: () => void | Promise<void> }>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const bench of benchmarks) {
    const result = await benchmark(bench.name, bench.fn, options);
    results.push(result);
  }

  return results;
}

/**
 * Format benchmark results for console output
 */
export function formatResults(results: BenchmarkResult | BenchmarkResult[]): string {
  const resultsArray = Array.isArray(results) ? results : [results];
  
  let output = '\n';
  output += '┌─────────────────────────────────────────────────────────────────────────┐\n';
  output += '│                       Performance Benchmark Results                     │\n';
  output += '├─────────────────────────────────────────────────────────────────────────┤\n';

  for (const result of resultsArray) {
    output += `│ ${result.name.padEnd(71)} │\n`;
    output += '├─────────────────────────────────────────────────────────────────────────┤\n';
    output += `│   Iterations:     ${result.iterations.toLocaleString().padStart(10)}                                         │\n`;
    output += `│   Total Time:     ${result.totalTime.toFixed(2).padStart(10)} ms                                     │\n`;
    output += `│   Avg Time:       ${result.avgTime.toFixed(3).padStart(10)} ms                                     │\n`;
    output += `│   Min Time:       ${result.minTime.toFixed(3).padStart(10)} ms                                     │\n`;
    output += `│   Max Time:       ${result.maxTime.toFixed(3).padStart(10)} ms                                     │\n`;
    output += `│   Median Time:    ${result.medianTime.toFixed(3).padStart(10)} ms                                     │\n`;
    output += `│   P95 Time:       ${result.p95Time.toFixed(3).padStart(10)} ms                                     │\n`;
    output += `│   P99 Time:       ${result.p99Time.toFixed(3).padStart(10)} ms                                     │\n`;
    output += `│   Ops/Second:     ${result.opsPerSecond.toFixed(0).padStart(10)}                                          │\n`;
    
    if (result.memoryUsage) {
      const heapMB = (result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
      output += `│   Memory (Heap):  ${heapMB.padStart(10)} MB                                     │\n`;
    }
    
    output += '├─────────────────────────────────────────────────────────────────────────┤\n';
  }

  // Add comparison if multiple results
  if (resultsArray.length > 1) {
    output += '│                            Comparison                                   │\n';
    output += '├─────────────────────────────────────────────────────────────────────────┤\n';
    
    const fastest = resultsArray.reduce((prev, curr) => 
      curr.avgTime < prev.avgTime ? curr : prev
    );
    
    for (const result of resultsArray) {
      const ratio = (result.avgTime / fastest.avgTime).toFixed(2);
      const symbol = result === fastest ? '🏆' : '  ';
      output += `│ ${symbol} ${result.name.padEnd(40)} ${ratio.padStart(6)}x        │\n`;
    }
    
    output += '├─────────────────────────────────────────────────────────────────────────┤\n';
  }

  output += '└─────────────────────────────────────────────────────────────────────────┘\n';

  return output;
}

/**
 * Assert that benchmark meets performance targets
 */
export function assertPerformance(
  result: BenchmarkResult,
  targets: {
    maxAvgTime?: number;
    maxP95Time?: number;
    maxP99Time?: number;
    minOpsPerSecond?: number;
    maxMemoryMB?: number;
  }
): void {
  const failures: string[] = [];

  if (targets.maxAvgTime && result.avgTime > targets.maxAvgTime) {
    failures.push(`Average time ${result.avgTime.toFixed(3)}ms exceeds target ${targets.maxAvgTime}ms`);
  }

  if (targets.maxP95Time && result.p95Time > targets.maxP95Time) {
    failures.push(`P95 time ${result.p95Time.toFixed(3)}ms exceeds target ${targets.maxP95Time}ms`);
  }

  if (targets.maxP99Time && result.p99Time > targets.maxP99Time) {
    failures.push(`P99 time ${result.p99Time.toFixed(3)}ms exceeds target ${targets.maxP99Time}ms`);
  }

  if (targets.minOpsPerSecond && result.opsPerSecond < targets.minOpsPerSecond) {
    failures.push(`Ops/second ${result.opsPerSecond.toFixed(0)} below target ${targets.minOpsPerSecond}`);
  }

  if (targets.maxMemoryMB && result.memoryUsage) {
    const memoryMB = result.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryMB > targets.maxMemoryMB) {
      failures.push(`Memory usage ${memoryMB.toFixed(2)}MB exceeds target ${targets.maxMemoryMB}MB`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Performance targets not met for "${result.name}":\n${failures.join('\n')}`);
  }
}

/**
 * Measure memory usage of a function
 */
export async function measureMemory<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; memoryDelta: NodeJS.MemoryUsage }> {
  if (global.gc) {
    global.gc();
  }

  const before = process.memoryUsage();
  const result = await fn();
  const after = process.memoryUsage();

  return {
    result,
    memoryDelta: {
      rss: after.rss - before.rss,
      heapTotal: after.heapTotal - before.heapTotal,
      heapUsed: after.heapUsed - before.heapUsed,
      external: after.external - before.external,
      arrayBuffers: after.arrayBuffers - before.arrayBuffers,
    },
  };
}
