# Emergence Detection System

## Overview

The Emergence Detection System monitors multiple stores within a universe to identify emergent behavioral patterns. Emergent behavior occurs when interactions between simple components produce complex, unexpected patterns at higher levels of organization.

## Pattern Types

The system detects 10 distinct types of emergent patterns:

### 1. Synchronization
**Description**: Multiple stores changing in lockstep, indicating coordinated behavior.

**Detection Algorithm**:
- Counts how many stores change within a narrow time window
- Calculates synchronization ratio (synchronized changes / total changes)
- Triggers when >50% of changes are synchronized

**Metrics**:
- `syncRatio`: Proportion of synchronized changes (0-1)

**Example Use Cases**:
- Ideal gas law (PV=nRT): pressure, volume, temperature changing together
- Coordinated UI updates across multiple components
- Synchronized state machines

### 2. Oscillation
**Description**: Periodic, repeating patterns in store values over time.

**Detection Algorithm**:
- Uses Fast Fourier Transform (FFT)-like periodicity detection
- Compares values at regular intervals to detect cycles
- Identifies dominant period and regularity

**Metrics**:
- `period`: Number of samples in one cycle
- `amplitude`: Magnitude of oscillation

**Example Use Cases**:
- Pendulum simulations
- Day/night cycles in game state
- Periodic batch processing

### 3. Cascade
**Description**: Changes propagating sequentially through stores, like dominoes falling.

**Detection Algorithm**:
- Tracks temporal ordering of store changes
- Identifies stores that consistently change after others
- Measures propagation delay between stores

**Metrics**:
- `propagationDelay`: Average time between sequential changes (ms)
- `sequenceLength`: Number of stores in cascade

**Example Use Cases**:
- Event sourcing workflows
- State machine transitions
- Dependency chains

### 4. Convergence
**Description**: Multiple stores moving toward similar states over time.

**Detection Algorithm**:
- Calculates variance of store values across time windows
- Detects downward trend in variance (stores becoming more similar)
- Uses linear regression to measure trend strength

**Metrics**:
- `initialVariance`: Variance at start of window
- `finalVariance`: Variance at end of window
- `trend`: Rate of convergence (negative = converging)

**Example Use Cases**:
- Thermal equilibrium (temperature equalization)
- Consensus algorithms
- Load balancing

### 5. Divergence
**Description**: Stores moving toward different states, increasing system variance.

**Detection Algorithm**:
- Similar to convergence but detects upward variance trend
- Identifies when system is becoming less uniform

**Metrics**:
- `initialVariance`: Starting variance
- `finalVariance`: Ending variance  
- `trend`: Rate of divergence (positive = diverging)

**Example Use Cases**:
- Non-equilibrium thermodynamics
- Evolutionary algorithms
- Market fragmentation

### 6. Clustering
**Description**: Stores grouping into subsets with similar behavior rates.

**Detection Algorithm**:
- Calculates change rate for each store
- Groups stores by similar rates using threshold-based clustering
- Identifies distinct behavioral clusters

**Metrics**:
- `clusterCount`: Number of distinct groups
- `largestCluster`: Size of biggest group

**Example Use Cases**:
- User behavior segmentation
- Performance tier detection
- Network partitioning

### 7. Feedback Loop
**Description**: Cyclic dependencies where stores influence each other in a loop (A→B→A).

**Detection Algorithm**:
- Tracks change sequences to detect cycles
- Identifies stores that repeatedly cause changes in each other
- Measures loop frequency

**Metrics**:
- `loopLength`: Number of stores in cycle
- `frequency`: How often loop completes

**Example Use Cases**:
- PID controllers
- Economic supply/demand cycles
- Feedback control systems

### 8. Phase Transition
**Description**: Sudden, dramatic change in system behavior.

**Detection Algorithm**:
- Detects rapid increases in change rate
- Identifies discontinuities in state evolution
- Measures transition sharpness

**Metrics**:
- `beforeRate`: Change rate before transition
- `afterRate`: Change rate after transition
- `transitionSharpness`: How abrupt the change was

**Example Use Cases**:
- Water freezing/boiling
- Network congestion onset
- System mode switches

### 9. Equilibrium
**Description**: System reaching a stable state with minimal changes.

**Detection Algorithm**:
- Measures total change rate across all stores
- Detects when rate falls below threshold
- Confirms stability over time window

**Metrics**:
- `changeRate`: Changes per time unit
- `stability`: How long equilibrium has lasted

**Example Use Cases**:
- Chemical equilibrium
- Steady-state simulations
- Settled UI state

### 10. Chaos
**Description**: Unpredictable, highly sensitive behavior.

**Detection Algorithm**:
- Measures entropy of state changes
- Detects high variance without patterns
- Identifies lack of correlation

**Metrics**:
- `entropy`: Information-theoretic measure of unpredictability
- `lyapunovExponent`: Sensitivity to initial conditions

**Example Use Cases**:
- Weather simulation
- Chaotic systems (double pendulum)
- Turbulence modeling

## API Reference

### EmergenceDetector

```typescript
class EmergenceDetector {
  constructor(
    universe: UniverseManager,
    options?: EmergenceDetectorOptions
  )
  
  start(): void
  stop(): void
  getPatterns(type?: PatternType): EmergentPattern[]
  clearPatterns(): void
}
```

### Options

