/**
 * 🧬 Ontogenesis Module
 * 
 * Fortistate vX: Generative Existence Platform
 * 
 * This module provides the foundational ontogenetic operators and
 * Law Fabric Engine for Generative Existence Theory (GET).
 */

// Operators
export {
  BEGIN,
  BECOME,
  CEASE,
  TRANSCEND,
  WHEN,
  ALWAYS,
  NEVER,
  isBegin,
  isBecome,
  isCease,
  isTranscend,
  getNarrative,
} from './operators.js'

export type {
  EntityId,
  UniverseId,
  Timestamp,
  Predicate,
  Transform,
  Constraint,
  BeginOp,
  BecomeOp,
  CeaseOp,
  TranscendOp,
  OntogeneticOp,
} from './operators.js'

// Law Fabric Engine
export {
  LawFabricEngine,
  createFabric,
} from './fabric.js'

export type {
  EntityState,
  Reality,
  Paradox,
  ExecutionStep,
  ExecutionResult,
} from './fabric.js'
