# Collaboration Features

Fortistate Inspector supports real-time multi-user collaboration, allowing teams to view and debug application state together. This document describes the presence system, security model, and usage patterns.

## Overview

The collaboration system provides:
- **Real-time presence tracking**: See who's connected to the inspector
- **Active store awareness**: Know which stores other users are viewing
- **Cursor tracking**: See where other users are navigating in the state tree
- **Role-based access control**: Control who can observe vs. edit
- **Session-based authentication**: Secure token-based user identification

## Architecture

The presence system consists of three layers:

1. **PresenceManager** (`src/presence.ts`): Core tracking logic
2. **WebSocket Protocol**: Real-time bidirectional messaging
3. **HTTP API**: RESTful endpoints for presence queries

## User Roles

Sessions have three role levels (see [AUTHENTICATION.md](./AUTHENTICATION.md)):

- **observer**: Read-only access, can view state but not modify
- **editor**: Can trigger actions and modify state
- **admin**: Full control including inspector configuration

## WebSocket Protocol

### Connection

Connect to the inspector WebSocket endpoint with authentication:

```javascript
const ws = new WebSocket('ws://localhost:5173/ws?token=YOUR_SESSION_TOKEN');

ws.onopen = () => {
  console.log('Connected to Fortistate Inspector');
};
```

### Message Types

#### Presence Events (Server → Client)

The server broadcasts presence events to all connected clients:

```typescript
// User joined
{
  type: 'presence:join',
  user: {
    id: 'ws-abc123',
    displayName: 'Alice (admin)',
    role: 'admin',
    activeStore: null,
    cursorPath: null,
    session: {
      id: 'session-xyz',
      label: 'Alice'
    },
    createdAt: 1704067200000,
    lastActivity: 1704067200000
  }
}

// User left
{
  type: 'presence:leave',
  userId: 'ws-abc123'
}

// User updated (changed store or cursor position)
{
  type: 'presence:update',
  user: {
    id: 'ws-abc123',
    displayName: 'Alice (admin)',
    role: 'admin',
    activeStore: 'userStore',
    cursorPath: ['user', 'profile', 'name'],
    session: {
      id: 'session-xyz',
      label: 'Alice'
    },
    createdAt: 1704067200000,
    lastActivity: 1704067250000
  }
}
```

#### Client Updates (Client → Server)

Clients send updates when they navigate to a different store or state path:

```typescript
// Update active store
ws.send(JSON.stringify({
  type: 'presence:update',
  activeStore: 'cartStore'
}));

// Update cursor path
ws.send(JSON.stringify({
  type: 'presence:update',
  cursorPath: ['items', 0, 'product', 'name']
}));

// Update both
ws.send(JSON.stringify({
  type: 'presence:update',
  activeStore: 'cartStore',
  cursorPath: ['items', 0, 'quantity']
}));
```

### Activity Tracking

The server automatically tracks user activity:
- Last activity timestamp updates on every message
- Idle users (>5 minutes inactive) are automatically removed
- The `touch()` mechanism ensures active connections persist

## HTTP API

### GET /presence

Retrieve all connected users.

**Authentication**: Requires valid session token

**Response**:
```json
{
  "users": [
    {
      "id": "ws-abc123",
      "displayName": "Alice (admin)",
      "role": "admin",
      "activeStore": "userStore",
      "cursorPath": ["user", "profile"],
      "session": {
        "id": "session-xyz",
        "label": "Alice"
      },
      "createdAt": 1704067200000,
      "lastActivity": 1704067250000
    },
    {
      "id": "ws-def456",
      "displayName": "Guest #1 (observer)",
      "role": "observer",
      "activeStore": null,
      "cursorPath": null,
      "session": null,
      "createdAt": 1704067205000,
      "lastActivity": 1704067255000
    }
  ]
}
```

**Example**:
```javascript
const response = await fetch('http://localhost:5173/presence', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
});
const { users } = await response.json();
```

## Display Names

The system automatically generates user-friendly display names:

- **Authenticated users**: `${session.label} (${role})`
  - Example: `"Alice (admin)"`
- **Anonymous users**: `Guest #${N} (${role})`
  - Example: `"Guest #1 (observer)"`
- **Fallback**: `${session.id} (${role})` if no label provided

## Client Implementation Example

### React Hook for Presence

