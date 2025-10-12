# Session Persistence with Auto-Logout System - Complete Guide

## Overview

An intelligent session management system that automatically signs out users after 30 minutes of inactivity while preserving their work state for seamless restoration when they sign back in.

## Key Features

### ✅ Activity Tracking
- **Automatic Detection**: Monitors mouse movement, clicks, keyboard input, scrolling, and touches
- **Throttled Updates**: Activity updates max once per second for performance
- **Real-time Monitoring**: Checks for inactivity every 30 seconds
- **Activity Count**: Tracks total user interactions

### ✅ Auto-Logout Constraint
- **30-Minute Timeout**: Users automatically logged out after 30 minutes of inactivity
- **2-Minute Warning**: Warning modal appears at 28 minutes
- **Countdown Timer**: Shows remaining time until logout
- **Stay Signed In**: Users can extend their session with one click

### ✅ Work State Persistence
- **LocalStorage Backup**: Work state saved automatically
- **24-Hour Retention**: Saved sessions valid for 24 hours
- **Current Universe**: Remembers which universe user was working on
- **Editor State**: Preserves code, cursor position, and selection
- **Navigation**: Restores current path and scroll positions
- **Open Modals**: Remembers which panels were open
- **Marketplace Filters**: Saves search queries and category selections

### ✅ Session Restoration
- **Automatic Detection**: Detects when user returns after auto-logout
- **Silent Restoration**: Work state restored in background
- **Welcome Banner**: Shows friendly notification of restored session
- **Seamless UX**: User continues exactly where they left off

## Architecture

### Data Flow

```
User Activity
    ↓
Activity Events (mouse, keyboard, etc.)
    ↓
sessionStore.activity.lastActivityTime updated
    ↓
Every 30s: validateAndRepair() checks inactivity
    ↓
If 28 minutes: Show warning modal
    ↓
If 30 minutes: Trigger auto-logout
    ↓
Save workState to localStorage
    ↓
Sign out via Clerk
```

### State Structure

```typescript
interface SessionState {
  userId: string | null
  sessionId: string | null
  
  activity: {
    lastActivityTime: number  // Last user interaction
    isActive: boolean         // Currently active?
    activityCount: number     // Total interactions
  }
  
  workState: {
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
  }
  
  autoLogoutEnabled: boolean
  inactivityTimeoutMs: number  // Default: 30 minutes
  lastSavedAt: number
  restoredFromAutoLogout: boolean
}
```

## Usage

### 1. Basic Integration (Already Done in App.tsx)

```tsx
import { SessionManager } from './session/SessionComponents'
import { useClerk } from '@clerk/clerk-react'

function App() {
  const { signOut } = useClerk()
  
  const handleAutoLogout = () => {
    signOut()
  }
  
  return (
    <AuthGate>
      <SessionManager 
        onLogout={handleAutoLogout}
        showActivityIndicator={false}  // Set true for debugging
      />
      {/* Your app content */}
    </AuthGate>
  )
}
```

### 2. Save Work State

```tsx
import { useSessionActions } from './session/useSession'

function UniverseEditor() {
  const { updateWorkState } = useSessionActions()
  
  const handleUniverseChange = (universeId: string) => {
    updateWorkState({
      currentUniverseId: universeId
    })
  }
  
  const handleEditorChange = (code: string, cursor: number) => {
    updateWorkState({
      editorState: {
        code,
        cursorPosition: cursor,
        selectedText: ''
      }
    })
  }
  
  return <Editor onChange={handleEditorChange} />
}
```

### 3. Restore Work State

```tsx
import { useWorkState, useWasRestored } from './session/useSession'

function UniverseEditor() {
  const workState = useWorkState()
  const wasRestored = useWasRestored()
  
  useEffect(() => {
    if (wasRestored && workState.currentUniverseId) {
      // Restore the universe
      loadUniverse(workState.currentUniverseId)
      
      // Restore editor state
      if (workState.editorState) {
        setCode(workState.editorState.code)
        setCursor(workState.editorState.cursorPosition)
      }
    }
  }, [wasRestored, workState])
  
  return <Editor />
}
```

### 4. Check Session Status

