/**
 * Algebra: Substrate & Existence Constraints
 * 
 * Define what *can* exist in a universe through formal constraints.
 * This is the foundation for programmable "laws of nature".
 */

import type { CausalEvent, UniverseId } from '../temporal/causalEvent.js';

/**
 * Relation between states (e.g., physics equations)
 */
export type Relation<T> = (a: T, b: T) => number | boolean | T;

/**
 * Existence constraint defines the possibility space
 */
export interface ExistenceConstraint<T> {
  /** Name of this constraint (for debugging) */
  name: string;
  
  /** 
   * Domain function: returns all possible values
   * Can be finite (e.g., enum) or generator (e.g., all positive integers)
   */
  domain?: () => T[] | IterableIterator<T>;
  
  /**
   * Invariants: rules that must always hold
   * If any return false, the state is invalid
   */
  invariants: Array<{
    name: string;
    check: (state: T) => boolean;
    message?: string;
  }>;
  
  /**
   * Relations to other states/stores
   * Key = related store name
   */
  relations?: Map<string, Relation<T>>;
  
  /**
   * Repair function: attempt to fix invalid states
   * Returns repaired state or undefined if unrepairable
   */
  repair?: (state: T) => T | undefined;
}

/**
 * Validation result for a state
 */
export interface ValidationResult {
  valid: boolean;
  violations: Array<{
    constraintName: string;
    invariantName: string;
    message: string;
    actualValue: any;
  }>;
  repairedValue?: any;
}

/**
 * Law context for reactive behaviors (provided by cosmogenesis runtime)
 */
export interface LawContext {
  universeId: string;
  observerId?: string;
  timestamp: number;
  eventId?: string;
  getState(storeKey: string): any;
  setState(
    storeKey: string,
    next: any,
    metadata?: Record<string, unknown>
  ): void;
}

/**
 * Law reaction function type
 */
export type LawReaction<T> = (
  localState: T,
  context: LawContext
) => void | T | Promise<void | T>;

/**
 * Universe law: pairs a constraint with reactive behaviors
 */
export interface UniverseLaw<T = any> {
  name: string;
  constraint: ExistenceConstraint<T>;
  reactions?: Record<string, LawReaction<T>>;
  onViolation?: (payload: any) => void;
  onRepair?: (payload: any) => void;
}

/**
 * Substrate: collection of constraints defining a universe's "physics"
 */
export interface Substrate {
  /** Unique identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Constraints per store */
  constraints: Map<string, ExistenceConstraint<any>>;
  
  /** Global invariants (across all stores) */
  globalInvariants?: Array<{
    name: string;
    check: (allStates: Map<string, any>) => boolean;
    message?: string;
  }>;

  /** Optional laws bound to specific stores */
  laws?: Map<string, UniverseLaw<any>[]>;
}

export interface SubstrateOptions {
  laws?: Map<string, UniverseLaw<any>[]>;
}

/**
 * Create an existence constraint
 */
export function defineConstraint<T>(
  name: string,
  invariants: Array<{
    name: string;
    check: (state: T) => boolean;
    message?: string;
  }>,
  options: {
    domain?: () => T[] | IterableIterator<T>;
    relations?: Map<string, Relation<T>>;
    repair?: (state: T) => T | undefined;
  } = {}
): ExistenceConstraint<T> {
  return {
    name,
    invariants,
    domain: options.domain,
    relations: options.relations,
    repair: options.repair,
  };
}

/**
 * Validate a state against a constraint
 */
export function validateState<T>(
  state: T,
  constraint: ExistenceConstraint<T>
): ValidationResult {
  const violations: ValidationResult['violations'] = [];

  for (const invariant of constraint.invariants) {
    try {
      if (!invariant.check(state)) {
        violations.push({
          constraintName: constraint.name,
          invariantName: invariant.name,
          message: invariant.message || `Invariant ${invariant.name} violated`,
          actualValue: state,
        });
      }
    } catch (error) {
      violations.push({
        constraintName: constraint.name,
        invariantName: invariant.name,
        message: `Error checking invariant: ${error}`,
        actualValue: state,
      });
    }
  }

  const valid = violations.length === 0;

  // Attempt repair if invalid
  let repairedValue: T | undefined;
  if (!valid && constraint.repair) {
    repairedValue = constraint.repair(state);
  }

  return { valid, violations, repairedValue };
}

/**
 * Validate event against constraint
 */
export function validateEvent<T>(
  event: CausalEvent<T>,
  constraint: ExistenceConstraint<T>
): ValidationResult {
  return validateState(event.value, constraint);
}

/**
 * Create a substrate (collection of constraints)
 */
export function createSubstrate(
  name: string,
  constraints: Map<string, ExistenceConstraint<any>>,
  globalInvariants?: Substrate['globalInvariants'],
  options: SubstrateOptions = {}
): Substrate {
  return {
    id: `substrate-${name}-${Date.now()}`,
    name,
    constraints,
    globalInvariants,
    laws: options.laws,
  };
}

/**
 * Validate all stores in a substrate
 */
