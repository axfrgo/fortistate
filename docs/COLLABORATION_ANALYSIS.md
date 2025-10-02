# Collaboration Analysis — Epic 5

## Current State

### WebSocket Infrastructure ✅
- **Connection handling**: WebSocket server running alongside HTTP server
- **Authentication**: Session-based auth with `_fortistateAuth` attached to each connection
- **Authorization**: Observer role required for WS connections (with anon support)
- **Audit logging**: `ws:connect` and `ws:disconnect` events tracked
- **Store broadcasting**: Changes propagate to all connected clients

### Message Types (Current)
```typescript
// Server → Client
{ type: 'hello', version: 1 }
{ type: 'snapshot', stores: {...} }
{ type: 'store:create', key, initial }
{ type: 'store:change', key, value }

// Client → Server
'req:snapshot' (string message)
```

### What EXISTS
1. ✅ WebSocket server with session auth
2. ✅ Store change broadcasting to all clients
3. ✅ Session context available via `authInfo.sessionContext`
4. ✅ Audit trail for connections
5. ✅ Origin validation and CORS

### What's MISSING (Gaps)

#### 1. **Presence Tracking** 🚫
- No tracking of **who** is connected
- No visibility into **which store** users are viewing
- No **user metadata** (name, avatar, role) in client list
- No **active cursor/focus** indication

#### 2. **User Identity** 🚫
- Sessions have IDs but no display names
- No user profiles or labels visible to other users
- No way to distinguish "Bob" from "Alice" in UI

#### 3. **Collaborative Awareness** 🚫
- Can't see if someone else is editing same store
- No conflict prevention or "who's typing" indicators  
- No activity indicators (idle vs active)

#### 4. **Presence API** 🚫
- No `GET /presence` endpoint for HTTP clients
- No WebSocket message for presence updates
- No way to query "who's online"

## Target State — Multi-User Collaboration

### Core Features

#### Presence System
Track and broadcast connected users with:
- **Session ID**: Unique identifier
- **Display name**: From session label or auto-generated
- **Role**: observer/editor/admin
- **Connection time**: When they joined
- **Last activity**: Heartbeat timestamp
- **Active store**: Which store key they're viewing
- **Cursor position**: Path in state tree they're focused on

#### Presence Protocol

**Client → Server**:
```typescript
// Update my presence
{ type: 'presence:update', activeStore: 'counter', cursorPath: ['items', 0] }

// Heartbeat (optional, for activity tracking)
{ type: 'presence:ping' }
```

**Server → Client**:
```typescript
// Initial presence list on connect
{ type: 'presence:init', users: [...] }

// User joined
{ type: 'presence:join', user: { sessionId, name, role, connectedAt, ... } }

// User left
{ type: 'presence:leave', sessionId: '...' }

// User updated presence
{ type: 'presence:update', sessionId: '...', activeStore: '...', cursorPath: [...] }
```

#### HTTP Endpoint
```http
GET /presence
Authorization: Bearer <token>

Response:
{
  "users": [
    {
      "sessionId": "sess_123",
      "displayName": "Alice (admin)",
      "role": "admin",
      "connectedAt": "2025-10-01T12:00:00Z",
      "lastActivity": "2025-10-01T12:05:00Z",
      "activeStore": "counter",
      "cursorPath": null
    }
  ],
  "total": 1
}
```

### Data Structures

```typescript
interface PresenceUser {
  sessionId: string
  displayName: string
  role: 'observer' | 'editor' | 'admin'
  connectedAt: string
  lastActivity: string
  activeStore: string | null
  cursorPath: (string | number)[] | null
  remoteAddress: string | null
}

interface PresenceState {
  users: Map<WebSocket, PresenceUser>
}
```

### Implementation Plan

#### Phase 1: Core Presence Tracking
1. Create `PresenceManager` class to track WS connections
2. Generate display names from session labels or auto-increment
3. Broadcast `presence:join` and `presence:leave` events
4. Add `GET /presence` endpoint (admin-only)

#### Phase 2: Presence Updates
1. Handle `presence:update` messages from clients
2. Validate presence updates (store exists, valid cursor path)
3. Broadcast updates to other connected clients
4. Add heartbeat/activity tracking

#### Phase 3: Inspector UI
1. Add presence sidebar to inspector client
2. Show avatar/initials for each connected user
3. Highlight active store with user badges
4. Display cursor positions in state tree
5. Add "who's viewing" indicator on store cards

#### Phase 4: Advanced Features
1. Idle detection (no activity for 5+ minutes)
2. Typing indicators for store mutations
3. Conflict warnings (2+ editors on same store)
4. Follow mode (shadow another user's view)

## Security Considerations

1. **Privacy**: Display names shouldn't leak sensitive session info
2. **Authorization**: Presence visibility respects role hierarchy
3. **Rate limiting**: Prevent presence spam from malicious clients
4. **Audit**: Log presence events for compliance

## Testing Strategy

1. **Unit tests**: PresenceManager add/remove/update operations
2. **Integration tests**: Multi-client presence scenarios
3. **E2E tests**: Full inspector UI with multiple browsers
4. **Load tests**: 50+ concurrent connections with presence updates

## Success Metrics

- ✅ Multiple users can connect and see each other
- ✅ Active store indicator shows who's viewing what
- ✅ Presence updates propagate within 100ms
- ✅ No performance degradation with 20+ connected users
- ✅ Session expiry automatically removes user from presence
