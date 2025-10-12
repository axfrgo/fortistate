import { useMemo } from 'react'
import { useStore, type Node, type Edge, type ReactFlowState } from 'reactflow'
import './AlgebraView.css'
import { useSettings } from '../settingsContext.tsx'

const FALLBACK_MESSAGE = '// No operators yet...\n// Drag operators from the sidebar!'

const selectNodes = (state: ReactFlowState): Node[] => state.getNodes()
const selectEdges = (state: ReactFlowState): Edge[] => state.edges

export default function AlgebraView() {
  const nodes = useStore(selectNodes)
  const edges = useStore(selectEdges)
  const { settings } = useSettings()

  const algebraCode = useMemo(
    () =>
      generateAlgebraCode(nodes, edges, {
        includeGraphSnapshot: settings.includeGraphSnapshot,
        showWarnings: settings.showAlgebraWarnings,
        showChronotopeTips: settings.showChronotopeTips,
      }),
    [nodes, edges, settings.includeGraphSnapshot, settings.showAlgebraWarnings, settings.showChronotopeTips],
  )
  const displayCode = algebraCode || FALLBACK_MESSAGE

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCode)
  }

  return (
    <div className="algebra-view">
      <div className="algebra-header">
        <span className="algebra-icon">⚡</span>
        <h3>Generated Algebra</h3>
        <button className="copy-btn" onClick={handleCopy}>
          📋 Copy
        </button>
      </div>
      <pre className="algebra-code">
        <code>{displayCode}</code>
      </pre>
    </div>
  )
}

interface AlgebraViewOptions {
  includeGraphSnapshot: boolean
  showWarnings: boolean
  showChronotopeTips: boolean
}

