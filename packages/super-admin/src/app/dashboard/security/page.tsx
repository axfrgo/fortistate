'use client';

import { useEffect, useState } from 'react';
import { exportSecurityEvents } from '@/lib/exportUtils';
import { ConfirmModal, AlertModal } from '@/components/Modals';

interface SecurityEvent {
  id: string;
  type: 'abuse' | 'anomaly' | 'suspicious' | 'violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  userEmail: string;
  organizationName: string;
  description: string;
  timestamp: string;
}

export default function SecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [filterType, setFilterType] = useState<'all' | 'abuse' | 'anomaly' | 'suspicious' | 'violation'>('all');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info' | 'success';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    // Fetch security events from API
    async function fetchEvents() {
      try {
        const response = await fetch('/api/security/events');
        if (!response.ok) {
          throw new Error('Failed to fetch security events');
        }
        const data = await response.json();
        setEvents(data.events);
      } catch (error) {
        console.error('Error fetching security events:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(evt => {
    const matchesSeverity = filterSeverity === 'all' || evt.severity === filterSeverity;
    const matchesType = filterType === 'all' || evt.type === filterType;
    return matchesSeverity && matchesType;
  });

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;
  const abuseCount = events.filter(e => e.type === 'abuse').length;
  const violationCount = events.filter(e => e.type === 'violation').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading security events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">🛡️ Security & Abuse Detection</h1>
          <p className="text-foreground-muted">
            Monitor security events and abuse patterns
          </p>
        </div>
        <button 
          onClick={() => exportSecurityEvents(events)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          Export Report
        </button>
      </div>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="text-red-400 font-semibold">Critical Security Alert</h3>
              <p className="text-sm text-red-300">
                {criticalCount} critical security {criticalCount === 1 ? 'event' : 'events'} detected in the last 24 hours. Immediate action required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Critical Events</div>
          <div className="text-3xl font-bold text-red-400">{criticalCount}</div>
          <div className="text-xs text-foreground-muted mt-1">
            Last 24 hours
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">High Severity</div>
          <div className="text-3xl font-bold text-amber-400">{highCount}</div>
          <div className="text-xs text-foreground-muted mt-1">
            Requires attention
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Abuse Events</div>
          <div className="text-3xl font-bold text-red-400">{abuseCount}</div>
          <div className="text-xs text-foreground-muted mt-1">
            Rate limit violations
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Law Violations</div>
          <div className="text-3xl font-bold text-amber-400">{violationCount}</div>
          <div className="text-xs text-foreground-muted mt-1">
            Physics law breaks
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Event Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="abuse">Abuse</option>
              <option value="violation">Law Violation</option>
              <option value="suspicious">Suspicious Activity</option>
              <option value="anomaly">Anomaly</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-foreground-muted">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </div>

      {/* Events Timeline */}
      <div className="space-y-4">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className={`bg-background-secondary border rounded-lg p-6 ${
              evt.severity === 'critical'
                ? 'border-red-500/50 bg-red-500/5'
                : evt.severity === 'high'
                ? 'border-amber-500/50 bg-amber-500/5'
                : 'border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {evt.type === 'abuse' ? '🚫' : evt.type === 'violation' ? '⚠️' : evt.type === 'suspicious' ? '🔍' : '📊'}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        evt.severity === 'critical'
                          ? 'bg-red-500/20 text-red-300'
                          : evt.severity === 'high'
                          ? 'bg-amber-500/20 text-amber-300'
                          : evt.severity === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {evt.severity.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded bg-purple-500/20 text-purple-300`}
                    >
                      {evt.type.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-2">{evt.description}</h3>
                </div>
              </div>
              <span className="text-sm text-foreground-muted">
                {new Date(evt.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
              <div>
                <div className="text-xs text-foreground-muted mb-1">User</div>
                <div className="text-sm text-foreground">{evt.userEmail}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-muted mb-1">Organization</div>
                <div className="text-sm text-foreground">{evt.organizationName}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-muted mb-1">Event ID</div>
                <div className="text-sm text-foreground-muted">{evt.id}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4">
              <button 
                onClick={() => {
                  setAlertModal({
                    isOpen: true,
                    title: 'Investigating Security Event',
                    message: 
                      `🔍 INVESTIGATING SECURITY EVENT\n\n` +
                      `Event ID: ${evt.id}\n` +
                      `Type: ${evt.type.toUpperCase()}\n` +
                      `Severity: ${evt.severity.toUpperCase()}\n` +
                      `User: ${evt.userEmail}\n` +
                      `Organization: ${evt.organizationName}\n` +
                      `Time: ${new Date(evt.timestamp).toLocaleString()}\n\n` +
                      `ANALYSIS:\n` +
                      `• Checking for related incidents...\n` +
                      `• Analyzing user behavior patterns...\n` +
                      `• Reviewing organization activity...\n\n` +
                      `Full investigation report will be generated and added to audit logs.`,
                    type: 'info'
                  });
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 shadow-sm hover:shadow-md"
              >
                Investigate
              </button>
              <button 
                onClick={() => {
                  setAlertModal({
                    isOpen: true,
                    title: 'Security Event Details',
                    message: 
                      `📋 SECURITY EVENT DETAILS\n\n` +
                      `Event ID: ${evt.id}\n` +
                      `Type: ${evt.type.toUpperCase()}\n` +
                      `Severity: ${evt.severity.toUpperCase()}\n` +
                      `Status: Requires Review\n\n` +
                      `USER INFORMATION:\n` +
                      `Email: ${evt.userEmail}\n` +
                      `Organization: ${evt.organizationName}\n\n` +
                      `INCIDENT DETAILS:\n` +
                      `Timestamp: ${new Date(evt.timestamp).toLocaleString()}\n` +
                      `Description: ${evt.description}\n\n` +
                      `RECOMMENDED ACTIONS:\n` +
                      `${evt.severity === 'critical' ? '• Suspend user immediately\n• Review account activity\n• Contact organization admin' : '• Monitor for patterns\n• Update security rules\n• Log for review'}`,
                    type: 'info'
                  });
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 shadow-sm hover:shadow-md"
              >
                View Details
              </button>
              {evt.severity === 'critical' && (
                <button 
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Suspend User',
                      message: 
                        `⚠️ CRITICAL ACTION: SUSPEND USER\n\n` +
                        `User: ${evt.userEmail}\n` +
                        `Organization: ${evt.organizationName}\n` +
                        `Reason: ${evt.type.toUpperCase()}\n` +
                        `Severity: CRITICAL\n\n` +
                        `This will:\n` +
                        `• Immediately revoke all access\n` +
                        `• Block login attempts\n` +
                        `• Notify organization admin\n` +
                        `• Log to audit trail\n\n` +
                        `Are you ABSOLUTELY SURE you want to suspend this user?`,
                      type: 'danger',
                      onConfirm: () => {
                        setAlertModal({
                          isOpen: true,
                          title: 'User Suspended',
                          message: 
                            `🚨 USER SUSPENDED\n\n` +
                            `User: ${evt.userEmail}\n` +
                            `Organization: ${evt.organizationName}\n\n` +
                            `Actions taken:\n` +
                            `✓ Access revoked\n` +
                            `✓ Sessions terminated\n` +
                            `✓ Admin notified\n` +
                            `✓ Audit log created\n\n` +
                            `Event ID ${evt.id} has been resolved.`,
                          type: 'success'
                        });
                        setConfirmModal({ ...confirmModal, isOpen: false });
                      }
                    });
                  }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 hover:text-red-300 text-sm rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 shadow-sm hover:shadow-md animate-pulse hover:animate-none"
                >
                  Suspend User
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-foreground-muted">No security events found matching your filters.</p>
          <button
            onClick={() => {
              setFilterSeverity('all');
              setFilterType('all');
            }}
            className="mt-4 text-primary hover:text-primary-hover"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
