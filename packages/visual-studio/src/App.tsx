import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { UserButton, useUser } from '@clerk/clerk-react'
import { ReactFlowProvider } from 'reactflow'
import type { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import Canvas from './components/Canvas.tsx'
import { Sidebar } from './components/Sidebar.tsx'
import CodeGenerator from './components/CodeGenerator.tsx'
import ConflictInspector from './components/ConflictInspector.tsx'
import AlgebraView from './components/AlgebraView.tsx'
import NarrativePanel from './components/NarrativePanel.tsx'
import UniverseTree from './components/UniverseTree.tsx'
import SettingsPanel from './components/SettingsPanel.tsx'
import ConnectionCenter from './components/ConnectionCenter.tsx'
import HelpModal from './components/HelpModal.tsx'
import { PresenceAvatars } from './collaboration/PresenceAvatars.tsx'
import { PresenceCursors } from './collaboration/PresenceCursors.tsx'
import { ShareDialog } from './collaboration/ShareDialog.tsx'
import { createExecutionEngine } from './ontogenesisEngine.ts'
import type { Template } from './templates.ts'
import SavedUniversesDashboard from './components/SavedUniversesDashboard.tsx'
import GoLiveLaunchCenter from './components/GoLiveLaunchCenter.tsx'
import { LiveMonitoringDashboard } from './components/LiveMonitoringDashboard.tsx'
import { universeRegistryActions } from './universes/universeRegistryStore.ts'
import { chronotopeStore } from './vomega.ts'
import { useSettings } from './settingsContext.tsx'
import { createCollaborationStore } from './collaboration/collaborationStore.ts'
import type { User, Presence } from './collaboration/types.ts'
import { MarketplaceStore } from './marketplace/marketplaceStore.ts'
import type { Template as MarketplaceTemplate } from './marketplace/types.ts'
import type { SavedUniverseSummary, SavedUniverseVersion, UniverseDraftMetadata } from './integrations/types.ts'
import { BillingStore } from './billing/billingStore.ts'
import type { Subscription } from './billing/types.ts'
import { MarketplaceGallery } from './marketplace/MarketplaceGallery.tsx'
import { PlanSelector } from './billing/PlanSelector.tsx'
import { SessionManager } from './session/SessionComponents.tsx'
import { useSession, useSessionActions, useWorkState, useWasRestored } from './session/useSession.ts'
import { sessionActions as rawSessionActions } from './session/sessionPersistence'
import AgentFeedbackPanel, { type AgentFeedbackEntry } from './components/AgentFeedbackPanel'
import GlassCursor from './components/GlassCursor'
import './App.css'
import ErrorBoundary from './components/ErrorBoundary'
import { integrationSelectors } from './integrations/integrationStore.ts'

// vX: Progressive Depth Modes
type VXMode = 'play' | 'hybrid' | 'algebra'

const mapMarketplaceCategoryToTemplate = (
  category: MarketplaceTemplate['category']
): Template['category'] => {
  switch (category) {
    case 'ecommerce':
      return 'ecommerce'
    case 'gaming':
      return 'game'
    default:
      return 'demo'
  }
}

function App() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentExecutingNode, setCurrentExecutingNode] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false)
  const [isUniverseOpen, setIsUniverseOpen] = useState(false)
  const [isSavedUniversesOpen, setIsSavedUniversesOpen] = useState(false)
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false)
  const [isLiveMonitoringOpen, setIsLiveMonitoringOpen] = useState(false)
  const [loadExampleFn, setLoadExampleFn] = useState<(() => void) | null>(null)
  const [loadTemplateFn, setLoadTemplateFn] = useState<((template: Template) => void) | null>(null)
  const [restoreSessionFn, setRestoreSessionFn] = useState<((nodes: Node[], edges: Edge[]) => void) | null>(null)
  const [vxMode, setVxMode] = useState<VXMode>('play')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isConnectionCenterOpen, setIsConnectionCenterOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
  const [isPlanSelectorOpen, setIsPlanSelectorOpen] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [marketplaceTemplates, setMarketplaceTemplates] = useState<MarketplaceTemplate[]>([])
  const [presenceMap, setPresenceMap] = useState<Map<string, Presence>>(new Map())
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [agentFeedbackEntries, setAgentFeedbackEntries] = useState<AgentFeedbackEntry[]>([])
  const [isAgentInsightsOpen, setIsAgentInsightsOpen] = useState(false)
  const [isGlassCursorActive, setIsGlassCursorActive] = useState(false)
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const canvasViewportRef = useRef<{ x: number; y: number; zoom: number }>({ x: 0, y: 0, zoom: 1 })
  const selectionRef = useRef<{ nodeIds: string[]; edgeIds: string[] }>({ nodeIds: [], edgeIds: [] })
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const appContainerRef = useRef<HTMLDivElement | null>(null)
  const isRestoringRef = useRef<boolean>(false) // Track if we're currently restoring state
  const hasRestoredDataRef = useRef<boolean>(false) // Track if we have data waiting to restore
  const initialLoadCompleteRef = useRef<boolean>(false) // Track if initial load is complete
  // @ts-expect-error - Reserved for future narrative display in UI
  const [executionNarrative, setExecutionNarrative] = useState<string[]>([])
  const { settings } = useSettings()
  const { user: clerkUser } = useUser()
  const { sessionId } = useSession()
  const { updateWorkState, clearRestoredFlag, saveNow } = useSessionActions()
  const workState = useWorkState()
  const wasRestored = useWasRestored()
  const lastRestoredSessionRef = useRef<string | null>(null)

  const persistCanvasState = useCallback(() => {
    console.log('🔍 [DIAGNOSTIC] persistCanvasState called')
    console.log('📊 [DIAGNOSTIC] Current state - nodes:', nodesRef.current.length, 'edges:', edgesRef.current.length)
    console.log('🆔 [DIAGNOSTIC] Session ID:', sessionId)
    console.log('👤 [DIAGNOSTIC] User ID:', clerkUser?.id)
    console.log('🔄 [DIAGNOSTIC] Is restoring:', isRestoringRef.current)
    console.log('🔄 [DIAGNOSTIC] Initial load complete:', initialLoadCompleteRef.current)
    
    // Don't overwrite with empty state during restoration
    if (isRestoringRef.current) {
      console.log('⏸️ [DIAGNOSTIC] Skipping persist - restoration in progress')
      return
    }
    
    // If initial load hasn't been marked complete yet but the user has started editing,
    // allow persistence to begin so we don't lose work.
    if (!initialLoadCompleteRef.current) {
      if (nodesRef.current.length > 0 || edgesRef.current.length > 0 || !hasRestoredDataRef.current) {
        initialLoadCompleteRef.current = true
        console.log('▶️ [DIAGNOSTIC] Initial load flag promoted due to active edits')
      } else {
        console.log('⏸️ [DIAGNOSTIC] Skipping persist - awaiting initial restoration payload')
        return
      }
    }
    
    // Don't save empty state if we have restored data waiting
    if (nodesRef.current.length === 0 && hasRestoredDataRef.current) {
      console.log('⏸️ [DIAGNOSTIC] Skipping persist - have restored data but refs not updated yet')
      return
    }
    
    const serializedState = {
      canvasState: {
        nodes: nodesRef.current.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
          width: node.width,
          height: node.height,
          style: node.style,
          className: node.className,
          selected: node.selected,
          dragging: node.dragging,
        })),
        edges: edgesRef.current.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          animated: edge.animated,
          label: edge.label,
          style: edge.style,
          markerEnd: edge.markerEnd,
          markerStart: edge.markerStart,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
        viewport: canvasViewportRef.current,
      },
    }
    
    console.log('💾 [DIAGNOSTIC] Serialized canvas state:', JSON.stringify(serializedState, null, 2))
    updateWorkState(serializedState)
    console.log('✅ [DIAGNOSTIC] updateWorkState called successfully')
  }, [updateWorkState, sessionId, clerkUser])

  useEffect(() => {
    rawSessionActions.setPreSaveCallback(persistCanvasState)
    return () => {
      rawSessionActions.setPreSaveCallback(null)
    }
  }, [persistCanvasState])

  useEffect(() => {
    console.log('🔐 [DIAGNOSTIC] Auth status changed')
    console.log('👤 [DIAGNOSTIC] User signed in:', !!clerkUser)
    console.log('🆔 [DIAGNOSTIC] User ID:', clerkUser?.id || 'none')
  }, [clerkUser])

  useEffect(() => {
    console.log('🎨 [DIAGNOSTIC] Canvas state from workState:', {
      hasCanvasState: !!workState.canvasState,
      nodeCount: workState.canvasState?.nodes?.length || 0,
      edgeCount: workState.canvasState?.edges?.length || 0,
      viewport: workState.canvasState?.viewport,
    })
    
    // Track if we have restored data waiting
    if (workState.canvasState?.nodes && workState.canvasState.nodes.length > 0) {
      hasRestoredDataRef.current = true
      console.log('🔖 [DIAGNOSTIC] Restored data flag set - have', workState.canvasState.nodes.length, 'nodes to restore')
    }
    
    if (workState.canvasState?.viewport) {
      canvasViewportRef.current = workState.canvasState.viewport
    }
  }, [workState.canvasState])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = () => {
      persistCanvasState()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [persistCanvasState])

  const projectId = 'visual-studio-main'
  const currentUser = useMemo<User>(() => ({
    id: clerkUser?.id || 'user-unknown',
    name: 'Alex Johnson',
    email: 'alex@fortistate.dev',
    avatar: '',
    color: '#8b5cf6',
    tier: 'pro',
  }), [])

  const [collaborationStore] = useState(() => createCollaborationStore(projectId))
  const [marketplaceStore] = useState(() => new MarketplaceStore())
  const [billingStore] = useState(() => new BillingStore())

  const handleInviteUser = useCallback(async (email: string, role: 'viewer' | 'editor' | 'admin') => {
    console.log('✉️ Sending invite:', { email, role })
    await new Promise((resolve) => setTimeout(resolve, 600))
  }, [])

  const handleSelectPlan = useCallback(async (tier: Subscription['tier'], billingCycle: 'monthly' | 'annual') => {
    const updatedSubscription = await billingStore.createSubscription(currentUser.id, tier, billingCycle)
    setSubscription(updatedSubscription)
  }, [billingStore, currentUser.id])

  const remotePresences = useMemo(() => {
    return new Map(
      Array.from(presenceMap.entries()).filter(([userId]) => userId !== currentUser.id)
    )
  }, [presenceMap, currentUser.id])

  const activeCollaborators = useMemo(() => remotePresences.size, [remotePresences])

  useEffect(() => {
    document.body.dataset.theme = settings.theme
  }, [settings.theme])

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      // Check if this is an OAuth callback
      if (code || error) {
        const savedState = sessionStorage.getItem('oauth_state')
        const providerId = sessionStorage.getItem('oauth_provider')

        // Validate state parameter (CSRF protection)
        if (state !== savedState) {
          console.error('[OAuth] ❌ State mismatch - possible CSRF attack')
          console.error('[OAuth] Expected:', savedState)
          console.error('[OAuth] Received:', state)
          alert('Security error: OAuth state mismatch. Please try connecting again.')
          return
        }

        if (error) {
          console.error('[OAuth] ❌ Authorization failed:', error)
          console.error('[OAuth] Error description:', errorDescription)
          
          // Clean up session storage
          sessionStorage.removeItem('oauth_state')
          sessionStorage.removeItem('oauth_provider')
          
          // Show user-friendly error
          alert(`Authorization failed: ${errorDescription || error}\n\nPlease try connecting again.`)
          return
        }

        if (code && providerId) {
          console.log('[OAuth] ✅ Authorization successful!')
          console.log('[OAuth] Provider:', providerId)
          console.log('[OAuth] Authorization code received (length):', code.length)
          
          try {
            // Import integration store
            const { integrationStore } = await import('./integrations/integrationStore')
            const state = integrationStore.get()
            const provider = state.providers.find(p => p.id === providerId)
            
            if (!provider) {
              throw new Error(`Provider ${providerId} not found`)
            }

            console.log('[OAuth] 🔄 Creating authenticated account...')
            
            // Create account with real OAuth credentials
            // Note: In production, you'd exchange the code for tokens on your backend
            // For now, we store the authorization code and provider info
            const account = {
              id: `acct-${providerId}-${Date.now()}`,
              providerId: providerId as any,
              providerName: provider.name,
              status: 'connected' as const,
              lastCheckedAt: new Date().toISOString(),
              connectedAt: new Date().toISOString(),
              displayName: `${provider.name} Account`,
              scopes: provider.oauth?.scopes || [],
              securityTier: 'production' as const,
              metadata: {
                authorizationCode: code,
                authorizedAt: new Date().toISOString(),
                redirectUri: `${window.location.origin}/oauth/callback`,
              },
              credentials: {
                // In production, these would be the exchanged tokens from backend
                // For demo: store the auth code (never expose in real production!)
                type: 'oauth2',
                authorizationCode: code,
                // These would come from backend token exchange:
                // accessToken: '<encrypted>',
                // refreshToken: '<encrypted>',
                // expiresAt: '<timestamp>',
              },
              isVerified: true,
              notices: [
                '✅ Real OAuth connection established',
                '⚠️ Full token exchange requires backend setup',
                'Authorization code stored (set up backend to exchange for access tokens)',
              ],
            }

            // Update store with real account
            integrationStore.set({
              ...state,
              accounts: [...state.accounts.filter(acc => acc.providerId !== providerId), account],
            })

            console.log('[OAuth] ✅ Account created:', account.displayName)
            console.log('[OAuth] Account ID:', account.id)
            console.log('[OAuth] Scopes:', account.scopes.join(', '))

            // Clean up session storage
            sessionStorage.removeItem('oauth_state')
            sessionStorage.removeItem('oauth_provider')

            // Remove OAuth params from URL
            const cleanUrl = window.location.origin + window.location.pathname
            window.history.replaceState({}, document.title, cleanUrl)

            // Open Connection Center to show the newly connected account
            setIsConnectionCenterOpen(true)

            // Show success message
            alert(`✅ Successfully connected ${provider.name}!\n\nYour account is now available in the Connection Center.\n\nNote: Set up a backend to enable full API access.`)

          } catch (err) {
            console.error('[OAuth] ❌ Failed to create account:', err)
            alert(`Failed to create account: ${err instanceof Error ? err.message : 'Unknown error'}`)
          }
        }
      }
    }

    handleOAuthCallback()
  }, [])

  useEffect(() => {
    let isMounted = true

    collaborationStore
      .begin(currentUser)
      .then(() => {
        if (!isMounted) return
        collaborationStore.updatePresence({ status: 'active' })
        setPresenceMap(new Map(collaborationStore.getPresence()))
      })
      .catch((error) => {
        console.warn('⚠️ Collaboration bootstrap failed; running offline', error)
        if (!isMounted) return
        setPresenceMap(new Map([
          [
            currentUser.id,
            {
              userId: currentUser.id,
              user: currentUser,
              sessionId: `offline-${currentUser.id}`,
              projectId,
              cursor: null,
              selection: { nodeIds: [], edgeIds: [] },
              viewport: { x: 0, y: 0, zoom: 1 },
              lastSeen: Date.now(),
              status: 'active',
            } satisfies Presence,
          ],
        ]))
      })

    const presenceUnsub = collaborationStore.on('presence:update', () => {
      if (!isMounted) return
      setPresenceMap(new Map(collaborationStore.getPresence()))
    })

    const syncUnsub = collaborationStore.on('sync:complete', () => {
      if (!isMounted) return
      setPresenceMap(new Map(collaborationStore.getPresence()))
    })

    const userJoinUnsub = collaborationStore.on('user:join', () => {
      if (!isMounted) return
      setPresenceMap(new Map(collaborationStore.getPresence()))
    })

    const userLeaveUnsub = collaborationStore.on('user:leave', () => {
      if (!isMounted) return
      setPresenceMap(new Map(collaborationStore.getPresence()))
    })

    return () => {
      isMounted = false
      presenceUnsub?.()
      syncUnsub?.()
      userJoinUnsub?.()
      userLeaveUnsub?.()
    }
  }, [collaborationStore, currentUser, projectId])

  useEffect(() => {
    const element = canvasRef.current
    if (!element) return

    const handlePointerMove = (event: PointerEvent) => {
      collaborationStore.updatePresence({
        cursor: { x: event.clientX, y: event.clientY, timestamp: Date.now() },
      })
    }

    const handlePointerLeave = () => {
      collaborationStore.updatePresence({ cursor: null })
    }

    const handlePointerDown = () => {
      collaborationStore.updatePresence({
        selection: {
          nodeIds: [...selectionRef.current.nodeIds],
          edgeIds: [...selectionRef.current.edgeIds],
        },
      })
    }

    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerleave', handlePointerLeave)
    element.addEventListener('pointerdown', handlePointerDown)

    return () => {
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerleave', handlePointerLeave)
      element.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [canvasRef, collaborationStore])

  useEffect(() => {
    if (!isMarketplaceOpen) return

    let active = true

    marketplaceStore.browseTemplates({}).then((templates) => {
      if (active) {
        setMarketplaceTemplates(templates)
      }
    })

    return () => {
      active = false
    }
  }, [isMarketplaceOpen, marketplaceStore])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setIsHelpOpen((prev) => !prev)
      }
      if (event.key === ',' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setIsSettingsOpen((prev) => !prev)
      }
      if (event.key === 'Escape') {
        setIsHelpOpen(false)
        setIsSettingsOpen(false)
        setIsShareDialogOpen(false)
        setIsMarketplaceOpen(false)
        setIsPlanSelectorOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const syncChronotope = useCallback(() => {
    const observer = chronotopeStore.getObserver('local')
    if (!observer) return
    const nodes = nodesRef.current
    const edges = edgesRef.current
    chronotopeStore.reconcileSnapshots([
      {
        observer,
        state: { nodes, edges },
        timeline: nodes.map((node) => ({
          id: node.id,
          at: new Date().toISOString(),
          payload: node.data,
        })),
      },
    ])
  }, [])

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    nodesRef.current = newNodes
    syncChronotope()

    const selectedNodeIds = newNodes.filter((node) => node.selected).map((node) => node.id)
    selectionRef.current.nodeIds = selectedNodeIds

    collaborationStore.updatePresence({
      selection: {
        nodeIds: [...selectionRef.current.nodeIds],
        edgeIds: [...selectionRef.current.edgeIds],
      },
    })

    // Save canvas state to session
    persistCanvasState()
  }, [collaborationStore, persistCanvasState, syncChronotope])

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    edgesRef.current = newEdges
    syncChronotope()

    const selectedEdgeIds = newEdges.filter((edge) => edge.selected).map((edge) => edge.id)
    selectionRef.current.edgeIds = selectedEdgeIds

    collaborationStore.updatePresence({
      selection: {
        nodeIds: [...selectionRef.current.nodeIds],
        edgeIds: [...selectionRef.current.edgeIds],
      },
    })

    // Save canvas state to session
    persistCanvasState()
  }, [collaborationStore, persistCanvasState, syncChronotope])

  // vΩ⁺ alpha: register default observers for global/local chronotopes
  useEffect(() => {
    chronotopeStore.registerObserver({
      id: 'global',
      frame: { origin: new Date().toISOString() },
      tags: ['default', 'system'],
    })
    chronotopeStore.registerObserver({
      id: 'local',
      frame: { origin: new Date().toISOString(), metadata: { mode: vxMode } },
      tags: ['user'],
    })
    syncChronotope()
  }, [vxMode, syncChronotope])

  useEffect(() => {
    syncChronotope()
  }, [syncChronotope])

  // Restore canvas state from session
  useEffect(() => {
    console.log('🔄 [DIAGNOSTIC] Restoration effect triggered')
    console.log('🔍 [DIAGNOSTIC] workState.canvasState exists:', !!workState.canvasState)
    console.log('🔍 [DIAGNOSTIC] restoreSessionFn exists:', !!restoreSessionFn)
    console.log('🆔 [DIAGNOSTIC] sessionId:', sessionId)
    console.log('🆔 [DIAGNOSTIC] lastRestoredSessionRef:', lastRestoredSessionRef.current)
    
    const canvasState = workState.canvasState
    const restoreFn = restoreSessionFn

    if (!canvasState || !restoreFn) {
      console.warn('⚠️ [DIAGNOSTIC] Cannot restore - missing canvasState or restoreFn')
      return
    }

    const sessionKey = sessionId ?? 'anonymous'
    const nodes = Array.isArray(canvasState.nodes) ? canvasState.nodes : []
    const edges = Array.isArray(canvasState.edges) ? canvasState.edges : []
    const hasContent = nodes.length > 0 || edges.length > 0

    console.log('📊 [DIAGNOSTIC] Canvas state to restore:', {
      sessionKey,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      hasContent,
      viewport: canvasState.viewport
    })

    if (!hasContent) {
      console.warn('⚠️ [DIAGNOSTIC] No canvas content to restore (empty state)')
      if (wasRestored) {
        clearRestoredFlag()
      }
      lastRestoredSessionRef.current = sessionKey
      // Mark initial load as complete even if empty
      initialLoadCompleteRef.current = true
      console.log('✅ [DIAGNOSTIC] Initial load complete (empty canvas)')
      return
    }

    if (lastRestoredSessionRef.current === sessionKey) {
      console.log('✅ [DIAGNOSTIC] Already restored this session, skipping')
      return
    }

    canvasViewportRef.current = canvasState.viewport ?? { x: 0, y: 0, zoom: 1 }

    const nodesToRestore = nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position ?? { x: 0, y: 0 },
      data: node.data ?? {},
      width: node.width,
      height: node.height,
      style: node.style,
      className: node.className,
      selected: Boolean(node.selected),
      dragging: false,
    })) as Node[]

    const edgesToRestore = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated,
      label: edge.label,
      style: edge.style,
      markerEnd: edge.markerEnd,
      markerStart: edge.markerStart,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })) as Edge[]

    const performRestore = () => {
      console.log('🎉 [DIAGNOSTIC] PERFORMING CANVAS RESTORATION')
      console.log('📊 [DIAGNOSTIC] Restoring canvas state:', {
        nodes: nodesToRestore.length,
        edges: edgesToRestore.length,
        viewport: canvasViewportRef.current
      })
      console.log('📝 [DIAGNOSTIC] Node details:', nodesToRestore.map(n => ({ id: n.id, type: n.type, pos: n.position })))

      // Set flag to prevent persist during restoration
      isRestoringRef.current = true
      console.log('🔒 [DIAGNOSTIC] Restoration lock acquired')

      restoreFn(nodesToRestore, edgesToRestore)

      nodesRef.current = nodesToRestore
      edgesRef.current = edgesToRestore

      syncChronotope()

      if (wasRestored) {
        clearRestoredFlag()
      }

      lastRestoredSessionRef.current = sessionKey
      
      // Release lock after restoration completes
      setTimeout(() => {
        isRestoringRef.current = false
        hasRestoredDataRef.current = false // Clear the restored data flag
        initialLoadCompleteRef.current = true // Mark initial load complete
        console.log('🔓 [DIAGNOSTIC] Restoration lock released')
        console.log('✅ [DIAGNOSTIC] Initial load complete')
      }, 100)
      
      console.log('✅ [DIAGNOSTIC] Canvas restoration complete')
    }

    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      window.requestAnimationFrame(performRestore)
    } else {
      performRestore()
    }
  }, [clearRestoredFlag, restoreSessionFn, sessionId, syncChronotope, wasRestored, workState.canvasState])

  useEffect(() => {
    if (!sessionId) {
      lastRestoredSessionRef.current = null
    }
  }, [sessionId])

  const handleExecuteGraph = useCallback(async () => {
    const nodes = nodesRef.current
    const edges = edgesRef.current
    
    if (isExecuting || nodes.length === 0) return

    setIsExecuting(true)
    setExecutionNarrative([])

    try {
      const engine = createExecutionEngine((progress) => {
        setCurrentExecutingNode(progress.nodeId)
        
        // Update node status via ref
        nodesRef.current = nodesRef.current.map((n: Node) => 
          n.id === progress.nodeId 
            ? { ...n, data: { ...n.data, status: progress.status } }
            : n
        )
      }, workState.currentUniverseId ?? undefined)

      const result = await engine.execute(nodes, edges)
      setExecutionNarrative(result.narrative)
      
      console.log('✅ Execution complete:', result)
      console.log('📖 Narrative:', result.narrative.join('\n'))
      console.log('⚡ Performance:', result.performance)
      console.log('🔌 External Calls:', result.externalCalls)
      
    } catch (error) {
      console.error('❌ Execution error:', error)
    } finally {
      setIsExecuting(false)
      setCurrentExecutingNode(null)
    }
  }, [isExecuting, workState.currentUniverseId])

  const handleLoadExample = useCallback((fn: () => void) => {
    setLoadExampleFn(() => fn)
  }, [])

  const handleLoadTemplate = useCallback((template: Template) => {
    if (loadTemplateFn) {
      loadTemplateFn(template)
      console.log(`📚 Loaded template: ${template.name}`)
    }
  }, [loadTemplateFn])

  const handleRegisterTemplateLoader = useCallback((fn: (template: Template) => void) => {
    setLoadTemplateFn(() => fn)
  }, [])

  const handleRegisterSessionRestore = useCallback((fn: (nodes: Node[], edges: Edge[]) => void) => {
    setRestoreSessionFn(() => fn)
  }, [])

  const handleLoadSavedUniverse = useCallback(
    async (universe: SavedUniverseSummary, version: SavedUniverseVersion) => {
      if (!restoreSessionFn) {
        console.warn('⚠️ Unable to restore universe - restoreSessionFn not registered yet')
        return
      }

      console.log('🌌 Loading saved universe:', { universeId: universe.id, versionId: version.id })

      const nodes = (version.canvasState.nodes ?? []) as Node[]
      const edges = (version.canvasState.edges ?? []) as Edge[]

      restoreSessionFn(nodes, edges)

      nodesRef.current = nodes
      edgesRef.current = edges
      canvasViewportRef.current = version.canvasState.viewport
      hasRestoredDataRef.current = true
      initialLoadCompleteRef.current = true

      updateWorkState({
        canvasState: version.canvasState,
        currentUniverseId: universe.id,
        universeState: {
          ...workState.universeState,
          activeUniverseId: universe.id,
          lastViewedUniverseId: universe.id,
          recentUniverseIds: [
            universe.id,
            ...workState.universeState.recentUniverseIds.filter((id) => id !== universe.id),
          ].slice(0, 12),
        },
      })

      universeRegistryActions.setLastViewed(universe.id)

      selectionRef.current = { nodeIds: [], edgeIds: [] }

      setIsSavedUniversesOpen(false)
      setIsUniverseOpen(true)
    },
    [restoreSessionFn, updateWorkState, workState.universeState]
  )

  const handleSaveCanvas = useCallback(() => {
    console.log('🚀 [DIAGNOSTIC] Save Canvas button clicked')
    console.log('👤 [DIAGNOSTIC] Current user:', clerkUser?.id)
    console.log('🆔 [DIAGNOSTIC] Current session:', sessionId)
    
    try {
      console.log('💾 [DIAGNOSTIC] Calling persistCanvasState...')
      persistCanvasState()
      
      console.log('📝 [DIAGNOSTIC] Calling saveNow...')
      saveNow?.()
      
      console.log('✅ [DIAGNOSTIC] Canvas saved successfully - nodes:', nodesRef.current.length, 'edges:', edgesRef.current.length)
      
      // Show success notification
      setShowSaveNotification(true)
      setTimeout(() => {
        setShowSaveNotification(false)
      }, 3000)
    } catch (err) {
      console.error('❌ [DIAGNOSTIC] Failed to save canvas:', err)
      console.error('🔍 [DIAGNOSTIC] Error stack:', err instanceof Error ? err.stack : 'No stack trace')
    }
  }, [persistCanvasState, saveNow, clerkUser, sessionId])

  const handleSaveUniverse = useCallback(
    async (metadata: UniverseDraftMetadata & { icon?: string }) => {
  console.log('🌌 [Universes] Save Universe requested with metadata:', metadata)

  persistCanvasState()

  const normalizedMetadata: UniverseDraftMetadata = {
        label: metadata.label.trim(),
        description: metadata.description?.trim() || undefined,
        icon: metadata.icon?.trim() || undefined,
        marketTags: (metadata.marketTags ?? []).map(tag => tag.trim()).filter(Boolean),
        targetLaunchDate: metadata.targetLaunchDate,
      }

      const draftId = universeRegistryActions.createDraft(undefined, normalizedMetadata)
      console.log('🆕 [Universes] Draft created:', draftId)

      const serializedNodes = nodesRef.current.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        width: node.width,
        height: node.height,
        style: node.style,
        className: node.className,
        selected: node.selected,
        dragging: node.dragging,
      }))

      const serializedEdges = edgesRef.current.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        label: edge.label,
        style: edge.style,
        markerEnd: edge.markerEnd,
        markerStart: edge.markerStart,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      }))

      const viewport = canvasViewportRef.current ?? { x: 0, y: 0, zoom: 1 }
      const bindings = integrationSelectors.getBindings().map(binding => ({ ...binding }))

      try {
        const result = await universeRegistryActions.saveUniverse(draftId, {
          canvas: {
            nodes: serializedNodes,
            edges: serializedEdges,
            viewport,
          },
          bindings,
          ownerId: clerkUser?.id ?? undefined,
          createdBy: sessionId ?? clerkUser?.id ?? undefined,
        })

        console.log('✅ [Universes] Universe saved successfully:', result.universe.id)
        return result
      } catch (error) {
        console.error('❌ [Universes] Failed to save universe', error)
        universeRegistryActions.removeDraft(draftId)
        throw error
      }
    },
    [clerkUser?.id, sessionId, persistCanvasState]
  )

  const handleMarketplaceTemplateClick = useCallback((template: MarketplaceTemplate) => {
    const requiresPremium = template.pricingModel !== 'free' && template.authorId !== currentUser.id

    if (requiresPremium && !billingStore.hasFeature(currentUser.id, 'premiumTemplates')) {
      console.info('🔒 Premium template requires upgrade')
      setIsPlanSelectorOpen(true)
      return
    }

    const convertedTemplate: Template = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: mapMarketplaceCategoryToTemplate(template.category),
      icon: template.icon || '🧩',
      nodes: template.nodes,
      edges: template.edges,
    }

    if (loadTemplateFn) {
      loadTemplateFn(convertedTemplate)
      console.log(`🧭 Marketplace template loaded: ${template.name}`)
    }

    setIsMarketplaceOpen(false)
  }, [billingStore, currentUser.id, loadTemplateFn])

  const handlePurchaseTemplate = useCallback(async (templateId: string) => {
    const targetTemplate = marketplaceTemplates.find((tpl) => tpl.id === templateId)

    if (targetTemplate && targetTemplate.pricingModel !== 'free' && !billingStore.hasFeature(currentUser.id, 'premiumTemplates')) {
      console.info('🔒 Premium template purchase requires upgrade')
      setIsPlanSelectorOpen(true)
      throw new Error('Upgrade required to purchase premium templates')
    }

    try {
      const purchase = await marketplaceStore.purchaseTemplate(templateId, currentUser.id)
      console.log('💰 Marketplace purchase complete:', purchase)
      const updatedTemplates = await marketplaceStore.browseTemplates({})
      setMarketplaceTemplates(updatedTemplates)
    } catch (error) {
      console.error('❌ Marketplace purchase failed', error)
      throw error
    }
  }, [billingStore, currentUser.id, marketplaceStore, marketplaceTemplates])

  // Handle auto-logout from session manager
  const handleAutoLogout = useCallback(() => {
    console.log('[App] Handling auto-logout')
    // Ensure canvas snapshot is persisted to the session store
    persistCanvasState()
    // Also write the entire session immediately to localStorage
    try {
      saveNow?.()
    } catch (err) {
      console.warn('[App] saveNow failed', err)
    }
    // Note: SessionManager handles the actual logout
  }, [persistCanvasState, saveNow])

  // Agent feedback management
  const handlePushAgentFeedback = useCallback((entry: Omit<AgentFeedbackEntry, 'id' | 'timestamp'>) => {
    const synthesizedId = `agent-feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const timestamp = Date.now()
    setAgentFeedbackEntries((current) => [{ ...entry, id: synthesizedId, timestamp }, ...current].slice(0, 24))
    setIsAgentInsightsOpen(true)
  }, [])

  const handleDismissAgentFeedback = useCallback((id: string) => {
    setAgentFeedbackEntries((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const handleClearAgentFeedback = useCallback(() => {
    setAgentFeedbackEntries([])
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const pointerCapability = window.matchMedia('(pointer: fine)')

    const updateCursorCapability = () => {
      setIsGlassCursorActive(pointerCapability.matches)
    }

    updateCursorCapability()
    pointerCapability.addEventListener('change', updateCursorCapability)
    return () => pointerCapability.removeEventListener('change', updateCursorCapability)
  }, [])

  return (
    <>
      <SessionManager 
        onLogout={handleAutoLogout}
        showActivityIndicator={false}
      />
      <ReactFlowProvider>
        <ErrorBoundary>
          <div className={`app${isGlassCursorActive ? ' glass-cursor-enabled' : ''}`} ref={appContainerRef}>
            {isGlassCursorActive && <GlassCursor containerRef={appContainerRef} />}
          <header className="app-header">
            <div className="header-content">
              <div className="logo-section">
                <div className="logo-icon">⚡</div>
                <div className="logo-text">
                  <span className="brand-name">Fortistate</span>
                  <span className="product-name">Visual Studio</span>
                </div>
              </div>

              <div className="header-center">
                <button
                  className="panel-toggle left"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
                >
                  <span className="toggle-label">📚</span>
                </button>

                {vxMode === 'play' && (
                  <button
                    className="panel-toggle right"
                    onClick={() => setIsExecutionPanelOpen(!isExecutionPanelOpen)}
                    title={isExecutionPanelOpen ? 'Hide Narrative Panel' : 'Show Narrative Panel'}
                  >
                    <span className="toggle-label">📖</span>
                  </button>
                )}
              </div>

              <div className="header-actions">
                <div className="mode-switcher">
                  <button
                    className={`mode-btn ${vxMode === 'play' ? 'active' : ''}`}
                    onClick={() => setVxMode('play')}
                    title="Play Mode - Visual metaphors only"
                  >
                    <span className="mode-icon">🎨</span>
                    <span className="mode-label">Play</span>
                  </button>
                  <button
                    className={`mode-btn ${vxMode === 'hybrid' ? 'active' : ''}`}
                    onClick={() => setVxMode('hybrid')}
                    title="Hybrid Mode - Visual + Algebra"
                  >
                    <span className="mode-icon">🔬</span>
                    <span className="mode-label">Hybrid</span>
                  </button>
                  <button
                    className={`mode-btn ${vxMode === 'algebra' ? 'active' : ''}`}
                    onClick={() => setVxMode('algebra')}
                    title="Algebra Mode - Pure operators"
                  >
                    <span className="mode-icon">⚡</span>
                    <span className="mode-label">Algebra</span>
                  </button>
                </div>

                <div className="mode-divider"></div>

                <div className="collaboration-hub">
                  <PresenceAvatars presences={presenceMap} currentUserId={currentUser.id} />
                  <button
                    className="header-pill"
                    onClick={() => setIsShareDialogOpen(true)}
                    title="Share project"
                  >
                    <span className="pill-label">Share</span>
                    {activeCollaborators > 0 && <span className="pill-badge">{activeCollaborators}</span>}
                  </button>
                  <button
                    className="header-pill"
                    onClick={() => setIsMarketplaceOpen(true)}
                    title="Browse Marketplace"
                  >
                    <span className="pill-label">Marketplace</span>
                  </button>
                  <button
                    className={`header-pill${subscription?.tier !== 'free' ? ' secondary' : ''}`}
                    onClick={() => setIsPlanSelectorOpen(true)}
                    title="Manage subscription"
                  >
                    <span className="pill-label">{subscription?.tier === 'free' ? 'Upgrade' : 'Plan'}</span>
                  </button>
                </div>

                <div className="mode-divider"></div>

                {vxMode === 'play' && (
                  <button
                    className="header-btn"
                    onClick={() => setIsUniverseOpen(!isUniverseOpen)}
                    title={isUniverseOpen ? 'Hide Universe Tree' : 'Show Universe Tree'}
                  >
                    <span>{isUniverseOpen ? '🌌' : '🌑'}</span>
                  </button>
                )}

                <button
                  className="header-btn"
                  title="Saved Universes"
                  onClick={() => setIsSavedUniversesOpen(true)}
                >
                  <span>🗂</span>
                </button>

                <button
                  className="header-btn"
                  title="Go-Live Orchestration"
                  onClick={() => setIsGoLiveOpen(true)}
                >
                  <span>🚀</span>
                </button>

                <button
                  className="header-btn"
                  title="Live Monitoring"
                  onClick={() => setIsLiveMonitoringOpen(true)}
                >
                  <span>📊</span>
                </button>

                <button
                  className="header-btn"
                  title="Connection Center"
                  onClick={() => setIsConnectionCenterOpen(true)}
                >
                  <span>🔗</span>
                </button>
                <button
                  className="header-btn"
                  title="Help (Ctrl/Cmd + ?)"
                  onClick={() => setIsHelpOpen(true)}
                >
                  <span>?</span>
                </button>
                <button
                  className="header-btn"
                  title="Settings (Ctrl/Cmd + ,)"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <span>⚙</span>
                </button>

                <div className="mode-divider"></div>

                <div className="header-auth">
                  <div className="user-session">
                    <UserButton 
                      afterSignOutUrl="/"
                      showName={false}
                      appearance={{
                        elements: {
                          avatarBox: {
                            width: "32px",
                            height: "32px",
                            cursor: "pointer"
                          },
                          userButtonTrigger: {
                            cursor: "pointer"
                          },
                          userButtonPopoverCard: {
                            zIndex: "10000"
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="app-body">
            {vxMode === 'play' && isUniverseOpen && <UniverseTree nodes={nodesRef.current} />}
            {isSidebarOpen && <Sidebar onLoadExample={loadExampleFn} onLoadTemplate={handleLoadTemplate} onSaveCanvas={handleSaveCanvas} />}

            <main className={vxMode === 'hybrid' ? 'hybrid-container' : 'canvas-container'}>
              <Canvas
                onNodeSelect={() => {}}
                currentExecutingNode={currentExecutingNode}
                onLoadExample={handleLoadExample}
                onLoadTemplate={handleRegisterTemplateLoader}
                onRestoreSession={handleRegisterSessionRestore}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                canvasRef={canvasRef}
                onPushAgentFeedback={handlePushAgentFeedback}
              />
              <PresenceCursors presences={remotePresences} canvasRef={canvasRef} />
              {vxMode === 'hybrid' && <AlgebraView />}
            </main>

            {vxMode === 'play' && isExecutionPanelOpen && (
              <NarrativePanel
                nodes={nodesRef.current}
                edges={edgesRef.current}
                isExecuting={isExecuting}
                onExecute={handleExecuteGraph}
              />
            )}
          </div>

          <CodeGenerator />
          <ConflictInspector />

          {/* Agent Insights Toggle */}
          <button
            className="agent-insights-toggle"
            onClick={() => setIsAgentInsightsOpen(!isAgentInsightsOpen)}
            title="Agent Insights"
          >
            {isAgentInsightsOpen ? '✕' : '✨'}
          </button>

          {/* Agent Insights Panel */}
          <div className={`agent-insights-panel ${isAgentInsightsOpen ? 'open' : ''}`}>
            <AgentFeedbackPanel
              entries={agentFeedbackEntries}
              isCollapsed={false}
              onToggleCollapse={() => {}} 
              onDismiss={handleDismissAgentFeedback}
              onClearAll={handleClearAgentFeedback}
            />
          </div>

          <SavedUniversesDashboard
            isOpen={isSavedUniversesOpen}
            onClose={() => setIsSavedUniversesOpen(false)}
            onLoadUniverse={handleLoadSavedUniverse}
            onSaveUniverse={handleSaveUniverse}
          />
          <GoLiveLaunchCenter
            isOpen={isGoLiveOpen}
            onClose={() => setIsGoLiveOpen(false)}
          />
          {isLiveMonitoringOpen && (
            <div className="modal-overlay" onClick={() => setIsLiveMonitoringOpen(false)}>
              <div className="modal-content modal-fullscreen" onClick={(e) => e.stopPropagation()}>
                <LiveMonitoringDashboard />
              </div>
            </div>
          )}
          <ConnectionCenter
            isOpen={isConnectionCenterOpen}
            onClose={() => setIsConnectionCenterOpen(false)}
          />
          <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
          <ShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => setIsShareDialogOpen(false)}
            projectId={projectId}
            currentUser={currentUser}
            onInvite={handleInviteUser}
          />

          {isPlanSelectorOpen && (
            <div className="modal-portal" role="dialog" aria-modal="true" aria-label="Plan selector">
              <div className="overlay-backdrop" onClick={() => setIsPlanSelectorOpen(false)} />
              <div className="overlay-panel plan-panel">
                <button
                  className="overlay-close"
                  onClick={() => setIsPlanSelectorOpen(false)}
                  aria-label="Close plan selector"
                >
                  ×
                </button>
                <PlanSelector
                  currentTier={subscription?.tier ?? 'free'}
                  onSelectPlan={handleSelectPlan}
                  onClose={() => setIsPlanSelectorOpen(false)}
                />
              </div>
            </div>
          )}

          {isMarketplaceOpen && (
            <div className="modal-portal" role="dialog" aria-modal="true" aria-label="Marketplace">
              <div className="overlay-backdrop" onClick={() => setIsMarketplaceOpen(false)} />
              <div className="overlay-panel marketplace-panel">
                <button
                  className="overlay-close"
                  onClick={() => setIsMarketplaceOpen(false)}
                  aria-label="Close marketplace"
                >
                  ×
                </button>
                <MarketplaceGallery
                  templates={marketplaceTemplates}
                  onTemplateClick={handleMarketplaceTemplateClick}
                  onPurchase={handlePurchaseTemplate}
                  currentUserId={currentUser.id}
                />
              </div>
            </div>
          )}

          {/* Save Canvas Notification */}
          {showSaveNotification && (
            <div className="save-notification">
              <div className="save-notification-content">
                <div className="save-notification-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="save-notification-text">
                  <strong>Canvas Saved!</strong>
                  <span>{nodesRef.current.length} nodes, {edgesRef.current.length} edges</span>
                </div>
              </div>
            </div>
          )}
        </div>
        </ErrorBoundary>
      </ReactFlowProvider>
    </>
  )
}

export default App
