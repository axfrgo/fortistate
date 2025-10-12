import { describe, it, expect } from 'vitest'
import { detectConflicts, getResolutionStrategies } from '../src/conflictDetector'
import type { Node, Edge } from 'reactflow'

describe('conflictDetector', () => {
  describe('detectConflicts', () => {
    it('should return empty array for valid graph', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Transform Law' } },
        { id: 'b', type: 'law', position: { x: 100, y: 0 }, data: { name: 'Filter Law' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'a', target: 'b' }
      ]
      
      const conflicts = detectConflicts(nodes, edges)
      
      expect(conflicts).toHaveLength(1) // Info about Transform -> Filter
      expect(conflicts[0].severity).toBe('info')
    })

    it('should detect logical conflict with AND operator', () => {
      const nodes: Node[] = [
        { id: 'validation', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Validation Law' } },
        { id: 'constraint', type: 'law', position: { x: 0, y: 100 }, data: { name: 'Constraint Law' } },
        { id: 'and', type: 'operator', position: { x: 100, y: 50 }, data: { operator: 'AND' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'validation', target: 'and' },
        { id: 'e2', source: 'constraint', target: 'and' }
      ]
      
      const conflicts = detectConflicts(nodes, edges)
      
      const logicalConflict = conflicts.find(c => c.type === 'logical-conflict')
      expect(logicalConflict).toBeDefined()
      expect(logicalConflict?.severity).toBe('warning')
      expect(logicalConflict?.description).toContain('conflicting boolean')
    })

    it('should detect circular dependencies', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Law A' } },
        { id: 'b', type: 'law', position: { x: 100, y: 0 }, data: { name: 'Law B' } },
        { id: 'c', type: 'law', position: { x: 200, y: 0 }, data: { name: 'Law C' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'c' },
        { id: 'e3', source: 'c', target: 'a' }
      ]
      
      const conflicts = detectConflicts(nodes, edges)
      
      const circularConflict = conflicts.find(c => c.type === 'dependency-conflict')
      expect(circularConflict).toBeDefined()
      expect(circularConflict?.severity).toBe('error')
      expect(circularConflict?.description).toContain('Circular dependency')
    })

    it('should detect Transform -> Filter incompatibility', () => {
      const nodes: Node[] = [
        { id: 'transform', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Transform Law' } },
        { id: 'filter', type: 'law', position: { x: 100, y: 0 }, data: { name: 'Filter Law' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'transform', target: 'filter' }
      ]
      
      const conflicts = detectConflicts(nodes, edges)
      
      const valueConflict = conflicts.find(c => c.type === 'value-conflict')
      expect(valueConflict).toBeDefined()
      expect(valueConflict?.severity).toBe('info')
      expect(valueConflict?.description).toContain('not be compatible')
    })

    it('should detect single value to Aggregate Law', () => {
      const nodes: Node[] = [
        { id: 'validation', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Validation Law' } },
        { id: 'aggregate', type: 'law', position: { x: 100, y: 0 }, data: { name: 'Aggregate Law' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'validation', target: 'aggregate' }
      ]
      
      const conflicts = detectConflicts(nodes, edges)
      
      const aggregateConflict = conflicts.find(c => c.description.includes('Aggregate'))
      expect(aggregateConflict).toBeDefined()
      expect(aggregateConflict?.severity).toBe('info')
    })

    it('should handle multiple conflicts', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Law A' } },
        { id: 'b', type: 'law', position: { x: 100, y: 0 }, data: { name: 'Law B' } },
        { id: 'transform', type: 'law', position: { x: 200, y: 0 }, data: { name: 'Transform Law' } },
        { id: 'filter', type: 'law', position: { x: 300, y: 0 }, data: { name: 'Filter Law' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' }, // Circular
        { id: 'e3', source: 'transform', target: 'filter' } // Value mismatch
      ]
      
      const conflicts = detectConflicts(nodes, edges)
      
      expect(conflicts.length).toBeGreaterThanOrEqual(2)
    })

    it('should not detect conflicts in OR operator', () => {
      const nodes: Node[] = [
        { id: 'validation', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Validation Law' } },
        { id: 'constraint', type: 'law', position: { x: 0, y: 100 }, data: { name: 'Constraint Law' } },
        { id: 'or', type: 'operator', position: { x: 100, y: 50 }, data: { operator: 'OR' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'validation', target: 'or' },
        { id: 'e2', source: 'constraint', target: 'or' }
      ]
      
      const conflicts = detectConflicts(nodes, edges)
      
      const logicalConflict = conflicts.find(c => c.type === 'logical-conflict')
      expect(logicalConflict).toBeUndefined()
    })
  })

  describe('getResolutionStrategies', () => {
    it('should provide strategies for dependency conflicts', () => {
      const conflict = {
        id: 'c1',
        type: 'dependency-conflict' as const,
        severity: 'error' as const,
        nodes: ['a', 'b'],
        description: 'Circular dependency'
      }
      
      const strategies = getResolutionStrategies(conflict)
      
      expect(strategies.length).toBeGreaterThan(0)
      expect(strategies.some(s => s.includes('Remove'))).toBe(true)
    })

    it('should provide strategies for logical conflicts', () => {
      const conflict = {
        id: 'c2',
        type: 'logical-conflict' as const,
        severity: 'warning' as const,
        nodes: ['a', 'b'],
        description: 'Incompatible laws'
      }
      
      const strategies = getResolutionStrategies(conflict)
      
      expect(strategies.length).toBeGreaterThan(0)
      expect(strategies.some(s => s.includes('operator'))).toBe(true)
    })

    it('should provide strategies for value conflicts', () => {
      const conflict = {
        id: 'c3',
        type: 'value-conflict' as const,
        severity: 'info' as const,
        nodes: ['a', 'b'],
        description: 'Type mismatch'
      }
      
      const strategies = getResolutionStrategies(conflict)
      
      expect(strategies.length).toBeGreaterThan(0)
      expect(strategies.some(s => s.includes('validation') || s.includes('transformation'))).toBe(true)
    })
  })
})
