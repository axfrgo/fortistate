/**
 * Execution Engine - Connects Visual Studio canvas to Fortistate possibility engine
 * Executes laws and meta-laws from the graph visualization
 */

import { defineLaw } from '@fortistate/possibility'
import type { Node, Edge } from 'reactflow'

export interface ExecutionResult {
  nodeId: string
  success: boolean
  value?: any
  error?: string
  duration: number
  timestamp: number
}

export interface ExecutionState {
  isRunning: boolean
  currentNodeId: string | null
  results: Map<string, ExecutionResult>
  executionOrder: string[]
}

/**
 * Sample law implementations for demo
 */
export const sampleLaws = {
  'Validation Law': defineLaw({
    name: 'validation-law',
    inputs: ['input'],
    output: 'result',
    enforce: (input: any) => {
      return input !== undefined && input !== null
    }
  }),

  'Transform Law': defineLaw({
    name: 'transform-law',
    inputs: ['input'],
    output: 'result',
    enforce: (input: any) => {
      if (typeof input === 'number') {
        return input * 2
      }
      return String(input).toUpperCase()
    }
  }),

  'Filter Law': defineLaw({
    name: 'filter-law',
    inputs: ['input'],
    output: 'result',
    enforce: (input: any) => {
      return typeof input === 'number' && input > 0
    }
  }),

  'Aggregate Law': defineLaw({
    name: 'aggregate-law',
    inputs: ['input'],
    output: 'result',
    enforce: (input: any) => {
      if (Array.isArray(input)) {
        return input.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)
      }
      return typeof input === 'number' ? input : 0
    }
  }),

  'Constraint Law': defineLaw({
    name: 'constraint-law',
    inputs: ['input'],
    output: 'result',
    enforce: (input: any) => {
      return typeof input === 'number' && input >= 0 && input <= 100
    }
  }),
}

/**
 * Execute a single law node
 */
export async function executeLaw(
  node: Node,
  input: any
): Promise<ExecutionResult> {
  const startTime = performance.now()
  
  try {
    const lawName = node.data.name as string
    const law = sampleLaws[lawName as keyof typeof sampleLaws]
    
    if (!law) {
      throw new Error(`Law not found: ${lawName}`)
    }

    const result = law.execute(input)
    const duration = performance.now() - startTime

    return {
      nodeId: node.id,
      success: result.success,
      value: result.value,
      error: result.error,
      duration,
      timestamp: Date.now(),
    }
  } catch (error) {
    const duration = performance.now() - startTime
    return {
      nodeId: node.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: Date.now(),
    }
  }
}

/**
 * Execute a meta-law (operator composition)
 */
export async function executeMetaLaw(
  operatorNode: Node,
  inputNodes: Node[],
  _edges: Edge[]
): Promise<ExecutionResult> {
  const startTime = performance.now()
  
  try {
    const operator = operatorNode.data.operator as string
    
    // For now, simulate meta-law execution
    // TODO: Actually compose laws using defineMetaLaw
    
    let result: any
    
    switch (operator) {
      case 'AND':
        // All inputs must be true
        result = inputNodes.every(n => n.data.lastResult === true)
        break
      case 'OR':
        // At least one input must be true
        result = inputNodes.some(n => n.data.lastResult === true)
        break
      case 'IMPLIES':
        // If first is true, second must be true
        result = !inputNodes[0]?.data.lastResult || inputNodes[1]?.data.lastResult
        break
      case 'SEQUENCE':
        // Execute in order, thread output to input
        result = inputNodes[inputNodes.length - 1]?.data.lastResult
        break
      case 'PARALLEL':
        // Execute all in parallel, return array
        result = inputNodes.map(n => n.data.lastResult)
        break
      default:
        result = null
    }

    const duration = performance.now() - startTime

    return {
      nodeId: operatorNode.id,
      success: true,
      value: result,
      duration,
      timestamp: Date.now(),
    }
  } catch (error) {
    const duration = performance.now() - startTime
    return {
      nodeId: operatorNode.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: Date.now(),
    }
  }
}

/**
 * Build execution order from graph using topological sort
 */
export function buildExecutionOrder(nodes: Node[], edges: Edge[]): string[] {
  const order: string[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  // Build adjacency list
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, [])
    }
    adjacency.get(edge.source)!.push(edge.target)
  }

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return
    if (visiting.has(nodeId)) {
      throw new Error('Circular dependency detected in graph')
    }

    visiting.add(nodeId)
    const neighbors = adjacency.get(nodeId) || []
    for (const neighbor of neighbors) {
      visit(neighbor)
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
    order.unshift(nodeId) // Add to front for reverse order
  }

  // Find root nodes (no incoming edges)
  const hasIncoming = new Set(edges.map(e => e.target))
  const roots = nodes.filter(n => !hasIncoming.has(n.id))

  for (const root of roots) {
    visit(root.id)
  }

  return order
}

/**
 * Execute the entire graph
 */
export async function executeGraph(
  nodes: Node[],
  edges: Edge[],
  initialInput: any = { value: 42 }, // Default test input
  onProgress?: (nodeId: string, result: ExecutionResult) => void
): Promise<Map<string, ExecutionResult>> {
  const results = new Map<string, ExecutionResult>()
  
  try {
    const executionOrder = buildExecutionOrder(nodes, edges)
    
    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId)
      if (!node) continue

      // Get input from previous node or use initial input
      const incomingEdges = edges.filter(e => e.target === nodeId)
      const input = incomingEdges.length > 0
        ? results.get(incomingEdges[0].source)?.value
        : initialInput

      // Execute based on node type
      let result: ExecutionResult
      if (node.type === 'law') {
        result = await executeLaw(node, input)
      } else if (node.type === 'operator') {
        const inputNodes = incomingEdges.map(e => nodes.find(n => n.id === e.source)!).filter(Boolean)
        result = await executeMetaLaw(node, inputNodes, edges)
      } else {
        continue
      }

      results.set(nodeId, result)
      
      // Notify progress callback
      if (onProgress) {
        onProgress(nodeId, result)
      }

      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  } catch (error) {
    console.error('Graph execution failed:', error)
  }

  return results
}
