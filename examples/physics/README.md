# Physics Simulation Examples

This directory contains examples demonstrating classical mechanics simulations using Fortistate's substrate and constraint system.

## Examples

### 🏀 Bouncing Ball (`bouncing-ball.mjs`)

Single ball simulation demonstrating:
- Gravity acceleration (9.8 m/s²)
- Ground collision with bounce damping
- Wall bouncing
- Friction when grounded
- Energy conservation tracking

**Run:**
```bash
npm run build
node examples/physics/bouncing-ball.mjs
```

**Output:**
```
🏀 Bouncing Ball Physics Simulation

World: 800x600 pixels
Gravity: 9.8 m/s²
Bounce damping: 0.8

Time    | Position (x, y)      | Velocity (x, y)    | Energy (K+P=T)
--------|----------------------|--------------------|-------------------
1.00s   | (450.0, 505.0)       | (50.0, 9.8)        | 1298.0+4948.8=6246.8
2.00s   | (500.0, 519.8)       | (50.0, 19.6)       | 1442.1+5093.7=6535.8
...

✓ Simulation complete
```

### 💥 Multi-Body Collision (`collision-demo.mjs`)

Three-body collision simulation demonstrating:
- Elastic collisions between bodies
- Momentum conservation
- Energy analysis
- Collision detection and resolution

**Run:**
```bash
npm run build
node examples/physics/collision-demo.mjs
```

**Output:**
```
💥 Multi-Body Collision Simulation

Bodies: 3
Elasticity: 0.9

Initial Configuration:
  body-1: pos=(200, 300) vel=(100, 0) mass=2
  body-2: pos=(500, 300) vel=(0, 0) mass=1
  body-3: pos=(750, 300) vel=(-50, 0) mass=1.5

Time    | Total Momentum (x, y) | Total Energy | Collisions
--------|----------------------|--------------|------------
1.00s   | (125.0, 44.1)        | 25540.8 J    | 0
3.00s   | (125.0, 132.3)       | 26593.1 J    | 2
...

✓ Simulation complete
```

## Physics Substrate

The examples use `src/physics/physics-substrate.ts` which provides:

### Constants

```typescript
const PHYSICS_CONSTANTS = {
  GRAVITY: 9.8,              // m/s²
  AIR_RESISTANCE: 0.01,      // coefficient
  FRICTION_COEFFICIENT: 0.1, // surface friction
  BOUNCE_DAMPING: 0.8,       // energy retained after bounce
  MIN_VELOCITY: 0.01,        // stopping threshold
  COLLISION_ELASTICITY: 0.9, // elastic collision coefficient
}
```

### Constraints

1. **Positive Mass**: `mass > 0`
2. **Velocity Limit**: `speed <= 1000 m/s`
3. **Position Bounds**: `|x|, |y| < 10000`

### Utilities

```typescript
// Distance between bodies
PhysicsUtils.distance(a, b): number

// Collision detection
PhysicsUtils.isColliding(a, b): boolean

// Momentum calculation
PhysicsUtils.momentum(body): Vector2D

// Energy calculations
PhysicsUtils.kineticEnergy(body): number
PhysicsUtils.potentialEnergy(body): number
PhysicsUtils.totalEnergy(body): number

// Physics integration
PhysicsUtils.updateBody(body, dt): PhysicsBody

// Collision resolution
PhysicsUtils.handleGroundCollision(body, groundY): PhysicsBody
PhysicsUtils.resolveCollision(a, b): { a: PhysicsBody, b: PhysicsBody }

// Body creation
PhysicsUtils.createBody(options): PhysicsBody
```

## Building Custom Simulations

### 1. Create Universe

```typescript
import { createUniverse } from 'fortistate/cosmogenesis/universe';
import { createPhysicsSubstrate } from 'fortistate/physics/physics-substrate';

const universe = createUniverse({
  substrates: [createPhysicsSubstrate()],
});
```

### 2. Create Bodies

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

### 3. Simulation Loop

```typescript
const dt = 1 / 60; // 60 FPS

function simulate() {
  const ball = ballStore.getState();
  
  // Apply forces
  const withGravity = {
    ...ball,
    acceleration: { x: 0, y: PHYSICS_CONSTANTS.GRAVITY },
  };
  
  // Update physics
  let updated = PhysicsUtils.updateBody(withGravity, dt);
  updated = PhysicsUtils.handleGroundCollision(updated, 0);
  
  // Update store (constraints enforced automatically!)
  ballStore.setState(updated);
}

setInterval(simulate, dt * 1000);
```

## Performance

From `test/performance/constraints.perf.test.ts`:

| Metric | Value |
|--------|-------|
| Universe + Constraints | 5.6 ms (avg for 1000 updates) |
| Target | < 15 ms |
| Result | **3x better than target** ✅ |

**Recommended:**
- **< 10 bodies**: Real-time (60 FPS) easily
- **10-100 bodies**: Use spatial partitioning
- **100+ bodies**: Broadphase algorithms

## Advanced Features

### Time Travel

```typescript
// Snapshot current state
const snapshot = universe.snapshot();

// Run simulation
simulate(100);

// Rewind
universe.restore(snapshot);
```

### Scenario Testing

```typescript
// Fork universe
const testUniverse = universe.fork();

// Test "what if" scenarios
testUniverse.getStore('ball-1').setState({
  ...ball,
  mass: ball.mass * 2,
});
```

### Constraint Violations

```typescript
universe.on('constraint:violation', (event) => {
  console.error(`⚠️ ${event.constraint}: ${event.message}`);
});
```

## See Also

- [Physics Documentation](../../docs/PHYSICS.md) - Complete guide
- [Performance](../../docs/PERFORMANCE.md) - Benchmarks
- [Universe Manager](../../docs/UNIVERSE.md) - Multi-store coordination
- [Getting Started](../../docs/GETTING_STARTED.md) - Basic usage