```typescript
import { useEffect, useState } from 'react';

interface PresenceUser {
  id: string;
  displayName: string;
  role: string;
  activeStore: string | null;
  cursorPath: string[] | null;
  lastActivity: number;
}

export function usePresence(wsUrl: string, token: string) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`${wsUrl}?token=${token}`);
    
    socket.onopen = () => {
      console.log('[Presence] Connected');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'presence:join') {
        setUsers(prev => [...prev, message.user]);
      } else if (message.type === 'presence:leave') {
        setUsers(prev => prev.filter(u => u.id !== message.userId));
      } else if (message.type === 'presence:update') {
        setUsers(prev => prev.map(u => 
          u.id === message.user.id ? message.user : u
        ));
      }
    };

    socket.onerror = (error) => {
      console.error('[Presence] Error:', error);
    };

    socket.onclose = () => {
      console.log('[Presence] Disconnected');
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [wsUrl, token]);

  const updatePresence = (update: {
    activeStore?: string;
    cursorPath?: string[];
  }) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'presence:update',
        ...update
      }));
    }
  };

  return { users, updatePresence };
}
```

### Usage in Component

```tsx
function StateInspector() {
  const { users, updatePresence } = usePresence(
    'ws://localhost:5173/ws',
    sessionStorage.getItem('fortistate_token')
  );

  const handleStoreChange = (storeName: string) => {
    updatePresence({ activeStore: storeName });
  };

  const handlePathClick = (path: string[]) => {
    updatePresence({ cursorPath: path });
  };

  return (
    <div>
      <h3>Connected Users ({users.length})</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.displayName}
            {user.activeStore && (
              <span> - viewing {user.activeStore}</span>
            )}
            {user.cursorPath && (
              <span> at {user.cursorPath.join('.')}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Security Considerations

### Authentication Required

All presence features require authentication:
- WebSocket connections must include valid session token
- HTTP endpoints verify token in Authorization header
- Unauthenticated connections are rejected

### Privacy

- Only authenticated users can see presence data
- Session IDs are exposed but tokens remain secure
- Role information is visible to all users

### Rate Limiting

Consider implementing rate limits for presence updates to prevent abuse:
- Limit cursor updates to once per 100ms
- Throttle store changes to once per second

### Anonymous Users

Users without valid sessions can still connect but appear as "Guest" users:
- No session information exposed
- Unique guest numbers assigned
- Limited to observer role by default

## Performance

### Scalability

The in-memory PresenceManager is suitable for:
- **Small teams**: 2-10 concurrent users per inspector
- **Development environments**: Local debugging sessions
- **Demo purposes**: Short-lived collaborative sessions

For production multi-user scenarios at scale:
- Consider external presence store (Redis, etc.)
- Implement presence sharding by store
- Add connection pooling

### Cleanup

Idle users are automatically removed:
- **Timeout**: 5 minutes of inactivity
- **Check interval**: Every 60 seconds
- **Activity signals**: Any WebSocket message

## Configuration

Configure presence behavior via inspector options:

```javascript
import { startInspector } from 'fortistate/inspector';

startInspector({
  port: 5173,
  auth: {
    sessionSecret: process.env.FORTISTATE_SESSION_SECRET,
    // Configure session expiry (affects presence timeout)
    sessionExpiry: '30m'
  }
});
```

## Troubleshooting

### Users Not Appearing

**Problem**: Connected users don't show in presence list

**Solutions**:
1. Verify authentication token is valid
2. Check WebSocket connection established
3. Ensure `presence:update` messages sent after connection

### Stale Users

**Problem**: Disconnected users remain in list

**Solutions**:
1. Verify idle cleanup running (check logs)
2. Ensure WebSocket `close` events handled
3. Check client heartbeat/ping implementation

### Missing Updates

**Problem**: Cursor/store changes not broadcasting

**Solutions**:
1. Verify `presence:update` message format
2. Check WebSocket connection state
3. Ensure updates sent from correct component

## Future Enhancements

Potential additions to the collaboration system:

- **Real-time action synchronization**: Execute actions across all users
- **Collaborative editing**: Multiple users modify state together
- **Cursor annotations**: Add comments at specific paths
- **Screen sharing**: Broadcast selected store views
- **Playback mode**: Record and replay collaborative sessions
- **Conflict resolution**: Handle simultaneous state modifications
- **Presence persistence**: Store across server restarts
- **User avatars**: Visual identification in UI
- **Typing indicators**: Show when users are editing values

## Related Documentation

- [Authentication & Sessions](./AUTHENTICATION.md) - Role-based access control
- [Inspector API](./INSPECTOR_API.md) - Full HTTP/WebSocket reference
- [Getting Started](./GETTING_STARTED.md) - Basic inspector usage
- [Security](./COLLABORATION_SECURITY.md) - Security best practices

## Testing

Run presence system tests:

```bash
npm test test/presence.test.ts
```

The test suite covers:
- Adding/removing users
- Updating active store and cursor
- Session integration
- Anonymous user handling
- Multi-user scenarios
- Idle user cleanup

---

**Questions or issues?** See [CONTRIBUTING.md](../CONTRIBUTING.md) or open an issue on GitHub.
