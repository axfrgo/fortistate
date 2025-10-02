/**
 * Emergence Detection Demo
 * 
 * Demonstrates how emergent patterns arise from interactions between
 * multiple stores in a Fortistate universe.
 */

import { createUniverse } from '../../dist/cosmogenesis/universe.js';
import { EmergenceDetector } from '../../dist/cosmogenesis/emergence.js';

console.log('🌌 Emergence Detection Demo\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Create universe
const universe = createUniverse({
  id: 'emergence-demo',
});

// Create stores representing different parts of a system
const stores = {
  temperature: universe.createStore({
    id: 'temperature',
    initialState: { value: 20, unit: 'celsius' },
  }),
  
  pressure: universe.createStore({
    id: 'pressure',
    initialState: { value: 101.3, unit: 'kPa' },
  }),
  
  volume: universe.createStore({
    id: 'volume',
    initialState: { value: 1.0, unit: 'liters' },
  }),
  
  humidity: universe.createStore({
    id: 'humidity',
    initialState: { value: 50, unit: 'percent' },
  }),
};

console.log('Created 4 stores: temperature, pressure, volume, humidity\n');

// Create emergence detector
const detector = new EmergenceDetector(universe, {
  samplingInterval: 200,  // Sample every 200ms
  minConfidence: 0.5,     // Report patterns with >50% confidence
  windowSize: 50,         // Analyze last 50 samples
});

console.log('Starting emergence detection...\n');
detector.start();

// Track patterns
let lastPatternCount = 0;

const checkPatterns = () => {
  const patterns = detector.getPatterns();
  
  if (patterns.length > lastPatternCount) {
    const newPatterns = patterns.slice(lastPatternCount);
    
    for (const pattern of newPatterns) {
      console.log(`\n🔍 Pattern Detected: ${pattern.type.toUpperCase()}`);
      console.log(`   Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
      console.log(`   Description: ${pattern.description}`);
      console.log(`   Stores involved: ${pattern.storesInvolved.join(', ')}`);
      
      if (pattern.evidence.length > 0) {
        console.log(`   Evidence:`);
        pattern.evidence.forEach(e => console.log(`     • ${e}`));
      }
      
      if (Object.keys(pattern.metrics).length > 0) {
        console.log(`   Metrics:`);
        for (const [key, value] of Object.entries(pattern.metrics)) {
          const formatted = typeof value === 'number' ? value.toFixed(3) : value;
          console.log(`     ${key}: ${formatted}`);
        }
      }
    }
    
    lastPatternCount = patterns.length;
  }
};

// Set up pattern checking
const patternCheckInterval = setInterval(checkPatterns, 300);

// Scenario 1: Synchronization (Ideal Gas Law)
console.log('─────────────────────────────────────────────────────────────');
console.log('Scenario 1: Synchronized Changes (Ideal Gas Law: PV = nRT)');
console.log('─────────────────────────────────────────────────────────────\n');

await new Promise(resolve => setTimeout(resolve, 500));

for (let i = 0; i < 8; i++) {
  // Simulate ideal gas: increase temp → increase pressure, volume changes
  const temp = 20 + i * 5;
  const pressure = 101.3 + i * 3;
  const volume = 1.0 + i * 0.1;
  
  stores.temperature.setState({ value: temp, unit: 'celsius' });
  stores.pressure.setState({ value: pressure, unit: 'kPa' });
  stores.volume.setState({ value: volume, unit: 'liters' });
  
  await new Promise(resolve => setTimeout(resolve, 250));
}

await new Promise(resolve => setTimeout(resolve, 500));

// Scenario 2: Cascade Effect
console.log('\n─────────────────────────────────────────────────────────────');
console.log('Scenario 2: Cascade (Temperature affects humidity, then pressure)');
console.log('─────────────────────────────────────────────────────────────\n');

await new Promise(resolve => setTimeout(resolve, 500));

for (let i = 0; i < 6; i++) {
  // Temperature increases
  stores.temperature.setState({ value: 50 + i * 5, unit: 'celsius' });
  await new Promise(resolve => setTimeout(resolve, 250));
  
  // This affects humidity
  stores.humidity.setState({ value: 50 - i * 5, unit: 'percent' });
  await new Promise(resolve => setTimeout(resolve, 250));
  
  // Which then affects pressure
  stores.pressure.setState({ value: 110 + i * 2, unit: 'kPa' });
  await new Promise(resolve => setTimeout(resolve, 250));
}

await new Promise(resolve => setTimeout(resolve, 500));

// Scenario 3: Convergence
console.log('\n─────────────────────────────────────────────────────────────');
console.log('Scenario 3: Convergence (System reaching thermal equilibrium)');
console.log('─────────────────────────────────────────────────────────────\n');

await new Promise(resolve => setTimeout(resolve, 500));

const targetTemp = 25;
for (let i = 0; i < 10; i++) {
  // All temperatures converge to equilibrium
  const currentTemp = stores.temperature.getState().value;
  const newTemp = currentTemp + (targetTemp - currentTemp) * 0.3;
  
  stores.temperature.setState({ value: newTemp, unit: 'celsius' });
  
  // Pressure stabilizes
  const currentPressure = stores.pressure.getState().value;
  stores.pressure.setState({ value: currentPressure * 0.98 + 101.3 * 0.02, unit: 'kPa' });
  
  await new Promise(resolve => setTimeout(resolve, 250));
}

await new Promise(resolve => setTimeout(resolve, 500));

// Scenario 4: Equilibrium
console.log('\n─────────────────────────────────────────────────────────────');
console.log('Scenario 4: Equilibrium (System stabilizes)');
console.log('─────────────────────────────────────────────────────────────\n');

await new Promise(resolve => setTimeout(resolve, 500));

// System reaches equilibrium - no more changes
for (let i = 0; i < 8; i++) {
  await new Promise(resolve => setTimeout(resolve, 250));
}

await new Promise(resolve => setTimeout(resolve, 500));

// Scenario 5: Divergence
console.log('\n─────────────────────────────────────────────────────────────');
console.log('Scenario 5: Divergence (Non-equilibrium conditions)');
console.log('─────────────────────────────────────────────────────────────\n');

await new Promise(resolve => setTimeout(resolve, 500));

for (let i = 0; i < 10; i++) {
  // Temperature increases
  stores.temperature.setState({ value: 25 + i * 5, unit: 'celsius' });
  
  // Pressure decreases
  stores.pressure.setState({ value: 101.3 - i * 2, unit: 'kPa' });
  
  // Volume oscillates
  stores.volume.setState({ value: 1.0 + Math.sin(i) * 0.5, unit: 'liters' });
  
  await new Promise(resolve => setTimeout(resolve, 250));
}

await new Promise(resolve => setTimeout(resolve, 500));

// Final summary
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('Emergence Detection Summary');
console.log('═══════════════════════════════════════════════════════════════\n');

const allPatterns = detector.getPatterns(20);
console.log(`Total patterns detected: ${allPatterns.length}\n`);

// Group by type
const byType = new Map();
for (const pattern of allPatterns) {
  byType.set(pattern.type, (byType.get(pattern.type) ?? 0) + 1);
}

console.log('Pattern breakdown:');
for (const [type, count] of byType.entries()) {
  console.log(`  ${type}: ${count}`);
}

console.log('\nMost confident patterns:');
const topPatterns = allPatterns
  .sort((a, b) => b.confidence - a.confidence)
  .slice(0, 5);

for (const pattern of topPatterns) {
  console.log(`  • ${pattern.type} (${(pattern.confidence * 100).toFixed(1)}%): ${pattern.description}`);
}

console.log('\n✓ Demo complete!');
console.log('\nKey insights:');
console.log('  • Emergent patterns arise from simple interactions');
console.log('  • Different scenarios produce distinct pattern types');
console.log('  • The system can detect synchronization, cascades, convergence, etc.');
console.log('  • Confidence scores help distinguish strong from weak patterns');

// Cleanup
clearInterval(patternCheckInterval);
detector.stop();

console.log('\n═══════════════════════════════════════════════════════════════\n');
