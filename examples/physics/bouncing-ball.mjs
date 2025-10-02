/**
 * Bouncing Ball Simulation
 * 
 * Demonstrates physics constraints with a simple bouncing ball.
 * Shows gravity, collisions, and energy conservation.
 */

import { createUniverse } from '../../dist/cosmogenesis/universe.js';
import { createPhysicsSubstrate, PhysicsUtils, PHYSICS_CONSTANTS } from '../../dist/physics/physics-substrate.js';

// Simulation parameters
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const GROUND_Y = 50;
const TIME_STEP = 1 / 60; // 60 FPS
const SIMULATION_DURATION = 10000; // 10 seconds

console.log('🏀 Bouncing Ball Physics Simulation\n');
console.log('═'.repeat(60));
console.log(`World: ${WORLD_WIDTH}x${WORLD_HEIGHT} pixels`);
console.log(`Gravity: ${PHYSICS_CONSTANTS.GRAVITY} m/s²`);
console.log(`Bounce damping: ${PHYSICS_CONSTANTS.BOUNCE_DAMPING}`);
console.log(`Time step: ${TIME_STEP}s (${1/TIME_STEP} FPS)`);
console.log('═'.repeat(60));
console.log();

// Create physics universe
const physicsSubstrate = createPhysicsSubstrate();
const universe = createUniverse({
  id: 'bouncing-ball-sim',
  name: 'Bouncing Ball Simulation',
  substrate: physicsSubstrate,
  autoRepair: true,
});

// Create a ball
const initialBall = PhysicsUtils.createBody({
  position: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 100 },
  velocity: { x: 50, y: 0 }, // Initial horizontal velocity
  mass: 1,
  radius: 20,
});

const ballStore = universe.createStore('body:ball', initialBall);

// Track energy over time
const energyHistory = [];

// Simulation loop
let currentTime = 0;
let frameCount = 0;
const startTime = Date.now();

console.log('Starting simulation...\n');
console.log('Time    | Position (x, y)      | Velocity (x, y)    | Energy (K+P=T)');
console.log('--------|----------------------|--------------------|-----------------');

const interval = setInterval(() => {
  frameCount++;
  currentTime += TIME_STEP;

  // Get current ball state
  let ball = ballStore.get();

  // Apply gravity
  ball = {
    ...ball,
    acceleration: {
      x: ball.acceleration.x,
      y: PHYSICS_CONSTANTS.GRAVITY,
    },
  };

  // Apply friction if on ground
  if (ball.grounded) {
    const frictionForce = PHYSICS_CONSTANTS.FRICTION_COEFFICIENT * PHYSICS_CONSTANTS.GRAVITY;
    const frictionX = ball.velocity.x > 0 ? -frictionForce : ball.velocity.x < 0 ? frictionForce : 0;
    ball = {
      ...ball,
      acceleration: {
        x: frictionX / ball.mass,
        y: ball.acceleration.y,
      },
    };
  }

  // Update physics
  ball = PhysicsUtils.updateBody(ball, TIME_STEP);

  // Handle ground collision
  ball = PhysicsUtils.handleGroundCollision(ball, GROUND_Y);

  // Handle wall collisions
  const radius = ball.radius ?? 20;
  if (ball.position.x - radius <= 0 || ball.position.x + radius >= WORLD_WIDTH) {
    ball = {
      ...ball,
      position: {
        x: ball.position.x - radius <= 0 ? radius : WORLD_WIDTH - radius,
        y: ball.position.y,
      },
      velocity: {
        x: -ball.velocity.x * PHYSICS_CONSTANTS.BOUNCE_DAMPING,
        y: ball.velocity.y,
      },
    };
  }

  // Update store
  ballStore.set(ball);

  // Calculate energy
  const kineticEnergy = PhysicsUtils.kineticEnergy(ball);
  const potentialEnergy = PhysicsUtils.potentialEnergy(ball);
  const totalEnergy = kineticEnergy + potentialEnergy;

  energyHistory.push({
    time: currentTime,
    kinetic: kineticEnergy,
    potential: potentialEnergy,
    total: totalEnergy,
  });

  // Log every 60 frames (1 second)
  if (frameCount % 60 === 0) {
    console.log(
      `${currentTime.toFixed(2)}s  | ` +
      `(${ball.position.x.toFixed(1)}, ${ball.position.y.toFixed(1)}) | ` +
      `(${ball.velocity.x.toFixed(1)}, ${ball.velocity.y.toFixed(1)}) | ` +
      `${kineticEnergy.toFixed(1)}+${potentialEnergy.toFixed(1)}=${totalEnergy.toFixed(1)}`
    );
  }

  // Check if ball has stopped
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  if (ball.grounded && speed < PHYSICS_CONSTANTS.MIN_VELOCITY && currentTime > 2) {
    console.log('\n✓ Ball has come to rest');
    clearInterval(interval);
    printSummary();
  }

  // Stop after max duration
  if (currentTime >= SIMULATION_DURATION / 1000) {
    console.log('\n✓ Simulation complete');
    clearInterval(interval);
    printSummary();
  }
}, TIME_STEP * 1000);

function printSummary() {
  const endTime = Date.now();
  const simulationTime = (endTime - startTime) / 1000;

  console.log('\n' + '═'.repeat(60));
  console.log('Simulation Summary');
  console.log('═'.repeat(60));
  console.log(`Frames simulated: ${frameCount}`);
  console.log(`Simulation time: ${currentTime.toFixed(2)}s`);
  console.log(`Real time: ${simulationTime.toFixed(2)}s`);
  console.log(`Performance: ${(currentTime / simulationTime).toFixed(2)}x realtime`);

  // Analyze energy
  if (energyHistory.length > 0) {
    const initialEnergy = energyHistory[0].total;
    const finalEnergy = energyHistory[energyHistory.length - 1].total;
    const energyLoss = initialEnergy - finalEnergy;
    const energyLossPercent = (energyLoss / initialEnergy) * 100;

    console.log(`\nEnergy Analysis:`);
    console.log(`  Initial energy: ${initialEnergy.toFixed(2)} J`);
    console.log(`  Final energy: ${finalEnergy.toFixed(2)} J`);
    console.log(`  Energy lost: ${energyLoss.toFixed(2)} J (${energyLossPercent.toFixed(1)}%)`);
    console.log(`  (Expected due to friction and bounce damping)`);
  }

  // Universe stats
  const stats = universe.getStats();
  console.log(`\nUniverse Statistics:`);
  console.log(`  State updates: ${stats.eventCount}`);
  console.log(`  Stores: ${stats.storeCount}`);
  console.log(`  Uptime: ${stats.uptime}ms`);

  console.log('\n✓ Simulation complete!\n');

  // Cleanup
  universe.destroy();
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nInterrupted by user');
  clearInterval(interval);
  printSummary();
});
