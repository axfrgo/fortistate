import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import type { MutableRefObject } from 'react'
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type NodeTypes,
  useReactFlow,
  ConnectionMode,
        MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import LawNodeAnimated from './LawNodeAnimated.tsx'
import OperatorNode from './nodes/OperatorNode.tsx'
import BeginNode from './nodes/BeginNode.tsx'
import BecomeNode from './nodes/BecomeNode.tsx'
import CeaseNode from './nodes/CeaseNode.tsx'
import TranscendNode from './nodes/TranscendNode.tsx'
import ResolveNode from './nodes/ResolveNode.tsx'
import NodeEditor from './NodeEditor.tsx'
import { ContextMenu } from './ContextMenu.tsx'
import { spawnAgent } from '../ai/agentRuntime'
import type { CustodianInput, CustodianOutput, NarratorInput, NarratorOutput, ExplorerInput, ExplorerOutput, StorytellerInput, StorytellerOutput } from '../ai/agentTypes'
import type { ExecutionResult } from '../executionEngine.ts'
import type { Template } from '../templates.ts'
import { useSettings } from '../settingsContext.tsx'
import type { AgentFeedbackEntry } from './AgentFeedbackPanel'
import { fixOrchestrator, generateFixReport } from '../ai/ontogenetic-aws'
import type { FixWorkflow } from '../ai/ontogenetic-aws'
import './Canvas.css'

const nodeTypes: NodeTypes = {
  law: LawNodeAnimated,
  operator: OperatorNode,
  // vX: Ontogenetic node types
  begin: BeginNode,
  become: BecomeNode,
  cease: CeaseNode,
  transcend: TranscendNode,
  resolve: ResolveNode,
}

const DEFAULT_EDGE_COLOR = '#a855f7'

interface CanvasProps {
  onNodeSelect: (nodeId: string | null) => void
  executionResults?: Map<string, ExecutionResult>
  currentExecutingNode?: string | null
  onLoadExample?: (loadFn: () => void) => void
  onLoadTemplate?: (loadFn: (template: Template) => void) => void
  onRestoreSession?: (restoreFn: (nodes: Node[], edges: Edge[]) => void) => void
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
  canvasRef?: MutableRefObject<HTMLDivElement | null>
  onPushAgentFeedback?: (entry: Omit<AgentFeedbackEntry, 'id' | 'timestamp'>) => void
}