function generateAlgebraCode(nodes: Node[], edges: Edge[], options: AlgebraViewOptions): string {
  if (nodes.length === 0) {
    return ''
  }

  const sortedNodes = topologicalSortNodes(nodes, edges)
  const cycles = detectCycles(nodes, edges)
  const graphSnapshot = options.includeGraphSnapshot ? createGraphSnapshot(sortedNodes, edges) : null
  const executionOrder = sortedNodes.map((node) => node.id)
  const warnings = options.showWarnings ? collectGraphWarnings(sortedNodes, edges) : []

  const lines: string[] = []
  const indent = (level: number) => '  '.repeat(level)
  const push = (line = '', level = 0) => {
    lines.push(line ? `${indent(level)}${line}` : '')
  }
  const pushConstDeclaration = (identifier: string, literal: string, level: number) => {
    const literalLines = literal.split('\n')
    if (literalLines.length === 1) {
      push(`${identifier} = ${literalLines[0]} as const;`, level)
      push('', level)
      return
    }

    push(`${identifier} = ${literalLines[0]}`, level)
    for (let i = 1; i < literalLines.length - 1; i += 1) {
      push(literalLines[i], level)
    }
    push(`${literalLines[literalLines.length - 1]} as const;`, level)
    push('', level)
  }

  push(`// Graph summary: ${nodes.length} node${nodes.length === 1 ? '' : 's'}, ${edges.length} edge${edges.length === 1 ? '' : 's'}`)
  if (executionOrder.length > 0) {
    push(`// Execution order (topological): ${executionOrder.join(' → ')}`)
  }
  if (cycles.length === 0) {
    push('// No cycles detected ✅')
  } else {
    cycles.forEach((cycle: string[], index: number) => {
      push(`// ⚠️ Cycle ${index + 1}: ${cycle.join(' → ')}`)
    })
  }
  push('')

  if (options.showWarnings && warnings.length > 0) {
    push('// Graph warnings:')
    warnings.forEach((warning: string) => push(`// ⚠️ ${warning}`))
    push('')
  }

  push("import { BEGIN, BECOME, CEASE, TRANSCEND } from 'fortistate/ontogenesis'")
  push("import { createLawFabric } from 'fortistate/ontogenesis'")
  push('')
  push('// Generated automatically from Fortistate Visual Studio')
  push('function runFortistateGraph() {')
  push('const fabric = createLawFabric()', 1)
  push('const operators: any[] = []', 1)
  push('')

  if (graphSnapshot) {
    pushConstDeclaration('const graph', stringifyAsConst(graphSnapshot), 1)
  }
  pushConstDeclaration('const executionOrder', stringifyAsConst(executionOrder), 1)
  if (options.showChronotopeTips) {
    if (graphSnapshot) {
      push('// TIP: Sync graph to chronotope store or paradox detector as needed.', 1)
      push("// chronotopeStore.reconcileSnapshots([{ observer: chronotopeStore.getObserver('local'), state: graph }])", 1)
      push('// detectParadoxZones(graph, result) // integrate with ConflictInspector', 1)
    } else {
      push('// TIP: Enable graph snapshots in Settings to sync with chronotopeStore or paradox detectors.', 1)
    }
    push('')
  }

  sortedNodes.forEach((node) => {
    const data = (node.data ?? {}) as Record<string, unknown>
    const narrative = sanitizeHint((data.narrative as string) || defaultNarrative(node))
    if (narrative) {
      push(`// ${getOperatorEmoji(node.type)} ${narrative}`, 1)
    }

    switch (node.type) {
      case 'begin': {
        const entityLiteral = stringifyValue(data.entity, 'entity:unknown')
        const propsLiteral = formatObjectLiteral(data.properties)
        push(`operators.push(BEGIN(${entityLiteral}, ${propsLiteral}))`, 1)
        break
      }
      case 'become': {
        const entityLiteral = stringifyValue(data.entity, 'entity:unknown')
        const transformHint = sanitizeHint(data.transform) || 'define transform'
        const triggerHint = sanitizeHint(data.trigger)
        if (triggerHint) {
          push(`// Trigger hint: ${triggerHint}`, 1)
        }
        push(`operators.push(BECOME(${entityLiteral}, (state) => state /* TODO: ${transformHint} */))`, 1)
        break
      }
      case 'cease': {
        const entityLiteral = stringifyValue(data.entity, 'entity:unknown')
        const actionLiteral = stringifyValue(data.action, 'terminate')
        const conditionHint = sanitizeHint(data.condition) || 'define condition'
        push(`operators.push(CEASE(${entityLiteral}, () => false /* TODO: condition -> ${conditionHint} */, ${actionLiteral}))`, 1)
        break
      }
      case 'transcend': {
        const entityLiteral = stringifyValue(data.entity, 'entity:unknown')
        const portalLiteral = stringifyValue(data.portal, 'universe:unknown')
        const conditionHint = sanitizeHint(data.condition) || 'state => true'
        push(`operators.push(TRANSCEND(${entityLiteral}, ${portalLiteral}, () => true /* TODO: condition -> ${conditionHint} */))`, 1)
        break
      }
      case 'resolve': {
        const entityLiteral = stringifyValue(data.entity, 'entity:unknown')
        const strategy = sanitizeHint(data.strategy) || 'merge'
        const inbound = edges
          .filter((edge) => edge.target === node.id)
          .map((edge) => edge.source)
        if (inbound.length > 0) {
          push(`// Inputs: ${inbound.join(' → ')}`, 1)
        }
        push(`// TODO: Implement RESOLVE handler for ${entityLiteral} (strategy: ${strategy})`, 1)
        break
      }
      default: {
        push(`// Unsupported operator type: ${node.type}`, 1)
      }
    }

    push('', 1)
  })

  if (edges.length > 0) {
    push('// Graph connections', 1)
    edges.forEach((edge) => {
      push(`// ${edge.source} → ${edge.target}`, 1)
    })
    push('', 1)
  }

  push('fabric.addMany(operators)', 1)
  push('const result = fabric.execute()', 1)
  push("console.log('Narrative:', result.trace.map(step => step.narrative).join('\\n'))", 1)
  push("console.log('Reality entities:', Array.from(result.reality.entities.entries()))", 1)
  push("console.log('Execution order:', executionOrder.join(' → '))", 1)
  if (graphSnapshot) {
    push("console.table(graph.nodes.map(node => ({ id: node.id, type: node.type, entity: node.entity ?? '∅' })))", 1)
  } else {
    push("console.log('Enable graph snapshot in Settings to inspect node metadata tables.')", 1)
  }
  push('return result', 1)
  push('}')
  push('')
  push('runFortistateGraph()')

  return lines.join('\n')
}

