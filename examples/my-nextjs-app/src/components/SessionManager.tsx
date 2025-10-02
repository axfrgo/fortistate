'use client';

import { useState } from 'react';
import { buildInspectorHttpUrl, getInspectorHost } from '@/utils/inspector';

interface SessionData {
  session: {
    id: string;
    role: 'observer' | 'editor' | 'admin';
    createdAt: number;
    expiresAt?: number;
    label?: string;
  };
  token: string;
  tokenType: 'opaque' | 'jwt';
}

interface Session {
  id: string;
  label: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newSession, setNewSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [role, setRole] = useState<'observer' | 'editor' | 'admin'>('editor');
  const [label, setLabel] = useState('');
  const [ttl, setTtl] = useState('1h');

  const inspectorHost = getInspectorHost();

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) {
      const message = err.message || '';
      if (
        err instanceof TypeError ||
        /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED/i.test(message)
      ) {
        return `Cannot reach the Fortistate inspector at ${inspectorHost}. Make sure it's running (npm run inspect) or set NEXT_PUBLIC_INSPECTOR_URL. If the inspector is running but you still see this, restart it with --allow-origin http://localhost:3000.`;
      }
      return message;
    }
    return 'Unknown error';
  };

  const createSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildInspectorHttpUrl('/session/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, label: label || `Demo ${role}`, ttl }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      setNewSession(data);
      
      // Store token in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('fortistate_demo_token', data.token);
        localStorage.setItem('fortistate_demo_role', data.session?.role ?? 'observer');
      }

      // Reset form
      setLabel('');
      
      // Refresh session list
      await listSessions();
    } catch (err) {
      console.error('Failed to create session', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const listSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('fortistate_demo_token') 
        : null;

      if (!token) {
        throw new Error('No authentication token. Create a session first.');
      }

      const response = await fetch(buildInspectorHttpUrl('/session/list'), {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to list sessions: ${response.statusText}`);
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to list sessions', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('fortistate_demo_token')
        : null;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(buildInspectorHttpUrl('/session/revoke'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to revoke session: ${response.statusText}`);
      }

      // Refresh list
      await listSessions();
    } catch (err) {
      console.error('Failed to revoke session', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (newSession) {
      navigator.clipboard.writeText(newSession.token);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Session Management</h2>
        <p className="text-gray-600 mb-4">
          Create and manage inspector sessions with role-based access control.
          <br />
          <span className="text-sm text-gray-500">
            Epic 2-3: Authentication, authorization, and CLI features
          </span>
        </p>

        {/* Create Session Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'observer' | 'editor' | 'admin')}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={loading}
            >
              <option value="observer">Observer (read-only)</option>
              <option value="editor">Editor (can modify state)</option>
              <option value="admin">Admin (full control)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Alice, Bob, Production Team"
              className="w-full px-3 py-2 border rounded-lg"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">TTL (Time to Live)</label>
            <select
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={loading}
            >
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>

          <button
            onClick={createSession}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </div>

        {/* New Session Display */}
        {newSession && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-green-900 mb-2">✓ Session Created</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Token:</span>
                <div className="flex gap-2 mt-1">
                  <code className="flex-1 bg-white px-2 py-1 rounded text-xs overflow-hidden text-ellipsis">
                    {newSession.token}
                  </code>
                  <button
                    onClick={copyToken}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div><span className="font-medium">Role:</span> {newSession.session?.role ?? 'observer'}</div>
              <div><span className="font-medium">Expires:</span> {newSession.session?.expiresAt ? new Date(newSession.session.expiresAt).toLocaleString() : 'Never'}</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-red-900 mb-2">Error</h3>
            <p className="text-sm text-red-700">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </p>
          </div>
        )}

        {/* List Sessions Button */}
        <button
          onClick={listSessions}
          disabled={loading}
          className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 mb-6"
        >
          {loading ? 'Loading...' : 'List Active Sessions'}
        </button>

        {/* Sessions List */}
        {sessions.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-medium">
              Active Sessions ({sessions.length})
            </div>
            <div className="divide-y">
              {sessions.map((session) => (
                <div key={session.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{session.label}</div>
                      <div className="text-sm text-gray-600">
                        Role: <span className="font-mono">{session.role}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: <span className="font-mono text-xs">{session.id}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(session.expiresAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => revokeSession(session.id)}
                      disabled={loading}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
