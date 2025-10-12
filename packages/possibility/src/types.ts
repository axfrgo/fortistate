/**
 * Fortistate v3.0 - Possibility Algebra Types
 * 
 * Defines the type system for describing what CAN exist before instantiation.
 * Think of these as Platonic forms - the ideal templates that actual state instances conform to.
 */

import type { z } from 'zod'

/**
 * Property types supported in entity definitions
 */
export type PropertyType = 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'enum' | 'date'

/**
 * Definition of a single property in an entity
 */
export interface PropertyDefinition {
  /** The type of this property */
  type: PropertyType
  /** Whether this property is required (defaults to true) */
  required?: boolean
  /** Minimum value (for numbers) or length (for strings) */
  min?: number
  /** Maximum value (for numbers) or length (for strings) */
  max?: number
  /** Regex pattern (for strings) */
  pattern?: RegExp
  /** Whether this property must be unique across all instances */
  unique?: boolean
  /** Allowed values (for enum type) */
  values?: string[]
  /** Default value if not provided */
  default?: any
  /** Human-readable description */
  description?: string
}

/**
 * Metadata for possibility definitions
 */
export interface PossibilityMetadata {
  /** Human-readable name */
  name: string
  /** Detailed description */
  description?: string
  /** Version string (semver) */
  version?: string
  /** Author information */
  author?: string
  /** Tags for categorization */
  tags?: string[]
  /** When this definition was created */
  createdAt?: Date
  /** When this definition was last modified */
  updatedAt?: Date
}

/**
 * Definition of a custom constraint on an entity
 */
export interface ConstraintDefinition {
  /** Unique identifier for this constraint */
  name: string
  /** Human-readable error message when constraint fails */
  message: string
  /** Function that checks if an instance satisfies this constraint */
  check: (instance: any) => boolean
  /** Optional function to automatically repair violations */
  repair?: (instance: any) => any
  /** Severity level */
  severity?: 'low' | 'medium' | 'high' | 'critical'
  /** Category for grouping */
  category?: string
}

/**
 * Complete definition of an entity possibility
 */
export interface EntityDefinition {
  /** Unique name for this entity type */
  name: string
  /** Property definitions */
  properties: Record<string, PropertyDefinition>
  /** Custom constraints beyond property validation */
  constraints?: ConstraintDefinition[]
  /** Metadata about this entity definition */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean
  /** List of validation errors */
  errors?: ValidationError[]
  /** Repaired instance if auto-repair was applied */
  repaired?: any
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** Path to the property that failed */
  path?: string[]
  /** Error message */
  message: string
  /** The invalid value */
  value?: any
  /** Type of error */
  type?: 'schema' | 'constraint' | 'uniqueness'
}

/**
 * The entity schema created from an entity definition
 * This is the "possibility" - the template that actual instances conform to
 */
export interface EntitySchema<T = any> {
  /** The entity name */
  name: string
  /** The Zod schema for validation */
  zodSchema: z.ZodObject<any>
  /** Custom constraints */
  constraints: ConstraintDefinition[]
  /** Metadata */
  metadata: PossibilityMetadata
  /** Validate an instance against this schema */
  validate: (instance: any) => ValidationResult
  /** Create a valid instance with defaults */
  create: (partial?: Partial<T>) => ValidationResult
  /** Check if a value matches this schema */
  matches: (instance: any) => boolean
}

/**
 * Registry for tracking unique values across instances
 */
export interface UniquenessRegistry {
  /** Track a unique value for an entity/property */
  register: (entityName: string, propertyName: string, value: any, instanceId: string) => boolean
  /** Check if a value is already registered */
  isUnique: (entityName: string, propertyName: string, value: any, excludeInstanceId?: string) => boolean
  /** Remove a value from the registry */
  unregister: (entityName: string, propertyName: string, value: any) => void
  /** Clear all registered values for an entity */
  clear: (entityName: string) => void
}

/**
 * Options for entity definition
 */