function topologicalSortNodes(nodes: Node[], edges: Edge[]): Node[] {
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  nodes.forEach((node) => {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, [])
    }
    adjacency.get(edge.source)!.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  })

  const queue: Node[] = nodes.filter((node) => (inDegree.get(node.id) ?? 0) === 0)
  const sorted: Node[] = []
  const visited = new Set<string>()

  while (queue.length > 0) {
    const node = queue.shift()!
    if (visited.has(node.id)) continue

    visited.add(node.id)
    sorted.push(node)

    const neighbors = adjacency.get(node.id) ?? []
    neighbors.forEach((neighborId) => {
      const updatedDegree = (inDegree.get(neighborId) ?? 0) - 1
      inDegree.set(neighborId, updatedDegree)
      if (updatedDegree <= 0) {
        const neighborNode = nodes.find((n) => n.id === neighborId)
        if (neighborNode) {
          queue.push(neighborNode)
        }
      }
    })
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      sorted.push(node)
    }
  })

  return sorted
}

function getOperatorEmoji(type?: string): string {
  switch (type) {
    case 'begin':
      return '🌱'
    case 'become':
      return '🌊'
    case 'cease':
      return '🧱'
    case 'transcend':
      return '🌀'
    case 'resolve':
      return '🔄'
    default:
      return '•'
  }
}

function defaultNarrative(node: Node): string {
  const data = (node.data ?? {}) as Record<string, unknown>
  const entity = typeof data.entity === 'string' ? data.entity : node.id

  switch (node.type) {
    case 'begin':
      return `Seed ${entity}`
    case 'become':
      return `Transform ${entity}`
    case 'cease':
      return `Guard ${entity}`
    case 'transcend':
      return `Portal ${entity}`
    case 'resolve':
      return `Resolve conflicts for ${entity}`
    default:
      return node.id
  }
}

function sanitizeHint(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\*\//g, '*\\/')
    .trim()
}

function stringifyValue(value: unknown, fallback: string): string {
  const resolved = value === undefined || value === null ? fallback : value
  if (typeof resolved === 'string') {
    return JSON.stringify(resolved)
  }
  try {
    return JSON.stringify(resolved)
  } catch {
    return JSON.stringify(fallback)
  }
}

function formatObjectLiteral(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '{}'
  }

  try {
    return JSON.stringify(value, null, 2).replace(/\n\s*/g, ' ').trim()
  } catch {
    return '{}'
  }
}

function stringifyAsConst(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function createGraphSnapshot(nodes: Node[], edges: Edge[]): {
  nodes: Array<Record<string, unknown>>
  edges: Array<Record<string, unknown>>
} {
  return {
    nodes: nodes.map(snapshotNode),
    edges: edges.map(snapshotEdge),
  }
}

function snapshotNode(node: Node): Record<string, unknown> {
  const data = (node.data ?? {}) as Record<string, unknown>

  const snapshot: Record<string, unknown> = {
    id: node.id,
    type: node.type,
  }

  const interestingKeys: Array<keyof typeof data> = [
    'entity',
    'properties',
    'narrative',
    'transform',
    'trigger',
    'condition',
    'action',
    'portal',
    'strategy',
    'status',
    'conflictCount',
  ]

  interestingKeys.forEach((key) => {
    if (data[key] !== undefined) {
      snapshot[key] = data[key]
    }
  })

  if (node.position) {
    snapshot.position = node.position
  }

  return snapshot
}

function snapshotEdge(edge: Edge): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }

  const label = (edge as Record<string, unknown>).label
  if (typeof label === 'string') {
    snapshot.label = label
  }

  if (edge.sourceHandle) {
    snapshot.sourceHandle = edge.sourceHandle
  }
  if (edge.targetHandle) {
    snapshot.targetHandle = edge.targetHandle
  }

  return snapshot
}

