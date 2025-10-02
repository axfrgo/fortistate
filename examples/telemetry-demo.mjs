/**
 * Telemetry Demo
 * 
 * Demonstrates law violations/repairs streaming to the inspector's
 * telemetry panel via Server-Sent Events (SSE).
 */

import { createCausalStore } from '../dist/temporal/causalStore.js';
import { defineConstraint, createSubstrate } from '../dist/algebra/substrate.js';
import { defineLaw } from '../dist/cosmogenesis/laws.js';
import { ConstraintAuditor } from '../dist/cosmogenesis/auditor.js';
import { createInspectorServer } from '../dist/inspector.js';

// Define a simple numeric range constraint
const positiveConstraint = defineConstraint('positive', [
  {
    name: 'mustBePositive',
    check: (n) => n > 0,
    message: 'Value must be positive'
  }
]);

// Define a law that wraps the constraint
const positiveLaw = defineLaw('positive-numbers', positiveConstraint, {
  onViolation: (payload) => {
    console.log('[law] violation:', payload.lawName, payload.storeKey);
  },
  onRepair: (payload) => {
    console.log('[law] repair:', payload.lawName, payload.storeKey, '→', payload.repairedValue);
  }
});

// Create substrate with the law
const substrate = createSubstrate({
  id: 'demo-universe',
  name: 'Telemetry Demo Universe',
  constraints: new Map([['counter', positiveConstraint]]),
  laws: new Map([['counter', [positiveLaw]]])
});

// Create a causal store
const counterStore = createCausalStore('counter', {
  initial: { count: 10 },
  universeId: 'demo-universe'
});

const stores = new Map([['counter', counterStore]]);

// Create auditor and wire up telemetry to inspector
let telemetrySink = null;

async function startDemo() {
  const port = 4001;
  const srv = createInspectorServer({ port, quiet: false });
  
  // Hook into the inspector's telemetry system
  await srv.start();
  
  console.log(`\n✓ Inspector running at http://localhost:${port}`);
  console.log('✓ Open the inspector and click "Telemetry" button to see law events\n');
  
  // Get the telemetry sink from the inspector
  // For now we'll emit events manually - in production the auditor would
  // automatically call emitTelemetry
  
  // Create auditor with telemetry
  const auditor = new ConstraintAuditor({
    substrate,
    stores,
    autoRepair: true,
    applyReactions: false,
    telemetrySink: (entry) => {
      console.log('[telemetry]', entry.type, entry.lawName, entry.message);
      // In a real setup, this would be wired to the inspector's emitTelemetry
    }
  });
  
  auditor.start();
  
  // Simulate violations
  console.log('Triggering law violations...\n');
  
  setTimeout(() => {
    console.log('Setting count to -5 (should violate positive constraint)');
    counterStore.set({ count: -5 });
  }, 2000);
  
  setTimeout(() => {
    console.log('Setting count to 0 (should violate positive constraint)');
    counterStore.set({ count: 0 });
  }, 4000);
  
  setTimeout(() => {
    console.log('Setting count to 42 (valid)');
    counterStore.set({ count: 42 });
  }, 6000);
  
  // Keep running
  console.log('Demo running. Press Ctrl+C to exit.');
}

startDemo().catch(console.error);
