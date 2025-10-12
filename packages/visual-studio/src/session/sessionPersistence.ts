/**
 * Session Persistence System with Activity Tracking
 *
 * Automatically signs out users after 30 minutes of inactivity,
 * but preserves their work state for seamless restoration on sign-in.
 */

import { createStore } from '../../../../src/storeFactory'

// ============================================================================
// TYPES
// ============================================================================

export interface ActivityState {
  lastActivityTime: number
  isActive: boolean
  activityCount: number
}

export interface WorkState {
  currentUniverseId: string | null
  openModals: string[]
  editorState: {
    code: string
    cursorPosition: number
    selectedText: string
  } | null
  marketplaceFilters: {
    category: string
    searchQuery: string
    sortBy: string
  } | null
  navigationPath: string
  scrollPositions: Record<string, number>
  unsavedChanges: boolean
  // Canvas/Universe state
  canvasState: {
    nodes: Array<{
      id: string
      type?: string
      position: { x: number; y: number }
      data: unknown
      [key: string]: unknown
    }>
    edges: Array<{
      id: string
      source: string
      target: string
      [key: string]: unknown
    }>
    viewport: {
      x: number
      y: number
      zoom: number
    }
  } | null
  integrationState: {
    accountIds: string[]
    bindingIds: string[]
    draftIds: string[]
    lastSyncedAt: string | null
  }
  universeState: {
    activeUniverseId: string | null
    lastViewedUniverseId: string | null
    recentUniverseIds: string[]
    draftUniverseIds: string[]
  }
}

export interface SessionState {
  userId: string | null
  sessionId: string | null
  activity: ActivityState
  workState: WorkState
  autoLogoutEnabled: boolean
  inactivityTimeoutMs: number
  lastSavedAt: number
  restoredFromAutoLogout: boolean
}

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_THRESHOLD = 28 * 60 * 1000  // 28 minutes (2 min warning)

const initialState: SessionState = {
  userId: null,
  sessionId: null,
  activity: {
    lastActivityTime: Date.now(),
    isActive: true,
    activityCount: 0,
  },
  workState: {
    currentUniverseId: null,
    openModals: [],
    editorState: null,
    marketplaceFilters: null,
    navigationPath: '/',
    scrollPositions: {},
    unsavedChanges: false,
    canvasState: null,
    integrationState: {
      accountIds: [],
      bindingIds: [],
      draftIds: [],
      lastSyncedAt: null,
    },
    universeState: {
      activeUniverseId: null,
      lastViewedUniverseId: null,
      recentUniverseIds: [],
      draftUniverseIds: [],
    },
  },
  autoLogoutEnabled: true,
  inactivityTimeoutMs: INACTIVITY_TIMEOUT,
  lastSavedAt: Date.now(),
  restoredFromAutoLogout: false,
}

// ============================================================================
// FORTISTATE STORE
// ============================================================================

export const sessionStore = createStore<SessionState>('session', {
  value: initialState,
})

// ============================================================================
// VALIDATION & AUTO-LOGOUT CONSTRAINT
// ============================================================================

let logoutCallback: (() => void) | null = null
let warningCallback: ((minutesRemaining: number) => void) | null = null
let preSaveCallback: (() => void) | null = null

/**
 * Validate and enforce auto-logout constraint
 */
