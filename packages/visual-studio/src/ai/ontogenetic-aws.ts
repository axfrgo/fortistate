/**
 * Ontogenetic AWS (Automated Workflow System)
 * 
 * Manages Custodian fixes through a rigorous ontogenetic lifecycle:
 * PROPOSE → ANALYZE → VALIDATE → APPLY → VERIFY
 * 
 * Ensures fixes are accurate, impactful, and strong with:
 * - Deep impact analysis (ripple effects, dependencies, risk assessment)
 * - Strength validation (correctness, completeness, safety, reversibility)
 * - Atomic application with snapshot/rollback support
 * - Multi-phase verification and quality gates
 */

import type { Node, Edge } from 'reactflow'
import type { RepairStep } from './agentTypes'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type FixPhase = 'propose' | 'analyze' | 'validate' | 'apply' | 'verify' | 'complete' | 'failed' | 'rolled_back'

export interface FixWorkflow {
  id: string
  phase: FixPhase
  targetId: string
  violationType: string
  steps: RepairStep[]
  
  // Impact analysis
  impact?: ImpactAnalysis
  
  // Validation results
  validation?: ValidationResult
  
  // Application results
  snapshot?: WorkflowSnapshot
  appliedAt?: number
  appliedChanges?: AppliedChange[]
  
  // Verification
  verification?: VerificationResult
  
  // Metadata
  createdAt: number
  completedAt?: number
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ImpactAnalysis {
  affectedNodes: string[]
  affectedEdges: string[]
  rippleEffects: RippleEffect[]
  dependencyChain: DependencyNode[]
  riskScore: number
  estimatedChanges: number
  reversible: boolean
  conflictPotential: 'none' | 'low' | 'medium' | 'high'
}

export interface RippleEffect {
  nodeId: string
  changeType: 'data_modified' | 'edge_added' | 'edge_removed' | 'validation_updated'
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface DependencyNode {
  id: string
  type: string
  relationship: 'parent' | 'child' | 'sibling' | 'dependent'
  strength: number
}

export interface ValidationResult {
  passed: boolean
  strength: number // 0-100 score
  checks: ValidationCheck[]
  warnings: string[]
  errors: string[]
  recommendation: 'apply' | 'review' | 'reject'
}

export interface ValidationCheck {
  name: string
  category: 'correctness' | 'completeness' | 'safety' | 'reversibility'
  passed: boolean
  score: number
  message: string
}

export interface WorkflowSnapshot {
  id: string
  timestamp: number
  nodes: Node[]
  edges: Edge[]
  metadata: {
    nodeCount: number
    edgeCount: number
    checksum: string
  }
}

export interface AppliedChange {
  type: 'node_updated' | 'node_added' | 'node_removed' | 'edge_added' | 'edge_removed'
  targetId: string
  before?: any
  after?: any
  timestamp: number
}

export interface VerificationResult {
  success: boolean
  fixesVerified: string[]
  issuesRemaining: string[]
  qualityScore: number
  recommendation: 'success' | 'partial' | 'failed'
}

// ============================================================================
// IMPACT ANALYZER
// ============================================================================

export class ImpactAnalyzer {
  /**
   * Analyze the potential impact of applying repair steps
   */
  static analyze(
    targetId: string,
    steps: RepairStep[],
    nodes: Node[],
    edges: Edge[]
  ): ImpactAnalysis {
    const affectedNodes = new Set<string>([targetId])
    const affectedEdges = new Set<string>()
    const rippleEffects: RippleEffect[] = []
    const dependencyChain: DependencyNode[] = []
    
    // Analyze each step
    for (const step of steps) {
      if (step.action === 'set_entity_field' || step.action === 'initialize_properties' || 
          step.action === 'set_transformation' || step.action === 'set_condition') {
        // Node data modification
        affectedNodes.add(targetId)
        
        rippleEffects.push({
          nodeId: targetId,
          changeType: 'data_modified',
          severity: 'medium',
          description: `${step.action} will modify node data`,
        })
        
        // Find connected nodes
        const connectedEdges = edges.filter(e => e.source === targetId || e.target === targetId)
        connectedEdges.forEach(edge => {
          affectedEdges.add(edge.id)
          const otherId = edge.source === targetId ? edge.target : edge.source
          affectedNodes.add(otherId)
          
          dependencyChain.push({
            id: otherId,
            type: nodes.find(n => n.id === otherId)?.type || 'unknown',
            relationship: edge.source === targetId ? 'child' : 'parent',
            strength: 0.7,
          })
        })
      } else if (step.action === 'create_inbound_edge') {
        // Edge creation
        const sourceId = step.params?.sourceId as string
        if (sourceId && typeof sourceId === 'string') {
          affectedNodes.add(sourceId)
          affectedNodes.add(targetId)
          
          rippleEffects.push({
            nodeId: targetId,
            changeType: 'edge_added',
            severity: 'medium',
            description: `New edge from ${sourceId} will integrate orphaned node into workflow`,
          })
          
          dependencyChain.push({
            id: sourceId,
            type: nodes.find(n => n.id === sourceId)?.type || 'unknown',
            relationship: 'parent',
            strength: 0.9,
          })
        }
      } else if (step.action === 'remove_broken_edge') {
        // Edge removal
        const edge = edges.find(e => e.id === targetId)
        if (edge) {
          affectedNodes.add(edge.source)
          affectedNodes.add(edge.target)
          affectedEdges.add(edge.id)
          
          rippleEffects.push({
            nodeId: edge.source,
            changeType: 'edge_removed',
            severity: 'low',
            description: `Broken edge removal will clean up invalid connection`,
          })
        }
      } else if (step.action === 'validate_and_enhance') {
        // Validation metadata
        affectedNodes.add(targetId)
        
        rippleEffects.push({
          nodeId: targetId,
          changeType: 'validation_updated',
          severity: 'low',
          description: `Validation metadata will be added`,
        })
      }
    }
    
    // Calculate risk score based on impact breadth and depth
    const riskScore = this.calculateRiskScore(
      affectedNodes.size,
      affectedEdges.size,
      rippleEffects,
      dependencyChain
    )
    
    // Determine if changes are reversible
    const reversible = steps.every(s => 
      s.action !== 'remove_broken_edge' && 
      s.action !== 'node_removed'
    )
    
    // Assess conflict potential
    const conflictPotential = this.assessConflictPotential(affectedNodes.size, riskScore)
    
    return {
      affectedNodes: Array.from(affectedNodes),
      affectedEdges: Array.from(affectedEdges),
      rippleEffects,
      dependencyChain,
      riskScore,
      estimatedChanges: steps.length,
      reversible,
      conflictPotential,
    }
  }
  
