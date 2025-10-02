/**
 * Physics Substrate: Classical Mechanics
 * 
 * Defines fundamental physics constraints and laws for simulating
 * real-world physics behavior with Fortistate.
 */

import type { Substrate } from '../algebra/substrate.js';
import { defineLaw } from '../cosmogenesis/laws.js';

/**
 * Physics constants
 */
export const PHYSICS_CONSTANTS = {
  GRAVITY: 9.8, // m/s²
  AIR_RESISTANCE: 0.01, // coefficient
  FRICTION_COEFFICIENT: 0.1,
  BOUNCE_DAMPING: 0.8, // energy retained after collision
  MIN_VELOCITY: 0.01, // threshold for stopping
  COLLISION_ELASTICITY: 0.9,
} as const;

/**
 * Vector2D type for 2D physics
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Physics body state
 */
export interface PhysicsBody {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  radius?: number;
  grounded?: boolean;
}

/**
 * Create a physics substrate with classical mechanics laws
 */
export function createPhysicsSubstrate(): Substrate {
  const positiveConstraint = {
    name: 'positive-mass',
    invariants: [],
    validate: (body: PhysicsBody) => ({
      valid: body.mass > 0,
      message: body.mass > 0 ? undefined : `Mass must be positive, got ${body.mass}`,
    }),
  };

  const velocityLimitConstraint = {
    name: 'velocity-limit',
    invariants: [],
    validate: (body: PhysicsBody) => {
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      const maxSpeed = 1000; // m/s
      return {
        valid: speed <= maxSpeed,
        message: speed <= maxSpeed ? undefined : `Speed ${speed.toFixed(2)} exceeds limit ${maxSpeed}`,
      };
    },
  };

  const positionBoundsConstraint = {
    name: 'position-bounds',
    invariants: [],
    validate: (body: PhysicsBody) => {
      const maxBound = 10000;
      const inBounds = Math.abs(body.position.x) < maxBound && Math.abs(body.position.y) < maxBound;
      return {
        valid: inBounds,
        message: inBounds ? undefined : `Position out of bounds: (${body.position.x}, ${body.position.y})`,
      };
    },
  };

  return {
    id: 'classical-physics',
    name: 'Classical Mechanics',
    constraints: new Map([
      ['positive-mass', positiveConstraint],
      ['velocity-limit', velocityLimitConstraint],
      ['position-bounds', positionBoundsConstraint],
    ]),
    laws: new Map(),
  };
}

/**
 * Physics utilities
 */
export const PhysicsUtils = {
  /**
   * Calculate distance between two bodies
   */
  distance(a: PhysicsBody, b: PhysicsBody): number {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Check if two bodies are colliding
   */
  isColliding(a: PhysicsBody, b: PhysicsBody): boolean {
    const radiusA = a.radius ?? 1;
    const radiusB = b.radius ?? 1;
    return this.distance(a, b) < (radiusA + radiusB);
  },

  /**
   * Calculate momentum
   */
  momentum(body: PhysicsBody): Vector2D {
    return {
      x: body.mass * body.velocity.x,
      y: body.mass * body.velocity.y,
    };
  },

  /**
   * Calculate kinetic energy
   */
  kineticEnergy(body: PhysicsBody): number {
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    return 0.5 * body.mass * speed * speed;
  },

  /**
   * Calculate potential energy (assuming y=0 is ground)
   */
  potentialEnergy(body: PhysicsBody): number {
    return body.mass * PHYSICS_CONSTANTS.GRAVITY * body.position.y;
  },

  /**
   * Calculate total energy
   */
  totalEnergy(body: PhysicsBody): number {
    return this.kineticEnergy(body) + this.potentialEnergy(body);
  },

  /**
   * Update physics body (Euler integration)
   */
  updateBody(body: PhysicsBody, dt: number): PhysicsBody {
    const newVelocity = {
      x: body.velocity.x + body.acceleration.x * dt,
      y: body.velocity.y + body.acceleration.y * dt,
    };

    const newPosition = {
      x: body.position.x + newVelocity.x * dt,
      y: body.position.y + newVelocity.y * dt,
    };

    return {
      ...body,
      position: newPosition,
      velocity: newVelocity,
    };
  },

  /**
   * Handle ground collision
   */
  handleGroundCollision(body: PhysicsBody, groundY: number = 0): PhysicsBody {
    const radius = body.radius ?? 1;
    
    if (body.position.y - radius <= groundY && body.velocity.y > 0) {
      const newVelocity = {
        x: body.velocity.x,
        y: -body.velocity.y * PHYSICS_CONSTANTS.BOUNCE_DAMPING,
      };

      const newPosition = {
        x: body.position.x,
        y: groundY + radius,
      };

      const isNearlyStationary = Math.abs(newVelocity.y) < PHYSICS_CONSTANTS.MIN_VELOCITY;

      return {
        ...body,
        position: newPosition,
        velocity: isNearlyStationary ? { x: body.velocity.x, y: 0 } : newVelocity,
        grounded: isNearlyStationary,
      };
    }

    return body;
  },

  /**
   * Handle collision between two bodies (elastic collision)
   */
  resolveCollision(a: PhysicsBody, b: PhysicsBody): { a: PhysicsBody; b: PhysicsBody } {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { a, b };

    // Normal vector
    const nx = dx / distance;
    const ny = dy / distance;

    // Relative velocity
    const dvx = b.velocity.x - a.velocity.x;
    const dvy = b.velocity.y - a.velocity.y;

    // Relative velocity in normal direction
    const dvn = dvx * nx + dvy * ny;

    // Don't resolve if velocities are separating
    if (dvn > 0) return { a, b };

    // Calculate impulse
    const e = PHYSICS_CONSTANTS.COLLISION_ELASTICITY;
    const impulse = (-(1 + e) * dvn) / (1 / a.mass + 1 / b.mass);

    // Apply impulse
    const newVelocityA = {
      x: a.velocity.x - (impulse * nx) / a.mass,
      y: a.velocity.y - (impulse * ny) / a.mass,
    };

    const newVelocityB = {
      x: b.velocity.x + (impulse * nx) / b.mass,
      y: b.velocity.y + (impulse * ny) / b.mass,
    };

    return {
      a: { ...a, velocity: newVelocityA },
      b: { ...b, velocity: newVelocityB },
    };
  },

  /**
   * Create a physics body
   */
  createBody(options: {
    position: Vector2D;
    velocity?: Vector2D;
    mass?: number;
    radius?: number;
  }): PhysicsBody {
    return {
      position: options.position,
      velocity: options.velocity ?? { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: options.mass ?? 1,
      radius: options.radius ?? 1,
      grounded: false,
    };
  },
};
