/**
 * Tests for causalStore.ts
 * 
 * Tests time travel, branching, merging, and causal store operations.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StoreFactory } from '../src/storeFactory.js'
import {
  createCausalStore,
  isCausalStore,
  type CausalStore,
} from '../src/temporal/causalStore.js'

describe('causalStore', () => {
  let factory: StoreFactory
  let baseStore: any
  let causalStore: CausalStore<{ value: number }>

  beforeEach(() => {
    factory = new StoreFactory()
    baseStore = factory.create('counter', { value: { value: 0 } })
    causalStore = createCausalStore(baseStore, 'counter', {
      initialUniverse: 'universe-main',
      observerId: 'test-user',
    })
  })

  describe('basic operations', () => {
    it('should maintain Store<T> interface', () => {
      expect(causalStore.get()).toEqual({ value: 0 })
      
      causalStore.set({ value: 5 })
      expect(causalStore.get()).toEqual({ value: 5 })
    })

    it('should record events on set', () => {
      causalStore.set({ value: 1 })
      causalStore.set({ value: 2 })
      causalStore.set({ value: 3 })

      expect(causalStore.history.length).toBeGreaterThanOrEqual(3)
    })

    it('should subscribe to changes', () => {
      let callCount = 0
      const unsubscribe = causalStore.subscribe(() => {
        callCount++
      })

      causalStore.set({ value: 1 })
      causalStore.set({ value: 2 })

      expect(callCount).toBe(2)
      unsubscribe()
    })

    it('should reset to initial value', () => {
      causalStore.set({ value: 100 })
      causalStore.reset()

      expect(causalStore.get()).toEqual({ value: 0 })
    })
  })

  describe('time travel', () => {
    it('should get state at timestamp', async () => {
      causalStore.set({ value: 1 })
      await sleep(10)
      
      const timestamp1 = Date.now()
      await sleep(10)
      
      causalStore.set({ value: 2 })
      await sleep(10)
      
      causalStore.set({ value: 3 })

      const stateAt1 = causalStore.at(timestamp1)
      expect(stateAt1?.value).toBe(1)
    })

    it('should get state at event', () => {
      causalStore.set({ value: 1 })
      const eventId = causalStore.history[causalStore.history.length - 1].id
      
      causalStore.set({ value: 2 })
      causalStore.set({ value: 3 })

      const stateAtEvent = causalStore.atEvent(eventId)
      expect(stateAtEvent?.value).toBe(1)
    })

    it('should query events in time range', async () => {
      const start = Date.now()
      
      causalStore.set({ value: 1 })
      await sleep(10)
      causalStore.set({ value: 2 })
      await sleep(10)
      const end = Date.now()
      
      causalStore.set({ value: 3 })

      const events = causalStore.between(start, end)
      expect(events.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('branching', () => {
    it('should create a branch', () => {
      causalStore.set({ value: 5 })
      
      const branchId = causalStore.branch('experiment')
      
      expect(branchId).toBeDefined()
      expect(branchId).toContain('experiment')
    })

    it('should switch between branches', () => {
      causalStore.set({ value: 10 })
      
      const branchId = causalStore.branch('experiment')
      causalStore.switchBranch(branchId)
      causalStore.set({ value: 100 })

      expect(causalStore.get().value).toBe(100)

      causalStore.switchBranch('universe-main')
      expect(causalStore.get().value).toBe(10)
    })

    it('should list all branches', () => {
      causalStore.branch('exp-1')
      causalStore.branch('exp-2')

      const branches = causalStore.listBranches()
      expect(branches.length).toBeGreaterThanOrEqual(3) // main + 2 experiments
    })

    it('should track branch metadata', () => {
      const branchId = causalStore.branch('test-branch')
      const branches = causalStore.listBranches()
      const branch = branches.find(b => b.id === branchId)

      expect(branch?.name).toBe('test-branch')
      expect(branch?.parentUniverse).toBe('universe-main')
      expect(branch?.forkPoint).toBeDefined()
    })
  })

  describe('merging', () => {
    it('should merge with "theirs" strategy', () => {
      causalStore.set({ value: 10 })
      
      const branchId = causalStore.branch('experiment')
      causalStore.switchBranch(branchId)
      causalStore.set({ value: 100 })

      causalStore.switchBranch('universe-main')
      const result = causalStore.merge(branchId, 'theirs')

      expect(result.success).toBe(true)
      expect(causalStore.get().value).toBe(100)
    })

    it('should merge with "ours" strategy', () => {
      causalStore.set({ value: 10 })
      
      const branchId = causalStore.branch('experiment')
      causalStore.switchBranch(branchId)
      causalStore.set({ value: 100 })

      causalStore.switchBranch('universe-main')
      const result = causalStore.merge(branchId, 'ours')

      expect(result.success).toBe(true)
      expect(causalStore.get().value).toBe(10)
    })

    it('should detect conflicts with "manual" strategy', () => {
      causalStore.set({ value: 10 })
      
      const branchId = causalStore.branch('experiment')
      causalStore.switchBranch(branchId)
      causalStore.set({ value: 100 })

      causalStore.switchBranch('universe-main')
      causalStore.set({ value: 20 })

      const result = causalStore.merge(branchId, 'manual')

      expect(result.success).toBe(false)
      expect(result.conflicts.length).toBeGreaterThan(0)
    })
  })

  describe('causality tracking', () => {
    it('should track caused-by relationships', () => {
      causalStore.set({ value: 1 })
      const event1Id = causalStore.getLastEventId()!
      
      causalStore.set({ value: 2 })
      causalStore.set({ value: 3 })

      const descendants = causalStore.causedBy(event1Id)
      expect(descendants.length).toBeGreaterThan(0)
    })

    it('should query events by observer', () => {
      causalStore.set({ value: 1 })
      causalStore.set({ value: 2 })

      const events = causalStore.query({
        observerIds: ['test-user'],
      })

      expect(events.length).toBeGreaterThan(0)
      expect(events.every(e => e.observerId === 'test-user')).toBe(true)
    })
  })

  describe('export/import', () => {
    it('should export history as JSON', () => {
      causalStore.set({ value: 1 })
      causalStore.set({ value: 2 })

      const exported = causalStore.exportHistory()
      expect(typeof exported).toBe('string')
      
      const parsed = JSON.parse(exported)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBeGreaterThan(0)
    })

    it('should import history from JSON', () => {
      causalStore.set({ value: 1 })
      causalStore.set({ value: 2 })

      const exported = causalStore.exportHistory()
      
      // Create new store and import
      const newStore = factory.create('counter2', { value: { value: 0 } })
      const newCausal = createCausalStore(newStore, 'counter2')
      newCausal.importHistory(exported)

      expect(newCausal.history.length).toBe(causalStore.history.length)
    })
  })

  describe('statistics', () => {
    it('should calculate stats', () => {
      causalStore.set({ value: 1 })
      causalStore.set({ value: 2 })
      causalStore.branch('exp')

      const stats = causalStore.getStats()
      
      expect(stats.totalEvents).toBeGreaterThan(0)
      expect(stats.universeCount).toBeGreaterThan(0)
    })
  })

  describe('type guard', () => {
    it('should identify causal stores', () => {
      expect(isCausalStore(causalStore)).toBe(true)
      expect(isCausalStore(baseStore)).toBe(false)
    })
  })
})

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
