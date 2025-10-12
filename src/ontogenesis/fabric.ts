/**
 * 🌊 Law Fabric Engine
 * 
 * Executes ontogenetic operators as woven fields of existence.
 * This is the core runtime substrate for Generative Existence Theory (GET).
 * 
 * Key Features:
 * - Field-based operator execution
 * - Paradox detection and resolution via universe forking
 * - Reactive causal propagation (<50ms target)
 * - Telemetry and emergence detection
 */

import type {
  OntogeneticOp,
  EntityId,
  UniverseId,
  BeginOp,
  BecomeOp,
  CeaseOp,
  TranscendOp,
  Predicate,
} from './operators.js'

// ═══════════════════════════════════════════════════════════════
// State & Reality Types
// ═══════════════════════════════════════════════════════════════

export interface EntityState {
  id: EntityId
  properties: Record<string, unknown>
  createdAt: number
  updatedAt: number
  universeId: UniverseId
}

export interface Reality {
  universeId: UniverseId
  entities: Map<EntityId, EntityState>
  timestamp: number
  parentUniverse?: UniverseId
}

export interface Paradox {
  entity: EntityId
  constraint: string
  violation: string
  timestamp: number
}

export interface ExecutionStep {
  operator: OntogeneticOp
  before: EntityState | null
  after: EntityState | null
  timestamp: number
  narrative: string
}

export interface ExecutionResult {
  reality: Reality
  branches: Reality[]  // Forked universes from paradoxes
  trace: ExecutionStep[]
  paradoxes: Paradox[]
  performance: {
    propagationMs: number
    repairMs: number
    forkMs: number
  }
}

// ═══════════════════════════════════════════════════════════════
// Law Fabric Engine
// ═══════════════════════════════════════════════════════════════

export class LawFabricEngine {
  private reality: Reality
  private operators: OntogeneticOp[] = []
  private trace: ExecutionStep[] = []
  private subscribers: Map<EntityId, Set<(state: EntityState) => void>> = new Map()
  private telemetryHandlers: Set<(trace: ExecutionStep[]) => void> = new Set()

  constructor(universeId: UniverseId = 'universe:main') {
    this.reality = {
      universeId,
      entities: new Map(),
      timestamp: Date.now(),
    }
  }

  // ───────────────────────────────────────────────────────────
  // Operator Management
  // ───────────────────────────────────────────────────────────

  /**
   * Add an operator to the fabric
   */
  add(operator: OntogeneticOp): this {
    this.operators.push(operator)
    return this
  }

  /**
   * Add multiple operators
   */
  addMany(operators: OntogeneticOp[]): this {
    this.operators.push(...operators)
    return this
  }

  /**
   * Clear all operators
   */
  clear(): this {
    this.operators = []
    this.trace = []
    return this
  }

  // ───────────────────────────────────────────────────────────
  // Execution
  // ───────────────────────────────────────────────────────────

  /**
   * Execute all operators and propagate through the fabric
   */
  execute(): ExecutionResult {
    const startTime = performance.now()
    const branches: Reality[] = []
    const paradoxes: Paradox[] = []

    // Execute each operator in sequence
    for (const op of this.operators) {

      switch (op.type) {
        case 'BEGIN':
          this.executeBegin(op)
          break
        case 'BECOME':
          this.executeBecome(op)
          break
        case 'CEASE': {
          const result = this.executeCease(op)
          if (result.forked) {
            branches.push(...result.branches)
          }
          if (result.paradox) {
            paradoxes.push(result.paradox)
          }
          break
        }
        case 'TRANSCEND': {
          const result = this.executeTranscend(op)
          if (result.forked) {
            branches.push(result.newReality)
          }
          break
        }
      }

      // Emit telemetry
      this.emitTelemetry()
    }

    const endTime = performance.now()

    return {
      reality: this.reality,
      branches,
      trace: this.trace,
      paradoxes,
      performance: {
        propagationMs: endTime - startTime,
        repairMs: 0, // TODO: Track separately
        forkMs: 0,   // TODO: Track separately
      },
    }
  }

