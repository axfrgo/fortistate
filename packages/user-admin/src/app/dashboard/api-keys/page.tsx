'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import {
  KeyRound,
  ShieldCheck,
  ShieldHalf,
  ShieldAlert,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Loader2,
  Check,
  ShieldX,
} from 'lucide-react';

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
} as const;

type Role = keyof typeof roleLabels;

type ApiKeyPermission = 'read' | 'write' | 'admin';

type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  permissions: ApiKeyPermission[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
};

type ApiKeysResponse = {
  currentUserRole: Role;
  canManage: boolean;
  keys: ApiKeyRecord[];
};

const permissionLabels: Record<ApiKeyPermission, string> = {
  read: 'Read',
  write: 'Write',
  admin: 'Admin',
};

const permissionDescriptions: Record<ApiKeyPermission, string> = {
  read: 'State reads & analytics',
  write: 'State mutations & actions',
  admin: 'Full administrative access',
};

const permissionOrder: ApiKeyPermission[] = ['read', 'write', 'admin'];

function formatPermissions(permissions: ApiKeyPermission[]) {
  if (permissions.includes('admin')) {
    return 'Admin';
  }

  if (permissions.length === 2) {
    return permissions.map((permission) => permissionLabels[permission]).join(' + ');
  }

  return permissionLabels[permissions[0]];
}

function statusBadgeClasses(isActive: boolean) {
  return isActive
    ? 'bg-status-success/10 text-status-success border border-status-success/40'
    : 'bg-status-warning/10 text-status-warning border border-status-warning/40';
}

type CreateFormState = {
  name: string;
  permissions: Record<ApiKeyPermission, boolean>;
  expiresInDays: string;
};

