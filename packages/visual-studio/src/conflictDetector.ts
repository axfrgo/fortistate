/**
 * Conflict Detector - Identifies conflicts between laws in the graph
 * Uses Fortistate's conflict detection primitives
 */

import type { Node, Edge } from 'reactflow'
import { detectParadoxZones } from './incompleteness/paradoxDetector.ts'

export interface Conflict {
  id: string
  type: 'value-conflict' | 'dependency-conflict' | 'logical-conflict' | 'paradox-zone'
  severity: 'error' | 'warning' | 'info'
  nodes: string[]
  description: string
  suggestion?: string
}

/**
 * Detect conflicts in the graph
 */
export function detectConflicts(nodes: Node[], edges: Edge[]): Conflict[] {
  const conflicts: Conflict[] = []
  
  // Check for logical conflicts (AND with conflicting conditions)
  const andOperators = nodes.filter(n => n.type === 'operator' && n.data.operator === 'AND')
  andOperators.forEach(op => {
    const conflict = detectLogicalConflict(op, nodes, edges)
    if (conflict) conflicts.push(conflict)
  })
  
  // Check for circular dependencies
  const circular = detectCircularDependencies(nodes, edges)
  if (circular) conflicts.push(circular)
  
  // Check for incompatible law combinations
  const incompatible = detectIncompatibleLaws(nodes, edges)
  conflicts.push(...incompatible)

  // Experimental: bridge to paradox zones (vΩ⁺ alpha)
  const paradoxResult = detectParadoxZones({ nodes, edges })
  paradoxResult.zones.forEach(zone => {
    const severity: Conflict['severity'] =
      zone.severity === 'critical'
        ? 'error'
        : zone.severity === 'active'
          ? 'warning'
          : 'info'

    conflicts.push({
      id: `paradox-${zone.id}`,
      type: 'paradox-zone',
      severity,
      nodes: zone.involvedNodes,
      description: zone.description,
      suggestion: zone.hints?.join(' • '),
    })
  })
  
  return conflicts
}

function detectLogicalConflict(operatorNode: Node, nodes: Node[], edges: Edge[]): Conflict | null {
  const incomingEdges = edges.filter(e => e.target === operatorNode.id)
  const inputNodes = incomingEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean) as Node[]
  
  // Check if we have a Validation law and a Constraint law together
  const hasValidation = inputNodes.some(n => n.data.name === 'Validation Law')
  const hasConstraint = inputNodes.some(n => n.data.name === 'Constraint Law')
  
  if (hasValidation && hasConstraint && inputNodes.length === 2) {
    return {
      id: `conflict-${operatorNode.id}`,
      type: 'logical-conflict',
      severity: 'warning',
      nodes: [operatorNode.id, ...inputNodes.map(n => n.id)],
      description: 'Validation and Constraint laws may produce conflicting boolean results',
      suggestion: 'Consider using OR operator instead, or add Transform law to normalize outputs'
    }
  }
  
  return null
}

function detectCircularDependencies(nodes: Node[], edges: Edge[]): Conflict | null {
  // No edges = no cycles possible
  if (edges.length === 0) {
    console.log('🔍 No edges found, skipping circular dependency check')
    return null
  }
  
  console.log('🔍 Checking for circular dependencies with', edges.length, 'edges')
  
  const adjacency = new Map<string, string[]>()
  
  // Build adjacency list
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, [])
    }
    adjacency.get(edge.source)!.push(edge.target)
  }
  
  console.log('🔍 Adjacency map:', Array.from(adjacency.entries()).map(([k, v]) => `${k}->[${v.join(',')}]`).join(', '))
  
  // DFS to detect cycles - need fresh visited/stack for each starting node
  function hasCycle(nodeId: string): string[] | null {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []
    
    function dfs(current: string): string[] | null {
      if (recursionStack.has(current)) {
        // Found cycle - return the cycle path
        const cycleStart = path.indexOf(current)
        return path.slice(cycleStart).concat(current)
      }
      if (visited.has(current)) {
        return null
      }
      
      visited.add(current)
      recursionStack.add(current)
      path.push(current)
      
      const neighbors = adjacency.get(current) || []
      for (const neighbor of neighbors) {
        const cycle = dfs(neighbor)
        if (cycle) return cycle
      }
      
      recursionStack.delete(current)
      path.pop()
      return null
    }
    
    return dfs(nodeId)
  }
  
  // Check each node as potential start of cycle
  for (const node of nodes) {
    const cycle = hasCycle(node.id)
    if (cycle) {
      console.log('🔴 CYCLE DETECTED:', cycle.join(' → '))
      return {
        id: 'conflict-circular',
        type: 'dependency-conflict',
        severity: 'error',
        nodes: cycle,
        description: 'Circular dependency detected in the graph',
        suggestion: 'Remove one of the edges to break the cycle'
      }
    }
  }
  
  console.log('✅ No circular dependencies found')
  return null
}

function detectIncompatibleLaws(nodes: Node[], edges: Edge[]): Conflict[] {
  const conflicts: Conflict[] = []
  
  // Check for Transform -> Filter with no compatibility check
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.source)
    const target = nodes.find(n => n.id === edge.target)
    
    if (source?.data.name === 'Transform Law' && target?.data.name === 'Filter Law') {
      conflicts.push({
        id: `conflict-${edge.id}`,
        type: 'value-conflict',
        severity: 'info',
        nodes: [source.id, target.id],
        description: 'Transform Law outputs may not be compatible with Filter Law expectations',
        suggestion: 'Ensure Transform output is numeric for Filter to work correctly'
      })
    }
    
    // Check for Aggregate without array input
    if (target?.data.name === 'Aggregate Law' && source?.type === 'law') {
      conflicts.push({
        id: `conflict-agg-${edge.id}`,
        type: 'value-conflict',
        severity: 'info',
        nodes: [source.id, target.id],
        description: 'Aggregate Law expects array input but may receive single value',
        suggestion: 'Use Parallel operator to collect multiple values into an array'
      })
    }
  }
  
  return conflicts
}

/**
 * Get resolution strategies for a conflict
 */
export function getResolutionStrategies(conflict: Conflict): string[] {
  switch (conflict.type) {
    case 'dependency-conflict':
      return [
        'Remove circular edge',
        'Add intermediate node to break cycle',
        'Restructure graph topology'
      ]
    case 'logical-conflict':
      return [
        'Change operator from AND to OR',
        'Add Transform law to normalize outputs',
        'Remove one of the conflicting laws'
      ]
    case 'value-conflict':
      return [
        'Add validation/transformation layer',
        'Ensure data type compatibility',
        'Document expected input/output formats'
      ]
    default:
      return ['Manual resolution required']
  }
}
