/**
 * Multi-Body Collision Simulation
 * 
 * Demonstrates elastic collisions between multiple physics bodies.
 * Shows momentum conservation and collision detection.
 */

import { createUniverse } from '../../dist/cosmogenesis/universe.js';
import { createPhysicsSubstrate, PhysicsUtils, PHYSICS_CONSTANTS } from '../../dist/physics/physics-substrate.js';

// Simulation parameters
const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 600;
const GROUND_Y = 50;
const TIME_STEP = 1 / 60; // 60 FPS
const NUM_BODIES = 3;

console.log('💥 Multi-Body Collision Simulation\n');
console.log('═'.repeat(60));
console.log(`World: ${WORLD_WIDTH}x${WORLD_HEIGHT} pixels`);
console.log(`Bodies: ${NUM_BODIES}`);
console.log(`Elasticity: ${PHYSICS_CONSTANTS.COLLISION_ELASTICITY}`);
console.log('═'.repeat(60));
console.log();

// Create physics universe
const physicsSubstrate = createPhysicsSubstrate();
const universe = createUniverse({
  id: 'collision-sim',
  name: 'Collision Simulation',
  substrate: physicsSubstrate,
  autoRepair: true,
});

// Create multiple bodies
const bodies = [
  {
    id: 'body-1',
    initial: PhysicsUtils.createBody({
      position: { x: 200, y: 300 },
      velocity: { x: 100, y: 0 },
      mass: 2,
      radius: 30,
    }),
  },
  {
    id: 'body-2',
    initial: PhysicsUtils.createBody({
      position: { x: 500, y: 300 },
      velocity: { x: 0, y: 0 },
      mass: 1,
      radius: 20,
    }),
  },
  {
    id: 'body-3',
    initial: PhysicsUtils.createBody({
      position: { x: 750, y: 300 },
      velocity: { x: -50, y: 0 },
      mass: 1.5,
      radius: 25,
    }),
  },
];

// Create stores for each body
const bodyStores = bodies.map(({ id, initial }) => ({
  id,
  store: universe.createStore(id, initial),
}));

console.log('Initial Configuration:');
bodyStores.forEach(({ id, store }) => {
  const body = store.get();
  console.log(`  ${id}: pos=(${body.position.x}, ${body.position.y}) vel=(${body.velocity.x}, ${body.velocity.y}) mass=${body.mass}`);
});
console.log();

// Track momentum and energy
const history = [];
let currentTime = 0;
let frameCount = 0;
let collisionCount = 0;

console.log('Time    | Total Momentum (x, y) | Total Energy | Collisions');
console.log('--------|----------------------|--------------|------------');

// Simulation loop
const interval = setInterval(() => {
  frameCount++;
  currentTime += TIME_STEP;

  // Update all bodies
  const updatedBodies = bodyStores.map(({ id, store }) => {
    let body = store.get();

    // Apply gravity
    body = {
      ...body,
      acceleration: {
        x: 0,
        y: PHYSICS_CONSTANTS.GRAVITY,
      },
    };

    // Update physics
    body = PhysicsUtils.updateBody(body, TIME_STEP);

    // Handle ground collision
    body = PhysicsUtils.handleGroundCollision(body, GROUND_Y);

    // Handle wall collisions
    const radius = body.radius ?? 20;
    if (body.position.x - radius <= 0 || body.position.x + radius >= WORLD_WIDTH) {
      body = {
        ...body,
        position: {
          x: body.position.x - radius <= 0 ? radius : WORLD_WIDTH - radius,
          y: body.position.y,
        },
        velocity: {
          x: -body.velocity.x * PHYSICS_CONSTANTS.BOUNCE_DAMPING,
          y: body.velocity.y,
        },
      };
    }

    return { id, body };
  });

  // Check for collisions between bodies
  for (let i = 0; i < updatedBodies.length; i++) {
    for (let j = i + 1; j < updatedBodies.length; j++) {
      const a = updatedBodies[i].body;
      const b = updatedBodies[j].body;

      if (PhysicsUtils.isColliding(a, b)) {
        const resolved = PhysicsUtils.resolveCollision(a, b);
        updatedBodies[i].body = resolved.a;
        updatedBodies[j].body = resolved.b;
        collisionCount++;
      }
    }
  }

  // Update all stores
  updatedBodies.forEach(({ id, body }) => {
    const store = bodyStores.find(s => s.id === id);
    if (store) {
      store.store.set(body);
    }
  });

  // Calculate total momentum and energy
  let totalMomentumX = 0;
  let totalMomentumY = 0;
  let totalEnergy = 0;

  updatedBodies.forEach(({ body }) => {
    const momentum = PhysicsUtils.momentum(body);
    const energy = PhysicsUtils.totalEnergy(body);
    totalMomentumX += momentum.x;
    totalMomentumY += momentum.y;
    totalEnergy += energy;
  });

  history.push({
    time: currentTime,
    momentumX: totalMomentumX,
    momentumY: totalMomentumY,
    energy: totalEnergy,
  });

  // Log every 60 frames (1 second)
  if (frameCount % 60 === 0) {
    console.log(
      `${currentTime.toFixed(2)}s  | ` +
      `(${totalMomentumX.toFixed(1)}, ${totalMomentumY.toFixed(1)}) | ` +
      `${totalEnergy.toFixed(1)} J      | ` +
      `${collisionCount}`
    );
  }

  // Stop after 10 seconds
  if (currentTime >= 10) {
    clearInterval(interval);
    printSummary();
  }
}, TIME_STEP * 1000);

function printSummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('Simulation Summary');
  console.log('═'.repeat(60));
  console.log(`Frames simulated: ${frameCount}`);
  console.log(`Simulation time: ${currentTime.toFixed(2)}s`);
  console.log(`Collisions detected: ${collisionCount}`);

  // Momentum conservation analysis
  if (history.length > 0) {
    const initial = history[0];
    const final = history[history.length - 1];

    console.log(`\nMomentum Conservation:`);
    console.log(`  Initial: (${initial.momentumX.toFixed(2)}, ${initial.momentumY.toFixed(2)})`);
    console.log(`  Final: (${final.momentumX.toFixed(2)}, ${final.momentumY.toFixed(2)})`);
    
    const momentumChangeX = Math.abs(final.momentumX - initial.momentumX);
    const momentumChangeY = Math.abs(final.momentumY - initial.momentumY);
    console.log(`  Change: (${momentumChangeX.toFixed(2)}, ${momentumChangeY.toFixed(2)})`);
    
    if (momentumChangeX < 1 && momentumChangeY < 50) {
      console.log(`  ✓ Momentum approximately conserved`);
    } else {
      console.log(`  ⚠ Momentum not well conserved (expected due to friction/damping)`);
    }

    console.log(`\nEnergy Analysis:`);
    console.log(`  Initial: ${initial.energy.toFixed(2)} J`);
    console.log(`  Final: ${final.energy.toFixed(2)} J`);
    console.log(`  Loss: ${(initial.energy - final.energy).toFixed(2)} J`);
  }

  // Final positions
  console.log(`\nFinal Positions:`);
  bodyStores.forEach(({ id, store }) => {
    const body = store.get();
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    console.log(`  ${id}: (${body.position.x.toFixed(1)}, ${body.position.y.toFixed(1)}) speed=${speed.toFixed(1)} m/s`);
  });

  // Universe stats
  const stats = universe.getStats();
  console.log(`\nUniverse Statistics:`);
  console.log(`  State updates: ${stats.eventCount}`);
  console.log(`  Stores: ${stats.storeCount}`);

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