const defaultCreateState: CreateFormState = {
  name: '',
  permissions: {
    read: true,
    write: false,
    admin: false,
  },
  expiresInDays: 'never',
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<Role>('member');
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateState);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [generatedKey, setGeneratedKey] = useState<{ name: string; value: string } | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/api-keys');

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to load API keys' }));
        throw new Error(body.error || 'Failed to load API keys');
      }

      const data = (await response.json()) as ApiKeysResponse;
      setKeys(data.keys);
      setCurrentUserRole(data.currentUserRole);
      setCanManage(data.canManage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  const permissionSelection = useMemo(() => {
    const selected = permissionOrder.filter((permission) => createForm.permissions[permission]);
    if (selected.includes('admin')) {
      return ['admin'];
    }
    return selected.length ? selected : ['read'];
  }, [createForm.permissions]);

  const totalKeys = keys.length;
  const activeKeys = keys.filter((key) => key.isActive).length;
  const revokedKeys = totalKeys - activeKeys;

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManage) return;

    setCreateError(null);
    setFeedback(null);

    if (!createForm.name.trim()) {
      setCreateError('Name is required.');
      return;
    }

    const payload: Record<string, unknown> = {
      name: createForm.name.trim(),
      permissions: permissionSelection,
    };

    if (createForm.expiresInDays !== 'never') {
      payload.expiresInDays = Number(createForm.expiresInDays);
    }

    try {
      setCreateSubmitting(true);
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to create API key');
      }

      setGeneratedKey({ name: createForm.name.trim(), value: body.plainTextKey });
      setCreateModalOpen(false);
      setCreateForm(defaultCreateState);
      setFeedback('API key created successfully. Copy it now—this is the only time it will be shown.');
      await fetchKeys();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleCopyGeneratedKey = async () => {
    if (!generatedKey?.value) return;

    try {
      await navigator.clipboard.writeText(generatedKey.value);
      setFeedback('API key copied to clipboard.');
      setGeneratedKey((prev) => (prev ? { ...prev, name: prev.name } : prev));
    } catch {
      setFeedback('Unable to copy automatically. Please copy the key manually.');
    }
  };

  const handleRevoke = async (key: ApiKeyRecord) => {
    if (!canManage) return;

    setRevokingKeyId(key.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/api-keys/${key.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !key.isActive }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to update API key');
      }

      setFeedback(key.isActive ? 'API key revoked.' : 'API key reactivated.');
      await fetchKeys();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to update API key');
    } finally {
      setRevokingKeyId(null);
    }
  };

  const handleDelete = async (key: ApiKeyRecord) => {
    if (!canManage) return;

    if (!window.confirm(`Delete API key "${key.name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingKeyId(key.id);
    setFeedback(null);

    try {
      const response = await fetch(`/api/api-keys/${key.id}`, {
        method: 'DELETE',
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to delete API key');
      }

      setFeedback('API key deleted.');
      await fetchKeys();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setDeletingKeyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4" />
          <p className="text-vscode-text-secondary">Loading API keys...</p>
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
            onClick={() => void fetchKeys()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
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
          <h1 className="text-3xl font-bold text-vscode-text mb-2">API Keys</h1>
          <p className="text-vscode-text-secondary">
            Generate, revoke, and monitor API keys for integrations and automation.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Key
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
              <KeyRound className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-vscode-text-secondary">Total Keys</p>
              <p className="text-2xl font-semibold text-vscode-text">{totalKeys}</p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">{activeKeys} active · {revokedKeys} revoked</p>
        </div>

        <div className="vscode-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-accent-secondary" />
            </div>
            <div>
              <p className="text-sm text-vscode-text-secondary">Your Permissions</p>
              <p className="text-2xl font-semibold text-vscode-text">{roleLabels[currentUserRole]}</p>
            </div>
          </div>
          {!canManage && (
            <p className="text-xs text-vscode-text-tertiary">Only owners and admins can create or manage API keys.</p>
          )}
        </div>

        <div className="vscode-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-vscode-button flex items-center justify-center">
              <ShieldHalf className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-vscode-text-secondary">Read/Write Coverage</p>
              <p className="text-2xl font-semibold text-vscode-text">
                {keys.filter((key) => key.permissions.includes('write') || key.permissions.includes('admin')).length}
              </p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">Keys with write/admin access</p>
        </div>

        <div className="vscode-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-status-warning/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-status-warning" />
            </div>
            <div>
              <p className="text-sm text-vscode-text-secondary">Expiring Soon</p>
              <p className="text-2xl font-semibold text-vscode-text">
                {
                  keys.filter((key) => {
                    if (!key.expiresAt) return false;
                    const expires = new Date(key.expiresAt).getTime();
                    const now = Date.now();
                    const sevenDays = 7 * 24 * 60 * 60 * 1000;
                    return expires - now < sevenDays && expires > now;
                  }).length
                }
              </p>
            </div>
          </div>
          <p className="text-xs text-vscode-text-tertiary">Keys expiring within 7 days</p>
        </div>
      </div>

      <div className="vscode-card p-0 overflow-hidden">
        <div className="border-b border-vscode-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vscode-text">Key Directory</h2>
          <span className="text-xs text-vscode-text-tertiary">{keys.length} keys</span>
        </div>

        <div className="divide-y divide-vscode-border">
          {keys.map((key) => (
            <div key={key.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-vscode-text">{key.name}</h3>
                  <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium', statusBadgeClasses(key.isActive))}>
                    {key.isActive ? 'Active' : 'Revoked'}
                  </span>
                </div>
                <p className="text-sm text-vscode-text-secondary">
                  {formatPermissions(key.permissions)} · {key.prefix}***
                </p>
                <p className="text-xs text-vscode-text-tertiary">
                  Created {format(new Date(key.createdAt), 'MMM d, yyyy')} · Last used{' '}
                  {key.lastUsedAt ? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true }) : 'Never'}
                </p>
                {key.expiresAt && (
                  <p className="text-xs text-status-warning">
                    Expires {format(new Date(key.expiresAt), 'PPpp')} ({formatDistanceToNow(new Date(key.expiresAt), { addSuffix: true })})
                  </p>
                )}
              </div>

              {canManage && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-vscode-text-secondary hover:bg-vscode-button disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleRevoke(key)}
                    disabled={revokingKeyId === key.id}
                  >
                    {revokingKeyId === key.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : key.isActive ? (
                      <ShieldX className="w-4 h-4 text-status-warning" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-status-success" />
                    )}
                    {key.isActive ? 'Revoke' : 'Reactivate'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-status-error hover:bg-status-error/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void handleDelete(key)}
                    disabled={deletingKeyId === key.id}
                  >
                    {deletingKeyId === key.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}

          {keys.length === 0 && (
            <div className="px-6 py-12 text-center text-vscode-text-secondary">
              No API keys yet. Generate one to integrate FortiState into your workflows.
            </div>
          )}
        </div>
      </div>

      {canManage && createModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="vscode-card w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-vscode-text">Generate API Key</h3>
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
              API keys authenticate requests to FortiState. Choose minimal permissions and share securely.
            </p>

            {createError && <p className="text-sm text-status-error">{createError}</p>}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="api-key-name" className="block text-sm font-medium text-vscode-text-secondary mb-2">
                  Key Name
                </label>
                <input
                  id="api-key-name"
                  type="text"
                  className="input-field"
                  placeholder="Production Automation"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>

              <div>
                <p className="block text-sm font-medium text-vscode-text-secondary mb-2">Permissions</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {permissionOrder.map((permission) => (
                    <label key={permission} className="vscode-card border border-vscode-border p-4 flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={createForm.permissions[permission]}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setCreateForm((prev) => {
                            const next = { ...prev.permissions };
                            if (permission === 'admin') {
                              next.read = checked;
                              next.write = checked;
                              next.admin = checked;
                            } else {
                              next[permission] = checked;
                              if (!next.read && !next.write && !next.admin) {
                                next.read = true;
                              }
                              if (next.admin) {
                                next.admin = false;
                              }
                            }
                            return {
                              ...prev,
                              permissions: next,
                            };
                          });
                        }}
                      />
                      <div>
                        <p className="text-sm text-vscode-text font-medium">{permissionLabels[permission]}</p>
                        <p className="text-xs text-vscode-text-tertiary">{permissionDescriptions[permission]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="api-key-expiration" className="block text-sm font-medium text-vscode-text-secondary mb-2">
                  Expiration
                </label>
                <select
                  id="api-key-expiration"
                  className="input-field"
                  value={createForm.expiresInDays}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, expiresInDays: event.target.value }))}
                >
                  <option value="never">Never</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                </select>
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
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Generate Key
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {generatedKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="vscode-card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-status-success" />
              <h3 className="text-xl font-semibold text-vscode-text">API Key Generated</h3>
            </div>
            <p className="text-sm text-vscode-text-secondary">
              Copy and store the key securely. You will not be able to view it again.
            </p>
            <div className="bg-vscode-editor border border-vscode-border rounded-md p-4 font-mono text-sm text-vscode-text break-all">
              {generatedKey.value}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-vscode-text-secondary hover:bg-vscode-button"
                onClick={() => void handleCopyGeneratedKey()}
              >
                <Copy className="w-4 h-4" />
                Copy Key
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setGeneratedKey(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