export interface DefineEntityOptions {
  /** Whether to track unique values globally */
  trackUniqueness?: boolean
  /** Custom uniqueness registry */
  uniquenessRegistry?: UniquenessRegistry
  /** Whether to auto-repair constraint violations */
  autoRepair?: boolean
}

/**
 * Law Definition - Describes state transition rules
 */
export interface LawDefinition<TInput = any, TOutput = any> {
  /** Unique name for this law */
  name: string
  /** Input store keys or entities this law depends on */
  inputs: string[]
  /** Output store key or entity this law produces */
  output: string
  /** The enforcement function that performs the state transition */
  enforce: (...inputs: TInput[]) => TOutput
  /** Optional complexity annotation for optimization (e.g., 'O(n)', 'O(n²)') */
  complexity?: string
  /** Optional precondition that must be true before enforcement */
  precondition?: (...inputs: TInput[]) => boolean
  /** Optional postcondition that must be true after enforcement */
  postcondition?: (output: TOutput) => boolean
  /** Metadata about this law */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * A compiled law ready for execution
 */
export interface Law<TInput = any, TOutput = any> {
  /** The law name */
  name: string
  /** Input dependencies */
  inputs: string[]
  /** Output target */
  output: string
  /** Execute the law */
  execute: (...inputs: TInput[]) => LawExecutionResult<TOutput>
  /** Check if the law can be applied */
  canApply: (...inputs: TInput[]) => boolean
  /** Metadata */
  metadata: PossibilityMetadata
  /** Complexity annotation */
  complexity?: string
}

/**
 * Result of law execution
 */
export interface LawExecutionResult<T = any> {
  /** Whether execution succeeded */
  success: boolean
  /** The output value if successful */
  value?: T
  /** Error message if failed */
  error?: string
  /** Whether precondition was satisfied */
  preconditionMet?: boolean
  /** Whether postcondition was satisfied */
  postconditionMet?: boolean
}

/**
 * Law composition - combine multiple laws
 */
export interface LawComposition {
  /** Name of the composition */
  name: string
  /** Laws in execution order */
  laws: Law[]
  /** Strategy for handling conflicts */
  conflictStrategy?: 'first-wins' | 'last-wins' | 'merge' | 'error'
}

/**
 * Law conflict detection result
 */
export interface LawConflict {
  /** Laws that conflict */
  laws: [string, string]
  /** Reason for conflict */
  reason: string
  /** Severity of conflict */
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// ============================================================================
// QUANTUM SUBSTRATE (Week 3-4)
// ============================================================================

/**
 * A superposition state - represents multiple simultaneous values
 * with probability amplitudes (complex numbers represented as magnitude)
 */
export interface SuperpositionState<T = any> {
  /** Possible values in superposition */
  states: Array<{
    /** The actual value */
    value: T
    /** Probability amplitude (0-1, all amplitudes should sum to 1) */
    amplitude: number
    /** Optional phase information for quantum interference */
    phase?: number
  }>
  /** Whether this superposition has been observed/collapsed */
  isCollapsed: boolean
  /** The collapsed value (only set after observation) */
  collapsedValue?: T
  /** Timestamp of collapse */
  collapsedAt?: number
}

/**
 * Definition for creating a superposition property
 */
export interface SuperpositionDefinition<T = any> {
  /** Property name */
  name: string
  /** Initial possible states with amplitudes */
  initialStates: Array<{
    value: T
    amplitude: number
    phase?: number
  }>
  /** Optional decoherence time in ms (how long superposition lasts) */
  decoherenceTime?: number
  /** Whether to allow re-superposition after collapse */
  allowResuperposition?: boolean
  /** Metadata */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * A compiled superposition ready for use
 */
export interface Superposition<T = any> {
  /** Property name */
  name: string
  /** Get the current state */
  getState: () => SuperpositionState<T>
  /** Observe and collapse to a single value (probabilistic) */
  observe: () => T
  /** Check if collapsed */
  isCollapsed: () => boolean
  /** Reset to superposition (if allowed) */
  resuperpose: (states?: SuperpositionState<T>['states']) => void
  /** Metadata */
  metadata: PossibilityMetadata
}

/**
 * Entanglement correlation types
 */
export type EntanglementCorrelation = 
  | 'identical'       // Both properties always have same value
  | 'opposite'        // Properties have opposite values (boolean not, numeric negation)
  | 'complementary'   // Sum to a constant
  | 'orthogonal'      // Independent but constrained by shared norm
  | 'custom'          // Custom correlation function

/**
 * Definition for entangling two properties
 */
export interface EntanglementDefinition {
  /** Unique name for this entanglement */
  name: string
  /** First entangled property reference */
  propertyA: {
    entity: string
    property: string
  }
  /** Second entangled property reference */
  propertyB: {
    entity: string
    property: string
  }
  /** Type of correlation */
  correlation: EntanglementCorrelation
  /** Custom correlation function (required if correlation is 'custom') */
  correlationFn?: (valueA: any) => any
  /** Whether entanglement persists after measurement */
  persistent?: boolean
  /** Maximum distance for entanglement (in ms of causal time) */
  maxDistance?: number
  /** Metadata */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * A compiled entanglement link
 */
export interface Entanglement {
  /** Entanglement name */
  name: string
  /** Property references */
  propertyA: EntanglementDefinition['propertyA']
  propertyB: EntanglementDefinition['propertyB']
  /** Correlation type */
  correlation: EntanglementCorrelation
  /** Apply correlation when property A is measured */
  applyCorrelation: (valueA: any) => any
  /** Check if entanglement is still active */
  isActive: () => boolean
  /** Break the entanglement */
  break: () => void
  /** Metadata */
  metadata: PossibilityMetadata
}

/**
 * Observer definition - defines how measurements occur
 */
export interface ObserverDefinition {
  /** Observer name/ID */
  name: string
  /** What properties this observer can measure */
  observableProperties?: string[]
  /** Custom collapse strategy */
  collapseStrategy?: 'born-rule' | 'max-amplitude' | 'custom'
  /** Custom collapse function (required if strategy is 'custom') */
  collapseFn?: (states: SuperpositionState<any>['states']) => any
  /** Whether observation causes decoherence in nearby states */
  causesDecoherence?: boolean
  /** Decoherence radius (how many entangled states are affected) */
  decoherenceRadius?: number
  /** Metadata */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * A compiled observer
 */
export interface Observer {
  /** Observer name */
  name: string
  /** Observe a superposition and collapse it */
  observe: <T>(superposition: Superposition<T>) => T
  /** Check if observer can measure a property */
  canObserve: (propertyName: string) => boolean
  /** Metadata */
  metadata: PossibilityMetadata
}

/**
 * Quantum measurement result
 */
export interface MeasurementResult<T = any> {
  /** The measured/collapsed value */
  value: T
  /** Observer who made the measurement */
  observer: string
  /** Timestamp of measurement */
  timestamp: number
  /** Probability of this outcome (from amplitude) */
  probability: number
  /** Whether measurement caused decoherence */
  causedDecoherence?: boolean
  /** Other states affected by decoherence */
  decoherentStates?: string[]
}

/**
 * Quantum entity - entity with quantum properties
 */
export interface QuantumEntityDefinition extends EntityDefinition {
  /** Superposition properties */
  superpositions?: Record<string, SuperpositionDefinition>
  /** Entangled properties */
  entanglements?: EntanglementDefinition[]
  /** Default observer */
  defaultObserver?: string
}

// ============================================================================
// RELATIVISTIC SUBSTRATE (Week 5-6)
// ============================================================================

/**
 * Spacetime coordinates for events
 */
export interface SpacetimeCoordinates {
  /** Time coordinate */
  t: number
  /** Spatial coordinates [x, y, z] */
  x: number[]
}

/**
 * Velocity in spacetime (as fraction of c, the speed of causality)
 */
export interface Velocity {
  /** Speed as fraction of c (0 to 1) */
  v: number
  /** Direction vector (normalized) */
  direction: number[]
}

/**
 * Observer reference frame definition
 */
export interface ObserverFrameDefinition {
  /** Observer name/ID */
  name: string
  /** Velocity relative to universal frame */
  velocity?: Velocity
  /** Initial spacetime position */
  position?: SpacetimeCoordinates
  /** Speed of causality (default: 1.0) */
  speedOfCausality?: number
  /** Metadata */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * A compiled observer reference frame
 */
export interface ObserverFrame {
  /** Observer name */
  name: string
  /** Velocity */
  velocity: Velocity
  /** Current position */
  position: SpacetimeCoordinates
  /** Speed of causality */
  speedOfCausality: number
  /** Calculate Lorentz factor relative to another frame */
  lorentzFactor: (otherFrame: ObserverFrame) => number
  /** Transform event to this frame */
  transformEvent: (event: CausalEvent, fromFrame: ObserverFrame) => CausalEvent
  /** Check if event is in light cone */
  isInLightCone: (event: CausalEvent) => boolean
  /** Metadata */
  metadata: PossibilityMetadata
}

/**
 * Causal event with spacetime coordinates
 */
export interface CausalEvent {
  /** Event ID */
  id: string
  /** Event type */
  type: string
  /** Spacetime coordinates in observer's frame */
  coordinates: SpacetimeCoordinates
  /** Payload data */
  data: any
  /** Observer who recorded this event */
  observer: string
  /** Causal dependencies (event IDs that must happen before) */
  causes?: string[]
}

/**
 * Light cone region
 */
export type LightConeRegion = 
  | 'past'        // Events that could have caused this event
  | 'future'      // Events this event could cause
  | 'elsewhere'   // Events that are spacelike separated (no causal connection)

/**
 * Causal ordering result
 */
export interface CausalOrdering {
  /** First event */
  eventA: string
  /** Second event */
  eventB: string
  /** Relationship from A to B */
  relationship: 'before' | 'after' | 'simultaneous' | 'spacelike'
  /** Light cone region of B relative to A */
  lightCone: LightConeRegion
  /** Proper time interval (invariant) */
  properTime?: number
}

/**
 * Lorentz transformation parameters
 */
export interface LorentzTransformation {
  /** Lorentz factor (gamma) */
  gamma: number
  /** Relative velocity */
  beta: number
  /** Transformation matrix */
  matrix: number[][]
}

/**
 * Simultaneity definition (observer-dependent)
 */
export interface Simultaneity {
  /** Observer frame */
  observer: string
  /** Events that are simultaneous in this frame */
  simultaneousEvents: string[]
  /** Timestamp in this frame */
  timestamp: number
}

/**
 * Relativistic entity with frame-dependent properties
 */
export interface RelativisticEntityDefinition extends EntityDefinition {
  /** Observer frames that can access this entity */
  observerFrames?: string[]
  /** Properties that vary by observer frame */
  frameDependent?: Record<string, {
    /** Property name */
    property: string
    /** Transformation function */
    transform: (value: any, fromFrame: ObserverFrame, toFrame: ObserverFrame) => any
  }>
  /** Default reference frame */
  defaultFrame?: string
}

/**
 * Event synchronization strategy
 */
export type SynchronizationStrategy = 
  | 'einstein'      // Einstein synchronization (standard relativity)
  | 'absolute'      // Absolute time (ignore relativity)
  | 'causal'        // Maintain causal ordering only
  | 'custom'        // Custom synchronization function

/**
 * Frame synchronization definition
 */
export interface FrameSynchronizationDefinition {
  /** Synchronization name */
  name: string
  /** Strategy */
  strategy: SynchronizationStrategy
  /** Custom synchronization function */
  syncFn?: (eventA: CausalEvent, eventB: CausalEvent, frames: ObserverFrame[]) => CausalOrdering
  /** Metadata */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * Compiled frame synchronization
 */
export interface FrameSynchronization {
  /** Name */
  name: string
  /** Strategy */
  strategy: SynchronizationStrategy
  /** Synchronize events across frames */
  synchronize: (events: CausalEvent[], frames: ObserverFrame[]) => CausalEvent[]
  /** Determine event ordering */
  orderEvents: (eventA: CausalEvent, eventB: CausalEvent, observer: ObserverFrame) => CausalOrdering
  /** Metadata */
  metadata: PossibilityMetadata
}

// ============================================================================
// META-LAWS ENGINE (Week 7-8)
// ============================================================================

/**
 * Law composition operators - how to combine multiple laws
 */
export type LawCompositionOperator = 
  | 'conjunction'      // AND - all laws must hold
  | 'disjunction'      // OR - at least one law must hold
  | 'implication'      // IF-THEN - if first holds, then second must hold
  | 'sequence'         // Execute laws in order
  | 'parallel'         // Execute laws concurrently
  | 'custom'           // Custom composition logic

/**
 * Conflict resolution strategies for contradictory laws
 */
export type ConflictResolutionStrategy = 
  | 'priority'         // Higher priority law wins
  | 'voting'           // Majority vote among laws
  | 'first-wins'       // First applicable law wins
  | 'last-wins'        // Last applicable law wins
  | 'merge'            // Attempt to merge conflicting results
  | 'frame-dependent'  // Resolution depends on observer frame
  | 'error'            // Throw error on conflict
  | 'custom'           // Custom resolution function

/**
 * Context for law execution
 */
export interface LawContext {
  /** Current observer frame (relativistic) */
  frame?: ObserverFrame
  /** Current time */
  timestamp?: number
  /** Additional context data */
  data?: Record<string, any>
  /** Execution priority (higher = more important) */
  priority?: number
  /** Execution mode */
  mode?: 'strict' | 'lenient' | 'optimistic'
}

/**
 * Meta-law definition - compose multiple laws with resolution strategies
 */
export interface MetaLawDefinition<TInput = any, TOutput = any> {
  /** Unique name for this meta-law */
  name: string
  /** Component laws to compose */
  laws: (Law<TInput, TOutput> | MetaLaw<TInput, TOutput>)[]
  /** How to compose the laws */
  composition: LawCompositionOperator
  /** Custom composition function (required if composition='custom') */
  compositionFn?: (laws: Law<TInput, TOutput>[], inputs: TInput[], context: LawContext) => TOutput
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy
  /** Custom conflict resolver (required if conflictResolution='custom') */
  conflictResolver?: (conflicts: LawConflict[], context: LawContext) => TOutput
  /** Priority for this meta-law (used in conflict resolution) */
  priority?: number
  /** Execution context */
  context?: Partial<LawContext>
  /** Whether this meta-law can be composed further */
  composable?: boolean
  /** Metadata */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * Compiled meta-law ready for execution
 */
export interface MetaLaw<TInput = any, TOutput = any> {
  /** Name */
  name: string
  /** Component laws */
  laws: (Law<TInput, TOutput> | MetaLaw<TInput, TOutput>)[]
  /** Composition operator */
  composition: LawCompositionOperator
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy
  /** Priority */
  priority: number
  /** Execute the meta-law */
  execute: (inputs: TInput[], context?: Partial<LawContext>) => MetaLawExecutionResult<TOutput>
  /** Check if meta-law can be applied */
  canApply: (inputs: TInput[], context?: Partial<LawContext>) => boolean
  /** Detect conflicts among component laws */
  detectConflicts: (inputs: TInput[], context?: Partial<LawContext>) => LawConflict[]
  /** Resolve conflicts */
  resolveConflicts: (conflicts: LawConflict[], context: LawContext) => TOutput
  /** Add a new law to this meta-law */
  addLaw: (law: Law<TInput, TOutput> | MetaLaw<TInput, TOutput>) => void
  /** Remove a law from this meta-law */
  removeLaw: (lawName: string) => void
  /** Metadata */
  metadata: PossibilityMetadata
}

/**
 * Result of meta-law execution
 */
export interface MetaLawExecutionResult<T = any> {
  /** Whether execution succeeded */
  success: boolean
  /** The output value */
  value?: T
  /** Error message if failed */
  error?: string
  /** Individual law results */
  lawResults: Map<string, LawExecutionResult<T>>
  /** Conflicts detected */
  conflicts: LawConflict[]
  /** How conflicts were resolved */
  conflictResolution?: string
  /** Execution context */
  context: LawContext
}

/**
 * Emergent behavior pattern types
 */
export type EmergentPattern = 
  | 'synchronization'   // Multiple entities sync behavior
  | 'oscillation'       // Periodic patterns emerge
  | 'cascade'           // Chain reactions
  | 'convergence'       // Systems move toward equilibrium
  | 'divergence'        // Systems move apart
  | 'clustering'        // Formation of groups
  | 'feedback-loop'     // Self-reinforcing cycles
  | 'phase-transition'  // Sudden state changes
  | 'equilibrium'       // Stable states
  | 'chaos'             // Unpredictable behavior
  | 'custom'            // User-defined pattern

/**
 * Emergent behavior detection result
 */
export interface EmergentBehavior {
  /** Pattern type */
  pattern: EmergentPattern
  /** Pattern name */
  name: string
  /** Confidence level (0-1) */
  confidence: number
  /** Entities involved */
  entities: string[]
  /** Time window of detection */
  timeWindow: { start: number; end: number }
  /** Evidence supporting this pattern */
  evidence: Array<{
    type: string
    description: string
    timestamp: number
    data?: any
  }>
  /** Properties of the emergent behavior */
  properties: Record<string, any>
  /** Whether this could be synthesized as a law */
  synthesizable: boolean
}

/**
 * Emergent law definition - synthesized from observed patterns
 */
export interface EmergentLawDefinition<TInput = any, TOutput = any> extends LawDefinition<TInput, TOutput> {
  /** The emergent behavior that generated this law */
  sourcePattern: EmergentBehavior
  /** Confidence in this law (0-1) */
  confidence: number
  /** Number of observations supporting this law */
  observations: number
  /** Whether this law should be automatically applied */
  autoApply: boolean
}

/**
 * Frame-dependent law - laws that vary by observer frame
 */
export interface FrameDependentLawDefinition<TInput = any, TOutput = any> {
  /** Base law name */
  name: string
  /** Law variants for different frames */
  variants: Map<string, Law<TInput, TOutput>>
  /** Default law if frame not found */
  defaultLaw: Law<TInput, TOutput>
  /** Function to select appropriate law variant */
  selectVariant: (frame: ObserverFrame, context: LawContext) => Law<TInput, TOutput>
  /** Whether to transform inputs between frames */
  transformInputs: boolean
  /** Metadata */
  metadata?: Partial<PossibilityMetadata>
}

/**
 * Compiled frame-dependent law
 */
export interface FrameDependentLaw<TInput = any, TOutput = any> {
  /** Name */
  name: string
  /** Available frame variants */
  variants: Map<string, Law<TInput, TOutput>>
  /** Default law */
  defaultLaw: Law<TInput, TOutput>
  /** Execute in specific frame */
  executeInFrame: (inputs: TInput[], frame: ObserverFrame, context?: Partial<LawContext>) => LawExecutionResult<TOutput>
  /** Get law for specific frame */
  getLawForFrame: (frame: ObserverFrame) => Law<TInput, TOutput>
  /** Add frame variant */
  addVariant: (frameName: string, law: Law<TInput, TOutput>) => void
  /** Metadata */
  metadata: PossibilityMetadata
}