export default function Canvas({ 
  onNodeSelect, 
  executionResults, 
  currentExecutingNode, 
  onLoadExample,
  onLoadTemplate,
  onRestoreSession,
  onNodesChange: notifyNodesChange,
  onEdgesChange: notifyEdgesChange,
  canvasRef,
  onPushAgentFeedback,
}: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    node?: Node
    edge?: Edge
  } | null>(null)
  const [isStorytellerModalOpen, setIsStorytellerModalOpen] = useState(false)
  const [storytellerInput, setStorytellerInput] = useState('')
  const [isGeneratingPipeline, setIsGeneratingPipeline] = useState(false)
  const storytellerAbortRef = useRef<{ controller?: AbortController | null }>({ controller: null })
  const [pendingApplyPayload, setPendingApplyPayload] = useState<any>(null)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const { settings } = useSettings()
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow()
  const nodeIdCounter = useRef(1)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const setWrapperRef = useCallback((element: HTMLDivElement | null) => {
    reactFlowWrapper.current = element
    if (canvasRef) {
      canvasRef.current = element
    }
  }, [canvasRef])

  const pushAgentFeedback = onPushAgentFeedback ?? (() => {})

  // Notify parent of changes - no bidirectional sync!
  useEffect(() => {
    if (notifyNodesChange) {
      notifyNodesChange(nodes)
    }
  }, [nodes, notifyNodesChange])

  useEffect(() => {
    console.log('🔄 Edges changed:', edges.length, edges.map(e => `${e.source}->${e.target}`))
    if (notifyEdgesChange) {
      notifyEdgesChange(edges)
    }
  }, [edges, notifyEdgesChange])

  // Expose load example function
  const loadExample = useCallback(() => {
    // vX: Ontogenetic Banking Example
    const exampleNodes: Node[] = [
      {
        id: 'ex-begin-alice',
        type: 'begin',
        position: { x: 100, y: 50 },
        data: { 
          entity: 'user:alice',
          properties: { balance: 100, tier: 'basic' },
          narrative: "🌱 Alice's account begins with $100",
          status: 'idle'
        },
      },
      {
        id: 'ex-become-deposit',
        type: 'become',
        position: { x: 100, y: 220 },
        data: { 
          entity: 'user:alice',
          transform: 'balance + 50',
          trigger: 'deposit event',
          narrative: "🌊 Alice deposits $50",
          status: 'idle'
        },
      },
      {
        id: 'ex-cease-boundary',
        type: 'cease',
        position: { x: 100, y: 390 },
        data: { 
          entity: 'user:alice',
          condition: 'balance < 0',
          action: 'repair',
          narrative: "🧱 Balance cannot go negative",
          status: 'idle'
        },
      },
      {
        id: 'ex-transcend-vip',
        type: 'transcend',
        position: { x: 380, y: 390 },
        data: { 
          entity: 'user:alice',
          portal: 'universe:vip',
          condition: 'balance > 10000',
          narrative: "🌀 Transcend to VIP universe",
          status: 'idle'
        },
      },
    ]
    
    const exampleEdges: Edge[] = [
      {
        id: 'ex-e1',
        source: 'ex-begin-alice',
        target: 'ex-become-deposit',
        animated: true,
        style: { stroke: '#10B981', strokeWidth: 2 }
      },
      {
        id: 'ex-e2',
        source: 'ex-become-deposit',
        target: 'ex-cease-boundary',
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 2 }
      },
      {
        id: 'ex-e3',
        source: 'ex-cease-boundary',
        sourceHandle: 'out',
        target: 'ex-transcend-vip',
        targetHandle: 'in',
        animated: true,
        style: { stroke: '#8B5CF6', strokeWidth: 2 }
      },
    ]
    
    setNodes(exampleNodes)
    setEdges(exampleEdges)
    nodeIdCounter.current = exampleNodes.length + 1
  }, [setNodes, setEdges])

  // Template loader
  const loadTemplate = useCallback((template: Template) => {
    setNodes(template.nodes)
    setEdges(template.edges)
    nodeIdCounter.current = template.nodes.length + 1
  }, [setNodes, setEdges])

  // Session restoration loader
  const restoreSession = useCallback((restoredNodes: Node[], restoredEdges: Edge[]) => {
    console.log('[Canvas] Restoring session:', restoredNodes.length, 'nodes,', restoredEdges.length, 'edges')

    setNodes(restoredNodes.map((node) => ({
      ...node,
      position: node.position ?? { x: 0, y: 0 },
      data: node.data ?? {},
    })))

    setEdges(restoredEdges.map((edge) => ({
      ...edge,
    })))

    if (restoredNodes.length > 0) {
      const numericIds = restoredNodes
        .map((n) => Number.parseInt(String(n.id), 10))
        .filter((value) => Number.isFinite(value))

      nodeIdCounter.current = numericIds.length > 0
        ? Math.max(...numericIds) + 1
        : restoredNodes.length + 1
    }
  }, [setNodes, setEdges])

  // Pass load example function to parent on mount
  useEffect(() => {
    if (onLoadExample) {
      onLoadExample(loadExample)
    }
  }, [onLoadExample, loadExample])

  // Pass template loader to parent on mount
  useEffect(() => {
    if (onLoadTemplate) {
      onLoadTemplate(loadTemplate)
    }
  }, [onLoadTemplate, loadTemplate])

  // Pass session restore loader to parent on mount
  useEffect(() => {
    if (onRestoreSession) {
      onRestoreSession(restoreSession)
    }
  }, [onRestoreSession, restoreSession])

  // Global overlay safety: allow Escape to dismiss modals and a failsafe to clear stuck loading state
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        // Cancel any in-flight storyteller generation
        try {
          storytellerAbortRef.current.controller?.abort()
        } catch (e) {
          /* ignore */
        }
        setIsGeneratingPipeline(false)
        setIsStorytellerModalOpen(false)
        setIsApplyModalOpen(false)
        setPendingApplyPayload(null)
      }
    }

    // Safety timeout: if a generation gets stuck, clear the overlay after 60s
    timer = setTimeout(() => {
      if (isGeneratingPipeline) {
        try {
          storytellerAbortRef.current.controller?.abort()
        } catch (e) {
          /* ignore */
        }
        setIsGeneratingPipeline(false)
        pushAgentFeedback({
          agent: 'storyteller',
          status: 'warning',
          title: 'Generation timed out',
          summary: 'The Storyteller took too long and was automatically cancelled.',
        })
      }
    }, 60000)

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (timer) clearTimeout(timer)
    }
  }, [isGeneratingPipeline, pushAgentFeedback])

  const applyToCanvas = async (payload: any) => {
    if (!payload) return
    
    const targetId = payload.targetId
    const steps = payload.steps || []
    const violationType = payload.reason || 'unknown_violation'
    
    if (steps.length === 0) {
      pushAgentFeedback({
        agent: 'custodian',
        status: 'warning',
        title: 'No repair steps provided',
        summary: 'The repair payload contained no actionable steps.',
      })
      setPendingApplyPayload(null)
      setIsApplyModalOpen(false)
      return
    }
    
    try {
      // Create ontogenetic fix workflow
      const workflow: FixWorkflow = fixOrchestrator.createWorkflow(
        targetId,
        violationType,
        steps,
        payload.confidence || 0.85
      )
      
      // Phase 1: Impact Analysis
      await fixOrchestrator.analyzeImpact(workflow.id, nodes, edges)
      const impactReport = workflow.impact!
      
      pushAgentFeedback({
        agent: 'custodian',
        status: 'info',
        title: '📊 Impact Analysis Complete',
        summary: `Analyzed potential impact on ${impactReport.affectedNodes.length} node(s) and ${impactReport.affectedEdges.length} edge(s)`,
        metrics: [
          {
            label: 'Risk Score',
            value: `${impactReport.riskScore}/100`,
            tone: impactReport.riskScore > 60 ? 'negative' : impactReport.riskScore > 30 ? 'default' : 'positive',
          },
          {
            label: 'Reversible',
            value: impactReport.reversible ? 'Yes' : 'No',
            tone: impactReport.reversible ? 'positive' : 'negative',
          },
          {
            label: 'Conflict Risk',
            value: impactReport.conflictPotential.toUpperCase(),
          },
        ],
        details: impactReport.rippleEffects.map(r => `${r.nodeId}: ${r.description}`),
      })
      
      // Phase 2: Strength Validation
      await fixOrchestrator.validateStrength(workflow.id, nodes, edges)
      const validation = workflow.validation!
      
      if (!validation.passed) {
        pushAgentFeedback({
          agent: 'custodian',
          status: 'error',
          title: '❌ Validation Failed',
          summary: `Fix strength: ${validation.strength}/100. Recommendation: ${validation.recommendation}`,
          details: validation.errors,
          footnote: 'Fix was rejected due to validation failures.',
        })
        setPendingApplyPayload(null)
        setIsApplyModalOpen(false)
        return
      }
      
      pushAgentFeedback({
        agent: 'custodian',
        status: validation.recommendation === 'apply' ? 'success' : 'warning',
        title: '✓ Validation Complete',
        summary: `Fix strength: ${validation.strength}/100 - ${validation.checks.filter(c => c.passed).length}/${validation.checks.length} checks passed`,
        metrics: [
          {
            label: 'Correctness',
            value: `${validation.checks.filter(c => c.category === 'correctness' && c.passed).length}/${validation.checks.filter(c => c.category === 'correctness').length}`,
            tone: 'positive',
          },
          {
            label: 'Safety',
            value: `${validation.checks.filter(c => c.category === 'safety' && c.passed).length}/${validation.checks.filter(c => c.category === 'safety').length}`,
            tone: 'positive',
          },
          {
            label: 'Recommendation',
            value: validation.recommendation.toUpperCase(),
            tone: validation.recommendation === 'apply' ? 'positive' : 'default',
          },
        ],
        details: validation.warnings,
      })
      
      // Phase 3: Apply Changes (with snapshot)
      const snapshot = fixOrchestrator.createSnapshot(nodes, edges)
      workflow.snapshot = snapshot
      workflow.phase = 'apply'
      
      const appliedActions: string[] = []
      const appliedChanges: any[] = []
      
      // Apply repairs atomically
      steps.forEach((step: any) => {
        const action = step.action
        const params = step.params || {}
        
        if (action === 'set_entity_field' || action === 'initialize_properties' || action === 'set_transformation' || action === 'set_condition') {
          // Update existing node data
          setNodes((nds) => 
            nds.map((node) => {
              if (node.id === targetId) {
                const before = { ...node.data }
                const updatedData = { ...node.data }
                
                if (action === 'set_entity_field') {
                  updatedData.entity = params.value || 'unnamed_entity'
                  appliedActions.push(`Set entity to "${updatedData.entity}"`)
                } else if (action === 'initialize_properties') {
                  updatedData.properties = { ...updatedData.properties, ...params.properties }
                  appliedActions.push(`Initialized properties: ${Object.keys(params.properties).join(', ')}`)
                } else if (action === 'set_transformation') {
                  updatedData.transform = params.transform
                  updatedData.trigger = params.trigger
                  appliedActions.push(`Set transformation: "${params.transform}"`)
                } else if (action === 'set_condition') {
                  updatedData.condition = params.condition
                  updatedData.action = params.action
                  appliedActions.push(`Set condition: "${params.condition}"`)
                }
                
                appliedChanges.push({
                  type: 'node_updated',
                  targetId,
                  before,
                  after: updatedData,
                  timestamp: Date.now(),
                })
                
                return { ...node, data: updatedData }
              }
              return node
            })
          )
        } else if (action === 'create_inbound_edge') {
          // Create a new edge to connect orphaned node
          const sourceId = params.sourceId
          const edgeLabel = params.edgeLabel || 'repair_connection'
          
          setEdges((eds) => {
            // Check if edge already exists
            if (eds.some(e => e.source === sourceId && e.target === targetId)) {
              appliedActions.push(`Edge already exists from ${sourceId}`)
              return eds
            }
            
            const newEdge: Edge = {
              id: `repair-edge-${Date.now()}`,
              source: sourceId,
              target: targetId,
              label: edgeLabel,
              animated: params.animated || false,
              style: { stroke: '#10b981', strokeWidth: 2.5 },
            }
            
            appliedChanges.push({
              type: 'edge_added',
              targetId: newEdge.id,
              before: null,
              after: newEdge,
              timestamp: Date.now(),
            })
            
            appliedActions.push(`Created connection from ${sourceId} to ${targetId}`)
            return [...eds, newEdge]
          })
        } else if (action === 'remove_broken_edge') {
          // Remove the broken edge
          setEdges((eds) => {
            const edge = eds.find(e => e.id === targetId)
            const filtered = eds.filter(e => e.id !== targetId)
            if (filtered.length < eds.length) {
              appliedChanges.push({
                type: 'edge_removed',
                targetId,
                before: edge,
                after: null,
                timestamp: Date.now(),
              })
              appliedActions.push(`Removed broken edge ${targetId}`)
            }
            return filtered
          })
        } else if (action === 'validate_and_enhance') {
          // Add metadata to node
          setNodes((nds) => 
            nds.map((node) => {
              if (node.id === targetId) {
                const before = { ...node.data }
                const updatedData = {
                  ...node.data,
                  validated: true,
                  validatedAt: Date.now(),
                  custodianChecked: true,
                }
                
                appliedChanges.push({
                  type: 'node_updated',
                  targetId,
                  before,
                  after: updatedData,
                  timestamp: Date.now(),
                })
                
                appliedActions.push(`Enhanced node with validation metadata`)
                return { ...node, data: updatedData }
              }
              return node
            })
          )
        }
      })
      
      workflow.appliedAt = Date.now()
      workflow.appliedChanges = appliedChanges
      
      // Phase 4: Verification
      const verification = {
        success: appliedActions.length === steps.length,
        fixesVerified: appliedActions,
        issuesRemaining: [],
        qualityScore: Math.round((appliedActions.length / steps.length) * 100),
        recommendation: appliedActions.length === steps.length ? 'success' as const : 'partial' as const,
      }
      
      fixOrchestrator.complete(workflow.id, verification)
      
      // Final report
      const fullReport = generateFixReport(workflow)
      console.log('🛡️ [AWS] Fix Workflow Complete:\n', fullReport)
      
      pushAgentFeedback({
        agent: 'custodian',
        status: 'success',
        title: '✅ Ontogenetic AWS: Fix Applied',
        summary: `Applied ${appliedActions.length} repair action(s) to ${targetId} with ${validation.strength}/100 strength`,
        metrics: [
          {
            label: 'Quality',
            value: `${verification.qualityScore}%`,
            tone: 'positive',
          },
          {
            label: 'Risk',
            value: workflow.riskLevel.toUpperCase(),
            tone: workflow.riskLevel === 'low' ? 'positive' : 'default',
          },
          {
            label: 'Reversible',
            value: impactReport.reversible ? 'Yes' : 'No',
            tone: impactReport.reversible ? 'positive' : 'default',
          },
        ],
        details: appliedActions,
        footnote: `Snapshot ${snapshot.id} created. Fix workflow: ${workflow.id}`,
      })
      
    } catch (error) {
      console.error('🛡️ [AWS] Fix application failed:', error)
      pushAgentFeedback({
        agent: 'custodian',
        status: 'error',
        title: 'AWS Fix Failed',
        summary: 'The ontogenetic fix workflow encountered an error.',
        details: [(error as Error).message],
      })
    }

    setPendingApplyPayload(null)
    setIsApplyModalOpen(false)
  }

  const executeRepairSimulate = (payload: any) => {
    // For now simulate execution: snapshot + feedback
    pushAgentFeedback({
      agent: 'custodian',
      status: 'info',
      title: 'Simulated repair execution',
      summary: `Simulated ${payload.steps.length} repair step(s) against ${payload.targetId}.`,
      details: payload.steps.map((s: any, i: number) => `${i + 1}. ${s.action} -> ${s.target}`),
    })
    setPendingApplyPayload(null)
    setIsApplyModalOpen(false)
  }

  // Update edges with execution state - animate edges connected to executing nodes
  const edgesWithExecution = edges.map(edge => {
    if (!settings.highlightActiveEdges) {
      return edge
    }

    const sourceExecuted = executionResults?.has(edge.source) && executionResults.get(edge.source)?.success
    const targetExecuting = currentExecutingNode === edge.target
    const sourceExecuting = currentExecutingNode === edge.source
    
    // Mark edge as active if data is flowing through it
    const isActive = (sourceExecuted && targetExecuting) || sourceExecuting
    const baseStroke = edge.style?.stroke ?? DEFAULT_EDGE_COLOR
    const activeStroke = '#6366f1'
    const baseWidth = typeof edge.style?.strokeWidth === 'number' ? edge.style?.strokeWidth : 2.5
    const markerColor = isActive ? activeStroke : baseStroke
    const markerTemplate =
      edge.markerEnd && typeof edge.markerEnd === 'object'
        ? edge.markerEnd
        : {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          }
    
    return {
      ...edge,
      animated: isActive,
      className: isActive ? 'active-edge' : '',
      style: {
        ...edge.style,
        stroke: markerColor,
        strokeWidth: isActive ? Math.max(baseWidth, 3.5) : baseWidth,
      },
      markerEnd: {
        ...markerTemplate,
        color: markerColor,
      },
    }
  })

  // Merge execution metadata into nodes for UI (show running / success states)
  const nodesWithExecution = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      executionResult: executionResults?.get(node.id),
      isExecuting: currentExecutingNode === node.id,
    },
  }))

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('🔗 onConnect triggered (drag mode):', params)
      setEdges((eds) => {
        const newEdges = addEdge(params, eds)
        console.log('✅ New edges from onConnect:', newEdges.length)
        return newEdges
      })
    },
    [setEdges]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!settings.enableClickToConnect) {
        onNodeSelect(node.id)
        return
      }

      // Click-to-connect mode
      if (connectingFrom === null) {
        // First click - start connection
        setConnectingFrom(node.id)
        console.log('🔗 Click first node:', node.id)
        // Update node style to show it's selected for connection
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === node.id,
          }))
        )
      } else if (connectingFrom === node.id) {
        // Clicked same node - cancel connection
        console.log('❌ Connection cancelled')
        setConnectingFrom(null)
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: false,
          }))
        )
      } else {
        // Second click - complete connection
        console.log('✅ Click second node:', node.id, '(connecting from', connectingFrom, ')')
        
        const newEdge: Edge = {
          id: `edge-${connectingFrom}-${node.id}-${Date.now()}`,
          source: connectingFrom,
          target: node.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: DEFAULT_EDGE_COLOR, strokeWidth: 2.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: DEFAULT_EDGE_COLOR,
            width: 20,
            height: 20,
          },
        }
        
        setEdges((eds) => {
          const updated = [...eds, newEdge]
          console.log('📊 Updated edges:', updated)
          return updated
        })
        setConnectingFrom(null)
        
        // Clear selection
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: false,
          }))
        )
      }
      
      // Also notify parent of selection
      onNodeSelect(node.id)
    },
    [connectingFrom, onNodeSelect, setNodes, setEdges, settings.enableClickToConnect]
  )

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setEditingNode(node)
      setIsEditorOpen(true)
    },
    []
  )

  const handleSaveNode = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: newData }
          : node
      )
    )
  }, [setNodes])

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false)
    setEditingNode(null)
  }, [])

  // Context menu handlers
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    })
  }, [])

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edge,
    })
  }, [])

  // AI Agent integration
  const handleAskCustodian = useCallback(async (target: Node | Edge) => {
    console.log('🛡️ [CUSTODIAN] Handler called with target:', target)
    console.log('🛡️ [CUSTODIAN] Target type:', target.id, 'hasData:', 'data' in target)
    
    try {
      console.log('🛡️ [CUSTODIAN] Spawning agent...')
      const custodian = spawnAgent<CustodianInput, CustodianOutput>('visual-studio', {
        role: 'custodian',
        model: 'local.llama3.1+custodian-lora',
        tools: ['LawProver', 'Planner'],
        outputSchema: 'Proposal',
        temperature: 0.7,
        maxTokens: 1024,
      })
      console.log('🛡️ [CUSTODIAN] Agent spawned successfully')

      console.log('🛡️ [CUSTODIAN] Executing agent...')
      
      // Analyze actual node/edge to detect real violations
      let violationType: string
      let law: string
      let severity: 'low' | 'medium' | 'high'
      let snapshot: any
      let detectedIssues: string[] = []
      
      if ('data' in target) {
        // Node analysis
        const node = target as Node
        const type = node.type || 'unknown'
        const data = node.data || {}
        
        // Check for missing required fields
        if (!data.entity && ['begin', 'become', 'cease', 'transcend'].includes(type)) {
          violationType = 'missing_entity'
          law = 'ontogenetic_node.entity !== null'
          severity = 'high'
          detectedIssues.push('Missing entity identifier')
          snapshot = { nodeType: type, data, missingFields: ['entity'] }
        }
        // Check for missing properties
        else if (type === 'begin' && (!data.properties || Object.keys(data.properties).length === 0)) {
          violationType = 'incomplete_initialization'
          law = 'begin_node.properties !== empty'
          severity = 'medium'
          detectedIssues.push('BEGIN node should initialize properties')
          snapshot = { nodeType: type, entity: data.entity, properties: data.properties }
        }
        // Check for orphaned nodes (no connections)
        else if (type !== 'begin' && !edges.some(e => e.target === node.id || e.source === node.id)) {
          violationType = 'orphaned_node'
          law = 'non_begin_node.connected === true'
          severity = 'medium'
          detectedIssues.push('Node has no connections')
          snapshot = { nodeId: node.id, nodeType: type, connectedEdges: 0 }
        }
        // Check for invalid transformations
        else if (type === 'become' && !data.transform) {
          violationType = 'missing_transformation'
          law = 'become_node.transform !== null'
          severity = 'high'
          detectedIssues.push('BECOME node missing transformation logic')
          snapshot = { entity: data.entity, transform: data.transform }
        }
        // Check for missing conditions
        else if (type === 'cease' && !data.condition) {
          violationType = 'missing_condition'
          law = 'cease_node.condition !== null'
          severity = 'high'
          detectedIssues.push('CEASE node missing termination condition')
          snapshot = { entity: data.entity, condition: data.condition }
        }
        // Default fallback
        else {
          violationType = 'potential_optimization'
          law = 'node.optimized === true'
          severity = 'low'
          detectedIssues.push('Node could be optimized or enhanced')
          snapshot = { nodeType: type, data }
        }
      } else {
        // Edge analysis
        const edge = target as Edge
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)
        
        if (!sourceNode || !targetNode) {
          violationType = 'broken_edge'
          law = 'edge.source_exists && edge.target_exists'
          severity = 'high'
          detectedIssues.push('Edge references non-existent nodes')
          snapshot = { edgeId: edge.id, source: edge.source, target: edge.target, sourceExists: !!sourceNode, targetExists: !!targetNode }
        } else {
          violationType = 'edge_optimization'
          law = 'edge.labeled === true'
          severity = 'low'
          detectedIssues.push('Edge could benefit from a descriptive label')
          snapshot = { edgeId: edge.id, hasLabel: !!edge.label, sourceType: sourceNode.type, targetType: targetNode.type }
        }
      }

      const result = await custodian.execute({
        violation: {
          violationType,
          entity: target.id,
          law,
          snapshot,
          timestamp: Date.now(),
          severity,
        },
        laws: [
          'ontogenetic_node.entity !== null',
          'begin_node.properties !== empty',
          'become_node.transform !== null',
          'cease_node.condition !== null',
          'non_begin_node.connected === true',
          'edge.source_exists && edge.target_exists',
        ],
        universeState: {
          substrate: 'ontogenetic',
          timestamp: Date.now(),
          nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
          edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
        },
      })
      console.log('🛡️ [CUSTODIAN] Agent executed, result:', result)

      const primaryStep = result.proposal.steps[0]
      const severityStatus = (() => {
        switch (severity) {
          case 'high':
            return 'error'
          case 'medium':
            return 'warning'
          default:
            return 'info'
        }
      })()

      const confidenceTone = result.proposal.confidence >= 0.75
        ? 'positive'
        : result.proposal.confidence <= 0.4
          ? 'negative'
          : 'default'

      pushAgentFeedback({
        agent: 'custodian',
        status: severityStatus,
        title:
          severityStatus === 'error'
            ? 'Critical constraint breach analysed'
            : severityStatus === 'warning'
              ? 'Constraint requires attention'
              : 'Constraint verified',
        summary: result.reasoning?.split('\n')[0] ?? 'Custodian completed a full scan of this element.',
        metrics: [
          {
            label: 'Confidence',
            value: `${(result.proposal.confidence * 100).toFixed(0)}%`,
            tone: confidenceTone,
          },
          {
            label: 'Severity',
            value: severity.toUpperCase(),
            tone: severityStatus === 'error' ? 'negative' : undefined,
          },
          {
            label: 'Repair Steps',
            value: `${result.proposal.steps.length}`,
          },
        ],
        details: result.proposal.steps.slice(0, 4).map((step, index) => `${index + 1}. ${step.action} → ${step.target}`),
        footnote:
          result.alternatives && result.alternatives.length > 0
            ? `${result.alternatives.length} alternative plan${result.alternatives.length === 1 ? '' : 's'} drafted for review.`
            : primaryStep
              ? `Primary step: ${primaryStep.action} on ${primaryStep.target}.`
              : undefined,
        // Provide an applyPayload so UI can offer a one-click fix
        applyPayload: {
          targetId: target.id,
          steps: result.proposal.steps,
          reason: result.reasoning,
          proposalId: result.proposal.id,
        },
      })
    } catch (error) {
      console.error('🛡️ [CUSTODIAN] Error:', error)
      pushAgentFeedback({
        agent: 'custodian',
        status: 'error',
        title: 'Custodian agent unavailable',
        summary: 'The local Custodian model could not be reached. Ensure your AI stack is running.',
        details: [(error as Error).message],
        footnote: 'Run `npm run ai:train` and start the inference server to enable on-device reasoning.',
      })
    }
  }, [nodes, edges, pushAgentFeedback])

  // Listen for user-triggered apply events from the AgentFeedbackPanel
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent
      const payload = ev.detail as { targetId: string; steps: Array<{ action: string; target: string; params?: any }>; reason?: string }
      if (!payload) return
      console.log('🛠️ Received custodian apply payload (showing confirmation):', payload)
      // Store payload and open confirmation modal instead of applying immediately
      setPendingApplyPayload(payload)
      setIsApplyModalOpen(true)
    }

    window.addEventListener('agent-apply', handler as EventListener)
    return () => window.removeEventListener('agent-apply', handler as EventListener)
  }, [])

  const handleExplainWithNarrator = useCallback(async (target: Node | Edge) => {
    console.log('📖 [NARRATOR] Handler called with target:', target)
    console.log('📖 [NARRATOR] Target type:', target.id, 'hasData:', 'data' in target)
    
    try {
      console.log('📖 [NARRATOR] Spawning agent...')
      const narrator = spawnAgent<NarratorInput, NarratorOutput>('visual-studio', {
        role: 'narrator',
        model: 'local.qwen+narrator-lora',
        tools: ['Storyteller', 'WorldBuilder'],
        outputSchema: 'Narrative',
        temperature: 0.85,
        maxTokens: 512,
      })
      console.log('📖 [NARRATOR] Agent spawned successfully')

      const nodeData = 'data' in target ? target.data : {}
      const baseTimestamp = Date.now()
      const events: NarratorInput['events'] = [
        {
          id: `${target.id}-event-1`,
          type: 'violation_detected',
          entity: nodeData.label || target.id,
          timestamp: baseTimestamp,
          causes: [],
          effects: [`${target.id}-event-2`],
          data: nodeData,
        },
        {
          id: `${target.id}-event-2`,
          type: 'repair_proposed',
          entity: nodeData.label || target.id,
          timestamp: baseTimestamp + 1000,
          causes: [`${target.id}-event-1`],
          effects: [`${target.id}-event-3`],
          data: {
            proposalId: `proposal-${target.id}`,
            severity: 'medium',
          },
        },
        {
          id: `${target.id}-event-3`,
          type: 'state_restored',
          entity: nodeData.label || target.id,
          timestamp: baseTimestamp + 2000,
          causes: [`${target.id}-event-2`],
          effects: [],
          data: {
            residualRisk: 'low',
          },
        },
      ]
      console.log('📖 [NARRATOR] Executing agent...')
      const result = await narrator.execute({
        events,
        mode: 'pm',
        focusEntity: target.id,
      })
      console.log('📖 [NARRATOR] Agent executed, result:', result)

      const primaryChain = result.causalChains?.[0]
      const storyPreview = result.story.slice(0, 3).map((frame, index) => `${index + 1}. ${frame.speaker}: ${frame.text}`)
      pushAgentFeedback({
        agent: 'narrator',
        status: 'success',
        title: 'Narrator assembled a storyline',
        summary: result.summary || 'Explanation generated for the selected element.',
        metrics: [
          {
            label: 'Frames',
            value: `${result.story.length}`,
          },
          {
            label: 'Insights',
            value: `${result.keyInsights?.length ?? 0}`,
          },
          {
            label: 'Chains',
            value: `${result.causalChains?.length ?? 0}`,
          },
        ],
        details: storyPreview,
        footnote: primaryChain
          ? `Primary outcome: ${primaryChain.outcome}`
          : 'Trigger another narration for deeper causal arcs.',
      })
    } catch (error) {
      console.error('📖 [NARRATOR] Error:', error)
      pushAgentFeedback({
        agent: 'narrator',
        status: 'error',
        title: 'Narrator agent unavailable',
        summary: 'Unable to generate a narrative. Start the local narrator model and try again.',
        details: [(error as Error).message],
        footnote: 'Narrator relies on the Qwen LoRA adapter generated by the training pipeline.',
      })
    }
  }, [pushAgentFeedback])

  const handleExploreAlternatives = useCallback(async (target: Node | Edge) => {
    console.log('🔮 [EXPLORER] Handler called with target:', target)
    console.log('🔮 [EXPLORER] Target type:', target.id, 'hasData:', 'data' in target)
    
    try {
      console.log('🔮 [EXPLORER] Spawning agent...')
      const explorer = spawnAgent<ExplorerInput, ExplorerOutput>('visual-studio', {
        role: 'explorer',
        model: 'local.llama3.1+explorer-lora',
        tools: ['ParadoxDetector', 'BifurcationAnalyzer'],
        outputSchema: 'Scenarios',
        temperature: 0.7,
        maxTokens: 768,
      })
      console.log('🔮 [EXPLORER] Agent spawned successfully')

      console.log('🔮 [EXPLORER] Executing agent...')
      const paradoxType = 'node' in target ? 'logical' : 'temporal'
      const result = await explorer.execute({
        paradox: {
          id: `paradox-${target.id}`,
          type: paradoxType,
          description: 'Conflicting time-travel law with causality',
          conflictingLaws: ['time.forward_only', 'time_travel.allowed'],
          affectedEntities: [`entity-${target.id}`],
        },
        universeState: {
          substrate: paradoxType === 'temporal' ? 'workflow' : 'physics',
          timestamp: Date.now(),
          nodes: nodes.map(n => ({ id: n.id, type: n.type })),
          edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
        },
        explorationDepth: 3,
      })
      console.log('🔮 [EXPLORER] Agent executed, result:', result)

      const scenarios = result.scenarios || []
      pushAgentFeedback({
        agent: 'explorer',
        status: 'warning',
        title: 'Explorer mapped paradox scenarios',
        summary: `Analyzed ${scenarios.length} possible timelines and highlighted key divergences.`,
        metrics: [
          {
            label: 'Resolutions',
            value: `${result.analysis.paradoxResolutions}`,
          },
          {
            label: 'Stable Outcomes',
            value: `${result.analysis.stableOutcomes}`,
          },
          {
            label: 'Emergent Signals',
            value: `${result.analysis.emergentBehaviors.length}`,
          },
        ],
        details: scenarios.slice(0, 4).map((scenario, index) => `${index + 1}. ${scenario.name}: ${scenario.expectedOutcomes.join(', ')}`),
        footnote: result.recommendations[0] ?? 'Review emergent behaviors for timeline safeguards.',
      })
    } catch (error) {
      console.error('🔮 [EXPLORER] Error:', error)
      pushAgentFeedback({
        agent: 'explorer',
        status: 'error',
        title: 'Explorer agent unavailable',
        summary: 'Paradox exploration failed because the local explorer model is offline.',
        details: [(error as Error).message],
        footnote: 'Launch the explorer inference runtime to simulate alternate timelines.',
      })
    }
  }, [nodes, edges, pushAgentFeedback])

  const handleOpenStoryteller = useCallback(() => {
    setIsStorytellerModalOpen(true)
  }, [])

  const handleCloseStorytellerModal = useCallback(() => {
    setIsStorytellerModalOpen(false)
    setStorytellerInput('')
  }, [])

  const handleStorytellerSubmit = useCallback(async () => {
    if (!storytellerInput.trim()) {
      pushAgentFeedback({
        agent: 'storyteller',
        status: 'warning',
        title: 'Empty story provided',
        summary: 'Please provide a natural language description of your workflow.',
      })
      return
    }

    console.log('\ud83c\udfa8 [STORYTELLER] Processing story...', storytellerInput)
    
    try {
      const storyteller = spawnAgent<StorytellerInput, StorytellerOutput>('visual-studio', {
        role: 'storyteller',
        model: 'local.llama3.1+storyteller-lora',
        tools: ['NLPParser', 'PipelineBuilder'],
        outputSchema: 'UniversePipeline',
        temperature: 0.75,
        maxTokens: 1536,
      })

      // create an AbortController for this execution and keep a ref to it so UI can cancel
      const controller = new AbortController()
      storytellerAbortRef.current.controller = controller
      setIsGeneratingPipeline(true)

      const result = await storyteller.execute({
        naturalLanguageStory: storytellerInput,
        context: {
          existingNodes: nodes.map(n => ({ id: n.id, type: n.type ?? 'unknown', data: n.data })),
          existingEdges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
          domain: 'generic',
        },
        userIntent: 'create',
        preferences: {
          verbosity: 'balanced',
          autoConnect: true,
          suggestConstraints: true,
        },
      }, controller.signal)

      console.log('\ud83c\udfa8 [STORYTELLER] Pipeline generated:', result)

      // Add the generated pipeline to canvas
      const maxId = Math.max(0, ...nodes.map(n => Number.parseInt(n.id.replace(/\\D/g, ''), 10) || 0))
      const newNodes: Node[] = result.pipeline.nodes.map((pnode, idx) => ({
        id: `storyteller-${maxId + idx + 1}`,
        type: pnode.type,
        position: pnode.position,
        data: pnode.data,
      }))

      const newEdges: Edge[] = result.pipeline.edges.map((pedge, idx) => ({
        id: `storyteller-edge-${maxId + idx + 1}`,
        source: newNodes.find(n => n.id.endsWith(pedge.source.split('-').pop() ?? ''))?.id ?? pedge.source,
        target: newNodes.find(n => n.id.endsWith(pedge.target.split('-').pop() ?? ''))?.id ?? pedge.target,
        label: pedge.label,
        animated: true,
      }))

      setNodes(nds => [...nds, ...newNodes])
      setEdges(eds => [...eds, ...newEdges])

      pushAgentFeedback({
        agent: 'storyteller',
        status: 'success',
        title: 'Story translated into pipeline',
        summary: result.reasoning || 'Your story has been transformed into an ontogenetic workflow.',
        metrics: [
          {
            label: 'Nodes Created',
            value: `${newNodes.length}`,
            tone: 'positive',
          },
          {
            label: 'Edges',
            value: `${newEdges.length}`,
          },
          {
            label: 'Confidence',
            value: `${Math.round((result.interpretations.reduce((sum, i) => sum + i.confidence, 0) / result.interpretations.length) * 100)}%`,
          },
        ],
        details: result.suggestions.slice(0, 3).map((sug, i) => `${i + 1}. ${sug.description}`),
        footnote: result.narrative.enhanced,
      })

    } catch (error) {
      console.error('\ud83c\udfa8 [STORYTELLER] Error:', error)
      pushAgentFeedback({
        agent: 'storyteller',
        status: 'error',
        title: 'Storyteller agent unavailable',
        summary: 'Unable to translate your story. Ensure the storyteller model is running.',
        details: [(error as Error).message],
        footnote: 'The Storyteller uses NLP to map natural language descriptions to universe pipelines.',
      })
    } finally {
      setIsGeneratingPipeline(false)
      // clear controller ref
      storytellerAbortRef.current.controller = null
    }
  }, [storytellerInput, nodes, edges, pushAgentFeedback, setNodes, setEdges, handleCloseStorytellerModal])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setIsDraggingOver(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setIsDraggingOver(false)
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      setIsDraggingOver(false)

      const data = event.dataTransfer.getData('application/reactflow')
      if (!data) return

      const { nodeType, data: nodeData } = JSON.parse(data)
      
      // Convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // For ontogenetic operators, ensure all required fields are present
      let enhancedData = nodeData
      if (['begin', 'become', 'cease', 'transcend'].includes(nodeType)) {
        enhancedData = {
          entity: nodeData.name || nodeType.toUpperCase(),
          properties: {},
          narrative: nodeData.metaphor || `${nodeType} operation`,
          status: 'idle',
          color: nodeData.color,
          ...nodeData, // preserve any extra fields
        }
      } else if (nodeType === 'resolve') {
        enhancedData = {
          entity: nodeData.name || 'conflict',
          strategy: nodeData.strategy || 'merge',
          narrative: nodeData.metaphor || 'Resolve conflicts automatically',
          status: 'idle',
          conflictCount: 0,
          ...nodeData,
        }
      }

      const newNode: Node = {
        id: `${nodeType}-${nodeIdCounter.current++}`,
        type: nodeType,
        position,
        data: enhancedData,
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [screenToFlowPosition, setNodes]
  )

  // Handle keyboard delete
  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedNodes = getNodes().filter(node => node.selected)
      const selectedEdges = getEdges().filter(edge => edge.selected)
      
      if (selectedNodes.length > 0) {
        const nodeIds = selectedNodes.map(n => n.id)
        setNodes(nds => nds.filter(n => !nodeIds.includes(n.id)))
        // Also remove connected edges
        setEdges(eds => eds.filter(e => 
          !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
        ))
        onNodeSelect(null)
      }
      
      if (selectedEdges.length > 0) {
        const edgeIds = selectedEdges.map(e => e.id)
        setEdges(eds => eds.filter(e => !edgeIds.includes(e.id)))
      }
    }
  }, [getNodes, getEdges, setNodes, setEdges, onNodeSelect])

  useEffect(() => {
    if (!settings.enableClickToConnect) {
      setConnectingFrom(null)
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: false,
        }))
      )
    }
  }, [settings.enableClickToConnect, setNodes])

  return (
    <div 
      ref={setWrapperRef}
      className={`canvas ${isDraggingOver ? 'drag-over' : ''}`}
      onDrop={onDrop} 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {settings.enableClickToConnect && connectingFrom && (
        <div className="connection-banner">
          <div className="pulse"></div>
          <span>Click another node to connect (or click the same node to cancel)</span>
        </div>
      )}
      
      {/* Debug: Show edge count */}
      {settings.showEdgeCountOverlay && (
        <div className="edge-counter">
          🔗 Edges: {edges.length}
        </div>
      )}
      
      <ReactFlow
        nodes={nodesWithExecution}
        edges={edgesWithExecution}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={settings.snapToGrid}
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: DEFAULT_EDGE_COLOR, strokeWidth: 2.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: DEFAULT_EDGE_COLOR,
            width: 20,
            height: 20,
          },
        }}
        fitView
        deleteKeyCode={['Delete', 'Backspace']}
      >
        <Controls />
        {settings.showGrid && (
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1.5}
            color="rgba(167, 139, 250, 0.15)"
          />
        )}
      </ReactFlow>

      <NodeEditor
        node={editingNode}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveNode}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          edge={contextMenu.edge}
          onClose={handleCloseContextMenu}
          onAskCustodian={handleAskCustodian}
          onExplainWithNarrator={handleExplainWithNarrator}
          onExploreAlternatives={handleExploreAlternatives}
          onTranslateWithStoryteller={handleOpenStoryteller}
        />
      )}

      {/* Storyteller Modal */}
      {isStorytellerModalOpen && (
        <div className="storyteller-modal-overlay" onClick={handleCloseStorytellerModal}>
          <div className="storyteller-modal" onClick={(e) => e.stopPropagation()}>
            <div className="storyteller-modal-header">
              <h3>\ud83c\udfa8 Storyteller AI</h3>
              <button className="storyteller-modal-close" onClick={handleCloseStorytellerModal}>\u2715</button>
            </div>
            <div className="storyteller-modal-body">
              <p className="storyteller-modal-instructions">
                Describe your workflow in natural language. The Storyteller will translate it into ontogenetic operators.
              </p>
              <textarea
                className="storyteller-modal-textarea"
                placeholder="Example: Users sign up with an email, deposit funds, and can transfer money to friends. Balance can't go negative..."
                value={storytellerInput}
                onChange={(e) => setStorytellerInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className="storyteller-modal-footer">
              <button className="storyteller-modal-button secondary" onClick={handleCloseStorytellerModal}>
                Cancel
              </button>
              <button className="storyteller-modal-button primary" onClick={handleStorytellerSubmit}>
                Generate Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isGeneratingPipeline && (
        <div className="storyteller-loading-overlay">
          <div className="storyteller-loading-spinner">
            <div className="spinner"></div>
            <p>🎨 Translating your story into a universe pipeline...</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="storyteller-loading-cancel"
                onClick={() => {
                  // best-effort cancel: abort controller if present, hide overlay, and notify user
                  try {
                    storytellerAbortRef.current.controller?.abort()
                  } catch (e) {
                    /* ignore */
                  }
                  setIsGeneratingPipeline(false)
                  pushAgentFeedback({
                    agent: 'storyteller',
                    status: 'warning',
                    title: 'Generation cancelled',
                    summary: 'You cancelled the pipeline generation.',
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Confirmation Modal */}
      {isApplyModalOpen && pendingApplyPayload && (
        <div className="apply-modal-overlay" onClick={() => { setIsApplyModalOpen(false); setPendingApplyPayload(null) }}>
          <div className="apply-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apply-modal-header">
              <h3>Apply proposed repair?</h3>
              <button className="apply-modal-close" onClick={() => { setIsApplyModalOpen(false); setPendingApplyPayload(null) }}>&times;</button>
            </div>
            <div className="apply-modal-body">
              <p>The Custodian proposed the following steps to repair <strong>{pendingApplyPayload.targetId}</strong>. Choose an action:</p>
              <ol>
                {pendingApplyPayload.steps.map((s: any, i: number) => (
                  <li key={i}>{s.action} → {s.target}</li>
                ))}
              </ol>
            </div>
            <div className="apply-modal-footer">
              <button className="apply-modal-button" onClick={() => { setIsApplyModalOpen(false); setPendingApplyPayload(null) }}>Cancel</button>
              <button className="apply-modal-button" onClick={() => pendingApplyPayload && applyToCanvas(pendingApplyPayload)}>Apply to canvas</button>
              <button className="apply-modal-button primary" onClick={() => pendingApplyPayload && executeRepairSimulate(pendingApplyPayload)}>Simulate execution</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
