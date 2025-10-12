/**
 * Session UI Components
 * 
 * Warning dialogs and restoration notifications
 */

import { useEffect, useState } from 'react'
import { useWasRestored, useTimeUntilLogout, useSessionActions } from './useSession'
import './SessionComponents.css'

// ============================================================================
// INACTIVITY WARNING MODAL
// ============================================================================

interface InactivityWarningProps {
  onStaySignedIn: () => void
  onSignOut: () => void
}

export function InactivityWarning({ onStaySignedIn, onSignOut }: InactivityWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const timeUntilLogout = useTimeUntilLogout()

  useEffect(() => {
    setTimeRemaining(Math.ceil(timeUntilLogout / 60000))
    
    const interval = setInterval(() => {
      const remaining = Math.ceil(timeUntilLogout / 60000)
      setTimeRemaining(remaining)
      
      if (remaining <= 0) {
        // Auto-logout happening, close warning
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timeUntilLogout])

  return (
    <div className="session-modal-overlay">
      <div className="session-warning-modal">
        <div className="session-warning-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="currentColor"
            />
          </svg>
        </div>
        
        <h2>Still there?</h2>
        <p>
          You've been inactive for a while. For your security, you'll be automatically
          signed out in <strong>{timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}</strong>.
        </p>
        <p className="session-warning-subtext">
          Don't worry - your work will be saved and restored when you sign back in.
        </p>

        <div className="session-warning-actions">
          <button
            className="session-button session-button-primary"
            onClick={onStaySignedIn}
          >
            Stay Signed In
          </button>
          <button
            className="session-button session-button-secondary"
            onClick={onSignOut}
          >
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SESSION RESTORED NOTIFICATION
// ============================================================================

export function SessionRestoredNotification() {
  const wasRestored = useWasRestored()
  const { clearRestoredFlag } = useSessionActions()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (wasRestored) {
      setVisible(true)
    }
  }, [wasRestored])

  const handleDismiss = () => {
    setVisible(false)
    clearRestoredFlag()
  }

  if (!visible) return null

  return (
    <div className="session-restored-banner">
      <div className="session-restored-content">
        <div className="session-restored-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="session-restored-text">
          <strong>Welcome back!</strong>
          <span>Your previous session has been restored. You can continue where you left off.</span>
        </div>
        <button
          className="session-restored-close"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// ACTIVITY INDICATOR (DEBUG)
// ============================================================================

interface ActivityIndicatorProps {
  show?: boolean
}

export function ActivityIndicator({ show = false }: ActivityIndicatorProps) {
  const timeUntilLogout = useTimeUntilLogout()
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const minutes = Math.floor(timeUntilLogout / 60000)
      const seconds = Math.floor((timeUntilLogout % 60000) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [timeUntilLogout])

  if (!show) return null

  return (
    <div className="activity-indicator">
      <div className="activity-indicator-dot"></div>
      <span>Auto-logout in: {timeRemaining}</span>
    </div>
  )
}

// ============================================================================
// SESSION MANAGER (ORCHESTRATOR)
// ============================================================================

interface SessionManagerProps {
  onLogout: () => void
  showActivityIndicator?: boolean
}

export function SessionManager({ onLogout, showActivityIndicator = false }: SessionManagerProps) {
  const [showWarning, setShowWarning] = useState(false)
  const { setWarningCallback, setLogoutCallback, recordActivity } = useSessionActions()

  useEffect(() => {
    // Set up warning callback
    setWarningCallback((minutesRemaining) => {
      console.log(`[SessionManager] Warning: ${minutesRemaining} minutes until auto-logout`)
      setShowWarning(true)
    })

    // Set up logout callback
    setLogoutCallback(() => {
      console.log('[SessionManager] Auto-logout triggered')
      setShowWarning(false)
      onLogout()
    })
  }, [setWarningCallback, setLogoutCallback, onLogout])

  const handleStaySignedIn = () => {
    // Record activity to reset timer
    recordActivity()
    setShowWarning(false)
  }

  const handleSignOutNow = () => {
    setShowWarning(false)
    onLogout()
  }

  return (
    <>
      {showWarning && (
        <InactivityWarning
          onStaySignedIn={handleStaySignedIn}
          onSignOut={handleSignOutNow}
        />
      )}
      
      <SessionRestoredNotification />
      
      <ActivityIndicator show={showActivityIndicator} />
    </>
  )
}