```tsx
import { useSession } from './session/useSession'

function Header() {
  const {
    isActive,
    inactiveMinutes,
    timeUntilLogout,
    actions
  } = useSession()
  
  return (
    <div>
      Status: {isActive ? 'Active' : 'Inactive'}
      Inactive for: {inactiveMinutes} minutes
      
      {inactiveMinutes > 25 && (
        <button onClick={actions.recordActivity}>
          I'm still here!
        </button>
      )}
    </div>
  )
}
```

## React Hooks

### useSession()
Comprehensive hook with all session data.

```tsx
const {
  userId,              // Current user ID
  sessionId,           // Session identifier
  activity,            // Activity state
  workState,           // Work state
  autoLogoutEnabled,   // Is auto-logout enabled?
  isActive,            // Is user active?
  wasRestored,         // Was session restored?
  inactiveTime,        // Milliseconds inactive
  inactiveMinutes,     // Minutes inactive
  timeUntilLogout,     // Time until auto-logout (ms)
  actions              // Session actions
} = useSession()
```

### useActivity()
Get activity state only.

```tsx
const { lastActivityTime, isActive, activityCount } = useActivity()
```

### useWorkState()
Get work state only.

```tsx
const {
  currentUniverseId,
  editorState,
  navigationPath,
  openModals,
  marketplaceFilters,
  scrollPositions,
  unsavedChanges
} = useWorkState()
```

### useWasRestored()
Check if session was restored.

```tsx
const wasRestored = useWasRestored()
if (wasRestored) {
  showNotification('Session restored!')
}
```

### useTimeUntilLogout()
Get time remaining until auto-logout.

```tsx
const timeRemaining = useTimeUntilLogout()
const minutes = Math.floor(timeRemaining / 60000)
```

## Session Actions

### startSession(userId, sessionId)
Initialize session tracking (auto-called on login).

```tsx
sessionActions.startSession(user.id, clerkSessionId)
```

### endSession()
End session and save state (auto-called on logout).

```tsx
sessionActions.endSession()
```

### updateWorkState(updates)
Update work state and save to localStorage.

```tsx
sessionActions.updateWorkState({
  currentUniverseId: 'universe-123',
  editorState: { code: '...', cursorPosition: 42, selectedText: '' }
})
```

### recordActivity()
Manually trigger activity (extends session).

```tsx
sessionActions.recordActivity()
```

### setAutoLogout(enabled)
Enable/disable auto-logout feature.

```tsx
sessionActions.setAutoLogout(false)  // Disable for premium users
```

### clearRestoredFlag()
Clear the "was restored" flag after user acknowledges.

```tsx
sessionActions.clearRestoredFlag()
```

## UI Components

### SessionManager
Main orchestrator component (already integrated in App.tsx).

```tsx
<SessionManager
  onLogout={() => signOut()}
  showActivityIndicator={false}  // true for debug mode
/>
```

Features:
- Shows warning modal at 28 minutes
- Handles auto-logout at 30 minutes
- Displays restoration banner
- Optional activity indicator

### InactivityWarning
Modal shown 2 minutes before auto-logout.

```tsx
<InactivityWarning
  onStaySignedIn={() => recordActivity()}
  onSignOut={() => signOut()}
/>
```

### SessionRestoredNotification
Banner shown when session is restored.

```tsx
<SessionRestoredNotification />
```

### ActivityIndicator
Debug indicator showing time until logout.

```tsx
<ActivityIndicator show={true} />
```

## Constraint Enforcement

The system uses Fortistate's `validateAndRepair()` pattern:

```typescript
function validateAndRepair(state: SessionState): SessionState {
  const now = Date.now()
  const inactiveTime = now - state.activity.lastActivityTime
  
  // Constraint 1: Show warning at 28 minutes
  if (inactiveTime >= WARNING_THRESHOLD) {
    warningCallback(...)
  }
  
  // Constraint 2: Auto-logout at 30 minutes
  if (inactiveTime >= INACTIVITY_TIMEOUT) {
    saveWorkStateToStorage(state)
    logoutCallback()
    return { ...state, activity: { ...state.activity, isActive: false } }
  }
  
  return state
}
```

## LocalStorage Persistence