  private static calculateRiskScore(
    nodeCount: number,
    edgeCount: number,
    rippleEffects: RippleEffect[],
    dependencies: DependencyNode[]
  ): number {
    // Base risk from scope
    let risk = Math.min(nodeCount * 5 + edgeCount * 3, 50)
    
    // Add risk from ripple effects
    const highSeverityCount = rippleEffects.filter(r => r.severity === 'high').length
    const mediumSeverityCount = rippleEffects.filter(r => r.severity === 'medium').length
    risk += highSeverityCount * 15 + mediumSeverityCount * 8
    
    // Add risk from strong dependencies
    const strongDeps = dependencies.filter(d => d.strength > 0.7).length
    risk += strongDeps * 5
    
    return Math.min(Math.round(risk), 100)
  }
  
  private static assessConflictPotential(
    affectedCount: number,
    riskScore: number
  ): 'none' | 'low' | 'medium' | 'high' {
    if (affectedCount === 1 && riskScore < 20) return 'none'
    if (affectedCount <= 3 && riskScore < 40) return 'low'
    if (affectedCount <= 6 && riskScore < 60) return 'medium'
    return 'high'
  }
}

// ============================================================================
// STRENGTH VALIDATOR
// ============================================================================

export class StrengthValidator {
  /**
   * Validate the strength and quality of repair steps
   */
  static validate(
    steps: RepairStep[],
    impact: ImpactAnalysis,
    targetNode?: Node,
    _targetEdge?: Edge
  ): ValidationResult {
    const checks: ValidationCheck[] = []
    const warnings: string[] = []
    const errors: string[] = []
    
    // 1. CORRECTNESS: Do the steps make logical sense?
    const correctnessChecks = this.validateCorrectness(steps, targetNode, _targetEdge)
    checks.push(...correctnessChecks.checks)
    warnings.push(...correctnessChecks.warnings)
    errors.push(...correctnessChecks.errors)
    
    // 2. COMPLETENESS: Are all necessary changes covered?
    const completenessChecks = this.validateCompleteness(steps, impact)
    checks.push(...completenessChecks.checks)
    warnings.push(...completenessChecks.warnings)
    
    // 3. SAFETY: Can these changes cause harm?
    const safetyChecks = this.validateSafety(steps, impact)
    checks.push(...safetyChecks.checks)
    warnings.push(...safetyChecks.warnings)
    errors.push(...safetyChecks.errors)
    
    // 4. REVERSIBILITY: Can we undo these changes?
    const reversibilityChecks = this.validateReversibility(steps, impact)
    checks.push(...reversibilityChecks.checks)
    warnings.push(...reversibilityChecks.warnings)
    
    // Calculate overall strength score
    const passedCount = checks.filter(c => c.passed).length
    const strength = Math.round((passedCount / checks.length) * 100)
    
    // Determine recommendation
    const passed = errors.length === 0
    let recommendation: 'apply' | 'review' | 'reject'
    if (!passed || strength < 50) {
      recommendation = 'reject'
    } else if (strength < 75 || warnings.length > 2) {
      recommendation = 'review'
    } else {
      recommendation = 'apply'
    }
    
    return {
      passed,
      strength,
      checks,
      warnings,
      errors,
      recommendation,
    }
  }
  
