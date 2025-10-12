/**
 * 🧬 Ontogenesis Operators
 * 
 * The four primitive operators of Generative Existence Theory (GET):
 * - BEGIN: Seed new existence
 * - BECOME: Transform existing entities
 * - CEASE: Define boundaries and death conditions
 * - TRANSCEND: Universe forking and evolution
 * 
 * These operators form the substrate for all existence in Fortistate vX.
 */

export type EntityId = string
export type UniverseId = string
export type Timestamp = number | 'NOW' | 'INFINITE' | { ordinal: number }

/**
 * Predicate function for conditions
 */
export type Predicate<T = any> = (state: T) => boolean

/**
 * Transform function for state evolution
 */
export type Transform<T = any> = (state: T) => T

/**
 * Constraint definition
 */
export interface Constraint {
  name: string
  predicate: Predicate
  action: 'enforce' | 'repair' | 'fork'
  repairFn?: Transform
  narrative?: string
}

// ═══════════════════════════════════════════════════════════════
// BEGIN Operator: Seed new existence
// ═══════════════════════════════════════════════════════════════

export interface BeginOp {
  type: 'BEGIN'
  entity: EntityId
  properties: Record<string, unknown>
  constraints?: Constraint[]
  timestamp?: Timestamp
  narrative?: string
}

/**
 * BEGIN - Creates new existence within a universe
 * 
 * @example
 * BEGIN('user:alice', { 
 *   balance: 100, 
 *   tier: 'gold' 
 * })
 * // Narrative: "Alice's account begins with $100"
 */
export function BEGIN(
  entity: EntityId,
  properties: Record<string, unknown>,
  options?: {
    constraints?: Constraint[]
    timestamp?: Timestamp
    narrative?: string
  }
): BeginOp {
  return {
    type: 'BEGIN',
    entity,
    properties,
    constraints: options?.constraints,
    timestamp: options?.timestamp || 'NOW',
    narrative: options?.narrative || `${entity} begins with ${JSON.stringify(properties)}`,
  }
}

// ═══════════════════════════════════════════════════════════════
// BECOME Operator: Transform existing entities
// ═══════════════════════════════════════════════════════════════

export interface BecomeOp {
  type: 'BECOME'
  entity: EntityId
  transform: Transform
  trigger?: Predicate | 'IMMEDIATE'
  timestamp?: Timestamp
  narrative?: string
}

/**
 * BECOME - Evolution of existing entities through causal transforms
 * 
 * @example
 * BECOME('user:alice', 
 *   (state) => ({ ...state, balance: state.balance + 50 }),
 *   (state) => state.event === 'deposit'
 * )
 * // Narrative: "Alice's balance becomes $150 after deposit"
 */
export function BECOME(
  entity: EntityId,
  transform: Transform,
  trigger?: Predicate | 'IMMEDIATE',
  options?: {
    timestamp?: Timestamp
    narrative?: string
  }
): BecomeOp {
  return {
    type: 'BECOME',
    entity,
    transform,
    trigger: trigger || 'IMMEDIATE',
    timestamp: options?.timestamp || 'NOW',
    narrative: options?.narrative || `${entity} becomes transformed`,
  }
}

// ═══════════════════════════════════════════════════════════════
// CEASE Operator: Define boundaries and death conditions
// ═══════════════════════════════════════════════════════════════

export interface CeaseOp {
  type: 'CEASE'
  entity: EntityId
  condition: Predicate
  action: 'terminate' | 'repair' | 'fork'
  repairFn?: Transform
  timestamp?: Timestamp
  narrative?: string
}

/**
 * CEASE - Defines limits, death conditions, or constraint walls
 * 
 * @example
 * CEASE('user:alice', 
 *   (state) => state.balance < 0,
 *   'repair',
 *   (state) => ({ ...state, balance: 0 })
 * )
 * // Narrative: "Alice's balance cannot drop below zero. Repaired to 0."
 */
export function CEASE(
  entity: EntityId,
  condition: Predicate,
  action: 'terminate' | 'repair' | 'fork',
  repairFn?: Transform,
  options?: {
    timestamp?: Timestamp
    narrative?: string
  }
): CeaseOp {
  return {
    type: 'CEASE',
    entity,
    condition,
    action,
    repairFn,
    timestamp: options?.timestamp || 'NOW',
    narrative: options?.narrative || `${entity} ceases when condition met`,
  }
}

// ═══════════════════════════════════════════════════════════════
// TRANSCEND Operator: Universe forking and evolution
// ═══════════════════════════════════════════════════════════════

export interface TranscendOp {
  type: 'TRANSCEND'
  entity: EntityId
  portal: UniverseId
  condition: Predicate
  mapping?: Transform
  timestamp?: Timestamp
  narrative?: string
}

/**
 * TRANSCEND - Universe forking, evolution, or dimensional shift
 * 
 * @example
 * TRANSCEND('user:alice',
 *   'universe:vip',
 *   (state) => state.balance > 10000,
 *   (state) => ({ ...state, tier: 'platinum' })
 * )
 * // Narrative: "Alice transcends to VIP universe"
 */
export function TRANSCEND(
  entity: EntityId,
  portal: UniverseId,
  condition: Predicate,
  mapping?: Transform,
  options?: {
    timestamp?: Timestamp
    narrative?: string
  }
): TranscendOp {
  return {
    type: 'TRANSCEND',
    entity,
    portal,
    condition,
    mapping,
    timestamp: options?.timestamp || 'NOW',
    narrative: options?.narrative || `${entity} transcends to ${portal}`,
  }
}

// ═══════════════════════════════════════════════════════════════
// Union Type: All Ontogenetic Operators
// ═══════════════════════════════════════════════════════════════

export type OntogeneticOp = BeginOp | BecomeOp | CeaseOp | TranscendOp

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Check if an operator is of a specific type
 */
export function isBegin(op: OntogeneticOp): op is BeginOp {
  return op.type === 'BEGIN'
}

export function isBecome(op: OntogeneticOp): op is BecomeOp {
  return op.type === 'BECOME'
}

export function isCease(op: OntogeneticOp): op is CeaseOp {
  return op.type === 'CEASE'
}

export function isTranscend(op: OntogeneticOp): op is TranscendOp {
  return op.type === 'TRANSCEND'
}

/**
 * Get narrative description of an operator
 */
export function getNarrative(op: OntogeneticOp): string {
  return op.narrative || `${op.type} operation on ${op.entity}`
}

/**
 * Conditional triggers for BECOME operators
 */
export const WHEN = (eventType: string): Predicate => 
  (state: any) => state.event === eventType

export const ALWAYS: Predicate = () => true

export const NEVER: Predicate = () => false
