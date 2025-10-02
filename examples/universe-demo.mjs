/**
 * Universe Manager Demo
 * 
 * Demonstrates:
 * - Creating a universe with multiple causal stores
 * - Enforcing cross-store laws (e.g., energy conservation)
 * - Lifecycle management (pause/resume/fork)
 * - Multiverse coordination
 * - Telemetry streaming to inspector
 */

import { createUniverse, Multiverse } from '../src/cosmogenesis/universe.js';
import { defineLaw } from '../src/cosmogenesis/laws.js';
import { startInspector } from '../src/inspector.js';

// Define a physics substrate with conservation laws
const physicsSubstrate = {
  id: 'physics-v1',
  name: 'Classical Physics',
  
  constraints: new Map([
    // Positive energy constraint
    ['positive-energy', {
      name: 'positive-energy',
      invariants: [],
      validate: (value) => ({
        valid: typeof value === 'number' && value >= 0,
        message: value >= 0 ? undefined : `Energy cannot be negative: ${value}`,
      }),
    }],
  ]),
  
  laws: new Map([
    // Energy conservation law
    ['energy-conservation', [
      defineLaw({
        name: 'energy-conservation',
        constraint: 'positive-energy',
        scope: ['kineticEnergy', 'potentialEnergy', 'totalEnergy'],
        reaction: ({ context }) => {
          const kinetic = context.stores.get('kineticEnergy')?.get() ?? 0;
          const potential = context.stores.get('potentialEnergy')?.get() ?? 0;
          const total = context.stores.get('totalEnergy')?.get() ?? 0;
          
          const expectedTotal = kinetic + potential;
          
          return {
            type: 'repair',
            changes: [
              {
                storeKey: 'totalEnergy',
                value: expectedTotal,
                reason: `Energy conservation: KE(${kinetic}) + PE(${potential}) = ${expectedTotal}`,
              },
            ],
          };
        },
        metadata: {
          description: 'Total energy must equal sum of kinetic and potential energy',
          category: 'conservation',
        },
      }),
    ]],
  ]),
};

// =============================================================================
// Demo 1: Basic Universe Management
// =============================================================================
console.log('=== Demo 1: Basic Universe Management ===\n');

const universe = createUniverse({
  id: 'physics-sim-1',
  name: 'Physics Simulation',
  substrate: physicsSubstrate,
  autoRepair: true,
  applyReactions: true,
  metadata: {
    experiment: 'energy-conservation',
    version: '1.0',
  },
});

// Create stores for energy components
const kineticEnergy = universe.createStore('kineticEnergy', 100);
const potentialEnergy = universe.createStore('potentialEnergy', 50);
const totalEnergy = universe.createStore('totalEnergy', 150);

console.log('Initial state:');
console.log(`  Kinetic Energy: ${kineticEnergy.get()}`);
console.log(`  Potential Energy: ${potentialEnergy.get()}`);
console.log(`  Total Energy: ${totalEnergy.get()}`);

// Simulate energy transfer (e.g., falling object)
console.log('\n--- Simulating energy transfer ---');
kineticEnergy.set(120); // Kinetic increases
potentialEnergy.set(30); // Potential decreases