function validateAndRepair(state: SessionState): SessionState {
  if (!state.autoLogoutEnabled || !state.userId) {
    return state
  }

  const now = Date.now()
  const inactiveTime = now - state.activity.lastActivityTime
  const shouldWarn = inactiveTime >= WARNING_THRESHOLD && inactiveTime < state.inactivityTimeoutMs

  // Constraint: Auto-logout after inactivity timeout
  if (inactiveTime >= state.inactivityTimeoutMs && state.activity.isActive) {
    console.log(`[Session] Auto-logout triggered after ${Math.floor(inactiveTime / 60000)} minutes of inactivity`)
    
    // Persist work state to localStorage before logout
    saveWorkStateToStorage(state)
    
    // Trigger logout callback
    if (logoutCallback) {
      setTimeout(() => logoutCallback?.(), 0)
    }

    return {
      ...state,
      activity: {
        ...state.activity,
        isActive: false,
      },
    }
  }

  // Warning before auto-logout
  if (shouldWarn && warningCallback) {
    const timeRemaining = state.inactivityTimeoutMs - inactiveTime
    const minutesRemaining = Math.ceil(timeRemaining / 60000)
    
    // Only warn once when crossing threshold
    const prevInactiveTime = inactiveTime - 1000 // Approximate previous check
    if (prevInactiveTime < WARNING_THRESHOLD) {
      console.log(`[Session] Warning: Auto-logout in ${minutesRemaining} minutes`)
      setTimeout(() => warningCallback?.(minutesRemaining), 0)
    }
  }

  return state
}

/**
 * Save work state to localStorage for restoration
 */
function saveWorkStateToStorage(state: SessionState): void {
  console.log('💾 [DIAGNOSTIC] saveWorkStateToStorage called')
  console.log('👤 [DIAGNOSTIC] User ID:', state.userId)
  
  if (!state.userId) {
    console.warn('⚠️ [DIAGNOSTIC] No userId - skipping save')
    return
  }

  const storageKey = `fortistate_session_${state.userId}`
  console.log('🔑 [DIAGNOSTIC] Storage key:', storageKey)
  
  const dataToSave = {
    workState: state.workState,
    sessionId: state.sessionId,
    savedAt: Date.now(),
  }

  console.log('📦 [DIAGNOSTIC] Data to save:', {
    canvasNodes: dataToSave.workState?.canvasState?.nodes?.length || 0,
    canvasEdges: dataToSave.workState?.canvasState?.edges?.length || 0,
    integrationAccounts: dataToSave.workState?.integrationState?.accountIds?.length || 0,
    bindings: dataToSave.workState?.integrationState?.bindingIds?.length || 0,
    savedUniverses: dataToSave.workState?.universeState?.recentUniverseIds?.length || 0,
    sessionId: dataToSave.sessionId,
    hasWorkState: !!dataToSave.workState
  })

  try {
    const payload = JSON.stringify(dataToSave)
    console.log('📝 [DIAGNOSTIC] Payload size:', payload.length, 'characters')
    
    localStorage.setItem(storageKey, payload)
    console.log('✅ [DIAGNOSTIC] Successfully wrote to localStorage')
    
    // Verify the write
    const verification = localStorage.getItem(storageKey)
    if (verification) {
      const parsed = JSON.parse(verification)
      console.log('✅ [DIAGNOSTIC] Verification - canvas nodes in storage:', parsed.workState?.canvasState?.nodes?.length || 0)
      console.log('📊 [DIAGNOSTIC] Full persisted state:', JSON.stringify(parsed, null, 2))
    } else {
      console.error('❌ [DIAGNOSTIC] Verification failed - nothing in localStorage!')
    }
  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Failed to save work state:', error)
    console.error('🔍 [DIAGNOSTIC] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
  }
}

/**
 * Restore work state from localStorage
 */
function restoreWorkStateFromStorage(userId: string): WorkState | null {
  console.log('🔄 [DIAGNOSTIC] restoreWorkStateFromStorage called')
  console.log('👤 [DIAGNOSTIC] User ID:', userId)
  
  const storageKey = `fortistate_session_${userId}`
  console.log('🔑 [DIAGNOSTIC] Storage key:', storageKey)

  try {
    const saved = localStorage.getItem(storageKey)
    console.log('📦 [DIAGNOSTIC] Raw data from localStorage:', saved ? `${saved.length} characters` : 'null')
    
    if (!saved) {
      console.warn('⚠️ [DIAGNOSTIC] No saved data found in localStorage')
      return null
    }

    const data = JSON.parse(saved)
    console.log('📊 [DIAGNOSTIC] Parsed data:', {
      hasWorkState: !!data.workState,
      canvasNodes: data.workState?.canvasState?.nodes?.length || 0,
      canvasEdges: data.workState?.canvasState?.edges?.length || 0,
      integrationAccounts: data.workState?.integrationState?.accountIds?.length || 0,
      savedUniverses: data.workState?.universeState?.recentUniverseIds?.length || 0,
      savedAt: new Date(data.savedAt).toISOString()
    })
    
    const age = Date.now() - data.savedAt
    const ageHours = Math.floor(age / (60 * 60 * 1000))
    console.log('⏰ [DIAGNOSTIC] Data age:', ageHours, 'hours')

    // Only restore if saved within last 24 hours
    if (age > 24 * 60 * 60 * 1000) {
      console.warn('⚠️ [DIAGNOSTIC] Data too old, removing')
      localStorage.removeItem(storageKey)
      return null
    }

    console.log('✅ [DIAGNOSTIC] Work state restored from localStorage')
    console.log('📝 [DIAGNOSTIC] Full restored state:', JSON.stringify(data.workState, null, 2))
    return data.workState
  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Failed to restore work state:', error)
    console.error('🔍 [DIAGNOSTIC] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return null
  }
}

// ============================================================================
// ACTIVITY TRACKING
// ============================================================================

let activityCheckInterval: number | null = null

/**
 * Start activity monitoring
 */
export function startActivityTracking(): void {
  // Track user interactions
  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
  
  const handleActivity = () => {
    const state = sessionStore.get()
    if (!state.userId) return

    const newState = validateAndRepair({
      ...state,
      activity: {
        lastActivityTime: Date.now(),
        isActive: true,
        activityCount: state.activity.activityCount + 1,
      },
      lastSavedAt: Date.now(),
    })

    sessionStore.set(newState)
  }

  // Throttle activity updates (max once per second)
  let lastUpdate = 0
  const throttledHandler = () => {
    const now = Date.now()
    if (now - lastUpdate > 1000) {
      lastUpdate = now
      handleActivity()
    }
  }

  events.forEach(event => {
    window.addEventListener(event, throttledHandler, { passive: true })
  })

  // Check for inactivity every 30 seconds
  activityCheckInterval = setInterval(() => {
    const state = sessionStore.get()
    const validated = validateAndRepair(state)
    if (validated !== state) {
      sessionStore.set(validated)
    }
  }, 30000)

  console.log('[Session] Activity tracking started')
}

/**
 * Stop activity monitoring
 */
export function stopActivityTracking(): void {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval)
    activityCheckInterval = null
  }
  console.log('[Session] Activity tracking stopped')
}

