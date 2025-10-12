'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import useStore from 'fortistate/useStore';
import { settingsStore } from '@/stores/stores';
import { Settings as SettingsIcon, Save, Building2, Globe, Shield } from 'lucide-react';

type OrgSettings = {
  organization: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
  };
  settings: {
    allowPublicUniverses: boolean;
    requireTwoFactor: boolean;
    sessionTimeout: number;
  };
};

export default function SettingsPage() {
  const [settingsState, settingsUtils] = useStore(settingsStore);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      settingsUtils.set({ ...settingsState.value, loading: true, error: null });

      const response = await fetch('/api/settings');
      const body = await response.json().catch(() => ({ error: 'Failed to load settings' }));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to load settings');
      }

      const data = body as OrgSettings;
      settingsUtils.set({
        value: {
          name: data.organization.name,
          slug: data.organization.slug,
          domain: data.organization.domain || '',
          allowPublicUniverses: data.settings.allowPublicUniverses,
          require2FA: data.settings.requireTwoFactor,
          sessionTimeoutMinutes: data.settings.sessionTimeout,
          loading: false,
          error: null,
        },
      });
    } catch (err) {
      settingsUtils.set({
        ...settingsState,
        value: {
          ...settingsState.value,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load settings',
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);
      setFeedback(null);

      const form = new FormData(event.currentTarget);
      const payload = {
        name: form.get('name')?.toString().trim(),
        domain: form.get('domain')?.toString().trim() || null,
        allowPublicUniverses: form.get('allowPublicUniverses') === 'on',
        requireTwoFactor: form.get('requireTwoFactor') === 'on',
        sessionTimeout: Number(form.get('sessionTimeout')),
      };

      try {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const body = await response.json().catch(() => ({ error: 'Save failed' }));
        if (!response.ok) {
          throw new Error(body.error || 'Failed to save settings');
        }

        setFeedback('Settings saved successfully.');
        await fetchSettings();
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : 'Failed to save settings');
      } finally {
        setSaving(false);
      }
    },
    [fetchSettings],
  );

  const { loading, error, name, slug, domain, allowPublicUniverses, require2FA, sessionTimeoutMinutes } =
    settingsState?.value || {
      loading: false,
      error: null,
      name: '',
      slug: '',
      domain: '',
      allowPublicUniverses: false,
      require2FA: false,
      sessionTimeoutMinutes: 30,
    };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <SettingsIcon className="w-10 h-10 animate-spin text-accent-primary mx-auto mb-4" />
          <p className="text-vscode-text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => void fetchSettings()}
            className="px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-vscode-text mb-2">Settings</h1>
        <p className="text-vscode-text-secondary">Manage organization profile, security policies, and integrations.</p>
      </div>

      {feedback && (
        <div className="vscode-card border border-vscode-border p-4 bg-vscode-sidebar">
          <p className="text-sm text-vscode-text">{feedback}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="vscode-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-vscode-text">Organization profile</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-vscode-text mb-1">
                Organization name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={name}
                className="vscode-input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-vscode-text mb-1">
                Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                defaultValue={slug}
                className="vscode-input w-full"
                disabled
              />
              <p className="text-xs text-vscode-text-tertiary mt-1">
                Slug cannot be changed after creation.
              </p>
            </div>

            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-vscode-text mb-1">
                Custom domain (optional)
              </label>
              <input
                type="text"
                id="domain"
                name="domain"
                defaultValue={domain}
                className="vscode-input w-full"
                placeholder="app.yourcompany.com"
              />
            </div>
          </div>
        </section>

        <section className="vscode-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-accent-secondary" />
            <h2 className="text-xl font-semibold text-vscode-text">Sharing & access</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-vscode-text">Allow public universes</p>
              <p className="text-xs text-vscode-text-secondary">
                Members can mark universes as publicly accessible without authentication.
              </p>
            </div>
            <input
              type="checkbox"
              name="allowPublicUniverses"
              defaultChecked={allowPublicUniverses}
              className="w-4 h-4"
            />
          </div>
        </section>

        <section className="vscode-card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-accent-tertiary" />
            <h2 className="text-xl font-semibold text-vscode-text">Security policies</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-vscode-text">Require two-factor authentication</p>
              <p className="text-xs text-vscode-text-secondary">
                Enforce 2FA for all organization members.
              </p>
            </div>
            <input
              type="checkbox"
              name="requireTwoFactor"
              defaultChecked={require2FA}
              className="w-4 h-4"
            />
          </div>

          <div>
            <label htmlFor="sessionTimeout" className="block text-sm font-medium text-vscode-text mb-1">
              Session timeout (hours)
            </label>
            <input
              type="number"
              id="sessionTimeout"
              name="sessionTimeout"
              defaultValue={sessionTimeoutMinutes}
              min="1"
              max="168"
              className="vscode-input w-32"
              required
            />
            <p className="text-xs text-vscode-text-tertiary mt-1">
              Users will be logged out after this period of inactivity.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
