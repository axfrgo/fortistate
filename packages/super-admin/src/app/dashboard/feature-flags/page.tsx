'use client';

import { useEffect, useState } from 'react';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetOrganizations: string[];
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch feature flags from API
    async function fetchFlags() {
      try {
        const response = await fetch('/api/feature-flags');
        if (!response.ok) {
          throw new Error('Failed to fetch feature flags');
        }
        const data = await response.json();
        setFlags(data.flags);
      } catch (error) {
        console.error('Error fetching feature flags:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFlags();
  }, []);

  const toggleFlag = (flagId: string) => {
    setFlags(flags.map(f => 
      f.id === flagId ? { ...f, enabled: !f.enabled } : f
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">🚩 Feature Flags</h1>
          <p className="text-foreground-muted">
            Manage feature rollouts and A/B tests
          </p>
        </div>
        <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors">
          Create New Flag
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Flags</div>
          <div className="text-3xl font-bold text-primary">{flags.length}</div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Enabled</div>
          <div className="text-3xl font-bold text-emerald-400">
            {flags.filter(f => f.enabled).length}
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Full Rollout</div>
          <div className="text-3xl font-bold text-primary">
            {flags.filter(f => f.rolloutPercentage === 100).length}
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">In Testing</div>
          <div className="text-3xl font-bold text-amber-400">
            {flags.filter(f => f.rolloutPercentage > 0 && f.rolloutPercentage < 100).length}
          </div>
        </div>
      </div>

      {/* Feature Flags List */}
      <div className="space-y-4">
        {flags.map((flag) => (
          <div
            key={flag.id}
            className="bg-background-secondary border border-slate-700 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">{flag.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      flag.enabled ? 'status-active' : 'bg-slate-500/20 text-slate-300'
                    }`}
                  >
                    {flag.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-sm text-foreground-muted mb-2">{flag.description}</p>
                <p className="text-xs text-foreground-muted font-mono">Key: {flag.key}</p>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => toggleFlag(flag.id)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  flag.enabled ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    flag.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Rollout Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-foreground-muted">Rollout Progress</span>
                <span className="text-foreground font-medium">{flag.rolloutPercentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    flag.rolloutPercentage === 100
                      ? 'bg-emerald-500'
                      : flag.rolloutPercentage > 0
                      ? 'bg-amber-500'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${flag.rolloutPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Target Organizations */}
            {flag.targetOrganizations.length > 0 && (
              <div className="mb-4 p-3 bg-slate-800/50 rounded">
                <div className="text-xs text-foreground-muted mb-1">Targeted Organizations</div>
                <div className="flex flex-wrap gap-2">
                  {flag.targetOrganizations.map((orgId) => (
                    <span
                      key={orgId}
                      className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded"
                    >
                      {orgId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center space-x-6 text-xs text-foreground-muted pt-4 border-t border-slate-700">
              <div>
                Created: {new Date(flag.createdAt).toLocaleDateString()}
              </div>
              <div>
                Updated: {new Date(flag.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
