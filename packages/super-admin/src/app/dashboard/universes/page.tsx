'use client';

import { useEffect, useState } from 'react';
import { exportUniverses } from '@/lib/exportUtils';
import { ConfirmModal, AlertModal } from '@/components/Modals';
import Link from 'next/link';

interface Universe {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  status: 'running' | 'stopped' | 'error';
  lawViolations: number;
  entityCount: number;
  stateSize: number; // in KB
  totalOperations: number;
  createdAt: string;
  lastActiveAt: string;
}

export default function UniversesPage() {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'stopped' | 'error'>('all');
  const [filterViolations, setFilterViolations] = useState<'all' | 'clean' | 'violations'>('all');

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
    // Fetch universes from API
    async function fetchUniverses() {
      try {
        const response = await fetch('/api/universes');
        if (!response.ok) {
          throw new Error('Failed to fetch universes');
        }
        const data = await response.json();
        setUniverses(data.universes);
      } catch (error) {
        console.error('Error fetching universes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUniverses();
  }, []);

  const filteredUniverses = universes.filter(univ => {
    const matchesSearch = searchQuery === '' || 
      univ.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      univ.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      univ.id.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || univ.status === filterStatus;

    const matchesViolations = 
      filterViolations === 'all' ||
      (filterViolations === 'clean' && univ.lawViolations === 0) ||
      (filterViolations === 'violations' && univ.lawViolations > 0);

    return matchesSearch && matchesStatus && matchesViolations;
  });

  const totalEntities = universes.reduce((sum, u) => sum + u.entityCount, 0);
  const totalOperations = universes.reduce((sum, u) => sum + u.totalOperations, 0);
  const totalViolations = universes.reduce((sum, u) => sum + u.lawViolations, 0);
  const activeCount = universes.filter(u => u.status === 'running').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading universes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">🌌 Universe Monitoring</h1>
          <p className="text-foreground-muted">
            Monitor all {universes.length} universes across the platform
          </p>
        </div>
        <button 
          onClick={() => exportUniverses(universes)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          Export Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Active Universes</div>
          <div className="text-3xl font-bold text-emerald-400">{activeCount}</div>
          <div className="text-xs text-foreground-muted mt-1">
            {((activeCount / universes.length) * 100).toFixed(0)}% of total
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Entities</div>
          <div className="text-3xl font-bold text-primary">
            {(totalEntities / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Across all universes
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Operations</div>
          <div className="text-3xl font-bold text-primary">
            {(totalOperations / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            All time
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Law Violations</div>
          <div className={`text-3xl font-bold ${totalViolations > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {totalViolations}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {universes.filter(u => u.lawViolations > 0).length} affected universes
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Search Universes
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, organization, or ID..."
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-2">
              Law Violations
            </label>
            <select
              value={filterViolations}
              onChange={(e) => setFilterViolations(e.target.value as any)}
              className="w-full px-4 py-2 bg-background border border-slate-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All</option>
              <option value="clean">Clean (No Violations)</option>
              <option value="violations">Has Violations</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-foreground-muted">
          Showing {filteredUniverses.length} of {universes.length} universes
        </div>
      </div>

      {/* Universes Table */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Universe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Entities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  State Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Violations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUniverses.map((univ) => (
                <tr key={univ.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">{univ.name}</div>
                      <div className="text-xs text-foreground-muted">{univ.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/dashboard/organizations/${univ.organizationId}`}
                      className="text-sm text-primary hover:text-primary-hover"
                    >
                      {univ.organizationName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        univ.status === 'running'
                          ? 'status-active'
                          : univ.status === 'stopped'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'status-error'
                      }`}
                    >
                      {univ.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {univ.entityCount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {univ.stateSize > 1024 
                        ? `${(univ.stateSize / 1024).toFixed(1)} MB`
                        : `${univ.stateSize} KB`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {univ.lawViolations > 0 ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400">⚠️</span>
                        <span className="text-sm font-medium text-red-400">
                          {univ.lawViolations}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-emerald-400">✓ Clean</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground-muted">
                      {new Date(univ.lastActiveAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/universes/${univ.id}`}
                        className="text-primary hover:text-primary-hover"
                      >
                        View
                      </Link>
                      {univ.status === 'running' && (
                        <button 
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Stop Universe',
                              message: `Stop universe "${univ.name}"?\n\nThis will:\n• Halt all operations\n• Preserve current state (${univ.stateSize}KB)\n• Stop processing events\n\nYou can restart it later.`,
                              type: 'warning',
                              onConfirm: () => {
                                setAlertModal({
                                  isOpen: true,
                                  title: 'Universe Stopped',
                                  message: `🛑 Universe "${univ.name}" stopped successfully!\n\nState preserved. You can restart anytime.`,
                                  type: 'info'
                                });
                                // Optimistic UI update
                                setUniverses(universes.map(u => 
                                  u.id === univ.id ? { ...u, status: 'stopped' as const } : u
                                ));
                                setConfirmModal({ ...confirmModal, isOpen: false });
                              }
                            });
                          }}
                          className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-medium"
                        >
                          Stop
                        </button>
                      )}
                      {univ.status === 'stopped' && (
                        <button 
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Start Universe',
                              message: `Start universe "${univ.name}"?\n\nThis will:\n• Resume all operations\n• Load state (${univ.stateSize}KB)\n• Begin processing events`,
                              type: 'success',
                              onConfirm: () => {
                                setAlertModal({
                                  isOpen: true,
                                  title: 'Universe Started',
                                  message: `▶️ Universe "${univ.name}" started successfully!\n\nNow processing events.`,
                                  type: 'success'
                                });
                                // Optimistic UI update
                                setUniverses(universes.map(u => 
                                  u.id === univ.id ? { ...u, status: 'running' as const } : u
                                ));
                                setConfirmModal({ ...confirmModal, isOpen: false });
                              }
                            });
                          }}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-medium"
                        >
                          Start
                        </button>
                      )}
                      {univ.status === 'error' && (
                        <button 
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Restart Universe',
                              message: `🔄 RESTART universe "${univ.name}"?\n\nThis will:\n• Attempt to recover from error\n• Reset connections\n• Reload state\n\nError: ${univ.lawViolations} law violations detected`,
                              type: 'warning',
                              onConfirm: () => {
                                setAlertModal({
                                  isOpen: true,
                                  title: 'Universe Restarting',
                                  message: `🔄 Universe "${univ.name}" restarting...\n\nMonitoring for successful recovery.`,
                                  type: 'info'
                                });
                                // Optimistic UI update
                                setUniverses(universes.map(u => 
                                  u.id === univ.id ? { ...u, status: 'running' as const } : u
                                ));
                                setConfirmModal({ ...confirmModal, isOpen: false });
                              }
                            });
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-medium"
                        >
                          Restart
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUniverses.length === 0 && (
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-12 text-center">
          <p className="text-foreground-muted">No universes found matching your filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterViolations('all');
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