// ============================================================================
// SESSION ACTIONS
// ============================================================================

export const sessionActions = {
  /**
   * Initialize session for user
   */
  startSession: (userId: string, clerkSessionId: string) => {
    console.log('🚀 [DIAGNOSTIC] startSession called')
    console.log('👤 [DIAGNOSTIC] User ID:', userId)
    console.log('🆔 [DIAGNOSTIC] Clerk Session ID:', clerkSessionId)
    console.log('🔐 [DIAGNOSTIC] Persistence method: localStorage')
    
    const state = sessionStore.get()
    console.log('📊 [DIAGNOSTIC] Current session store state:', {
      hasUserId: !!state.userId,
      hasWorkState: !!state.workState,
      hasCanvasState: !!state.workState.canvasState
    })
    
    // Try to restore previous work state
    console.log('🔄 [DIAGNOSTIC] Attempting to restore work state from storage...')
    const restoredWorkState = restoreWorkStateFromStorage(userId)
    
    if (restoredWorkState) {
      console.log('✅ [DIAGNOSTIC] Work state restoration successful')
      console.log('📊 [DIAGNOSTIC] Restored canvas nodes:', restoredWorkState.canvasState?.nodes?.length || 0)
      console.log('📊 [DIAGNOSTIC] Restored canvas edges:', restoredWorkState.canvasState?.edges?.length || 0)
    } else {
      console.log('⚠️ [DIAGNOSTIC] No work state to restore - using default')
    }
    
    const newState: SessionState = {
      ...state,
      userId,
      sessionId: clerkSessionId,
      activity: {
        lastActivityTime: Date.now(),
        isActive: true,
        activityCount: 0,
      },
      workState: restoredWorkState || state.workState,
      restoredFromAutoLogout: !!restoredWorkState,
      lastSavedAt: Date.now(),
    }

    console.log('📝 [DIAGNOSTIC] Setting new session state:', {
      userId: newState.userId,
      sessionId: newState.sessionId,
      hasWorkState: !!newState.workState,
      restoredFromAutoLogout: newState.restoredFromAutoLogout,
      canvasNodes: newState.workState.canvasState?.nodes?.length || 0,
      integrationAccounts: newState.workState.integrationState.accountIds.length,
      savedUniverses: newState.workState.universeState.recentUniverseIds.length,
    })
    
    sessionStore.set(newState)
    startActivityTracking()

    console.log('✅ [DIAGNOSTIC] Session started successfully for user:', userId)
    if (restoredWorkState) {
      console.log('🎉 [DIAGNOSTIC] Previous work state has been restored!')
    }
  },

  /**
   * End session (logout)
   */
  endSession: async () => {
    console.log('🛑 [DIAGNOSTIC] endSession called')
    
    // retrieve latest state below after running pre-save hook
    // Allow a registered pre-save hook to flush transient UI state (canvas, etc.)
    console.log('🔄 [DIAGNOSTIC] Running pre-save callback...')
    try {
      preSaveCallback?.()
      console.log('✅ [DIAGNOSTIC] Pre-save callback completed')
    } catch (err) {
      console.error('❌ [DIAGNOSTIC] preSaveCallback failed:', err)
      console.warn('[Session] preSaveCallback failed', err)
    }

    // Wait one microtask for state updates to settle
    console.log('⏳ [DIAGNOSTIC] Waiting for state updates to settle...')
    await Promise.resolve()
    console.log('✅ [DIAGNOSTIC] State settled')

    // Save work state before logout (re-read state after pre-save)
    const latest = sessionStore.get()
    console.log('📊 [DIAGNOSTIC] Latest session state:', {
      userId: latest.userId,
      sessionId: latest.sessionId,
      canvasNodes: latest.workState.canvasState?.nodes?.length || 0,
      canvasEdges: latest.workState.canvasState?.edges?.length || 0
    })
    
    if (latest.userId) {
      console.log('💾 [DIAGNOSTIC] Saving work state before logout...')
      saveWorkStateToStorage(latest)
    } else {
      console.warn('⚠️ [DIAGNOSTIC] No userId - cannot save work state')
    }

    stopActivityTracking()

    console.log('🔄 [DIAGNOSTIC] Resetting session store to initial state')
    sessionStore.set({
      ...initialState,
      activity: {
        ...initialState.activity,
        lastActivityTime: Date.now(),
      },
    })

    console.log('✅ [DIAGNOSTIC] Session ended successfully')
  },

  /**
   * Update work state
   */
  updateWorkState: (updates: Partial<WorkState>) => {
    console.log('📝 [DIAGNOSTIC] updateWorkState called')
    console.log('📊 [DIAGNOSTIC] Updates:', {
      hasCanvasState: !!updates.canvasState,
      canvasNodes: updates.canvasState?.nodes?.length || 0,
      canvasEdges: updates.canvasState?.edges?.length || 0,
      updateKeys: Object.keys(updates)
    })
    
    const state = sessionStore.get()
    console.log('📊 [DIAGNOSTIC] Current state before update:', {
      userId: state.userId,
      hasWorkState: !!state.workState,
      currentCanvasNodes: state.workState.canvasState?.nodes?.length || 0
    })
    
    const newState = {
      ...state,
      workState: {
        ...state.workState,
        ...updates,
      },
      lastSavedAt: Date.now(),
    }

    console.log('📊 [DIAGNOSTIC] New state after update:', {
      canvasNodes: newState.workState.canvasState?.nodes?.length || 0,
      canvasEdges: newState.workState.canvasState?.edges?.length || 0
    })

    sessionStore.set(newState)
    console.log('✅ [DIAGNOSTIC] Session store updated')
    
    // Save to localStorage periodically
    if (state.userId) {
      console.log('💾 [DIAGNOSTIC] Auto-saving to localStorage...')
      saveWorkStateToStorage(newState)
    } else {
      console.warn('⚠️ [DIAGNOSTIC] No userId - skipping auto-save')
    }
  },

  /**
   * Immediately save the current session state to localStorage.
   * Useful to guarantee persistence right before a sign-out or page unload.
   */
  saveNow: () => {
    const state = sessionStore.get()
    saveWorkStateToStorage(state)
  },

  /**
   * Set auto-logout callback
   */
  setLogoutCallback: (callback: () => void) => {
    logoutCallback = callback
  },

  /**
   * Set warning callback
   */
  setWarningCallback: (callback: (minutesRemaining: number) => void) => {
    warningCallback = callback
  },

  /**
   * Register a callback that will be invoked synchronously before the session is saved
   * during `endSession()` so transient UI state can be flushed into the store.
   */
  setPreSaveCallback: (callback: (() => void) | null) => {
    preSaveCallback = callback
  },

  /**
   * Manually trigger activity (for programmatic events)
   */
  recordActivity: () => {
    const state = sessionStore.get()
    if (!state.userId) return

    const newState = validateAndRepair({
      ...state,
      activity: {
        lastActivityTime: Date.now(),
        isActive: true,
        activityCount: state.activity.activityCount + 1,
      },
    })

    sessionStore.set(newState)
  },

  /**
   * Enable/disable auto-logout
   */
  setAutoLogout: (enabled: boolean) => {
    const state = sessionStore.get()
    sessionStore.set({
      ...state,
      autoLogoutEnabled: enabled,
    })
  },

  /**
   * Clear restored flag (after user acknowledges restoration)
   */
  clearRestoredFlag: () => {
    const state = sessionStore.get()
    sessionStore.set({
      ...state,
      restoredFromAutoLogout: false,
    })
  },

  /**
   * Get time until auto-logout
   */
  getTimeUntilLogout: (): number => {
    const state = sessionStore.get()
    if (!state.autoLogoutEnabled || !state.userId) return Infinity

    const inactiveTime = Date.now() - state.activity.lastActivityTime
    const timeRemaining = state.inactivityTimeoutMs - inactiveTime

    return Math.max(0, timeRemaining)
  },
}

// ============================================================================
// SELECTORS
// ============================================================================

export const sessionSelectors = {
  getActivity: (state: SessionState): ActivityState => state.activity,
  
  getWorkState: (state: SessionState): WorkState => state.workState,
  
  isActive: (state: SessionState): boolean => state.activity.isActive,
  
  wasRestored: (state: SessionState): boolean => state.restoredFromAutoLogout,
  
  getInactiveTime: (state: SessionState): number => {
    return Date.now() - state.activity.lastActivityTime
  },
  
  shouldWarnUser: (state: SessionState): boolean => {
    if (!state.autoLogoutEnabled) return false
    const inactiveTime = Date.now() - state.activity.lastActivityTime
    return inactiveTime >= WARNING_THRESHOLD && inactiveTime < state.inactivityTimeoutMs
  },
}
