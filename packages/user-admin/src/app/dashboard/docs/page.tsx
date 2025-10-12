'use client';

import { useState } from 'react';
import { FileText, Code, Database, Key, Zap } from 'lucide-react';

const API_ENDPOINTS = [
  {
    category: 'Authentication',
    icon: Key,
    endpoints: [
      { method: 'POST', path: '/api/auth/login', description: 'Authenticate and receive a session token' },
      { method: 'POST', path: '/api/auth/register', description: 'Create a new user account' },
      { method: 'POST', path: '/api/auth/logout', description: 'Invalidate the current session' },
    ],
  },
  {
    category: 'Universes',
    icon: Database,
    endpoints: [
      { method: 'GET', path: '/api/universes', description: 'List all universes for the organization' },
      { method: 'POST', path: '/api/universes', description: 'Create a new universe' },
      { method: 'GET', path: '/api/universes/:id', description: 'Retrieve a specific universe configuration' },
      { method: 'PUT', path: '/api/universes/:id', description: 'Update universe settings' },
      { method: 'DELETE', path: '/api/universes/:id', description: 'Delete a universe' },
    ],
  },
  {
    category: 'State Operations',
    icon: Zap,
    endpoints: [
      { method: 'GET', path: '/api/state/:universe', description: 'Read current state from a universe' },
      { method: 'POST', path: '/api/state/:universe', description: 'Mutate state within a universe' },
      { method: 'GET', path: '/api/state/:universe/history', description: 'Retrieve state change history' },
    ],
  },
  {
    category: 'API Keys',
    icon: Key,
    endpoints: [
      { method: 'GET', path: '/api/keys', description: 'List all API keys for the organization' },
      { method: 'POST', path: '/api/keys', description: 'Generate a new API key' },
      { method: 'DELETE', path: '/api/keys/:id', description: 'Revoke an API key' },
    ],
  },
];

const CODE_SAMPLES = {
  curl: `curl -X POST https://api.fortistate.dev/api/state/my-universe \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "increment", "path": "/counter"}'`,
  javascript: `import { createClient } from '@fortistate/client';

const client = createClient({
  apiKey: process.env.FORTISTATE_API_KEY,
  universe: 'my-universe',
});

await client.mutate({
  action: 'increment',
  path: '/counter',
});`,
  python: `from fortistate import Client

client = Client(
    api_key=os.environ["FORTISTATE_API_KEY"],
    universe="my-universe"
)

client.mutate(action="increment", path="/counter")`,
};

export default function DocsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('javascript');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-vscode-text mb-2">API Documentation</h1>
        <p className="text-vscode-text-secondary">
          Interactive reference for all Fortistate API endpoints, request formats, and authentication patterns.
        </p>
      </div>

      <section className="vscode-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-accent-primary" />
          <h2 className="text-xl font-semibold text-vscode-text">Authentication</h2>
        </div>
        <p className="text-sm text-vscode-text-secondary">
          All API requests require an API key passed in the <code className="bg-vscode-button px-1.5 py-0.5 rounded text-xs">Authorization</code> header:
        </p>
        <div className="bg-vscode-sidebar border border-vscode-border rounded p-4">
          <code className="text-xs text-green-400">Authorization: Bearer YOUR_API_KEY</code>
        </div>
        <p className="text-sm text-vscode-text-secondary">
          Generate keys from the <a href="/dashboard/api-keys" className="text-accent-primary underline">API Keys</a> page.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-vscode-text">Endpoints</h2>
        {API_ENDPOINTS.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.category} className="vscode-card p-6 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 text-accent-secondary" />
                <h3 className="text-lg font-semibold text-vscode-text">{category.category}</h3>
              </div>
              <div className="space-y-2">
                {category.endpoints.map((endpoint) => (
                  <div
                    key={endpoint.path}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-vscode-border rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold ${
                          endpoint.method === 'GET'
                            ? 'bg-blue-500/10 text-blue-400'
                            : endpoint.method === 'POST'
                            ? 'bg-green-500/10 text-green-400'
                            : endpoint.method === 'PUT'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-vscode-text font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-xs text-vscode-text-secondary">{endpoint.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="vscode-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-accent-tertiary" />
          <h2 className="text-xl font-semibold text-vscode-text">Code samples</h2>
        </div>
        <div className="flex gap-2">
          {(['curl', 'javascript', 'python'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedLanguage === lang
                  ? 'bg-accent-primary text-white'
                  : 'bg-vscode-button text-vscode-text-secondary hover:text-vscode-text'
              }`}
            >
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>
        <div className="bg-vscode-sidebar border border-vscode-border rounded p-4 overflow-x-auto">
          <pre className="text-xs text-green-400">{CODE_SAMPLES[selectedLanguage]}</pre>
        </div>
      </section>

      <section className="vscode-card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent-primary" />
          <h2 className="text-xl font-semibold text-vscode-text">Additional resources</h2>
        </div>
        <p className="text-sm text-vscode-text-secondary">
          For deeper integration guides and SDK references, visit the docs folder in your workspace:
        </p>
        <ul className="list-disc list-inside text-sm text-vscode-text-secondary space-y-1">
          <li><code className="bg-vscode-button px-1.5 py-0.5 rounded text-xs">packages/user-admin/docs/API.md</code></li>
          <li><code className="bg-vscode-button px-1.5 py-0.5 rounded text-xs">packages/user-admin/docs/GETTING_STARTED.md</code></li>
        </ul>
      </section>
    </div>
  );
}
