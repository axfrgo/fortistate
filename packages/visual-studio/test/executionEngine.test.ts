import { describe, it, expect, vi } from 'vitest'
import { executeLaw, buildExecutionOrder, executeGraph, sampleLaws } from '../src/executionEngine'
import type { Node, Edge } from 'reactflow'

describe('executionEngine', () => {
  describe('executeLaw', () => {
    it('should execute Validation Law successfully', async () => {
      const node: Node = {
        id: 'node-1',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Validation Law' }
      }
      
      const result = await executeLaw(node, { value: 42 })
      
      expect(result.success).toBe(true)
      expect(result.nodeId).toBe('node-1')
      expect(result.value).toBe(true)
      expect(result.duration).toBeGreaterThan(0)
    })

    it('should detect null input in Validation Law', async () => {
      const node: Node = {
        id: 'node-1',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Validation Law' }
      }
      
      const result = await executeLaw(node, null)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })

    it('should transform numbers in Transform Law', async () => {
      const node: Node = {
        id: 'node-2',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Transform Law' }
      }
      
      const result = await executeLaw(node, 21)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(42)
    })

    it('should transform strings in Transform Law', async () => {
      const node: Node = {
        id: 'node-2',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Transform Law' }
      }
      
      const result = await executeLaw(node, 'hello')
      
      expect(result.success).toBe(true)
      expect(result.value).toBe('HELLO')
    })

    it('should filter positive numbers in Filter Law', async () => {
      const node: Node = {
        id: 'node-3',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Filter Law' }
      }
      
      const result = await executeLaw(node, 42)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })

    it('should reject negative numbers in Filter Law', async () => {
      const node: Node = {
        id: 'node-3',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Filter Law' }
      }
      
      const result = await executeLaw(node, -5)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })

    it('should aggregate arrays in Aggregate Law', async () => {
      const node: Node = {
        id: 'node-4',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Aggregate Law' }
      }
      
      const result = await executeLaw(node, [1, 2, 3, 4])
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(10)
    })

    it('should enforce constraints in Constraint Law', async () => {
      const node: Node = {
        id: 'node-5',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Constraint Law' }
      }
      
      const result = await executeLaw(node, 50)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })

    it('should detect constraint violations', async () => {
      const node: Node = {
        id: 'node-5',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Constraint Law' }
      }
      
      const result = await executeLaw(node, 150)
      
      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })

    it('should handle unknown law gracefully', async () => {
      const node: Node = {
        id: 'node-x',
        type: 'law',
        position: { x: 0, y: 0 },
        data: { name: 'Unknown Law' }
      }
      
      const result = await executeLaw(node, 42)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Law not found')
    })
  })

  describe('buildExecutionOrder', () => {
    it('should build simple linear execution order', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'law', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'law', position: { x: 100, y: 0 }, data: {} },
        { id: 'c', type: 'law', position: { x: 200, y: 0 }, data: {} }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'c' }
      ]
      
      const order = buildExecutionOrder(nodes, edges)
      
      expect(order).toEqual(['a', 'b', 'c'])
    })

    it('should handle parallel branches', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'law', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'law', position: { x: 100, y: 0 }, data: {} },
        { id: 'c', type: 'law', position: { x: 100, y: 100 }, data: {} },
        { id: 'd', type: 'law', position: { x: 200, y: 50 }, data: {} }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'a', target: 'c' },
        { id: 'e3', source: 'b', target: 'd' },
        { id: 'e4', source: 'c', target: 'd' }
      ]
      
      const order = buildExecutionOrder(nodes, edges)
      
      expect(order[0]).toBe('a')
      expect(order[3]).toBe('d')
      expect(order).toContain('b')
      expect(order).toContain('c')
    })

    it('should handle disconnected nodes', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'law', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'law', position: { x: 100, y: 0 }, data: {} },
        { id: 'c', type: 'law', position: { x: 200, y: 0 }, data: {} }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'a', target: 'b' }
      ]
      
      const order = buildExecutionOrder(nodes, edges)
      
      expect(order).toHaveLength(3)
      expect(order).toContain('a')
      expect(order).toContain('b')
      expect(order).toContain('c')
    })
  })

  describe('executeGraph', () => {
    it('should execute simple pipeline', async () => {
      const nodes: Node[] = [
        { id: 'validate', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Validation Law' } },
        { id: 'transform', type: 'law', position: { x: 100, y: 0 }, data: { name: 'Transform Law' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'validate', target: 'transform' }
      ]
      
      const progressCallback = vi.fn()
      const completeCallback = vi.fn()
      
      await executeGraph(nodes, edges, { value: 21 }, (nodeId, result) => {
        progressCallback(nodeId, result)
      })
      
      expect(progressCallback).toHaveBeenCalledTimes(2)
    })

    it('should pass data between nodes', async () => {
      const nodes: Node[] = [
        { id: 'transform', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Transform Law' } },
        { id: 'filter', type: 'law', position: { x: 100, y: 0 }, data: { name: 'Filter Law' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'transform', target: 'filter' }
      ]
      
      let filterInput: any
      await executeGraph(nodes, edges, 21, (nodeId, result) => {
        if (nodeId === 'filter') {
          filterInput = result.value
        }
      })
      
      expect(filterInput).toBe(true) // 21 * 2 = 42, which is > 0
    })
  })
})