  private static validateCorrectness(
    steps: RepairStep[],
    targetNode?: Node,
    _targetEdge?: Edge
  ): { checks: ValidationCheck[]; warnings: string[]; errors: string[] } {
    const checks: ValidationCheck[] = []
    const warnings: string[] = []
    const errors: string[] = []
    
    for (const step of steps) {
      // Check if action matches target type
      if (step.action === 'set_entity_field' && targetNode) {
        const isOntogenetic = ['begin', 'become', 'cease', 'transcend'].includes(targetNode.type || '')
        checks.push({
          name: 'Entity field target validation',
          category: 'correctness',
          passed: isOntogenetic,
          score: isOntogenetic ? 100 : 0,
          message: isOntogenetic 
            ? 'Target is an ontogenetic node that supports entity fields'
            : 'Target node type does not support entity fields',
        })
        
        if (!isOntogenetic) {
          errors.push(`Cannot set entity field on ${targetNode.type} node`)
        }
      } else if (step.action === 'initialize_properties' && targetNode) {
        const isBeginNode = targetNode.type === 'begin'
        checks.push({
          name: 'Properties initialization target',
          category: 'correctness',
          passed: isBeginNode,
          score: isBeginNode ? 100 : 75,
          message: isBeginNode
            ? 'BEGIN node is correct target for property initialization'
            : 'Non-BEGIN node can have properties but may not be ideal',
        })
        
        if (!isBeginNode) {
          warnings.push('Initializing properties on non-BEGIN node')
        }
      } else if (step.action === 'set_transformation' && targetNode) {
        const isBecomeNode = targetNode.type === 'become'
        checks.push({
          name: 'Transformation target validation',
          category: 'correctness',
          passed: isBecomeNode,
          score: isBecomeNode ? 100 : 0,
          message: isBecomeNode
            ? 'BECOME node requires transformation logic'
            : 'Only BECOME nodes support transformations',
        })
        
        if (!isBecomeNode) {
          errors.push('Cannot set transformation on non-BECOME node')
        }
      } else if (step.action === 'set_condition' && targetNode) {
        const isCeaseNode = targetNode.type === 'cease'
        checks.push({
          name: 'Condition target validation',
          category: 'correctness',
          passed: isCeaseNode,
          score: isCeaseNode ? 100 : 0,
          message: isCeaseNode
            ? 'CEASE node requires termination condition'
            : 'Only CEASE nodes support conditions',
        })
        
        if (!isCeaseNode) {
          errors.push('Cannot set condition on non-CEASE node')
        }
      }
      
      // Validate preconditions
      if (step.preconditions && step.preconditions.length > 0) {
        checks.push({
          name: `Preconditions defined for ${step.action}`,
          category: 'correctness',
          passed: true,
          score: 100,
          message: `${step.preconditions.length} precondition(s) specified`,
        })
      }
    }
    
    return { checks, warnings, errors }
  }
  