export function validateSubstrate(
  substrate: Substrate,
  allStates: Map<string, any>
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  // Validate each store's constraint
  for (const [storeKey, state] of allStates) {
    const constraint = substrate.constraints.get(storeKey);
    if (constraint) {
      results.set(storeKey, validateState(state, constraint));
    }
  }

  // Validate global invariants
  if (substrate.globalInvariants) {
    const globalViolations: ValidationResult['violations'] = [];

    for (const invariant of substrate.globalInvariants) {
      try {
        if (!invariant.check(allStates)) {
          globalViolations.push({
            constraintName: 'global',
            invariantName: invariant.name,
            message: invariant.message || `Global invariant ${invariant.name} violated`,
            actualValue: Object.fromEntries(allStates),
          });
        }
      } catch (error) {
        globalViolations.push({
          constraintName: 'global',
          invariantName: invariant.name,
          message: `Error checking global invariant: ${error}`,
          actualValue: Object.fromEntries(allStates),
        });
      }
    }

    if (globalViolations.length > 0) {
      results.set('__global__', {
        valid: false,
        violations: globalViolations,
      });
    }
  }

  return results;
}

// ========== Example Constraints ==========

/**
 * Example: Conservation of mass constraint for a physics simulation
 */
export interface GameObject {
  id: string;
  mass: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
}

export const conservationOfMass = defineConstraint<GameObject[]>(
  'conservation-of-mass',
  [
    {
      name: 'total-mass-constant',
      check: (objects) => {
        const totalMass = objects.reduce((sum, obj) => sum + obj.mass, 0);
        // Allow small floating point errors
        return Math.abs(totalMass - 100) < 0.001; // Assuming initial mass = 100
      },
      message: 'Total mass must remain constant',
    },
    {
      name: 'positive-mass',
      check: (objects) => objects.every(obj => obj.mass > 0),
      message: 'All objects must have positive mass',
    },
  ],
  {
    relations: new Map([
      [
        'gravity',
        (a: GameObject[], b: GameObject[]) => {
          // Calculate gravitational force between all objects
          // This is a simplified example
          return a.length + b.length; // Placeholder
        },
      ],
    ]),
  }
);

/**
 * Example: Non-negative counter constraint
 */
export const nonNegativeCounter = defineConstraint<{ value: number }>(
  'non-negative-counter',
  [
    {
      name: 'non-negative',
      check: (state) => state.value >= 0,
      message: 'Counter value must be non-negative',
    },
  ],
  {
    repair: (state) => {
      if (state.value < 0) {
        return { value: 0 };
      }
      return state;
    },
  }
);

/**
 * Example: Budget constraint (expenses <= income)
 */
export interface BudgetState {
  income: number;
  expenses: number;
  savings: number;
}

export const budgetConstraint = defineConstraint<BudgetState>(
  'budget-balance',
  [
    {
      name: 'expenses-not-exceed-income',
      check: (state) => state.expenses <= state.income,
      message: 'Expenses cannot exceed income',
    },
    {
      name: 'savings-correct',
      check: (state) => Math.abs(state.savings - (state.income - state.expenses)) < 0.01,
      message: 'Savings must equal income minus expenses',
    },
  ],
  {
    repair: (state) => {
      // Auto-correct savings
      return {
        ...state,
        savings: state.income - state.expenses,
      };
    },
  }
);

/**
 * Example: State machine constraint
 */
export type WorkflowState = 'draft' | 'review' | 'approved' | 'published';

export const workflowStateMachine = defineConstraint<{ status: WorkflowState }>(
  'workflow-state-machine',
  [
    {
      name: 'valid-status',
      check: (state) => ['draft', 'review', 'approved', 'published'].includes(state.status),
      message: 'Status must be one of: draft, review, approved, published',
    },
  ],
  {
    domain: () => [
      { status: 'draft' as WorkflowState },
      { status: 'review' as WorkflowState },
      { status: 'approved' as WorkflowState },
      { status: 'published' as WorkflowState },
    ],
  }
);

/**
 * Helper: Create a range constraint (min <= value <= max)
 */
export function rangeConstraint(
  name: string,
  min: number,
  max: number,
  path?: string[]
): ExistenceConstraint<any> {
  return defineConstraint(
    name,
    [
      {
        name: 'within-range',
        check: (state) => {
          let value = state;
          if (path) {
            for (const key of path) {
              value = value?.[key];
            }
          }
          return typeof value === 'number' && value >= min && value <= max;
        },
        message: `Value must be between ${min} and ${max}`,
      },
    ],
    {
      repair: (state) => {
        let value = state;
        if (path) {
          for (const key of path) {
            value = value?.[key];
          }
        }
        
        if (typeof value === 'number') {
          const clamped = Math.max(min, Math.min(max, value));
          
          if (path) {
            const repaired = { ...state };
            let current: any = repaired;
            for (let i = 0; i < path.length - 1; i++) {
              current = current[path[i]];
            }
            current[path[path.length - 1]] = clamped;
            return repaired;
          }
          
          return clamped as any;
        }
        
        return undefined;
      },
    }
  );
}

/**
 * Helper: Create a type constraint (value must match type)
 */
export function typeConstraint<T>(
  name: string,
  expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array'
): ExistenceConstraint<T> {
  return defineConstraint<T>(
    name,
    [
      {
        name: 'type-check',
        check: (state) => {
          switch (expectedType) {
            case 'array':
              return Array.isArray(state);
            case 'object':
              return typeof state === 'object' && state !== null && !Array.isArray(state);
            default:
              return typeof state === expectedType;
          }
        },
        message: `Value must be of type ${expectedType}`,
      },
    ]
  );
}
