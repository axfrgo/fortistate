/**
 * React Hooks for Session Persistence
 */

import { useSyncExternalStore } from 'react'
import {
  sessionStore,
  sessionActions,
  sessionSelectors,
  type SessionState,
  type ActivityState,
  type WorkState,
} from './sessionPersistence'

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access full session state
 */
export function useSessionState(): SessionState {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.get,
    sessionStore.get
  )
}

/**
 * Hook to get activity state
 */
export function useActivity(): ActivityState {
  const state = useSessionState()
  return sessionSelectors.getActivity(state)
}

/**
 * Hook to get work state
 */
export function useWorkState(): WorkState {
  const state = useSessionState()
  return sessionSelectors.getWorkState(state)
}

/**
 * Hook to check if user is active
 */
export function useIsActive(): boolean {
  const state = useSessionState()
  return sessionSelectors.isActive(state)
}

/**
 * Hook to check if session was restored from auto-logout
 */
export function useWasRestored(): boolean {
  const state = useSessionState()
  return sessionSelectors.wasRestored(state)
}

/**
 * Hook to get inactive time in milliseconds
 */
export function useInactiveTime(): number {
  const state = useSessionState()
  return sessionSelectors.getInactiveTime(state)
}

/**
 * Hook to check if user should be warned about impending logout
 */
export function useShouldWarn(): boolean {
  const state = useSessionState()
  return sessionSelectors.shouldWarnUser(state)
}

/**
 * Hook to get time until auto-logout in milliseconds
 */
export function useTimeUntilLogout(): number {
  return sessionActions.getTimeUntilLogout()
}

/**
 * Hook to get session actions
 */
export function useSessionActions() {
  return sessionActions
}

/**
 * Comprehensive session hook
 */
export function useSession() {
  const state = useSessionState()
  const activity = sessionSelectors.getActivity(state)
  const workState = sessionSelectors.getWorkState(state)
  const isActive = sessionSelectors.isActive(state)
  const wasRestored = sessionSelectors.wasRestored(state)
  const inactiveTime = sessionSelectors.getInactiveTime(state)

  return {
    // State
    userId: state.userId,
    sessionId: state.sessionId,
    activity,
    workState,
    autoLogoutEnabled: state.autoLogoutEnabled,
    
    // Computed
    isActive,
    wasRestored,
    inactiveTime,
    inactiveMinutes: Math.floor(inactiveTime / 60000),
    timeUntilLogout: sessionActions.getTimeUntilLogout(),
    
    // Actions
    actions: sessionActions,
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type SessionState,
  type ActivityState,
  type WorkState,
} from './sessionPersistence'