```typescript
interface EmergenceDetectorOptions {
  /** Number of samples to keep in history (default: 100) */
  windowSize?: number
  
  /** Minimum confidence to report pattern (default: 0.7) */
  minConfidence?: number
  
  /** Sampling interval in milliseconds (default: 100) */
  samplingInterval?: number
  
  /** Which pattern types to detect (default: all) */
  enabledPatterns?: PatternType[]
}
```

### Pattern Result

```typescript
interface EmergentPattern {
  type: PatternType
  confidence: number  // 0-1
  detectedAt: number  // timestamp
  storesInvolved: string[]
  description: string
  evidence: string[]
  metrics: Record<string, number>
}
```

## Usage Examples

### Basic Setup

```typescript
import { createUniverse } from 'fortistate';
import { EmergenceDetector } from 'fortistate';
import { createSubstrate } from 'fortistate';

// Create universe with physics
const substrate = createSubstrate('physics', new Map());
const universe = createUniverse({
  id: 'my-sim',
  substrate
});

// Create stores
const temp = universe.createStore('temperature', 298.15);
const pressure = universe.createStore('pressure', 101325);
const volume = universe.createStore('volume', 0.0224);

// Start detection
const detector = new EmergenceDetector(universe, {
  samplingInterval: 50,
  minConfidence: 0.6
});

detector.start();

// Simulate ideal gas law
setInterval(() => {
  const T = temp.get() + (Math.random() - 0.5) * 10;
  const P = pressure.get() * (T / temp.get());
  
  temp.set(T);
  pressure.set(P);
}, 100);

// Check for patterns
setTimeout(() => {
  const patterns = detector.getPatterns();
  console.log('Detected patterns:', patterns);
  
  const sync = patterns.find(p => p.type === 'synchronization');
  if (sync) {
    console.log(`Synchronization detected with ${sync.confidence} confidence`);
    console.log(`Stores involved: ${sync.storesInvolved.join(', ')}`);
  }
}, 5000);
```

### Filtering Patterns

```typescript
// Only detect specific pattern types
const detector = new EmergenceDetector(universe, {
  enabledPatterns: ['synchronization', 'cascade', 'equilibrium']
});

// Get patterns above threshold
detector.start();
setTimeout(() => {
  const highConfidence = detector
    .getPatterns()
    .filter(p => p.confidence > 0.8);
  
  console.log(`Found ${highConfidence.length} high-confidence patterns`);
}, 1000);

// Get patterns of specific type
const cascades = detector.getPatterns('cascade');
```

### Real-time Monitoring

```typescript
const detector = new EmergenceDetector(universe, {
  samplingInterval: 100,
  windowSize: 50
});

detector.start();

// Check every second
setInterval(() => {
  const patterns = detector.getPatterns();
  
  // Display top pattern
  if (patterns.length > 0) {
    const top = patterns[0];
    console.log(`${top.type}: ${top.description} (${top.confidence.toFixed(2)})`);
    console.log(`  Stores: ${top.storesInvolved.join(', ')}`);
    console.log(`  Metrics:`, top.metrics);
  }
}, 1000);
```

## Performance Characteristics

- **Sampling Overhead**: ~0.1ms per store per sample
- **Analysis Overhead**: ~1-2ms per analysis cycle (depends on window size)
- **Memory**: ~1KB per sample (windowSize * storeCount)
- **Recommended Settings**:
  - Small systems (<10 stores): 50ms sampling, 100 window
  - Medium systems (10-100 stores): 100ms sampling, 50 window
  - Large systems (>100 stores): 200ms sampling, 25 window

## Integration with Universe Manager

The EmergenceDetector works seamlessly with the Universe Manager:

```typescript
// Detector automatically tracks all stores in universe
universe.createStore('new-store', initialValue);
// Detector will include this in next analysis

// Detector respects universe lifecycle
universe.pause();
// Detector continues sampling but values are frozen

universe.destroy();
detector.stop();  // Should manually stop detector
```

## Algorithm Details

### Time-Series Sampling

The detector maintains a sliding window of samples:

```typescript
interface DataPoint {
  timestamp: number
  storeId: string
  value: any
  changeCount: number
}
```

Samples are collected at `samplingInterval` and trimmed to `windowSize * storeCount` points.

### Pattern Detection

Each pattern type has a dedicated detection algorithm:

1. **Data Grouping**: Group samples by store ID
2. **Statistical Analysis**: Calculate variance, trends, correlations
3. **Pattern Matching**: Apply pattern-specific algorithms
4. **Confidence Scoring**: Score patterns 0-1 based on strength
5. **Evidence Collection**: Gather supporting data points

### Confidence Calculation

Confidence is calculated differently per pattern type:

- **Synchronization**: syncRatio directly maps to confidence
- **Oscillation**: regularity score (1 - variance in period)
- **Convergence/Divergence**: R² of trend line
- **Equilibrium**: inverse of normalized change rate
- Others: pattern-specific metrics

## Limitations

- **Latency**: Requires sufficient samples to detect patterns (~10-20 samples minimum)
- **Numerical Only**: Best results with numeric store values
- **Synchronous**: Sampling uses setInterval, not perfect timing
- **Memory**: Keeps full history up to window size
- **False Positives**: Low confidence patterns may be noise

## Future Enhancements

- Hierarchical pattern detection (meta-patterns)
- Adaptive sampling rates based on change frequency
- Machine learning for pattern classification
- Cross-universe pattern detection
- Pattern prediction (forecast future patterns)
- Custom pattern types via plugin API

## See Also

- [Universe Manager](./UNIVERSE.md)
- [Physics Simulations](./PHYSICS.md)
- [Examples](../examples/emergence/)
