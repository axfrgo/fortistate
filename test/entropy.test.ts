/**
 * Tests for entropy.ts
 * 
 * Tests entropy measurement, complexity analysis, and anomaly detection.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateShannonEntropy,
  calculateCausalComplexity,
  calculateDivergence,
  calculateConsistency,
  measureEntropy,
  detectAnomaly,
} from '../src/algebra/entropy.js'
import {
  createCausalEvent,
  buildCausalGraph,
  type CausalEvent,
} from '../src/temporal/causalEvent.js'

describe('entropy', () => {
  describe('calculateShannonEntropy', () => {
    it('should return 0 for uniform values', () => {
      const values = [1, 1, 1, 1, 1]
      const entropy = calculateShannonEntropy(values)
      expect(entropy).toBe(0)
    })

    it('should return positive entropy for varied values', () => {
      const values = [1, 2, 3, 4, 5]
      const entropy = calculateShannonEntropy(values)
      expect(entropy).toBeGreaterThan(0)
    })

    it('should return higher entropy for more varied values', () => {
      const low = calculateShannonEntropy([1, 1, 2, 2])
      const high = calculateShannonEntropy([1, 2, 3, 4])
      expect(high).toBeGreaterThan(low)
    })

    it('should handle empty array', () => {
      const entropy = calculateShannonEntropy([])
      expect(entropy).toBe(0)
    })
  })

  describe('calculateCausalComplexity', () => {
    it('should return 0 for empty graph', () => {
      const graph = buildCausalGraph([])
      const complexity = calculateCausalComplexity(graph)
      expect(complexity).toBe(0)
    })

    it('should return low complexity for linear chain', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'u1' })
      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'u1',
      })
      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e2.id],
        universeId: 'u1',
      })

      const graph = buildCausalGraph([e1, e2, e3])
      const complexity = calculateCausalComplexity(graph)
      
      expect(complexity).toBeGreaterThanOrEqual(0)
      expect(complexity).toBeLessThan(1)
    })

    it('should return higher complexity for branching', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'u1' })
      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'u1',
      })
      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e1.id],
        universeId: 'u1',
      })
      const e4 = createCausalEvent('store1', 'update', 4, {
        causedBy: [e1.id],
        universeId: 'u1',
      })

      const graph = buildCausalGraph([e1, e2, e3, e4])
      const complexity = calculateCausalComplexity(graph)
      
      expect(complexity).toBeGreaterThan(0)
    })
  })

  describe('calculateDivergence', () => {
    it('should return 0 for identical distributions', () => {
      const events1: CausalEvent<number>[] = [
        createCausalEvent('s1', 'create', 1, { universeId: 'u1' }),
        createCausalEvent('s1', 'update', 2, { universeId: 'u1' }),
      ]
      const events2: CausalEvent<number>[] = [
        createCausalEvent('s1', 'create', 1, { universeId: 'u2' }),
        createCausalEvent('s1', 'update', 2, { universeId: 'u2' }),
      ]

      const divergence = calculateDivergence(events1, events2)
      expect(divergence).toBe(0)
    })

    it('should return positive divergence for different distributions', () => {
      const events1: CausalEvent<number>[] = [
        createCausalEvent('s1', 'create', 1, { universeId: 'u1' }),
        createCausalEvent('s1', 'update', 1, { universeId: 'u1' }),
      ]
      const events2: CausalEvent<number>[] = [
        createCausalEvent('s1', 'create', 2, { universeId: 'u2' }),
        createCausalEvent('s1', 'update', 3, { universeId: 'u2' }),
      ]

      const divergence = calculateDivergence(events1, events2)
      expect(divergence).toBeGreaterThan(0)
    })
  })

  describe('calculateConsistency', () => {
    it('should return 1 when all constraints satisfied', () => {
      const events: CausalEvent<{ value: number }>[] = [
        createCausalEvent('s1', 'create', { value: 5 }, { universeId: 'u1' }),
        createCausalEvent('s1', 'update', { value: 10 }, { universeId: 'u1' }),
      ]

      const constraints = [
        (state: { value: number }) => state.value > 0,
        (state: { value: number }) => state.value < 100,
      ]

      const consistency = calculateConsistency(events, constraints)
      expect(consistency).toBe(1)
    })

    it('should return <1 when constraints violated', () => {
      const events: CausalEvent<{ value: number }>[] = [
        createCausalEvent('s1', 'create', { value: -5 }, { universeId: 'u1' }),
        createCausalEvent('s1', 'update', { value: 150 }, { universeId: 'u1' }),
      ]

      const constraints = [
        (state: { value: number }) => state.value > 0,
        (state: { value: number }) => state.value < 100,
      ]

      const consistency = calculateConsistency(events, constraints)
      expect(consistency).toBeLessThan(1)
    })
  })

  describe('measureEntropy', () => {
    it('should return comprehensive metrics', () => {
      const e1 = createCausalEvent('store1', 'create', 1, { universeId: 'u1' })
      const e2 = createCausalEvent('store1', 'update', 2, {
        causedBy: [e1.id],
        universeId: 'u1',
      })
      const e3 = createCausalEvent('store1', 'update', 3, {
        causedBy: [e2.id],
        universeId: 'u1',
      })

      const graph = buildCausalGraph([e1, e2, e3])
      const metrics = measureEntropy(graph)

      expect(metrics.shannon).toBeDefined()
      expect(metrics.causalComplexity).toBeDefined()
      expect(metrics.divergenceScore).toBeDefined()
      expect(metrics.consistencyIndex).toBeDefined()
      expect(metrics.metadata.uniqueStates).toBeGreaterThan(0)
    })

    it('should measure divergence with baseline', () => {
      const baseline: CausalEvent<number>[] = [
        createCausalEvent('s1', 'create', 1, { universeId: 'u1' }),
        createCausalEvent('s1', 'update', 2, { universeId: 'u1' }),
      ]

      const e1 = createCausalEvent('store1', 'create', 10, { universeId: 'u2' })
      const e2 = createCausalEvent('store1', 'update', 20, {
        causedBy: [e1.id],
        universeId: 'u2',
      })

      const graph = buildCausalGraph([e1, e2])
      const metrics = measureEntropy(graph, { baseline })

      expect(metrics.divergenceScore).toBeGreaterThan(0)
    })

    it('should measure consistency with constraints', () => {
      const e1 = createCausalEvent('store1', 'create', { value: 5 }, { universeId: 'u1' })
      const e2 = createCausalEvent('store1', 'update', { value: 10 }, {
        causedBy: [e1.id],
        universeId: 'u1',
      })

      const graph = buildCausalGraph([e1, e2])
      const constraints = [(state: any) => state.value > 0]
      const metrics = measureEntropy(graph, { constraints })

      expect(metrics.consistencyIndex).toBe(1)
    })
  })

  describe('detectAnomaly', () => {
    it('should detect no anomaly for similar entropy', () => {
      const baseline = {
        shannon: 1.0,
        causalComplexity: 0.3,
        divergenceScore: 0.1,
        consistencyIndex: 1.0,
        metadata: {
          uniqueStates: 5,
          avgBranchingFactor: 1.2,
          cyclomaticComplexity: 2,
        },
      }

      const current = {
        shannon: 1.1,
        causalComplexity: 0.35,
        divergenceScore: 0.15,
        consistencyIndex: 1.0,
        metadata: {
          uniqueStates: 6,
          avgBranchingFactor: 1.3,
          cyclomaticComplexity: 3,
        },
      }

      const isAnomaly = detectAnomaly(current, baseline)
      expect(isAnomaly).toBe(false)
    })

    it('should detect anomaly for high entropy spike', () => {
      const baseline = {
        shannon: 1.0,
        causalComplexity: 0.3,
        divergenceScore: 0.1,
        consistencyIndex: 1.0,
        metadata: {
          uniqueStates: 5,
          avgBranchingFactor: 1.2,
          cyclomaticComplexity: 2,
        },
      }

      const current = {
        shannon: 5.0, // 5x baseline
        causalComplexity: 0.3,
        divergenceScore: 0.1,
        consistencyIndex: 1.0,
        metadata: {
          uniqueStates: 20,
          avgBranchingFactor: 1.2,
          cyclomaticComplexity: 2,
        },
      }

      const isAnomaly = detectAnomaly(current, baseline)
      expect(isAnomaly).toBe(true)
    })

    it('should detect anomaly for high divergence', () => {
      const baseline = {
        shannon: 1.0,
        causalComplexity: 0.3,
        divergenceScore: 0.1,
        consistencyIndex: 1.0,
        metadata: {
          uniqueStates: 5,
          avgBranchingFactor: 1.2,
          cyclomaticComplexity: 2,
        },
      }

      const current = {
        shannon: 1.0,
        causalComplexity: 0.3,
        divergenceScore: 0.9, // High divergence
        consistencyIndex: 1.0,
        metadata: {
          uniqueStates: 5,
          avgBranchingFactor: 1.2,
          cyclomaticComplexity: 2,
        },
      }

      const isAnomaly = detectAnomaly(current, baseline)
      expect(isAnomaly).toBe(true)
    })
  })
})