// Energy conservation law should auto-correct totalEnergy
setTimeout(() => {
  console.log('\nAfter energy transfer:');
  console.log(`  Kinetic Energy: ${kineticEnergy.get()}`);
  console.log(`  Potential Energy: ${potentialEnergy.get()}`);
  console.log(`  Total Energy: ${totalEnergy.get()} (auto-corrected by law)`);
  
  // =============================================================================
  // Demo 2: Lifecycle Management
  // =============================================================================
  console.log('\n\n=== Demo 2: Lifecycle Management ===\n');
  
  const stats1 = universe.getStats();
  console.log('Universe stats:', stats1);
  
  console.log('\n--- Pausing universe ---');
  universe.pause();
  console.log(`Universe state: ${universe.getState()}`);
  
  // Changes during pause won't trigger laws
  kineticEnergy.set(200);
  console.log('Made change while paused (no law enforcement)');
  
  console.log('\n--- Resuming universe ---');
  universe.resume();
  console.log(`Universe state: ${universe.getState()}`);
  
  setTimeout(() => {
    console.log(`Total Energy after resume: ${totalEnergy.get()} (law enforced)`);
    
    // =============================================================================
    // Demo 3: Snapshots and Time Travel
    // =============================================================================
    console.log('\n\n=== Demo 3: Snapshots and Time Travel ===\n');
    
    const snapshot = universe.snapshot();
    console.log('Created snapshot:', {
      id: snapshot.id,
      storeCount: snapshot.storeCount,
      eventCount: snapshot.eventCount,
    });
    
    console.log('\n--- Making more changes ---');
    kineticEnergy.set(50);
    potentialEnergy.set(100);
    
    setTimeout(() => {
      console.log('Current state:');
      console.log(`  Kinetic: ${kineticEnergy.get()}`);
      console.log(`  Potential: ${potentialEnergy.get()}`);
      console.log(`  Total: ${totalEnergy.get()}`);
      
      console.log('\n--- Restoring from snapshot ---');
      universe.restore(snapshot);
      
      console.log('Restored state:');
      console.log(`  Kinetic: ${kineticEnergy.get()}`);
      console.log(`  Potential: ${potentialEnergy.get()}`);
      console.log(`  Total: ${totalEnergy.get()}`);
      
      // =============================================================================
      // Demo 4: Universe Forking
      // =============================================================================
      console.log('\n\n=== Demo 4: Universe Forking ===\n');
      
      const fork1 = universe.fork('physics-sim-2', {
        name: 'Alternate Timeline',
        metadata: { experiment: 'alternate-physics' },
      });
      
      console.log(`Created fork: ${fork1.id} - "${fork1.name}"`);
      console.log('Fork inherits current state:');
      console.log(`  Kinetic: ${fork1.getStore('kineticEnergy')?.get()}`);
      console.log(`  Potential: ${fork1.getStore('potentialEnergy')?.get()}`);
      
      // Diverge the timelines
      fork1.getStore('kineticEnergy')?.set(999);
      
      setTimeout(() => {
        console.log('\nAfter divergence:');
        console.log(`  Original kinetic: ${universe.getStore('kineticEnergy')?.get()}`);
        console.log(`  Fork kinetic: ${fork1.getStore('kineticEnergy')?.get()}`);
        
        // =============================================================================
        // Demo 5: Multiverse Coordination
        // =============================================================================
        console.log('\n\n=== Demo 5: Multiverse Coordination ===\n');
        
        const multiverse = new Multiverse();
        
        multiverse.add(universe);
        multiverse.add(fork1);
        
        // Create additional universes
        const universe3 = createUniverse({
          id: 'physics-sim-3',
          name: 'Quantum Realm',
          substrate: physicsSubstrate,
        });
        universe3.createStore('kineticEnergy', 0);
        universe3.createStore('potentialEnergy', 0);
        universe3.createStore('totalEnergy', 0);
        
        multiverse.add(universe3);
        
        console.log('Multiverse contains:');
        multiverse.getIds().forEach(id => {
          const u = multiverse.get(id);
          console.log(`  - ${id}: "${u?.name}" (${u?.getState()})`);
        });
        
        const multiverseStats = multiverse.getStats();
        console.log('\nMultiverse statistics:', multiverseStats);
        
        console.log('\n--- Pausing all universes ---');
        multiverse.pauseAll();
        console.log('All universes paused');
        
        console.log('\n--- Resuming all universes ---');
        multiverse.resumeAll();
        console.log('All universes resumed');
        
        // =============================================================================
        // Demo 6: Telemetry and Inspector Integration
        // =============================================================================
        console.log('\n\n=== Demo 6: Telemetry and Inspector ===\n');
        
        const telemetryEvents = [];
        
        const telemetryUniverse = createUniverse({
          id: 'telemetry-demo',
          name: 'Telemetry Demo',
          substrate: physicsSubstrate,
          telemetrySink: (event) => {
            telemetryEvents.push(event);
            console.log(`[TELEMETRY] ${event.type}: ${event.message}`);
          },
        });
        
        telemetryUniverse.createStore('kineticEnergy', 100);
        telemetryUniverse.createStore('potentialEnergy', 50);
        telemetryUniverse.createStore('totalEnergy', 999); // Wrong value!
        
        setTimeout(() => {
          console.log(`\nCollected ${telemetryEvents.length} telemetry events`);
          
          // Optional: Start inspector to visualize
          console.log('\n--- Inspector Available ---');
          console.log('To inspect these universes in your browser:');
          console.log('1. Run: npm run inspector:dev');
          console.log('2. Open: http://localhost:4000');
          console.log('3. Navigate to the telemetry panel to see live events');
          
          // Cleanup
          console.log('\n\n=== Cleanup ===\n');
          multiverse.destroyAll();
          telemetryUniverse.destroy();
          console.log('All universes destroyed');
          
          console.log('\n✅ Demo complete!\n');
        }, 100);
      }, 100);
    }, 100);
  }, 100);
}, 100);

// Keep process alive for async operations
setTimeout(() => {
  process.exit(0);
}, 1000);
