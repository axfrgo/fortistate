/**
 * Tests for causalEvent.ts
 * 
 * Tests event creation, causal graph building, queries, and graph algorithms.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateEventId,
  preciseTimestamp,
  createCausalEvent,
  buildCausalGraph,
  queryEvents,
  calculateCausalStats,
  findAncestors,
  findDescendants,
  findCommonAncestor,
  type CausalEvent,
  type CausalGraph,
} from '../src/temporal/causalEvent.js'

describe('causalEvent', () => {
  describe('generateEventId', () => {
    it('should generate valid UUID v4', () => {
      const id = generateEventId()
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should generate unique IDs', () => {
      const ids = new Set([
        generateEventId(),
        generateEventId(),
        generateEventId(),
      ])
      expect(ids.size).toBe(3)
    })
  })

  describe('preciseTimestamp', () => {
    it('should return a number', () => {
      const ts = preciseTimestamp()
      expect(typeof ts).toBe('number')
    })

    it('should be close to Date.now()', () => {
      const ts = preciseTimestamp()
      const now = Date.now()
      expect(Math.abs(ts - now)).toBeLessThan(1000)
    })

    it('should increase over time', async () => {
      const ts1 = preciseTimestamp()
      await new Promise(resolve => setTimeout(resolve, 10))
      const ts2 = preciseTimestamp()
      expect(ts2).toBeGreaterThan(ts1)
    })
  })

  describe('createCausalEvent', () => {
    it('should create a valid event', () => {
      const event = createCausalEvent('store1', 'create', { value: 42 }, {
        universeId: 'universe-main',
      })

      expect(event.id).toBeDefined()
      expect(event.timestamp).toBeGreaterThan(0)
      expect(event.storeKey).toBe('store1')
      expect(event.type).toBe('create')
      expect(event.value).toEqual({ value: 42 })
      expect(event.universeId).toBe('universe-main')
      expect(event.causedBy).toEqual([])
    })

    it('should include causedBy', () => {
      const parentId = generateEventId()
      const event = createCausalEvent('store1', 'update', { value: 100 }, {
        causedBy: [parentId],
        universeId: 'universe-main',
      })

      expect(event.causedBy).toEqual([parentId])
    })

    it('should include metadata', () => {
      const event = createCausalEvent('store1', 'update', { value: 100 }, {
        universeId: 'universe-main',
        metadata: { source: 'test', tags: ['important'] },
      })

      expect(event.metadata?.source).toBe('test')
      expect(event.metadata?.tags).toEqual(['important'])
    })
  })

  describe('buildCausalGraph', () => {
    let events: CausalEvent<any>[]
    let graph: CausalGraph

    beforeEach(() => {
      // Create a simple causal chain: e1 -> e2 -> e3
      const e1 = createCausalEvent('store1', 'create', 1, {
        universeId: 'universe-main',
      })

      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'universe-main',
      })

      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e2.id],
        universeId: 'universe-main',
      })

      events = [e1, e2, e3]
      graph = buildCausalGraph(events)
    })

    it('should index all events', () => {
      expect(graph.events.size).toBe(3)
      events.forEach(e => {
        expect(graph.events.has(e.id)).toBe(true)
      })
    })

    it('should build forward edges', () => {
      expect(graph.forward.get(events[0].id)?.has(events[1].id)).toBe(true)
      expect(graph.forward.get(events[1].id)?.has(events[2].id)).toBe(true)
    })

    it('should build backward edges', () => {
      expect(graph.backward.get(events[1].id)?.has(events[0].id)).toBe(true)
      expect(graph.backward.get(events[2].id)?.has(events[1].id)).toBe(true)
    })

    it('should track universe roots', () => {
      const roots = graph.universeRoots.get('universe-main')
      expect(roots?.has(events[0].id)).toBe(true)
      expect(roots?.size).toBe(1)
    })
  })

  describe('queryEvents', () => {
    let events: CausalEvent<any>[]
    let graph: CausalGraph

    beforeEach(() => {
      const baseTime = Date.now()
      
      events = [
        createCausalEvent('store1', 'create', 1, {
          universeId: 'universe-main',
          observerId: 'user-1',
          metadata: { tags: ['important'] },
        }),
        createCausalEvent('store1', 'update', 2, {
          universeId: 'universe-main',
          observerId: 'user-2',
          metadata: { tags: ['test'] },
        }),
        createCausalEvent('store1', 'update', 3, {
          universeId: 'universe-branch',
          observerId: 'user-1',
          metadata: { tags: ['important'] },
        }),
      ]

      // Manually set timestamps for testing
      events[0].timestamp = baseTime
      events[1].timestamp = baseTime + 1000
      events[2].timestamp = baseTime + 2000

      graph = buildCausalGraph(events)
    })

    it('should filter by universe', () => {
      const results = queryEvents(graph, {
        universeIds: ['universe-main'],
      })

      expect(results.length).toBe(2)
      expect(results.every(e => e.universeId === 'universe-main')).toBe(true)
    })

    it('should filter by observer', () => {
      const results = queryEvents(graph, {
        observerIds: ['user-1'],
      })

      expect(results.length).toBe(2)
      expect(results.every(e => e.observerId === 'user-1')).toBe(true)
    })

    it('should filter by time range', () => {
      const baseTime = events[0].timestamp
      const results = queryEvents(graph, {
        timeRange: [baseTime, baseTime + 1500],
      })

      expect(results.length).toBe(2)
    })

    it('should filter by type', () => {
      const results = queryEvents(graph, {
        types: ['update'],
      })

      expect(results.length).toBe(2)
      expect(results.every(e => e.type === 'update')).toBe(true)
    })

    it('should filter by tags', () => {
      const results = queryEvents(graph, {
        tags: ['important'],
      })

      expect(results.length).toBe(2)
    })

    it('should limit results', () => {
      const results = queryEvents(graph, {
        limit: 1,
      })

      expect(results.length).toBe(1)
    })

    it('should sort by timestamp descending', () => {
      const results = queryEvents(graph, {
        sortDirection: 'desc',
      })

      expect(results[0].timestamp).toBeGreaterThan(results[1].timestamp)
    })
  })

  describe('calculateCausalStats', () => {
    it('should calculate basic stats', () => {
      const events = [
        createCausalEvent('store1', 'create', 1, { universeId: 'universe-main' }),
        createCausalEvent('store1', 'update', 2, { universeId: 'universe-main' }),
        createCausalEvent('store1', 'update', 3, { universeId: 'universe-branch' }),
      ]

      const graph = buildCausalGraph(events)
      const stats = calculateCausalStats(graph)

      expect(stats.totalEvents).toBe(3)
      expect(stats.universeCount).toBe(2)
      expect(stats.eventsPerUniverse.get('universe-main')).toBe(2)
      expect(stats.eventsPerUniverse.get('universe-branch')).toBe(1)
    })

    it('should detect branch points', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'universe-main' })
      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'universe-main',
      })
      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e1.id],
        universeId: 'universe-main',
      })

      const graph = buildCausalGraph([e1, e2, e3])
      const stats = calculateCausalStats(graph)

      expect(stats.branchPoints).toBe(1)
    })
  })

  describe('findAncestors', () => {
    it('should find all ancestors', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'universe-main' })
      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'universe-main',
      })
      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e2.id],
        universeId: 'universe-main',
      })

      const graph = buildCausalGraph([e1, e2, e3])
      const ancestors = findAncestors(graph, e3.id)

      expect(ancestors.length).toBe(2)
      expect(ancestors.map(e => e.id)).toContain(e1.id)
      expect(ancestors.map(e => e.id)).toContain(e2.id)
    })

    it('should respect maxDepth', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'universe-main' })
      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'universe-main',
      })
      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e2.id],
        universeId: 'universe-main',
      })

      const graph = buildCausalGraph([e1, e2, e3])
      const ancestors = findAncestors(graph, e3.id, 1)

      expect(ancestors.length).toBe(1)
      expect(ancestors[0].id).toBe(e2.id)
    })
  })

  describe('findDescendants', () => {
    it('should find all descendants', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'universe-main' })
      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'universe-main',
      })
      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e2.id],
        universeId: 'universe-main',
      })

      const graph = buildCausalGraph([e1, e2, e3])
      const descendants = findDescendants(graph, e1.id)

      expect(descendants.length).toBe(2)
      expect(descendants.map(e => e.id)).toContain(e2.id)
      expect(descendants.map(e => e.id)).toContain(e3.id)
    })
  })

  describe('findCommonAncestor', () => {
    it('should find common ancestor', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'universe-main' })
      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'universe-main',
      })
      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e1.id],
        universeId: 'universe-main',
      })

      const graph = buildCausalGraph([e1, e2, e3])
      const common = findCommonAncestor(graph, e2.id, e3.id)

      expect(common).toBe(e1.id)
    })

    it('should return null if no common ancestor', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'universe-main' })
      const e2 = createCausalEvent('store1', 'create', 2, { universeId: 'universe-main' })

      const graph = buildCausalGraph([e1, e2])
      const common = findCommonAncestor(graph, e1.id, e2.id)

      expect(common).toBeNull()
    })
  })
})
