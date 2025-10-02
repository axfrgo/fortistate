'use client';

import { useState, useEffect, useCallback } from 'react';
import { buildInspectorHttpUrl, buildInspectorWsUrl, getInspectorHost } from '@/utils/inspector';

interface PresenceUser {
  id: string;
  displayName: string;
  role: string;
  activeStore: string | null;
  cursorPath: string[] | null;
  lastActivity: number;
  createdAt: number;
}

export default function PresenceViewer() {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [myActiveStore, setMyActiveStore] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const inspectorHost = getInspectorHost();
  const wsUrl = buildInspectorWsUrl();

  const getErrorMessage = useCallback((err?: unknown) => {
    if (err instanceof Error) {
      const message = err.message || '';
      if (
        err instanceof TypeError ||
        /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED|WebSocket is closed/i.test(message)
      ) {
        return `Cannot reach the Fortistate inspector at ${inspectorHost}. Make sure it's running (npm run inspect) or set NEXT_PUBLIC_INSPECTOR_URL. If the inspector is running but you still see this, restart it with --allow-origin http://localhost:3000.`;
      }
      return message;
    }

    if (typeof err === 'string' && /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED|WebSocket/i.test(err)) {
      return `Cannot reach the Fortistate inspector at ${inspectorHost}. Make sure it's running (npm run inspect) or set NEXT_PUBLIC_INSPECTOR_URL. If the inspector is running but you still see this, restart it with --allow-origin http://localhost:3000.`;
    }

    return 'Unknown error';
  }, [inspectorHost]);

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('fortistate_demo_token');
  }, []);

  // Fetch presence via HTTP
  const fetchPresence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();

      if (!token) {
        setError('No authentication token found. Create a session in the Sessions tab first.');
        setConnected(false);
        return;
      }
  const response = await fetch(buildInspectorHttpUrl('/presence'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Create a new admin or editor session.');
        }
        throw new Error(`Failed to fetch presence: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('[Presence] Failed to fetch presence', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [getErrorMessage, getToken]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const token = getToken();

    if (!token) {
      setError('No authentication token found. Create a session in the Sessions tab first.');
      setConnected(false);
      return;
    }

  const ws = new WebSocket(`${wsUrl}?token=${token}`);
    
    ws.onopen = () => {
      console.log('[Presence] WebSocket connected');
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Presence] Message:', message);

        if (message.type === 'presence:join') {
          setUsers((prev) => [...prev, message.user]);
        } else if (message.type === 'presence:leave') {
          setUsers((prev) => prev.filter((u) => u.id !== message.userId));
        } else if (message.type === 'presence:update') {
          setUsers((prev) =>
            prev.map((u) => (u.id === message.user.id ? message.user : u))
          );
        }
      } catch (err) {
        console.error('[Presence] Failed to parse message:', err);
      }
    };

    ws.onerror = (event) => {
      const deriveDetails = (evt: unknown): string | undefined => {
        if (evt instanceof ErrorEvent && evt.message) {
          return evt.message;
        }
        if (typeof evt === 'string' && evt.length > 0) {
          return evt;
        }
        if (typeof evt === 'object' && evt !== null) {
          const withMessage = evt as { message?: unknown; type?: unknown };
          if (typeof withMessage.message === 'string' && withMessage.message.length > 0) {
            return withMessage.message;
          }
          if (typeof withMessage.type === 'string' && withMessage.type.length > 0) {
            return `WebSocket ${withMessage.type}`;
          }
        }
        return undefined;
      };

      const details = deriveDetails(event);

      const friendlyMessage = getErrorMessage(details ?? 'WebSocket error');
      console.warn(
        '[Presence] WebSocket error:',
        details ?? 'Unknown network error',
        `→ ${friendlyMessage}`
      );
      setError(friendlyMessage);
      setConnected(false);
    };

    ws.onclose = (event) => {
      console.log('[Presence] WebSocket disconnected');
      if (!event.wasClean) {
        setError(getErrorMessage(`WebSocket closed: ${event.code}`));
      }
      setConnected(false);
    };

    setWsConnection(ws);

    return () => {
      ws.close();
    };
  }, [getErrorMessage, getToken, wsUrl]);

  // Update my active store
  const updateActiveStore = (storeName: string | null) => {
    setMyActiveStore(storeName);
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(
        JSON.stringify({
          type: 'presence:update',
          activeStore: storeName,
        })
      );
    }
  };

  // Update cursor path
  const updateCursorPath = (path: string[] | null) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(
        JSON.stringify({
          type: 'presence:update',
          cursorPath: path,
        })
      );
    }
  };

  const getActivityStatus = (lastActivity: number) => {
    const now = Date.now();
    const diff = now - lastActivity;
    if (diff < 30000) return { label: 'Active', color: 'bg-green-500' };
    if (diff < 120000) return { label: 'Idle', color: 'bg-yellow-500' };
    return { label: 'Away', color: 'bg-gray-400' };
  };

  const stores = ['counterStore', 'cartStore', 'userStore', 'collaborationStore', 'sessionStore', 'auditStore'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Real-Time Presence</h2>
        <p className="text-gray-600 mb-4">
          See who&apos;s connected to the inspector and what stores they&apos;re viewing in real-time.
          <br />
          <span className="text-sm text-gray-500">
            Epic 5: Multi-user collaboration with WebSocket protocol
          </span>
        </p>

        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {connected ? 'Connected to inspector' : 'Disconnected'}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchPresence}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Presence (HTTP)'}
          </button>
        </div>

        {/* My Store Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">My Active Store</label>
          <select
            value={myActiveStore || ''}
            onChange={(e) => updateActiveStore(e.target.value || null)}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={!connected}
          >
            <option value="">None</option>
            {stores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Broadcast which store you&apos;re viewing to other users
          </p>
        </div>

        {/* Test Cursor Update */}
        <div className="mb-6">
          <button
            onClick={() => updateCursorPath(['user', 'profile', 'name'])}
            disabled={!connected}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 mr-2"
          >
            Test Cursor Update
          </button>
          <button
            onClick={() => updateCursorPath(null)}
            disabled={!connected}
            className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 disabled:opacity-50"
          >
            Clear Cursor
          </button>
        </div>

        {/* Connected Users */}
        <div>
          <h3 className="font-bold mb-3">Connected Users ({users.length})</h3>
          {users.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No users connected</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const status = getActivityStatus(user.lastActivity);
                return (
                  <div
                    key={user.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          <span className="font-medium">{user.displayName}</span>
                          <span className="text-xs text-gray-500">{status.label}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.lastActivity).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {user.activeStore && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Viewing:</span>
                        <span className="ml-2 font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          {user.activeStore}
                        </span>
                      </div>
                    )}
                    
                    {user.cursorPath && user.cursorPath.length > 0 && (
                      <div className="mt-1 text-sm">
                        <span className="text-gray-600">Cursor:</span>
                        <span className="ml-2 font-mono text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                          {user.cursorPath.join(' → ')}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-400">
                      ID: {user.id}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