  private static validateCompleteness(
    steps: RepairStep[],
    impact: ImpactAnalysis
  ): { checks: ValidationCheck[]; warnings: string[] } {
    const checks: ValidationCheck[] = []
    const warnings: string[] = []
    
    // Check if impact is addressed
    const addressesTarget = steps.length > 0
    checks.push({
      name: 'Repair steps provided',
      category: 'completeness',
      passed: addressesTarget,
      score: addressesTarget ? 100 : 0,
      message: addressesTarget 
        ? `${steps.length} repair step(s) defined`
        : 'No repair steps provided',
    })
    
    // Check if all affected nodes are considered
    const targetsCovered = impact.affectedNodes.length <= 5
    checks.push({
      name: 'Impact scope manageable',
      category: 'completeness',
      passed: targetsCovered,
      score: targetsCovered ? 100 : 60,
      message: `Affects ${impact.affectedNodes.length} node(s)`,
    })
    
    if (impact.affectedNodes.length > 5) {
      warnings.push(`Repair affects ${impact.affectedNodes.length} nodes - consider breaking into smaller fixes`)
    }
    
    // Check postconditions
    const hasPostconditions = steps.every(s => s.postconditions && s.postconditions.length > 0)
    checks.push({
      name: 'Postconditions defined',
      category: 'completeness',
      passed: hasPostconditions,
      score: hasPostconditions ? 100 : 70,
      message: hasPostconditions
        ? 'All steps have postconditions for verification'
        : 'Some steps lack postconditions',
    })
    
    return { checks, warnings }
  }
  
  private static validateSafety(
    steps: RepairStep[],
    impact: ImpactAnalysis
  ): { checks: ValidationCheck[]; warnings: string[]; errors: string[] } {
    const checks: ValidationCheck[] = []
    const warnings: string[] = []
    const errors: string[] = []
    
    // Check risk score
    const lowRisk = impact.riskScore < 40
    checks.push({
      name: 'Risk assessment',
      category: 'safety',
      passed: lowRisk,
      score: Math.max(0, 100 - impact.riskScore),
      message: `Risk score: ${impact.riskScore}/100`,
    })
    
    if (impact.riskScore > 70) {
      errors.push(`High risk score (${impact.riskScore}) - review carefully before applying`)
    } else if (impact.riskScore > 40) {
      warnings.push(`Moderate risk score (${impact.riskScore})`)
    }
    
    // Check conflict potential
    const noConflicts = impact.conflictPotential === 'none' || impact.conflictPotential === 'low'
    checks.push({
      name: 'Conflict potential',
      category: 'safety',
      passed: noConflicts,
      score: noConflicts ? 100 : 60,
      message: `Conflict potential: ${impact.conflictPotential}`,
    })
    
    if (impact.conflictPotential === 'high') {
      warnings.push('High conflict potential detected')
    }
    
    // Check for destructive operations
    const hasDestructive = steps.some(s => 
      s.action === 'remove_broken_edge' || 
      s.action === 'node_removed'
    )
    checks.push({
      name: 'Non-destructive operations',
      category: 'safety',
      passed: !hasDestructive,
      score: hasDestructive ? 50 : 100,
      message: hasDestructive
        ? 'Contains destructive operations'
        : 'All operations are non-destructive',
    })
    
    return { checks, warnings, errors }
  }
  
  private static validateReversibility(
    _steps: RepairStep[],
    impact: ImpactAnalysis
  ): { checks: ValidationCheck[]; warnings: string[] } {
    const checks: ValidationCheck[] = []
    const warnings: string[] = []
    
    checks.push({
      name: 'Reversibility',
      category: 'reversibility',
      passed: impact.reversible,
      score: impact.reversible ? 100 : 50,
      message: impact.reversible
        ? 'Changes can be rolled back'
        : 'Some changes may be irreversible',
    })
    
    if (!impact.reversible) {
      warnings.push('Fix contains irreversible changes')
    }
    
    return { checks, warnings }
  }
}

// ============================================================================
// FIX ORCHESTRATOR
// ============================================================================

export class FixOrchestrator {
  private workflows: Map<string, FixWorkflow> = new Map()
  
  /**
   * Create a new fix workflow
   */
  createWorkflow(
    targetId: string,
    violationType: string,
    steps: RepairStep[],
    confidence: number
  ): FixWorkflow {
    const workflow: FixWorkflow = {
      id: `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phase: 'propose',
      targetId,
      violationType,
      steps,
      createdAt: Date.now(),
      confidence,
      riskLevel: 'medium',
    }
    
    this.workflows.set(workflow.id, workflow)
    return workflow
  }
  
  /**
   * Execute impact analysis phase
   */
  async analyzeImpact(
    workflowId: string,
    nodes: Node[],
    edges: Edge[]
  ): Promise<FixWorkflow> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`)
    
    workflow.phase = 'analyze'
    workflow.impact = ImpactAnalyzer.analyze(
      workflow.targetId,
      workflow.steps,
      nodes,
      edges
    )
    
    // Update risk level based on impact
    workflow.riskLevel = 
      workflow.impact.riskScore > 60 ? 'high' :
      workflow.impact.riskScore > 30 ? 'medium' : 'low'
    
    return workflow
  }
  
