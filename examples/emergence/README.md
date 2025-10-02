# Emergence Detection Examples

This directory contains demonstrations of the Fortistate Emergence Detection system.

## Demo Script: emergence-demo.mjs

Interactive demonstration showing 5 different emergence scenarios.

### Running the Demo

```bash
node examples/emergence/emergence-demo.mjs
```

### Scenarios

#### 1. Synchronization - Ideal Gas Law

Simulates the ideal gas law (PV=nRT) where temperature, pressure, and volume change together in a coordinated fashion.

**Expected Patterns**:
- Synchronization (high confidence)
- Possibly oscillation if values fluctuate

**Physics**: When temperature increases, pressure increases proportionally while volume adjusts to maintain equilibrium.

#### 2. Cascade - Sequential Propagation

Models environmental changes cascading through a system:
- Temperature changes first
- Humidity responds to temperature
- Pressure adjusts to humidity

**Expected Patterns**:
- Cascade (clear sequential pattern)
- Possible convergence as system stabilizes

**Real-world analogy**: Weather systems where changes propagate through layers of the atmosphere.

#### 3. Convergence - Thermal Equilibrium

Multiple objects at different temperatures exchange heat and converge to the same temperature.

**Expected Patterns**:
- Convergence (decreasing variance)
- Equilibrium (as temperatures equalize)

**Physics**: Heat flows from hot to cold until thermal equilibrium is reached.

#### 4. Equilibrium - System Stabilization

System starts with activity then settles into a stable state with no further changes.

**Expected Patterns**:
- Equilibrium (low change rate)
- High stability metric

**Real-world analogy**: Chemical reactions reaching equilibrium, markets stabilizing.

#### 5. Divergence - Non-Equilibrium

System starts uniform but external forces drive components apart, increasing variance.

**Expected Patterns**:
- Divergence (increasing variance)
- Possible clustering (distinct groups form)

**Real-world analogy**: Market fragmentation, evolutionary speciation.

## Output Format

The demo provides real-time updates as patterns are detected:

```
🎯 Scenario 1: Synchronization - Ideal Gas Law
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️  Running for 5 seconds...

📊 Pattern detected: synchronization
   Confidence: 0.85
   Stores: temperature, pressure, volume
   Evidence: 23 synchronized changes detected
   Metrics: syncRatio=0.85

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Summary:
   Total patterns: 1
   Synchronization: 1
   
   🏆 Top 5 patterns by confidence:
   1. synchronization (0.85) - temperature, pressure, volume
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Understanding Results

### Confidence Scores

- **0.9-1.0**: Very strong pattern, highly reliable
- **0.7-0.9**: Strong pattern, good evidence
- **0.5-0.7**: Moderate pattern, may have noise
- **<0.5**: Weak pattern, could be false positive

### Store Involvement

Patterns list which stores are participating:
- **Synchronization**: All stores that change together
- **Cascade**: Stores in propagation order
- **Convergence/Divergence**: All stores in the trend
- **Equilibrium**: Stable stores

### Evidence

Human-readable descriptions of why the pattern was detected:
- Number of occurrences
- Timing information
- Statistical measures
- Behavioral characteristics

### Metrics

Numerical measurements supporting the pattern:
- **syncRatio**: Proportion of synchronized changes
- **propagationDelay**: Time between cascade stages (ms)
- **variance**: Statistical variance of store values
- **changeRate**: Changes per time unit
- **trend**: Direction and strength of change (positive/negative)

## Customizing the Demo

You can modify the scenarios in `emergence-demo.mjs`:

### Adjust Timing

```javascript
const detector = new EmergenceDetector(universe, {
  samplingInterval: 50,  // Sample every 50ms (default: 100ms)
  minConfidence: 0.6,    // Report patterns above 0.6 (default: 0.7)
  windowSize: 200        // Keep 200 samples (default: 100)
});
```

### Change Duration

```javascript
function runScenario(name, setupFn, duration = 5000) {
  // duration in milliseconds
}

// Run for 10 seconds instead of 5
await runScenario('My Scenario', setupFn, 10000);
```

### Add Custom Scenarios

```javascript
async function myCustomScenario() {
  console.log('🎯 My Custom Scenario');
  console.log('━'.repeat(50));
  
  // Create stores
  const store1 = universe.createStore('data1', 0);
  const store2 = universe.createStore('data2', 100);
  
  // Create detector
  const detector = new EmergenceDetector(universe);
  detector.start();
  
  // Generate pattern
  const interval = setInterval(() => {
    store1.set(store1.get() + 1);
    store2.set(store2.get() - 1);
  }, 100);
  
  // Wait and analyze
  await new Promise(r => setTimeout(r, 5000));
  clearInterval(interval);
  
  // Report
  const patterns = detector.getPatterns();
  patterns.forEach(displayPattern);
  
  // Cleanup
  detector.stop();
  universe.removeStore('data1');
  universe.removeStore('data2');
}
```

## Troubleshooting

### No Patterns Detected

**Possible causes**:
1. Not enough samples collected - increase duration
2. Confidence threshold too high - lower `minConfidence`
3. Sampling interval too slow - decrease `samplingInterval`
4. Changes too random - pattern may not exist

### Wrong Pattern Type

**Solutions**:
1. Check that your scenario matches the expected pattern
2. Review pattern type descriptions in [EMERGENCE.md](../../docs/EMERGENCE.md)
3. Adjust timing - some patterns need specific change rates
4. Filter by type: `detector.getPatterns('synchronization')`

### Low Confidence

**Improvements**:
1. Increase sample size (longer duration or faster sampling)
2. Make changes more consistent
3. Reduce noise in the system
4. Check for conflicting patterns

### Multiple Patterns

It's normal for one scenario to detect multiple patterns! For example:
- Synchronization + Oscillation (coordinated cycles)
- Convergence + Equilibrium (approaching stable state)
- Cascade + Clustering (groups forming in sequence)

## Integration with Your Code

To use emergence detection in your own projects:

```javascript
import { createUniverse, EmergenceDetector } from 'fortistate';
import { createSubstrate } from 'fortistate';

// Setup
const substrate = createSubstrate('my-physics', new Map());
const universe = createUniverse({ id: 'my-app', substrate });
const detector = new EmergenceDetector(universe, {
  samplingInterval: 100,
  minConfidence: 0.7
});

// Your stores
const userCount = universe.createStore('users', 0);
const serverLoad = universe.createStore('load', 0);
const responseTime = universe.createStore('latency', 50);

// Start monitoring
detector.start();

// Your application logic...
// (stores change as users interact, servers respond, etc.)

// Periodic analysis
setInterval(() => {
  const patterns = detector.getPatterns();
  
  if (patterns.some(p => p.type === 'divergence')) {
    console.warn('System diverging - may need intervention!');
  }
  
  if (patterns.some(p => p.type === 'equilibrium')) {
    console.log('System stable ✓');
  }
}, 5000);
```

## Performance Tips

1. **Adjust sampling to workload**: High-frequency changes need fast sampling
2. **Limit window size**: Larger windows = more memory and slower analysis
3. **Enable only needed patterns**: Use `enabledPatterns` option
4. **Batch analysis**: Don't call `getPatterns()` every millisecond

## Learn More

- [Emergence Detection Docs](../../docs/EMERGENCE.md)
- [Universe Manager Docs](../../docs/UNIVERSE.md)
- [Physics Simulations](../../docs/PHYSICS.md)
