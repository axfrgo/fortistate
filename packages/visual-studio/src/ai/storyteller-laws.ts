/**
 * Ontogenetic Laws for Storyteller
 * 
 * Defines the invariants, constraints, and quality rules that all generated
 * universe pipelines must satisfy. These laws ensure that Storyteller outputs
 * are structurally sound, semantically valid, and operationally robust.
 */

import type { Node } from 'reactflow'
import type { StorytellerOutput } from './agentTypes'

// ============================================================================
// LAW TYPES
// ============================================================================

export type LawCategory = 'structural' | 'semantic' | 'ontogenetic' | 'operational' | 'quality'
export type LawSeverity = 'critical' | 'error' | 'warning' | 'info'

export interface OntogeneticLaw {
  id: string
  category: LawCategory
  severity: LawSeverity
  description: string
  invariant: string
  validate: (pipeline: StorytellerOutput['pipeline']) => LawViolation[]
}

export interface LawViolation {
  lawId: string
  severity: LawSeverity
  message: string
  nodeId?: string
  edgeId?: string
  suggestion?: string
}

export interface ValidationReport {
  passed: boolean
  score: number // 0-100
  violations: LawViolation[]
  warnings: string[]
  metrics: {
    totalLaws: number
    passed: number
    failed: number
    criticalViolations: number
    errorViolations: number
    warningViolations: number
  }
}

// ============================================================================
// ONTOGENETIC LAWS REGISTRY
// ============================================================================

