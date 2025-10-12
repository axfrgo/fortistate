/**
 * Chronotope Store — observer-relative timeline scaffolding for Fortistate vΩ⁺.
 *
 * This module will back Computational Relativity by allowing observers to own
 * localized causality, truth surfaces, and reconciliation semantics.
 */

export type ObserverId = string

export interface ChronotopeFrame {
  /** ISO timestamp or logical clock anchor */
  origin: string
  /** Optional velocity / dilation factor relative to the global frame */
  dilation?: number
  /** Arbitrary metadata the reconciliation engine can use */
  metadata?: Record<string, unknown>
}

export interface ObserverDefinition {
  id: ObserverId
  frame: ChronotopeFrame
  tags?: string[]
}

export interface ChronotopeSnapshot<TState = unknown> {
  observer: ObserverDefinition
  state: TState
  /** Ordered list of events as perceived inside this chronotope */
  timeline: Array<{ id: string; at: string; payload: unknown }>
}

export class ChronotopeStore {
  private observers = new Map<ObserverId, ObserverDefinition>()

  registerObserver(definition: ObserverDefinition): void {
    this.observers.set(definition.id, definition)
  }

  getObserver(id: ObserverId): ObserverDefinition | undefined {
    return this.observers.get(id)
  }

  listObservers(): ObserverDefinition[] {
    return Array.from(this.observers.values())
  }

  // Placeholder: eventually reconcile snapshots between observers.
  reconcileSnapshots<TState>(
    _snapshots: ChronotopeSnapshot<TState>[]
  ): ChronotopeSnapshot<TState> | null {
    // TODO: Implement chronotope reconciliation rules.
    return null
  }
}

export const chronotopeStore = new ChronotopeStore()
