/**
 * Fortistate v3.0 - Possibility Algebra
 * 
 * Public API for defining entity schemas, constraints, validations,
 * laws, quantum substrate (superposition, entanglement, observers),
 * relativistic substrate (observer frames, causal ordering),
 * and meta-laws engine (law composition, conflict resolution).
 * This is the foundation of the type system for v3.0.
 * 
 * @packageDocumentation
 */

// Core primitives (Week 1)
export {
  defineEntity,
  getEntityProperties,
  getPropertyType,
  areEntitiesCompatible
} from './defineEntity.js'

export {
  defineConstraint,
  rangeConstraint,
  equalityConstraint,
  patternConstraint,
  nonNegativeConstraint,
  customConstraint
} from './defineConstraint.js'

// Law primitives (Week 2)
export {
  defineLaw,
  composeLaws,
  executeComposition,
  detectConflicts,
  constantLaw,
  transformLaw,
  combineLaw,
  conditionalLaw,
  validatedLaw
} from './defineLaw.js'

// Quantum substrate primitives (Week 3-4)
export {
  defineSuperposition,
  binarySuperposition,
  weightedSuperposition,
  uniformSuperposition
} from './defineSuperposition.js'

export {
  defineEntanglement,
  identicalEntanglement,
  oppositeEntanglement,
  customEntanglement
} from './defineEntanglement.js'

export {
  defineObserver,
  standardObserver,
  deterministicObserver,
  restrictedObserver
} from './defineObserver.js'

// Relativistic substrate primitives (Week 5-6)
export {
  defineObserverFrame,
  stationaryFrame,
  movingFrame,
  properTime,
  lightConeRegion,
  SPEED_OF_CAUSALITY
} from './defineObserverFrame.js'

export {
  determineCausalOrder,
  sortEventsCausally,
  canBeCausallyConnected,
  getPastLightCone,
  getFutureLightCone,
  isAcausal,
  mergeEventLogs
} from './causalOrdering.js'

// Meta-laws engine primitives (Week 7-8)
export {
  defineMetaLaw,
  and,
  or,
  implies,
  sequence
} from './defineMetaLaw.js'

// Types
export type {
  PropertyType,
  PropertyDefinition,
  PossibilityMetadata,
  ConstraintDefinition,
  EntityDefinition,
  ValidationResult,
  ValidationError,
  EntitySchema,
  UniquenessRegistry,
  DefineEntityOptions,
  LawDefinition,
  Law,
  LawExecutionResult,
  LawComposition,
  LawConflict,
  SuperpositionState,
  SuperpositionDefinition,
  Superposition,
  EntanglementCorrelation,
  EntanglementDefinition,
  Entanglement,
  ObserverDefinition,
  Observer,
  MeasurementResult,
  QuantumEntityDefinition,
  SpacetimeCoordinates,
  Velocity,
  ObserverFrameDefinition,
  ObserverFrame,
  CausalEvent,
  LightConeRegion,
  CausalOrdering,
  LorentzTransformation,
  Simultaneity,
  RelativisticEntityDefinition,
  SynchronizationStrategy,
  FrameSynchronizationDefinition,
  FrameSynchronization,
  LawCompositionOperator,
  ConflictResolutionStrategy,
  LawContext,
  MetaLawDefinition,
  MetaLaw,
  MetaLawExecutionResult,
  EmergentPattern,
  EmergentBehavior,
  EmergentLawDefinition,
  FrameDependentLawDefinition,
  FrameDependentLaw
} from './types.js'

/**
 * Package version
 */
export const VERSION = '3.0.0-alpha.0'