  // ───────────────────────────────────────────────────────────
  // Operator Executors
  // ───────────────────────────────────────────────────────────

  private executeBegin(op: BeginOp): void {
    const entity: EntityState = {
      id: op.entity,
      properties: op.properties,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      universeId: this.reality.universeId,
    }

    this.reality.entities.set(op.entity, entity)

    // Record trace
    this.trace.push({
      operator: op,
      before: null,
      after: entity,
      timestamp: Date.now(),
      narrative: op.narrative || `🌱 ${op.entity} begins`,
    })

    // Notify subscribers
    this.notifySubscribers(op.entity, entity)
  }

  private executeBecome(op: BecomeOp): void {
    const current = this.reality.entities.get(op.entity)
    if (!current) {
      console.warn(`BECOME: Entity ${op.entity} does not exist`)
      return
    }

    // Check trigger condition
    if (op.trigger !== 'IMMEDIATE') {
      const shouldTrigger = (op.trigger as Predicate)(current.properties)
      if (!shouldTrigger) {
        return // Skip transformation
      }
    }

    // Apply transformation
    const before = { ...current }
    const newProperties = op.transform(current.properties)
    const after: EntityState = {
      ...current,
      properties: newProperties,
      updatedAt: Date.now(),
    }

    this.reality.entities.set(op.entity, after)

    // Record trace
    this.trace.push({
      operator: op,
      before,
      after,
      timestamp: Date.now(),
      narrative: op.narrative || `🦋 ${op.entity} becomes transformed`,
    })

    // Notify subscribers
    this.notifySubscribers(op.entity, after)
  }

  private executeCease(op: CeaseOp): {
    forked: boolean
    branches: Reality[]
    paradox?: Paradox
  } {
    const current = this.reality.entities.get(op.entity)
    if (!current) {
      return { forked: false, branches: [] }
    }

    // Check cease condition
    const shouldCease = op.condition(current.properties)
    if (!shouldCease) {
      return { forked: false, branches: [] }
    }

    const before = { ...current }

    switch (op.action) {
      case 'terminate': {
        // Remove entity from reality
        this.reality.entities.delete(op.entity)
        
        this.trace.push({
          operator: op,
          before,
          after: null,
          timestamp: Date.now(),
          narrative: op.narrative || `💀 ${op.entity} ceases to exist`,
        })

        this.notifySubscribers(op.entity, null as any)
        return { forked: false, branches: [] }
      }

      case 'repair': {
        // Apply repair function
        if (!op.repairFn) {
          console.warn(`CEASE: No repair function for ${op.entity}`)
          return { forked: false, branches: [] }
        }

        const repaired = op.repairFn(current.properties)
        const after: EntityState = {
          ...current,
          properties: repaired,
          updatedAt: Date.now(),
        }

        this.reality.entities.set(op.entity, after)

        this.trace.push({
          operator: op,
          before,
          after,
          timestamp: Date.now(),
          narrative: op.narrative || `🔧 ${op.entity} repaired to valid state`,
        })

        this.notifySubscribers(op.entity, after)
        return { forked: false, branches: [] }
      }

      case 'fork': {
        // Create branching universes
        const branchA = this.forkUniverse('repair')
        const branchB = this.forkUniverse('explore')

        // BranchA: Repair the violation
        if (op.repairFn) {
          const repaired = op.repairFn(current.properties)
          branchA.entities.set(op.entity, {
            ...current,
            properties: repaired,
            updatedAt: Date.now(),
          })
        }

        // BranchB: Keep the violation and explore
        branchB.entities.set(op.entity, current)

        this.trace.push({
          operator: op,
          before,
          after: current,
          timestamp: Date.now(),
          narrative: op.narrative || `🌀 ${op.entity} causes paradox - universe forks`,
        })

        const paradox: Paradox = {
          entity: op.entity,
          constraint: 'CEASE condition',
          violation: JSON.stringify(current.properties),
          timestamp: Date.now(),
        }

        return { forked: true, branches: [branchA, branchB], paradox }
      }

      default:
        return { forked: false, branches: [] }
    }
  }

