'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Activity,
  Cpu,
  Power,
  Trash2,
  Save,
  Loader2,
  Copy,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

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

type UniverseResponse = {
  currentUserRole: Role;
  universe: Universe;
};

const statusStyles: Record<'active' | 'inactive', string> = {
  active: 'bg-status-success/10 text-status-success border border-status-success/40',
  inactive: 'bg-status-warning/10 text-status-warning border border-status-warning/40',
};

function formatConfig(config: Record<string, unknown>): string {
  try {
    return JSON.stringify(config, null, 2);
  } catch {
    return '{}';
  }
}

export default function UniverseDetailPage() {
  const router = useRouter();
  const params = useParams<{ universeId: string }>();
  const universeId = params?.universeId ?? '';

  const [universe, setUniverse] = useState<Universe | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<Role>('member');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', configText: '{}', isActive: true });

  const canManage = useMemo(() => currentUserRole === 'owner' || currentUserRole === 'admin', [currentUserRole]);

  const fetchUniverse = useCallback(async () => {
    if (!universeId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/universes/${universeId}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to load universe' }));
        throw new Error(body.error || 'Failed to load universe');
      }

      const data = (await response.json()) as UniverseResponse;
      setUniverse(data.universe);
      setCurrentUserRole(data.currentUserRole);
      setForm({
        name: data.universe.name,
        description: data.universe.description ?? '',
        configText: formatConfig(data.universe.config),
        isActive: data.universe.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load universe');
    } finally {
      setLoading(false);
    }
  }, [universeId]);

  useEffect(() => {
    void fetchUniverse();
  }, [fetchUniverse]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const hasChanges = useMemo(() => {
    if (!universe) return false;

    const originalConfig = formatConfig(universe.config);
    const normalizedCurrent = form.configText.trim().length ? form.configText.trim() : '{}';
    const normalizedOriginal = originalConfig.trim().length ? originalConfig.trim() : '{}';

    return (
      form.name.trim() !== universe.name ||
      form.description.trim() !== (universe.description ?? '').trim() ||
      form.isActive !== universe.isActive ||
      normalizedCurrent !== normalizedOriginal
    );
  }, [form, universe]);

  const handleSave = async () => {
    if (!universe) return;

    setFeedback(null);
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Name is required');
      return;
    }

    const payload: Record<string, unknown> = {};

    if (form.name.trim() !== universe.name) {
      payload.name = form.name.trim();
    }

    const trimmedDescription = form.description.trim();
    if (trimmedDescription !== (universe.description ?? '').trim()) {
      payload.description = trimmedDescription.length ? trimmedDescription : null;
    }

    if (form.isActive !== universe.isActive) {
      payload.isActive = form.isActive;
    }

    const configText = form.configText.trim();
    if (configText.length) {
      try {
        JSON.parse(configText);
      } catch {
        setFormError('Configuration must be valid JSON');
        return;
      }
    }

    const originalConfig = formatConfig(universe.config).trim();
    const normalizedConfigText = configText.length ? configText : '{}';
    if (normalizedConfigText !== (originalConfig.length ? originalConfig : '{}')) {
      payload.config = normalizedConfigText;
    }

    if (Object.keys(payload).length === 0) {
      setFeedback('No changes detected.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/universes/${universe.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to save changes');
      }

      setFeedback('Universe updated successfully.');
      await fetchUniverse();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!universe || !canManage) return;

    if (!window.confirm(`Delete universe "${universe.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/universes/${universe.id}`, {
        method: 'DELETE',
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to delete universe');
      }

      router.push('/dashboard/universes');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to delete universe');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyConnection = async () => {
    if (!universe?.connectionString) return;
    try {
      await navigator.clipboard.writeText(universe.connectionString);
      setCopied(true);
    } catch {
      setFeedback('Unable to copy connection string. Copy manually instead.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4" />
          <p className="text-vscode-text-secondary">Loading universe...</p>
        </div>
      </div>
    );
  }

  if (error || !universe) {
    return (
      <div className="p-8">
        <div className="vscode-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 text-vscode-text-secondary" />
            <Link href="/dashboard/universes" className="text-accent-primary hover:underline text-sm">
              Back to universes
            </Link>
          </div>
          <p className="text-status-error">{error || 'Universe not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-vscode-text-secondary">
          <Link href="/dashboard/universes" className="hover:text-vscode-text">
            Universes
          </Link>
          <span>/</span>
          <span className="text-vscode-text">{universe.name}</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-vscode-text mb-2">{universe.name}</h1>
            <p className="text-vscode-text-secondary max-w-3xl">
              {universe.description || 'No description yet. Add one to document the purpose of this universe.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium', statusStyles[universe.isActive ? 'active' : 'inactive'])}>
              {universe.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-xs text-vscode-text-tertiary">Role: {roleLabels[currentUserRole]}</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="vscode-card border border-vscode-border p-4 bg-vscode-sidebar">
          <p className="text-sm text-vscode-text">{feedback}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="vscode-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-accent-secondary" />
            <div>
              <p className="text-sm text-vscode-text-secondary">API Calls</p>
              <p className="text-2xl font-semibold text-vscode-text">{universe.metrics.apiCalls.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">Last activity {formatDistanceToNow(new Date(universe.metrics.lastActivity), { addSuffix: true })}</p>
        </div>

        <div className="vscode-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-accent-primary" />
            <div>
              <p className="text-sm text-vscode-text-secondary">State Operations</p>
              <p className="text-2xl font-semibold text-vscode-text">{universe.metrics.stateOps.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">{universe.metrics.errors.toLocaleString()} errors recorded</p>
        </div>

        <div className="vscode-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-accent-secondary" />
            <div>
              <p className="text-sm text-vscode-text-secondary">Meta</p>
              <p className="text-2xl font-semibold text-vscode-text">{format(new Date(universe.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">Updated {formatDistanceToNow(new Date(universe.updatedAt), { addSuffix: true })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="vscode-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-vscode-text">Universe Settings</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="universe-name" className="block text-sm font-medium text-vscode-text-secondary mb-2">
                Name
              </label>
              <input
                id="universe-name"
                type="text"
                className="input-field"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={!canManage}
              />
            </div>

            <div>
              <label htmlFor="universe-description" className="block text-sm font-medium text-vscode-text-secondary mb-2">
                Description
              </label>
              <textarea
                id="universe-description"
                className="input-field min-h-[120px]"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                disabled={!canManage}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-vscode-text-secondary">Status</p>
                <p className="text-xs text-vscode-text-tertiary">
                  Toggle to activate or pause processing for this universe.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-vscode-text-secondary hover:bg-vscode-button disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                disabled={!canManage}
              >
                <Power className={clsx('w-4 h-4', form.isActive ? 'text-status-success' : 'text-status-warning')} />
                {form.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div>
              <label htmlFor="universe-config" className="block text-sm font-medium text-vscode-text-secondary mb-2">
                Configuration JSON
              </label>
              <textarea
                id="universe-config"
                className="input-field font-mono text-sm min-h-[240px]"
                value={form.configText}
                onChange={(event) => setForm((prev) => ({ ...prev, configText: event.target.value }))}
                disabled={!canManage}
              />
            </div>

            {formError && <p className="text-sm text-status-error">{formError}</p>}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-sm text-vscode-text-secondary hover:bg-vscode-button disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canManage || !hasChanges}
                onClick={() => void fetchUniverse()}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canManage || !hasChanges || saving}
                onClick={() => void handleSave()}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="vscode-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-vscode-text">Connection & Metadata</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-vscode-text-secondary">Connection string</p>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-vscode-text-secondary hover:bg-vscode-button"
                onClick={() => void handleCopyConnection()}
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-vscode-text bg-vscode-editor border border-vscode-border rounded-md px-3 py-2 break-all font-mono">
              {universe.connectionString}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm text-vscode-text-secondary">
              <div>
                <p className="text-xs text-vscode-text-tertiary">Created</p>
                <p>{format(new Date(universe.createdAt), 'PPpp')}</p>
              </div>
              <div>
                <p className="text-xs text-vscode-text-tertiary">Updated</p>
                <p>{format(new Date(universe.updatedAt), 'PPpp')}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-vscode-text-secondary mb-2">Configuration Preview</p>
            <pre className="bg-vscode-editor border border-vscode-border rounded-md p-4 text-xs text-vscode-text overflow-auto max-h-64">
{JSON.stringify(universe.config, null, 2)}
            </pre>
          </div>

          <div className="border-t border-vscode-border pt-4">
            <h3 className="text-sm font-semibold text-status-error mb-2">Danger Zone</h3>
            <p className="text-xs text-vscode-text-tertiary mb-3">
              Permanently delete this universe and its metrics. This action cannot be undone.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-status-error hover:bg-status-error/10 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => void handleDelete()}
              disabled={!canManage || deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? 'Deleting...' : 'Delete Universe'}
            </button>
          </div>
        </div>
      </div>

      <div className="vscode-card p-6">
        <h2 className="text-lg font-semibold text-vscode-text mb-3">Activity Timeline</h2>
        <p className="text-sm text-vscode-text-secondary">
          Universe activity appears in the global dashboard feed. Dedicated filtering will arrive in a later milestone.
        </p>
      </div>
    </div>
  );
}