export const STORYTELLER_LAWS: OntogeneticLaw[] = [
  // ========================================================================
  // STRUCTURAL LAWS - Pipeline structure and topology
  // ========================================================================
  {
    id: 'STR-001',
    category: 'structural',
    severity: 'critical',
    description: 'Every pipeline must have at least one BEGIN node',
    invariant: 'exists(node.type === "begin")',
    validate: (pipeline) => {
      const beginNodes = pipeline.nodes.filter(n => n.type === 'begin')
      if (beginNodes.length === 0) {
        return [{
          lawId: 'STR-001',
          severity: 'critical',
          message: 'Pipeline must start with at least one BEGIN node',
          suggestion: 'Add a BEGIN node to initialize the workflow state',
        }]
      }
      return []
    },
  },
  
  {
    id: 'STR-002',
    category: 'structural',
    severity: 'error',
    description: 'BEGIN nodes should not have incoming edges',
    invariant: 'forall(node.type === "begin" => inDegree(node) === 0)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const beginNodes = pipeline.nodes.filter(n => n.type === 'begin')
      
      beginNodes.forEach(node => {
        const incomingEdges = pipeline.edges.filter(e => e.target === node.id)
        if (incomingEdges.length > 0) {
          violations.push({
            lawId: 'STR-002',
            severity: 'error',
            message: `BEGIN node "${node.id}" has ${incomingEdges.length} incoming edge(s)`,
            nodeId: node.id,
            suggestion: 'BEGIN nodes should be workflow entry points with no incoming edges',
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'STR-003',
    category: 'structural',
    severity: 'warning',
    description: 'All non-BEGIN nodes should be reachable from a BEGIN node',
    invariant: 'forall(node => node.type === "begin" || reachableFrom(node, beginNode))',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const beginNodes = pipeline.nodes.filter(n => n.type === 'begin')
      
      if (beginNodes.length === 0) return []
      
      // Build adjacency map
      const adjacency = new Map<string, string[]>()
      pipeline.edges.forEach(edge => {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
        adjacency.get(edge.source)!.push(edge.target)
      })
      
      // Find reachable nodes via BFS
      const reachable = new Set<string>()
      const queue = beginNodes.map(n => n.id)
      
      while (queue.length > 0) {
        const nodeId = queue.shift()!
        if (reachable.has(nodeId)) continue
        reachable.add(nodeId)
        
        const neighbors = adjacency.get(nodeId) || []
        queue.push(...neighbors)
      }
      
      // Check for unreachable nodes
      pipeline.nodes.forEach(node => {
        if (node.type !== 'begin' && !reachable.has(node.id)) {
          violations.push({
            lawId: 'STR-003',
            severity: 'warning',
            message: `Node "${node.id}" is not reachable from any BEGIN node`,
            nodeId: node.id,
            suggestion: 'Connect this node to the workflow or remove it',
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'STR-004',
    category: 'structural',
    severity: 'error',
    description: 'Every edge must reference existing source and target nodes',
    invariant: 'forall(edge => exists(node.id === edge.source) && exists(node.id === edge.target))',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const nodeIds = new Set(pipeline.nodes.map(n => n.id))
      
      pipeline.edges.forEach(edge => {
        if (!nodeIds.has(edge.source)) {
          violations.push({
            lawId: 'STR-004',
            severity: 'error',
            message: `Edge "${edge.id}" references non-existent source node "${edge.source}"`,
            edgeId: edge.id,
            suggestion: 'Remove this edge or add the missing source node',
          })
        }
        
        if (!nodeIds.has(edge.target)) {
          violations.push({
            lawId: 'STR-004',
            severity: 'error',
            message: `Edge "${edge.id}" references non-existent target node "${edge.target}"`,
            edgeId: edge.id,
            suggestion: 'Remove this edge or add the missing target node',
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'STR-005',
    category: 'structural',
    severity: 'warning',
    description: 'Pipeline should not contain cycles (directed acyclic graph preferred)',
    invariant: 'isCyclic(pipeline) === false',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      
      // Build adjacency map
      const adjacency = new Map<string, string[]>()
      pipeline.edges.forEach(edge => {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
        adjacency.get(edge.source)!.push(edge.target)
      })
      
      // DFS cycle detection
      const visited = new Set<string>()
      const recursionStack = new Set<string>()
      
      const hasCycle = (nodeId: string): boolean => {
        visited.add(nodeId)
        recursionStack.add(nodeId)
        
        const neighbors = adjacency.get(nodeId) || []
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            if (hasCycle(neighbor)) return true
          } else if (recursionStack.has(neighbor)) {
            return true
          }
        }
        
        recursionStack.delete(nodeId)
        return false
      }
      
      for (const node of pipeline.nodes) {
        if (!visited.has(node.id)) {
          if (hasCycle(node.id)) {
            violations.push({
              lawId: 'STR-005',
              severity: 'warning',
              message: 'Pipeline contains cycles (circular dependencies detected)',
              suggestion: 'Consider restructuring to create a directed acyclic graph',
            })
            break
          }
        }
      }
      
      return violations
    },
  },
  
  // ========================================================================
  // SEMANTIC LAWS - Meaning and data validity
  // ========================================================================
  {
    id: 'SEM-001',
    category: 'semantic',
    severity: 'error',
    description: 'All ontogenetic nodes must have an entity identifier',
    invariant: 'forall(node in [begin, become, cease, transcend] => node.data.entity !== null)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const ontogeneticTypes = ['begin', 'become', 'cease', 'transcend']
      
      pipeline.nodes.forEach(node => {
        if (ontogeneticTypes.includes(node.type || '') && !node.data?.entity) {
          violations.push({
            lawId: 'SEM-001',
            severity: 'error',
            message: `${node.type?.toUpperCase()} node "${node.id}" missing entity identifier`,
            nodeId: node.id,
            suggestion: `Add an entity field like: { entity: "user", ... }`,
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'SEM-002',
    category: 'semantic',
    severity: 'error',
    description: 'BEGIN nodes must initialize properties',
    invariant: 'forall(node.type === "begin" => node.data.properties !== null)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const beginNodes = pipeline.nodes.filter(n => n.type === 'begin')
      
      beginNodes.forEach(node => {
        if (!node.data?.properties || Object.keys(node.data.properties).length === 0) {
          violations.push({
            lawId: 'SEM-002',
            severity: 'error',
            message: `BEGIN node "${node.id}" has no initial properties`,
            nodeId: node.id,
            suggestion: 'Initialize state with properties like: { properties: { status: "active", ... } }',
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'SEM-003',
    category: 'semantic',
    severity: 'error',
    description: 'BECOME nodes must define transformation logic',
    invariant: 'forall(node.type === "become" => node.data.transform !== null)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const becomeNodes = pipeline.nodes.filter(n => n.type === 'become')
      
      becomeNodes.forEach(node => {
        if (!node.data?.transform) {
          violations.push({
            lawId: 'SEM-003',
            severity: 'error',
            message: `BECOME node "${node.id}" missing transformation logic`,
            nodeId: node.id,
            suggestion: 'Add transformation like: { transform: "balance + amount", ... }',
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'SEM-004',
    category: 'semantic',
    severity: 'error',
    description: 'CEASE nodes must define termination condition',
    invariant: 'forall(node.type === "cease" => node.data.condition !== null)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const ceaseNodes = pipeline.nodes.filter(n => n.type === 'cease')
      
      ceaseNodes.forEach(node => {
        if (!node.data?.condition) {
          violations.push({
            lawId: 'SEM-004',
            severity: 'error',
            message: `CEASE node "${node.id}" missing termination condition`,
            nodeId: node.id,
            suggestion: 'Add condition like: { condition: "balance < 0 || expired", ... }',
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'SEM-005',
    category: 'semantic',
    severity: 'warning',
    description: 'Node positions should not overlap',
    invariant: 'forall(n1, n2 => n1 !== n2 => distance(n1.position, n2.position) > threshold)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const OVERLAP_THRESHOLD = 50 // pixels
      
      for (let i = 0; i < pipeline.nodes.length; i++) {
        for (let j = i + 1; j < pipeline.nodes.length; j++) {
          const n1 = pipeline.nodes[i]
          const n2 = pipeline.nodes[j]
          
          const dx = n1.position.x - n2.position.x
          const dy = n1.position.y - n2.position.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < OVERLAP_THRESHOLD) {
            violations.push({
              lawId: 'SEM-005',
              severity: 'warning',
              message: `Nodes "${n1.id}" and "${n2.id}" are overlapping`,
              nodeId: n1.id,
              suggestion: 'Adjust node positions to prevent visual overlap',
            })
          }
        }
      }
      
      return violations
    },
  },
  
  // ========================================================================
  // ONTOGENETIC LAWS - Lifecycle and operator semantics
  // ========================================================================
  {
    id: 'ONT-001',
    category: 'ontogenetic',
    severity: 'warning',
    description: 'Entity should flow through ontogenetic lifecycle (BEGIN → BECOME → CEASE)',
    invariant: 'forall(entity => hasLifecycle(entity))',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      
      // Group nodes by entity
      const entityNodes = new Map<string, Array<{ type: string; id: string }>>()
      
      pipeline.nodes.forEach(node => {
        const entity = node.data?.entity
        if (entity && typeof entity === 'string') {
          if (!entityNodes.has(entity)) entityNodes.set(entity, [])
          entityNodes.get(entity)!.push({ type: node.type || 'unknown', id: node.id })
        }
      })
      
      // Check lifecycle completeness
      entityNodes.forEach((nodes, entity) => {
        const hasBegin = nodes.some(n => n.type === 'begin')
        const hasBecome = nodes.some(n => n.type === 'become')
        const hasCease = nodes.some(n => n.type === 'cease')
        
        if (hasBegin && !hasBecome && !hasCease) {
          violations.push({
            lawId: 'ONT-001',
            severity: 'warning',
            message: `Entity "${entity}" only has BEGIN - consider adding BECOME or CEASE operators`,
            suggestion: 'Add transformation (BECOME) or termination (CEASE) logic',
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'ONT-002',
    category: 'ontogenetic',
    severity: 'info',
    description: 'TRANSCEND nodes should connect to external universes',
    invariant: 'forall(node.type === "transcend" => node.data.portal !== null)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      const transcendNodes = pipeline.nodes.filter(n => n.type === 'transcend')
      
      transcendNodes.forEach(node => {
        if (!node.data?.portal) {
          violations.push({
            lawId: 'ONT-002',
            severity: 'info',
            message: `TRANSCEND node "${node.id}" has no portal definition`,
            nodeId: node.id,
            suggestion: 'Add portal like: { portal: "universe:premium", ... }',
          })
        }
      })
      
      return violations
    },
  },
  
  // ========================================================================
  // OPERATIONAL LAWS - Runtime and execution properties
  // ========================================================================
  {
    id: 'OPR-001',
    category: 'operational',
    severity: 'warning',
    description: 'Pipeline complexity should be manageable (node count < 50)',
    invariant: 'count(nodes) < 50',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      
      if (pipeline.nodes.length > 50) {
        violations.push({
          lawId: 'OPR-001',
          severity: 'warning',
          message: `Pipeline has ${pipeline.nodes.length} nodes (recommended: < 50)`,
          suggestion: 'Consider breaking into smaller sub-workflows',
        })
      }
      
      return violations
    },
  },
  
  {
    id: 'OPR-002',
    category: 'operational',
    severity: 'warning',
    description: 'Node branching factor should be reasonable (outDegree < 10)',
    invariant: 'forall(node => outDegree(node) < 10)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      
      // Count outgoing edges per node
      const outDegrees = new Map<string, number>()
      pipeline.edges.forEach(edge => {
        outDegrees.set(edge.source, (outDegrees.get(edge.source) || 0) + 1)
      })
      
      outDegrees.forEach((degree, nodeId) => {
        if (degree >= 10) {
          violations.push({
            lawId: 'OPR-002',
            severity: 'warning',
            message: `Node "${nodeId}" has ${degree} outgoing edges`,
            nodeId,
            suggestion: 'Reduce branching complexity or introduce intermediary nodes',
          })
        }
      })
      
      return violations
    },
  },
  
  // ========================================================================
  // QUALITY LAWS - Best practices and aesthetics
  // ========================================================================
  {
    id: 'QLT-001',
    category: 'quality',
    severity: 'info',
    description: 'Nodes should have descriptive narratives',
    invariant: 'forall(node => node.data.narrative !== null)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      
      pipeline.nodes.forEach(node => {
        if (!node.data?.narrative) {
          violations.push({
            lawId: 'QLT-001',
            severity: 'info',
            message: `Node "${node.id}" has no narrative description`,
            nodeId: node.id,
            suggestion: 'Add a human-readable narrative for better understanding',
          })
        }
      })
      
      return violations
    },
  },
  
  {
    id: 'QLT-002',
    category: 'quality',
    severity: 'info',
    description: 'Edges should have descriptive labels',
    invariant: 'forall(edge => edge.label !== null)',
    validate: (pipeline) => {
      const violations: LawViolation[] = []
      
      pipeline.edges.forEach(edge => {
        if (!edge.label) {
          violations.push({
            lawId: 'QLT-002',
            severity: 'info',
            message: `Edge "${edge.id}" has no label`,
            edgeId: edge.id,
            suggestion: 'Add a label describing the relationship',
          })
        }
      })
      
      return violations
    },
  },
]

// ============================================================================
// LAW VALIDATOR
// ============================================================================

export class StorytellerLawValidator {
  /**
   * Validate a pipeline against all ontogenetic laws
   */
  static validate(pipeline: StorytellerOutput['pipeline']): ValidationReport {
    const allViolations: LawViolation[] = []
    
    // Run all law validators
    for (const law of STORYTELLER_LAWS) {
      const violations = law.validate(pipeline)
      allViolations.push(...violations)
    }
    
    // Categorize violations by severity
    const criticalViolations = allViolations.filter(v => v.severity === 'critical').length
    const errorViolations = allViolations.filter(v => v.severity === 'error').length
    const warningViolations = allViolations.filter(v => v.severity === 'warning').length
    const infoViolations = allViolations.filter(v => v.severity === 'info').length
    
    // Calculate score (0-100)
    // Critical violations: -20 each
    // Error violations: -10 each
    // Warning violations: -5 each
    // Info violations: -1 each
    const deductions = 
      (criticalViolations * 20) +
      (errorViolations * 10) +
      (warningViolations * 5) +
      (infoViolations * 1)
    
    const score = Math.max(0, 100 - deductions)
    
    // Determine pass/fail
    const passed = criticalViolations === 0 && errorViolations === 0
    
    // Generate warnings
    const warnings: string[] = []
    if (criticalViolations > 0) {
      warnings.push(`${criticalViolations} critical violation(s) found - pipeline is invalid`)
    }
    if (errorViolations > 0) {
      warnings.push(`${errorViolations} error(s) found - pipeline may not execute correctly`)
    }
    if (warningViolations > 3) {
      warnings.push(`${warningViolations} warnings found - consider improving pipeline quality`)
    }
    
    return {
      passed,
      score,
      violations: allViolations,
      warnings,
      metrics: {
        totalLaws: STORYTELLER_LAWS.length,
        passed: STORYTELLER_LAWS.length - allViolations.length,
        failed: allViolations.length,
        criticalViolations,
        errorViolations,
        warningViolations: warningViolations + infoViolations,
      },
    }
  }
  
  /**
   * Get violations by category
   */
  static getViolationsByCategory(report: ValidationReport): Map<LawCategory, LawViolation[]> {
    const byCategory = new Map<LawCategory, LawViolation[]>()
    
    report.violations.forEach(violation => {
      const law = STORYTELLER_LAWS.find(l => l.id === violation.lawId)
      if (law) {
        if (!byCategory.has(law.category)) byCategory.set(law.category, [])
        byCategory.get(law.category)!.push(violation)
      }
    })
    
    return byCategory
  }
  
  /**
   * Get violations by severity
   */
  static getViolationsBySeverity(report: ValidationReport): Map<LawSeverity, LawViolation[]> {
    const bySeverity = new Map<LawSeverity, LawViolation[]>()
    
    report.violations.forEach(violation => {
      if (!bySeverity.has(violation.severity)) bySeverity.set(violation.severity, [])
      bySeverity.get(violation.severity)!.push(violation)
    })
    
    return bySeverity
  }
  
  /**
   * Generate human-readable report
   */
  static generateReport(report: ValidationReport): string {
    const lines: string[] = [
      '═══════════════════════════════════════',
      '   STORYTELLER PIPELINE VALIDATION',
      '═══════════════════════════════════════',
      '',
      `Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`,
      `Score: ${report.score}/100`,
      '',
      'Metrics:',
      `  • Total Laws: ${report.metrics.totalLaws}`,
      `  • Passed: ${report.metrics.passed}`,
      `  • Failed: ${report.metrics.failed}`,
      '',
      'Violations by Severity:',
      `  • Critical: ${report.metrics.criticalViolations}`,
      `  • Errors: ${report.metrics.errorViolations}`,
      `  • Warnings: ${report.metrics.warningViolations}`,
      '',
    ]
    
    if (report.violations.length > 0) {
      lines.push('Violations:')
      report.violations.forEach((v, i) => {
        lines.push(`  ${i + 1}. [${v.severity.toUpperCase()}] ${v.lawId}: ${v.message}`)
        if (v.suggestion) {
          lines.push(`     → ${v.suggestion}`)
        }
      })
      lines.push('')
    }
    
    if (report.warnings.length > 0) {
      lines.push('Warnings:')
      report.warnings.forEach(w => lines.push(`  • ${w}`))
      lines.push('')
    }
    
    lines.push('═══════════════════════════════════════')
    
    return lines.join('\n')
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Auto-fix common violations
 */
export function autoFixViolations(
  pipeline: StorytellerOutput['pipeline'],
  violations: LawViolation[]
): StorytellerOutput['pipeline'] {
  const fixedPipeline = JSON.parse(JSON.stringify(pipeline)) // Deep clone
  
  violations.forEach(violation => {
    switch (violation.lawId) {
      case 'SEM-001': // Missing entity
        if (violation.nodeId) {
          const node = fixedPipeline.nodes.find((n: Node) => n.id === violation.nodeId)
          if (node && !node.data.entity) {
            node.data.entity = `${node.type}_entity`
          }
        }
        break
        
      case 'SEM-002': // Missing properties in BEGIN
        if (violation.nodeId) {
          const node = fixedPipeline.nodes.find((n: Node) => n.id === violation.nodeId)
          if (node && node.type === 'begin' && !node.data.properties) {
            node.data.properties = { status: 'initialized', created: Date.now() }
          }
        }
        break
        
      case 'SEM-003': // Missing transform in BECOME
        if (violation.nodeId) {
          const node = fixedPipeline.nodes.find((n: Node) => n.id === violation.nodeId)
          if (node && node.type === 'become' && !node.data.transform) {
            node.data.transform = 'state + delta'
          }
        }
        break
        
      case 'SEM-004': // Missing condition in CEASE
        if (violation.nodeId) {
          const node = fixedPipeline.nodes.find((n: Node) => n.id === violation.nodeId)
          if (node && node.type === 'cease' && !node.data.condition) {
            node.data.condition = 'state.invalid || state.expired'
          }
        }
        break
    }
  })
  
  return fixedPipeline
}

/**
 * Check if pipeline meets minimum quality threshold
 */
export function meetsQualityThreshold(report: ValidationReport, threshold: number = 70): boolean {
  return report.passed && report.score >= threshold
}