  private executeTranscend(op: TranscendOp): {
    forked: boolean
    newReality: Reality
  } {
    const current = this.reality.entities.get(op.entity)
    if (!current) {
      return { forked: false, newReality: this.reality }
    }

    // Check transcendence condition
    const shouldTranscend = op.condition(current.properties)
    if (!shouldTranscend) {
      return { forked: false, newReality: this.reality }
    }

    // Create new universe
    const newReality: Reality = {
      universeId: op.portal,
      entities: new Map(),
      timestamp: Date.now(),
      parentUniverse: this.reality.universeId,
    }

    // Map entity to new universe
    const mapped = op.mapping ? op.mapping(current.properties) : current.properties
    newReality.entities.set(op.entity, {
      ...current,
      properties: mapped,
      universeId: op.portal,
      updatedAt: Date.now(),
    })

    // Remove from current universe
    this.reality.entities.delete(op.entity)

    this.trace.push({
      operator: op,
      before: current,
      after: null,
      timestamp: Date.now(),
      narrative: op.narrative || `🌀 ${op.entity} transcends to ${op.portal}`,
    })

    return { forked: true, newReality }
  }

  // ───────────────────────────────────────────────────────────
  // Universe Forking
  // ───────────────────────────────────────────────────────────

  private forkUniverse(suffix: string): Reality {
    const newUniverseId = `${this.reality.universeId}:${suffix}:${Date.now()}`
    
    return {
      universeId: newUniverseId,
      entities: new Map(this.reality.entities),
      timestamp: Date.now(),
      parentUniverse: this.reality.universeId,
    }
  }

  // ───────────────────────────────────────────────────────────
  // Subscriptions & Telemetry
  // ───────────────────────────────────────────────────────────

  /**
   * Subscribe to entity changes
   */
  subscribe(entityId: EntityId, callback: (state: EntityState) => void): () => void {
    if (!this.subscribers.has(entityId)) {
      this.subscribers.set(entityId, new Set())
    }
    this.subscribers.get(entityId)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.get(entityId)?.delete(callback)
    }
  }

  /**
   * Subscribe to telemetry
   */
  onTelemetry(callback: (trace: ExecutionStep[]) => void): () => void {
    this.telemetryHandlers.add(callback)
    return () => {
      this.telemetryHandlers.delete(callback)
    }
  }

  private notifySubscribers(entityId: EntityId, state: EntityState): void {
    const subs = this.subscribers.get(entityId)
    if (subs) {
      subs.forEach((cb) => cb(state))
    }
  }

  private emitTelemetry(): void {
    this.telemetryHandlers.forEach((cb) => cb([...this.trace]))
  }

  // ───────────────────────────────────────────────────────────
  // Queries
  // ───────────────────────────────────────────────────────────

  /**
   * Get current reality state
   */
  getReality(): Reality {
    return this.reality
  }

  /**
   * Get entity state
   */
  getEntity(entityId: EntityId): EntityState | undefined {
    return this.reality.entities.get(entityId)
  }

  /**
   * Get execution trace
   */
  getTrace(): ExecutionStep[] {
    return [...this.trace]
  }

  /**
   * Get all entities
   */
  getAllEntities(): EntityState[] {
    return Array.from(this.reality.entities.values())
  }
}

// ═══════════════════════════════════════════════════════════════
// Factory Function
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new Law Fabric Engine
 */
export function createFabric(universeId?: UniverseId): LawFabricEngine {
  return new LawFabricEngine(universeId)
}
