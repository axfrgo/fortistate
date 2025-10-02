/**
 * Bouncing Balls Physics Simulation
 * 
 * Demonstrates:
 * - Gravity
 * - Friction
 * - Ground collision
 * - Energy conservation (approximate with friction)
 * - Real-time constraint enforcement
 */

import { createUniverse } from '../../src/cosmogenesis/universe.js';
import {
  physicsSubstrate,
  type PhysicsObject,
  calculateKineticEnergy,
  calculatePotentialEnergy,
  applyGravity,
  applyFriction,
  updatePosition,
  checkGroundCollision,
} from './physics-substrate.js';

// Simulation constants
const GRAVITY = 9.81; // m/s²
const FRICTION = 0.01; // very light air resistance
const GROUND_LEVEL = 0; // meters
const DELTA_TIME = 0.016; // ~60 FPS (16ms)
const SIMULATION_DURATION = 5000; // 5 seconds

console.log('=== Bouncing Balls Physics Simulation ===\n');

// Create physics universe
const universe = createUniverse({
  id: 'bouncing-balls',
  name: 'Bouncing Balls Simulation',
  substrate: physicsSubstrate,
  metadata: {
    simulation: 'bouncing-balls',
    gravity: GRAVITY,
    friction: FRICTION,
  },
});

// Create balls with different initial conditions
const ball1: PhysicsObject = {
  id: 'ball-1',
  mass: 1.0, // 1 kg
  position: { x: 0, y: 10, z: 0 }, // 10 meters high
  velocity: { x: 0, y: 0, z: 0 }, // dropped from rest
  acceleration: { x: 0, y: -GRAVITY, z: 0 },
  radius: 0.1, // 10 cm
};

const ball2: PhysicsObject = {
  id: 'ball-2',
  mass: 2.0, // 2 kg (heavier)
  position: { x: 2, y: 15, z: 0 }, // 15 meters high
  velocity: { x: 0, y: 0, z: 0 },
  acceleration: { x: 0, y: -GRAVITY, z: 0 },
  radius: 0.15, // 15 cm (bigger)
};

const ball3: PhysicsObject = {
  id: 'ball-3',
  mass: 0.5, // 0.5 kg (lighter)
  position: { x: -2, y: 5, z: 0 }, // 5 meters high
  velocity: { x: 1, y: 0, z: 0 }, // thrown horizontally at 1 m/s
  acceleration: { x: 0, y: -GRAVITY, z: 0 },
  radius: 0.08, // 8 cm (smaller)
};

// Create stores for each ball
const ball1Store = universe.createStore('ball-1', ball1);
const ball2Store = universe.createStore('ball-2', ball2);
const ball3Store = universe.createStore('ball-3', ball3);

// Energy tracking stores
const totalKineticEnergy = universe.createStore('totalKineticEnergy', 0);
const totalPotentialEnergy = universe.createStore('totalPotentialEnergy', 0);
const totalEnergy = universe.createStore('totalEnergy', 0);

console.log('Initial State:');
console.log(`Ball 1: mass=${ball1.mass}kg, height=${ball1.position.y}m, velocity=${ball1.velocity.y}m/s`);
console.log(`Ball 2: mass=${ball2.mass}kg, height=${ball2.position.y}m, velocity=${ball2.velocity.y}m/s`);
console.log(`Ball 3: mass=${ball3.mass}kg, height=${ball3.position.y}m, velocity=(${ball3.velocity.x}, ${ball3.velocity.y})m/s`);

// Calculate initial total energy
const initialKE = 
  calculateKineticEnergy(ball1) + 
  calculateKineticEnergy(ball2) + 
  calculateKineticEnergy(ball3);
const initialPE = 
  calculatePotentialEnergy(ball1, GRAVITY) + 
  calculatePotentialEnergy(ball2, GRAVITY) + 
  calculatePotentialEnergy(ball3, GRAVITY);
const initialTotalEnergy = initialKE + initialPE;

console.log(`\nInitial Energy:`);
console.log(`  Kinetic: ${initialKE.toFixed(2)} J`);
console.log(`  Potential: ${initialPE.toFixed(2)} J`);
console.log(`  Total: ${initialTotalEnergy.toFixed(2)} J`);
console.log('\nStarting simulation...\n');

// Simulation loop
let time = 0;
let stepCount = 0;
const printInterval = 0.5; // Print every 0.5 seconds
let nextPrintTime = printInterval;