### Save Format
```json
{
  "workState": {
    "currentUniverseId": "universe-123",
    "editorState": { "code": "...", "cursorPosition": 42 },
    "navigationPath": "/editor",
    "openModals": ["settings"],
    "scrollPositions": { "main": 100 }
  },
  "sessionId": "session-xyz",
  "savedAt": 1735689600000
}
```

### Storage Key
```
fortistate_session_{userId}
```

### Expiration
- Saved sessions expire after 24 hours
- Expired sessions automatically deleted on restore attempt

## Configuration

### Timeout Duration
```tsx
// Default: 30 minutes
const INACTIVITY_TIMEOUT = 30 * 60 * 1000

// Warning threshold: 28 minutes (2 min before logout)
const WARNING_THRESHOLD = 28 * 60 * 1000
```

### Tracked Events
```tsx
const events = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click'
]
```

### Update Throttle
```tsx
// Max one activity update per second
const THROTTLE_MS = 1000
```

## Benefits

1. **Security**: Auto-logout prevents unauthorized access to idle sessions
2. **User Experience**: Seamless restoration means no lost work
3. **Compliance**: Meets security requirements for auto-logout
4. **Performance**: Throttled updates minimize overhead
5. **Flexible**: Can be disabled for premium users or specific contexts
6. **Transparent**: Users know exactly when logout will occur
7. **Forgiving**: 2-minute warning allows users to extend session

## Testing

### Test Auto-Logout
```typescript
import { sessionActions, sessionStore } from './session/sessionPersistence'

// Fast-forward time (for testing)
const state = sessionStore.get()
const pastTime = Date.now() - (31 * 60 * 1000)  // 31 minutes ago
sessionStore.set({
  ...state,
  activity: {
    ...state.activity,
    lastActivityTime: pastTime
  }
})

// Trigger validation
const validated = validateAndRepair(sessionStore.get())
// Should trigger logout callback
```

### Test State Persistence
```typescript
// Save state
sessionActions.updateWorkState({
  currentUniverseId: 'test-universe'
})

// Simulate logout/login
sessionActions.endSession()
sessionActions.startSession('user-123', 'session-xyz')

// Check if restored
const workState = sessionStore.get().workState
expect(workState.currentUniverseId).toBe('test-universe')
```

## Files Created

1. **src/session/sessionPersistence.ts** (400+ lines)
   - Session store with Fortistate
   - Activity tracking logic
   - Auto-logout constraint
   - LocalStorage persistence
   - Session actions and selectors

2. **src/session/useSession.ts** (100+ lines)
   - 8 React hooks for session access
   - Type-safe hooks
   - Reactive subscriptions

3. **src/session/SessionComponents.tsx** (180+ lines)
   - SessionManager orchestrator
   - InactivityWarning modal
   - SessionRestoredNotification banner
   - ActivityIndicator debug tool

4. **src/session/SessionComponents.css** (300+ lines)
   - Premium modal styling
   - Animations (slideIn, pulse, breathe)
   - Responsive design

5. **src/auth/AuthContext.tsx** (updated)
   - Integrated session tracking
   - Starts session on login
   - Ends session on logout

6. **src/App.tsx** (updated)
   - Added SessionManager component
   - Auto-logout handler
   - Clerk signOut integration

## Production Considerations

### Security
- ✅ Auto-logout after inactivity
- ✅ Sensitive data not stored in localStorage (only UI state)
- ✅ Session tokens managed by Clerk
- ✅ 24-hour expiration on saved sessions

### Performance
- ✅ Throttled activity updates (1s)
- ✅ Passive event listeners
- ✅ Efficient localStorage usage
- ✅ Minimal re-renders with Fortistate

### User Experience
- ✅ 2-minute warning before logout
- ✅ One-click session extension
- ✅ Automatic state restoration
- ✅ Clear notifications

## Next Steps

1. **Analytics**: Track auto-logout frequency
2. **Premium**: Disable for paid users
3. **Customization**: Allow users to set timeout duration
4. **Server Sync**: Backup work state to server
5. **Multi-Device**: Sync session across devices

## Summary

The session persistence system provides enterprise-grade auto-logout functionality while maintaining an excellent user experience through intelligent state management and seamless restoration. All work is automatically preserved, and users can continue exactly where they left off after any interruption.

**Status: COMPLETE ✅**
