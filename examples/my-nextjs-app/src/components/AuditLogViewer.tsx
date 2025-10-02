'use client';

import { useState, useCallback } from 'react';
import { buildInspectorHttpUrl, getInspectorHost } from '@/utils/inspector';

interface AuditEntry {
  timestamp: string;
  level?: string;
  action: string;
  sessionId?: string;
  role?: string;
  userId?: string;
  details?: string | Record<string, unknown>;
}

export default function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [format, setFormat] = useState<'json' | 'csv' | 'plain'>('json');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<string>('');

  const inspectorHost = getInspectorHost();

  const getErrorMessage = useCallback(
    (err?: unknown) => {
      if (err instanceof Error) {
        const message = err.message || '';
        if (
          err instanceof TypeError ||
          /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED/i.test(message)
        ) {
          return `Cannot reach the Fortistate inspector at ${inspectorHost}. Make sure it's running (npm run inspect) or set NEXT_PUBLIC_INSPECTOR_URL. If it's running but you still see this, restart it with --allow-origin http://localhost:3000.`;
        }
        return message;
      }

      if (
        typeof err === 'string' &&
        /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED/i.test(err)
      ) {
  return `Cannot reach the Fortistate inspector at ${inspectorHost}. Make sure it's running (npm run inspect) or set NEXT_PUBLIC_INSPECTOR_URL. If it's running but you still see this, restart it with --allow-origin http://localhost:3000.`;
      }

      return 'Unknown error';
    },
    [inspectorHost]
  );

  const fetchAuditLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRawData('');
    
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('fortistate_demo_token')
        : null;

      if (!token) {
        throw new Error('No authentication token. Create a session first.');
      }

      const response = await fetch(
        buildInspectorHttpUrl('/audit/log', { format }),
        {
        headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Create an admin session in the Sessions tab.');
        }
        throw new Error(`Failed to fetch audit log: ${response.statusText}`);
      }

      if (format === 'json') {
        const data = await response.json();
        setEntries(data.entries || []);
        setRawData(JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        setRawData(text);
        setEntries([]);
      }
    } catch (err) {
      console.error('[Audit] Failed to fetch audit log', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [format, getErrorMessage]);

  const downloadLog = () => {
    const blob = new Blob([rawData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${Date.now()}.${format === 'csv' ? 'csv' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level?: string) => {
    if (!level) {
      return 'bg-gray-100 text-gray-800';
    }

    switch (level.toLowerCase()) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Audit Log Viewer</h2>
        <p className="text-gray-600 mb-4">
          View and export audit logs showing all admin actions, session events, and system operations.
          <br />
          <span className="text-sm text-gray-500">
            Epic 4: Log rotation, multiple export formats (JSON/CSV/plain)
          </span>
        </p>

        {/* Format Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Export Format</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('json')}
              className={`px-4 py-2 rounded-lg ${
                format === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setFormat('csv')}
              className={`px-4 py-2 rounded-lg ${
                format === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              CSV
            </button>
            <button
              onClick={() => setFormat('plain')}
              className={`px-4 py-2 rounded-lg ${
                format === 'plain'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Plain Text
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {format === 'json' && 'Structured JSON with metadata'}
            {format === 'csv' && 'Excel-compatible CSV with headers'}
            {format === 'plain' && 'Tab-separated values for grep/awk'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Make sure the inspector is running and you have admin privileges.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={fetchAuditLog}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Audit Log'}
          </button>
          
          {rawData && (
            <button
              onClick={downloadLog}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Download
            </button>
          )}
        </div>

        {/* JSON Format Display */}
        {format === 'json' && entries.length > 0 && (
          <div>
            <h3 className="font-bold mb-3">Audit Entries ({entries.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getLevelColor(entry.level)}`}>
                      {(entry.level ?? 'info').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm font-medium mb-1">{entry.action}</div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    {entry.sessionId && (
                      <div>
                        Session: <span className="font-mono">{entry.sessionId}</span>
                      </div>
                    )}
                    {entry.role && (
                      <div>
                        Role: <span className="font-mono">{entry.role}</span>
                      </div>
                    )}
                    {entry.userId && (
                      <div>
                        User: <span className="font-mono">{entry.userId}</span>
                      </div>
                    )}
                    {entry.details && (
                      <div className="mt-2 text-gray-700">
                        {typeof entry.details === 'string'
                          ? entry.details
                          : JSON.stringify(entry.details, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Data Display (CSV/Plain) */}
        {(format === 'csv' || format === 'plain') && rawData && (
          <div>
            <h3 className="font-bold mb-3">
              {format === 'csv' ? 'CSV Output' : 'Plain Text Output'}
            </h3>
            <pre className="bg-gray-50 border rounded-lg p-4 text-xs font-mono overflow-auto max-h-96">
              {rawData}
            </pre>
          </div>
        )}

        {/* No Data Message */}
        {!loading && !rawData && !error && (
          <div className="text-center text-gray-500 py-8">
            Click &quot;Fetch Audit Log&quot; to view entries
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-2">About Audit Logging</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All admin actions are automatically logged</li>
            <li>• Logs rotate automatically based on size (10MB) and age (30 days)</li>
            <li>• Export in multiple formats for analysis and compliance</li>
            <li>• Requires admin role to access audit logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
