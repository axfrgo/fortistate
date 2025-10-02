# Physics Simulations with Fortistate

Fortistate's substrate and constraint system enables realistic physics simulations with guaranteed correctness. This guide demonstrates how to build classical mechanics simulations.

## Table of Contents

- [Overview](#overview)
- [Physics Substrate](#physics-substrate)
- [Core Concepts](#core-concepts)
- [Running Examples](#running-examples)
- [Building Custom Simulations](#building-custom-simulations)
- [Performance Characteristics](#performance-characteristics)

## Overview

The physics substrate (`src/physics/physics-substrate.ts`) provides:

- **Classical Mechanics Laws**: Gravity, friction, momentum, energy
- **Constraint Enforcement**: Mass positivity, velocity limits, position bounds
- **Collision Detection**: Distance-based detection and elastic collision resolution
- **Energy Tracking**: Kinetic, potential, and total energy calculations
- **Vector Math**: 2D physics operations

## Physics Substrate

### Constants

```typescript
const PHYSICS_CONSTANTS = {
  GRAVITY: 9.8,              // m/s² (Earth gravity)
  AIR_RESISTANCE: 0.01,      // Drag coefficient
  FRICTION_COEFFICIENT: 0.1, // Surface friction
  BOUNCE_DAMPING: 0.8,       // Energy retained after bounce
  MIN_VELOCITY: 0.01,        // Stopping threshold
  COLLISION_ELASTICITY: 0.9, // Elastic collision coefficient
}
```

### Constraints

The substrate enforces three fundamental constraints:

1. **Positive Mass**: Bodies must have mass > 0
2. **Velocity Limit**: Speed cannot exceed 1000 m/s
3. **Position Bounds**: Bodies must stay within ±10,000 units

### Physics Body

```typescript
interface PhysicsBody {
  position: Vector2D;     // Current position (x, y)
  velocity: Vector2D;     // Current velocity (x, y)
  acceleration: Vector2D; // Current acceleration (x, y)
  mass: number;           // Mass in kg
  radius?: number;        // Collision radius (default: 1)
  grounded?: boolean;     // Resting on surface
}
```

## Core Concepts

### Vector Operations

```typescript
// Calculate distance between bodies
PhysicsUtils.distance(bodyA, bodyB): number

// Check collision
PhysicsUtils.isColliding(bodyA, bodyB): boolean

// Calculate momentum
PhysicsUtils.momentum(body): Vector2D
```

### Energy Calculations

```typescript
// Kinetic energy: KE = 0.5 * m * v²
PhysicsUtils.kineticEnergy(body): number

// Potential energy: PE = m * g * h
PhysicsUtils.potentialEnergy(body): number

// Total energy
PhysicsUtils.totalEnergy(body): number
```

### Integration

Euler integration updates position based on velocity:

```typescript
// Update body position and velocity
PhysicsUtils.updateBody(body, dt): PhysicsBody
```

### Collision Resolution

Elastic collision with momentum and energy conservation:

```typescript
// Resolve collision between two bodies
PhysicsUtils.resolveCollision(bodyA, bodyB): { a: PhysicsBody, b: PhysicsBody }
```

Ground collision with bounce damping:

```typescript
// Handle bounce off ground at y=0
PhysicsUtils.handleGroundCollision(body, groundY): PhysicsBody
```

## Running Examples

### Bouncing Ball

Simulates a single ball with gravity, friction, and bounce:

```bash
npm run build
node examples/physics/bouncing-ball.mjs
```

**Features:**
- Gravity acceleration (9.8 m/s²)
- Ground collision with 80% energy retention
- Wall bouncing at x=0 and x=800
- Friction when grounded
- Energy tracking (kinetic + potential)
- Stops when velocity < 0.01 m/s

**Output:**
```
Time    | Position (x, y)      | Velocity (x, y)    | Energy (K+P=T)
--------|----------------------|--------------------|-------------------
1.00s   | (450.0, 505.0)       | (50.0, 9.8)        | 1298.0+4948.8=6246.8
2.00s   | (500.0, 519.8)       | (50.0, 19.6)       | 1442.1+5093.7=6535.8
...
```

### Multi-Body Collision

Simulates three bodies with elastic collisions:

```bash
npm run build
node examples/physics/collision-demo.mjs
```

**Features:**
- Three bodies with different masses (2kg, 1kg, 1.5kg)
- Elastic collision detection and resolution
- Momentum conservation tracking
- Energy analysis
- Collision counting

**Output:**
```
Time    | Total Momentum (x, y) | Total Energy | Collisions
--------|----------------------|--------------|------------
1.00s   | (125.0, 44.1)        | 25540.8 J    | 0
2.00s   | (125.0, 88.2)        | 26840.9 J    | 0
3.00s   | (125.0, 132.3)       | 26593.1 J    | 2
...
```

## Building Custom Simulations

### Step 1: Create Universe with Physics Substrate

```typescript
import { createUniverse } from 'fortistate/cosmogenesis/universe';
import { createPhysicsSubstrate, PhysicsUtils } from 'fortistate/physics/physics-substrate';

const physicsSubstrate = createPhysicsSubstrate();
const universe = createUniverse({
  substrates: [physicsSubstrate],
});
```

### Step 2: Create Physics Bodies

```typescript
const ballStore = universe.createStore({
  id: 'ball-1',
  substrate: 'classical-physics',
  initialState: PhysicsUtils.createBody({
    position: { x: 100, y: 500 },
    velocity: { x: 50, y: 0 },
    mass: 2,
    radius: 10,
  }),
});
```

### Step 3: Simulation Loop

```typescript
const dt = 1 / 60; // 60 FPS

function simulate() {
  const ball = ballStore.getState();
  
  // Apply gravity
  const withGravity = {
    ...ball,
    acceleration: { x: 0, y: PHYSICS_CONSTANTS.GRAVITY },
  };
  
  // Update physics
  let updated = PhysicsUtils.updateBody(withGravity, dt);
  
  // Handle collisions
  updated = PhysicsUtils.handleGroundCollision(updated, 0);
  
  // Update store
  ballStore.setState(updated);
  
  // Constraints are automatically enforced!
}

setInterval(simulate, dt * 1000);
```

### Step 4: Handle Collisions

```typescript
// Detect collisions between all body pairs
for (let i = 0; i < bodies.length; i++) {
  for (let j = i + 1; j < bodies.length; j++) {
    if (PhysicsUtils.isColliding(bodies[i], bodies[j])) {
      // Resolve elastic collision
      const { a, b } = PhysicsUtils.resolveCollision(bodies[i], bodies[j]);
      bodies[i] = a;
      bodies[j] = b;
    }
  }
}
```

## Performance Characteristics

### Benchmark Results

From `test/performance/constraints.perf.test.ts`:

| Operation | Avg Time | P95 | P99 | Notes |
|-----------|----------|-----|-----|-------|
| Universe + Constraints | 5.6 ms | 9.0 ms | 10.8 ms | For 1000 updates |
| Constraint Repairs | 10.4 ms | 15.9 ms | 18.5 ms | With violations |
| Forking | 0.044 ms | 0.065 ms | 0.080 ms | Clone universe |
| Snapshots | 0.013 ms | 0.020 ms | 0.025 ms | State capture |

**Target: < 15ms** ✅ **Achieved: 5.6ms** (3x better)

### Memory Usage

- **10,000 events**: ~38 MB
- **Per body**: ~200 bytes overhead
- **Snapshot overhead**: Minimal (copy-on-write)

### Scaling Recommendations

- **< 10 bodies**: Real-time (60 FPS) easily achievable
- **10-100 bodies**: Use spatial partitioning for collision detection
- **100+ bodies**: Consider broadphase algorithms (quad-tree, grid)

### Optimization Tips

1. **Reduce update frequency**: Use fixed time steps (1/60s typical)
2. **Spatial partitioning**: Only check nearby bodies for collisions
3. **Sleep inactive bodies**: Skip updates for grounded/stationary bodies
4. **Use snapshots**: For time-travel or rollback features
5. **Fork for "what-if"**: Test scenarios without affecting main simulation

## Advanced Techniques

### Time Travel

```typescript
// Capture current state
const snapshot = universe.snapshot();

// Run simulation
simulateSteps(100);

// Rewind
universe.restore(snapshot);
```

### Scenario Testing

```typescript
// Fork universe for testing
const testUniverse = universe.fork();

// Try different parameters
testUniverse.getStore('ball-1').setState({
  ...ball,
  mass: ball.mass * 2, // What if mass doubled?
});

simulateSteps(100, testUniverse);
```

### Constraint Violation Handling

```typescript
universe.on('constraint:violation', (event) => {
  console.error(`⚠️ ${event.constraint}: ${event.message}`);
  
  // Optionally repair
  if (event.constraint === 'positive-mass') {
    event.store.setState({ ...event.state, mass: 1 });
  }
});
```

## See Also

- [Universe Manager](./UNIVERSE.md) - Multi-store coordination
- [Performance](./PERFORMANCE.md) - Benchmarks and optimization
- [Examples](../examples/physics/) - Complete simulation code
- [Getting Started](./GETTING_STARTED.md) - Basic Fortistate usage