function detectCycles(nodes: Node[], edges: Edge[]): string[][] {
  const adjacency = new Map<string, string[]>()

  nodes.forEach((node) => {
    adjacency.set(node.id, [])
  })

  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, [])
    }
    adjacency.get(edge.source)!.push(edge.target)
  })

  const visited = new Set<string>()
  const stack = new Set<string>()
  const recorded = new Set<string>()
  const cycles: string[][] = []

  const recordCycle = (cycle: string[]) => {
    if (cycle.length < 2) return
    const normalized = canonicalizeCycle(cycle)
    if (normalized && !recorded.has(normalized)) {
      recorded.add(normalized)
      cycles.push(cycle)
    }
  }

  const dfs = (nodeId: string, path: string[]) => {
    visited.add(nodeId)
    stack.add(nodeId)
    const nextPath = [...path, nodeId]
    const neighbors = adjacency.get(nodeId) ?? []

    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        dfs(neighbor, nextPath)
      } else if (stack.has(neighbor)) {
        const cycleStart = nextPath.indexOf(neighbor)
        const cyclePath = cycleStart >= 0 ? nextPath.slice(cycleStart) : [neighbor]
        cyclePath.push(neighbor)
        recordCycle(cyclePath)
      }
    })

    stack.delete(nodeId)
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      dfs(node.id, [])
    }
  })

  return cycles
}

function canonicalizeCycle(cycle: string[]): string {
  if (cycle.length < 2) return ''
  const loop = cycle.slice(0, -1)
  const rotations = loop.map((_, index) => {
    const rotated = loop.slice(index).concat(loop.slice(0, index))
    return rotated.join('→')
  })
  rotations.sort()
  return rotations[0] ?? ''
}

function collectGraphWarnings(nodes: Node[], edges: Edge[]): string[] {
  const inboundCounts = new Map<string, number>()
  const outboundCounts = new Map<string, number>()

  edges.forEach((edge) => {
    inboundCounts.set(edge.target, (inboundCounts.get(edge.target) ?? 0) + 1)
    outboundCounts.set(edge.source, (outboundCounts.get(edge.source) ?? 0) + 1)
  })

  const warnings: string[] = []

  nodes.forEach((node) => {
    const data = (node.data ?? {}) as Record<string, unknown>
    const entity = typeof data.entity === 'string' && data.entity.trim().length > 0 ? data.entity : null

    switch (node.type) {
      case 'begin':
        if (!entity) {
          warnings.push(`BEGIN node ${node.id} is missing an entity identifier.`)
        }
        if (typeof data.properties !== 'object' || data.properties === null) {
          warnings.push(`BEGIN node ${node.id} has no initial properties defined.`)
        }
        break
      case 'become':
        if (!entity) {
          warnings.push(`BECOME node ${node.id} is missing an entity identifier.`)
        }
        if (typeof data.transform !== 'string' || data.transform.trim().length === 0) {
          warnings.push(`BECOME node ${node.id} has no transform expression.`)
        }
        if ((inboundCounts.get(node.id) ?? 0) === 0) {
          warnings.push(`BECOME node ${node.id} has no incoming edges; it may never execute.`)
        }
        break
      case 'cease':
        if (!entity) {
          warnings.push(`CEASE node ${node.id} is missing an entity identifier.`)
        }
        if (typeof data.condition !== 'string' || data.condition.trim().length === 0) {
          warnings.push(`CEASE node ${node.id} has no condition expression.`)
        }
        break
      case 'transcend':
        if (!entity) {
          warnings.push(`TRANSCEND node ${node.id} is missing an entity identifier.`)
        }
        if (typeof data.portal !== 'string' || data.portal.trim().length === 0) {
          warnings.push(`TRANSCEND node ${node.id} has no destination portal.`)
        }
        break
      case 'resolve':
        if (!entity) {
          warnings.push(`RESOLVE node ${node.id} is missing an entity identifier.`)
        }
        if ((inboundCounts.get(node.id) ?? 0) < 2) {
          warnings.push(`RESOLVE node ${node.id} expects at least two inputs for conflict resolution.`)
        }
        break
      default:
        break
    }

    if ((outboundCounts.get(node.id) ?? 0) === 0 && ['begin', 'become', 'cease'].includes(node.type ?? '')) {
      warnings.push(`${(node.type ?? 'node').toUpperCase()} node ${node.id} has no outgoing edges; verify downstream flow.`)
    }
  })

  return warnings
}
