'use client';

import { useEffect, useState } from 'react';
import { exportAuditLogs } from '@/lib/exportUtils';

interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  useEffect(() => {
    // Fetch audit logs from API
    async function fetchLogs() {
      try {
        const response = await fetch('/api/audit-logs');
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        const data = await response.json();
        setLogs(data.logs);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));
  
  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    return matchesAction && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">📜 Audit Logs</h1>
          <p className="text-foreground-muted">
            Complete history of administrative actions
          </p>
        </div>
        <button 
          onClick={() => exportAuditLogs(logs)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Events</div>
          <div className="text-3xl font-bold text-primary">{logs.length}</div>
          <div className="text-xs text-foreground-muted mt-1">Last 24 hours</div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Critical Actions</div>
          <div className="text-3xl font-bold text-red-400">
            {logs.filter(l => l.severity === 'critical').length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">High priority</div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Warnings</div>
          <div className="text-3xl font-bold text-amber-400">
            {logs.filter(l => l.severity === 'warning').length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">Requires review</div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Active Admins</div>
          <div className="text-3xl font-bold text-primary">
            {new Set(logs.map(l => l.adminId)).size}
          </div>
          <div className="text-xs text-foreground-muted mt-1">Today</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Action Type
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Severity
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-foreground-muted">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className={`bg-background-secondary border rounded-lg p-4 ${
              log.severity === 'critical'
                ? 'border-red-500/50 bg-red-500/5'
                : log.severity === 'warning'
                ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      log.severity === 'critical'
                        ? 'bg-red-500/20 text-red-300'
                        : log.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}
                  >
                    {log.severity.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-purple-500/20 text-purple-300">
                    {log.action}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-foreground mb-2">{log.details}</p>
                <div className="flex items-center space-x-4 text-xs text-foreground-muted">
                  <span>Admin: {log.adminEmail}</span>
                  <span>•</span>
                  <span>Resource: {log.resource} ({log.resourceId})</span>
                  <span>•</span>
                  <span>IP: {log.ipAddress}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 && (
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-foreground-muted">No audit logs found matching your filters.</p>
          <button
            onClick={() => {
              setFilterAction('all');
              setFilterSeverity('all');
            }}
            className="mt-4 text-primary hover:text-primary-hover"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