const simulationInterval = setInterval(() => {
  stepCount++;
  time += DELTA_TIME;
  
  // Update each ball
  let updatedBall1 = ball1Store.get();
  let updatedBall2 = ball2Store.get();
  let updatedBall3 = ball3Store.get();
  
  // Apply gravity
  updatedBall1 = applyGravity(updatedBall1, GRAVITY, DELTA_TIME);
  updatedBall2 = applyGravity(updatedBall2, GRAVITY, DELTA_TIME);
  updatedBall3 = applyGravity(updatedBall3, GRAVITY, DELTA_TIME);
  
  // Apply friction
  updatedBall1 = applyFriction(updatedBall1, FRICTION, DELTA_TIME);
  updatedBall2 = applyFriction(updatedBall2, FRICTION, DELTA_TIME);
  updatedBall3 = applyFriction(updatedBall3, FRICTION, DELTA_TIME);
  
  // Update positions
  updatedBall1 = updatePosition(updatedBall1, DELTA_TIME);
  updatedBall2 = updatePosition(updatedBall2, DELTA_TIME);
  updatedBall3 = updatePosition(updatedBall3, DELTA_TIME);
  
  // Check ground collisions
  updatedBall1 = checkGroundCollision(updatedBall1, GROUND_LEVEL);
  updatedBall2 = checkGroundCollision(updatedBall2, GROUND_LEVEL);
  updatedBall3 = checkGroundCollision(updatedBall3, GROUND_LEVEL);
  
  // Update stores (constraint enforcement happens here)
  ball1Store.set(updatedBall1);
  ball2Store.set(updatedBall2);
  ball3Store.set(updatedBall3);
  
  // Calculate current energies
  const currentKE = 
    calculateKineticEnergy(updatedBall1) + 
    calculateKineticEnergy(updatedBall2) + 
    calculateKineticEnergy(updatedBall3);
  const currentPE = 
    calculatePotentialEnergy(updatedBall1, GRAVITY) + 
    calculatePotentialEnergy(updatedBall2, GRAVITY) + 
    calculatePotentialEnergy(updatedBall3, GRAVITY);
  const currentTotalEnergy = currentKE + currentPE;
  
  totalKineticEnergy.set(currentKE);
  totalPotentialEnergy.set(currentPE);
  totalEnergy.set(currentTotalEnergy);
  
  // Print state at intervals
  if (time >= nextPrintTime) {
    console.log(`--- t = ${time.toFixed(2)}s ---`);
    console.log(`Ball 1: h=${updatedBall1.position.y.toFixed(2)}m, vy=${updatedBall1.velocity.y.toFixed(2)}m/s`);
    console.log(`Ball 2: h=${updatedBall2.position.y.toFixed(2)}m, vy=${updatedBall2.velocity.y.toFixed(2)}m/s`);
    console.log(`Ball 3: x=${updatedBall3.position.x.toFixed(2)}m, h=${updatedBall3.position.y.toFixed(2)}m, v=(${updatedBall3.velocity.x.toFixed(2)}, ${updatedBall3.velocity.y.toFixed(2)})m/s`);
    console.log(`Energy: KE=${currentKE.toFixed(2)}J, PE=${currentPE.toFixed(2)}J, Total=${currentTotalEnergy.toFixed(2)}J (${((currentTotalEnergy/initialTotalEnergy)*100).toFixed(1)}%)`);
    console.log('');
    nextPrintTime += printInterval;
  }
  
  // Stop simulation after duration
  if (time >= SIMULATION_DURATION / 1000) {
    clearInterval(simulationInterval);
    
    console.log('=== Simulation Complete ===\n');
    console.log(`Steps: ${stepCount}`);
    console.log(`Final Energy: ${currentTotalEnergy.toFixed(2)}J (${((currentTotalEnergy/initialTotalEnergy)*100).toFixed(1)}% of initial)`);
    console.log(`Energy Lost to Friction: ${(initialTotalEnergy - currentTotalEnergy).toFixed(2)}J`);
    
    // Get universe stats
    const stats = universe.getStats();
    console.log(`\nUniverse Statistics:`);
    console.log(`  Total Events: ${stats.eventCount}`);
    console.log(`  Stores: ${stats.storeCount}`);
    console.log(`  Runtime: ${stats.uptime}ms`);
    
    // Cleanup
    universe.destroy();
    
    console.log('\n✅ Simulation completed successfully!');
    process.exit(0);
  }
}, DELTA_TIME * 1000);

// Handle interruption
process.on('SIGINT', () => {
  clearInterval(simulationInterval);
  universe.destroy();
  console.log('\n\nSimulation interrupted by user');
  process.exit(0);
});