  /**
   * Execute validation phase
   */
  async validateStrength(
    workflowId: string,
    nodes: Node[],
    edges: Edge[]
  ): Promise<FixWorkflow> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`)
    if (!workflow.impact) throw new Error('Impact analysis required before validation')
    
    workflow.phase = 'validate'
    
    const targetNode = nodes.find(n => n.id === workflow.targetId)
    const targetEdge = edges.find(e => e.id === workflow.targetId)
    
    workflow.validation = StrengthValidator.validate(
      workflow.steps,
      workflow.impact,
      targetNode,
      targetEdge
    )
    
    return workflow
  }
  
  /**
   * Create snapshot before applying changes
   */
  createSnapshot(nodes: Node[], edges: Edge[]): WorkflowSnapshot {
    const checksum = this.calculateChecksum(nodes, edges)
    
    return {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        checksum,
      },
    }
  }
  
  private calculateChecksum(nodes: Node[], edges: Edge[]): string {
    const str = JSON.stringify({ nodes, edges })
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }
  
  /**
   * Mark workflow as complete
   */
  complete(workflowId: string, verification: VerificationResult): FixWorkflow {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`)
    
    workflow.phase = verification.success ? 'complete' : 'failed'
    workflow.verification = verification
    workflow.completedAt = Date.now()
    
    return workflow
  }
  
  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): FixWorkflow | undefined {
    return this.workflows.get(workflowId)
  }
  
  /**
   * Get all workflows
   */
  getAllWorkflows(): FixWorkflow[] {
    return Array.from(this.workflows.values())
  }
  
  /**
   * Clean up old workflows
   */
  cleanup(maxAge: number = 3600000): void {
    const now = Date.now()
    for (const [id, workflow] of this.workflows.entries()) {
      if (workflow.completedAt && now - workflow.completedAt > maxAge) {
        this.workflows.delete(id)
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton orchestrator instance
export const fixOrchestrator = new FixOrchestrator()

// Utility functions
export function generateFixReport(workflow: FixWorkflow): string {
  const lines: string[] = [
    `Fix Workflow Report: ${workflow.id}`,
    `Target: ${workflow.targetId}`,
    `Violation: ${workflow.violationType}`,
    `Phase: ${workflow.phase}`,
    `Risk Level: ${workflow.riskLevel}`,
    ``,
  ]
  
  if (workflow.impact) {
    lines.push(`Impact Analysis:`)
    lines.push(`  - Affected Nodes: ${workflow.impact.affectedNodes.length}`)
    lines.push(`  - Affected Edges: ${workflow.impact.affectedEdges.length}`)
    lines.push(`  - Risk Score: ${workflow.impact.riskScore}/100`)
    lines.push(`  - Reversible: ${workflow.impact.reversible ? 'Yes' : 'No'}`)
    lines.push(`  - Conflict Potential: ${workflow.impact.conflictPotential}`)
    lines.push(``)
  }
  
  if (workflow.validation) {
    lines.push(`Validation:`)
    lines.push(`  - Strength: ${workflow.validation.strength}/100`)
    lines.push(`  - Passed: ${workflow.validation.passed ? 'Yes' : 'No'}`)
    lines.push(`  - Recommendation: ${workflow.validation.recommendation}`)
    lines.push(`  - Checks: ${workflow.validation.checks.filter(c => c.passed).length}/${workflow.validation.checks.length} passed`)
    if (workflow.validation.errors.length > 0) {
      lines.push(`  - Errors: ${workflow.validation.errors.length}`)
    }
    if (workflow.validation.warnings.length > 0) {
      lines.push(`  - Warnings: ${workflow.validation.warnings.length}`)
    }
    lines.push(``)
  }
  
  if (workflow.verification) {
    lines.push(`Verification:`)
    lines.push(`  - Success: ${workflow.verification.success ? 'Yes' : 'No'}`)
    lines.push(`  - Quality Score: ${workflow.verification.qualityScore}/100`)
    lines.push(`  - Fixes Verified: ${workflow.verification.fixesVerified.length}`)
    lines.push(`  - Issues Remaining: ${workflow.verification.issuesRemaining.length}`)
  }
  
  return lines.join('\n')
}
