'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import {
  Globe2,
  Plus,
  Activity,
  Cpu,
  Power,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
} as const;

type Role = keyof typeof roleLabels;

type UniverseMetrics = {
  apiCalls: number;
  stateOps: number;
  errors: number;
  lastActivity: string;
};

type Universe = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  config: Record<string, unknown>;
  connectionString: string;
  metrics: UniverseMetrics;
};

type UniverseSummary = {
  total: number;
  active: number;
  inactive: number;
  apiCalls: number;
  stateOps: number;
  errors: number;
  latestActivity: string | null;
};

type UniverseResponse = {
  currentUserRole: Role;
  universes: Universe[];
  summary: UniverseSummary;
};

const defaultSummary: UniverseSummary = {
  total: 0,
  active: 0,
  inactive: 0,
  apiCalls: 0,
  stateOps: 0,
  errors: 0,
  latestActivity: null,
};

const statusStyles: Record<'active' | 'inactive', string> = {
  active: 'bg-status-success/10 text-status-success border border-status-success/40',
  inactive: 'bg-status-warning/10 text-status-warning border border-status-warning/40',
};

export default function UniversesPage() {
  const router = useRouter();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [summary, setSummary] = useState<UniverseSummary>(defaultSummary);
  const [currentUserRole, setCurrentUserRole] = useState<Role>('member');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', config: '{\n  "initialState": true\n}' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [mutatingUniverseId, setMutatingUniverseId] = useState<string | null>(null);
  const [deletingUniverseId, setDeletingUniverseId] = useState<string | null>(null);

  const canManage = useMemo(() => currentUserRole === 'owner' || currentUserRole === 'admin', [currentUserRole]);

  const fetchUniverses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/universes');

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to load universes' }));
        throw new Error(body.error || 'Failed to load universes');
      }

      const data = (await response.json()) as UniverseResponse;
      setUniverses(data.universes);
      setSummary(data.summary);
      setCurrentUserRole(data.currentUserRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load universes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUniverses();
  }, [fetchUniverses]);

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setCreateError(null);

    if (!createForm.name.trim()) {
      setCreateError('Name is required');
      return;
    }

    const payload: Record<string, unknown> = {
      name: createForm.name.trim(),
    };

    if (createForm.description.trim()) {
      payload.description = createForm.description.trim();
    }

    if (createForm.config.trim()) {
      try {
        JSON.parse(createForm.config);
        payload.config = createForm.config;
      } catch {
        setCreateError('Configuration must be valid JSON');
        return;
      }
    }

    try {
      setCreateSubmitting(true);
      const response = await fetch('/api/universes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to create universe');
      }

      setFeedback('Universe created successfully.');
      setCreateModalOpen(false);
      setCreateForm({ name: '', description: '', config: '{\n  "initialState": true\n}' });
      await fetchUniverses();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create universe');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleToggleUniverse = async (universe: Universe) => {
    if (!canManage) return;

    setMutatingUniverseId(universe.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/universes/${universe.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !universe.isActive }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to update universe');
      }

      setFeedback(`Universe ${!universe.isActive ? 'activated' : 'deactivated'} successfully.`);
      await fetchUniverses();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to update universe');
    } finally {
      setMutatingUniverseId(null);
    }
  };

  const handleDeleteUniverse = async (universe: Universe) => {
    if (!canManage) return;

    if (!window.confirm(`Delete universe "${universe.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingUniverseId(universe.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/universes/${universe.id}`, {
        method: 'DELETE',
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to delete universe');
      }

      setFeedback('Universe deleted successfully.');
      await fetchUniverses();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to delete universe');
    } finally {
      setDeletingUniverseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4" />
          <p className="text-vscode-text-secondary">Loading universes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-status-error">{error}</p>
          <button
            type="button"
            onClick={() => void fetchUniverses()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-vscode-text mb-2">Universes</h1>
          <p className="text-vscode-text-secondary">
            Create and manage simulation universes for your organization.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Universe
          </button>
        )}
      </div>

      {feedback && (
        <div className="vscode-card border border-vscode-border p-4 bg-vscode-sidebar">
          <p className="text-sm text-vscode-text">{feedback}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="vscode-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-vscode-text-secondary">Total Universes</p>
              <p className="text-2xl font-semibold text-vscode-text">{summary.total}</p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">{summary.active} active · {summary.inactive} inactive</p>
        </div>

        <div className="vscode-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent-secondary" />
            </div>
            <div>
              <p className="text-sm text-vscode-text-secondary">API Calls</p>
              <p className="text-2xl font-semibold text-vscode-text">{summary.apiCalls.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">{summary.stateOps.toLocaleString()} state ops · {summary.errors.toLocaleString()} errors</p>
        </div>

        <div className="vscode-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-vscode-button flex items-center justify-center">
              <Cpu className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-vscode-text-secondary">Last Activity</p>
              <p className="text-2xl font-semibold text-vscode-text">
                {summary.latestActivity ? formatDistanceToNow(new Date(summary.latestActivity), { addSuffix: true }) : 'N/A'}
              </p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">Based on recorded universe metrics</p>
        </div>

        <div className="vscode-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-status-success/10 flex items-center justify-center">
              <Power className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-vscode-text-secondary">Your Permissions</p>
              <p className="text-2xl font-semibold text-vscode-text">{roleLabels[currentUserRole]}</p>
            </div>
          </div>
          {!canManage && (
            <p className="text-xs text-vscode-text-tertiary">Only owners and admins can create or manage universes.</p>
          )}
        </div>
      </div>

      <div className="vscode-card p-0 overflow-hidden">
        <div className="border-b border-vscode-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vscode-text">Universe Directory</h2>
          <span className="text-xs text-vscode-text-tertiary">{universes.length} total</span>
        </div>
        <div className="divide-y divide-vscode-border">
          {universes.map((universe) => (
            <div key={universe.id} className="px-6 py-4 flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-vscode-text">{universe.name}</h3>
                    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', statusStyles[universe.isActive ? 'active' : 'inactive'])}>
                      {universe.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-vscode-text-secondary max-w-3xl">
                    {universe.description || 'No description provided yet.'}
                  </p>
                  <p className="text-xs text-vscode-text-tertiary">
                    Created {format(new Date(universe.createdAt), 'MMM d, yyyy')} · Updated {formatDistanceToNow(new Date(universe.updatedAt), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-vscode-text-secondary break-all">
                    Connection: <span className="text-vscode-text">{universe.connectionString}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-vscode-text-secondary hover:bg-vscode-button"
                    onClick={() => router.push(`/dashboard/universes/${universe.id}`)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-vscode-text-secondary hover:bg-vscode-button disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={mutatingUniverseId === universe.id}
                      onClick={() => void handleToggleUniverse(universe)}
                    >
                      <Power className={clsx('w-4 h-4', universe.isActive ? 'text-status-warning' : 'text-status-success')} />
                      {mutatingUniverseId === universe.id ? 'Updating...' : universe.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-status-error hover:bg-status-error/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={deletingUniverseId === universe.id}
                      onClick={() => void handleDeleteUniverse(universe)}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingUniverseId === universe.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="vscode-card border border-vscode-border bg-vscode-editor p-4">
                  <p className="text-xs text-vscode-text-tertiary mb-1">API Calls</p>
                  <p className="text-lg font-semibold text-vscode-text">{universe.metrics.apiCalls.toLocaleString()}</p>
                </div>
                <div className="vscode-card border border-vscode-border bg-vscode-editor p-4">
                  <p className="text-xs text-vscode-text-tertiary mb-1">State Operations</p>
                  <p className="text-lg font-semibold text-vscode-text">{universe.metrics.stateOps.toLocaleString()}</p>
                </div>
                <div className="vscode-card border border-vscode-border bg-vscode-editor p-4">
                  <p className="text-xs text-vscode-text-tertiary mb-1">Errors</p>
                  <p className="text-lg font-semibold text-vscode-text">{universe.metrics.errors.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}

          {universes.length === 0 && (
            <div className="px-6 py-12 text-center text-vscode-text-secondary">
              No universes yet. Create your first universe to begin simulation.
            </div>
          )}
        </div>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="vscode-card w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-vscode-text">Create Universe</h3>
              <button
                type="button"
                className="text-vscode-text-secondary hover:text-vscode-text"
                onClick={() => {
                  setCreateModalOpen(false);
                  setCreateError(null);
                }}
              >
                ×
              </button>
            </div>

            <p className="text-sm text-vscode-text-secondary">
              Universes encapsulate state and simulation logic for your organization. Configure them with JSON parameters to tailor behavior.
            </p>

            {createError && <p className="text-sm text-status-error">{createError}</p>}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="universe-name" className="block text-sm font-medium text-vscode-text-secondary mb-2">
                  Name
                </label>
                <input
                  id="universe-name"
                  type="text"
                  className="input-field"
                  placeholder="Quantum Anchor"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label htmlFor="universe-description" className="block text-sm font-medium text-vscode-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  id="universe-description"
                  className="input-field min-h-[100px]"
                  placeholder="Briefly describe what this universe simulates."
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="universe-config" className="block text-sm font-medium text-vscode-text-secondary mb-2">
                  Configuration JSON
                </label>
                <textarea
                  id="universe-config"
                  className="input-field font-mono text-sm min-h-[180px]"
                  value={createForm.config}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, config: event.target.value }))}
                />
                <p className="mt-2 text-xs text-vscode-text-tertiary">
                  Provide structured parameters for the universe. Leave blank for defaults.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-sm text-vscode-text-secondary hover:bg-vscode-button"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Universe
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
