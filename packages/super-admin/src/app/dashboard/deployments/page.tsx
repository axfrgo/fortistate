'use client';

import { useEffect, useState } from 'react';

interface Deployment {
  id: string;
  version: string;
  environment: 'production' | 'staging' | 'development';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  deployedBy: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  commitHash: string;
  changes: string[];
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch deployments from API
    async function fetchDeployments() {
      try {
        const response = await fetch('/api/deployments');
        if (!response.ok) {
          throw new Error('Failed to fetch deployments');
        }
        const data = await response.json();
        setDeployments(data.deployments);
      } catch (error) {
        console.error('Error fetching deployments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeployments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading deployments...</p>
        </div>
      </div>
    );
  }

  const latestProduction = deployments.find(d => d.environment === 'production' && d.status === 'completed');
  const successRate = (deployments.filter(d => d.status === 'completed').length / deployments.length) * 100;
  const avgDuration = deployments
    .filter(d => d.duration !== null)
    .reduce((sum, d) => sum + (d.duration || 0), 0) / deployments.filter(d => d.duration !== null).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">🚀 Deployment Control</h1>
          <p className="text-foreground-muted">
            Manage and monitor deployments across environments
          </p>
        </div>
        <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors">
          New Deployment
        </button>
      </div>

      {/* Current Production Version */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-emerald-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-emerald-300 mb-1">Current Production Version</div>
            <div className="text-3xl font-bold text-foreground">{latestProduction?.version}</div>
            <div className="text-sm text-foreground-muted mt-1">
              Deployed {latestProduction && new Date(latestProduction.startedAt).toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-foreground-muted mb-1">Commit</div>
            <div className="text-lg font-mono text-primary">{latestProduction?.commitHash}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Deployments</div>
          <div className="text-3xl font-bold text-primary">{deployments.length}</div>
          <div className="text-xs text-foreground-muted mt-1">Last 7 days</div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Success Rate</div>
          <div className="text-3xl font-bold text-emerald-400">
            {successRate.toFixed(0)}%
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {deployments.filter(d => d.status === 'completed').length} successful
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Avg Duration</div>
          <div className="text-3xl font-bold text-primary">
            {avgDuration.toFixed(0)}m
          </div>
          <div className="text-xs text-foreground-muted mt-1">Per deployment</div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Rollbacks</div>
          <div className="text-3xl font-bold text-amber-400">
            {deployments.filter(d => d.status === 'rolled_back').length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">Last 7 days</div>
        </div>
      </div>

      {/* Deployment History */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">📋 Deployment History</h2>
        <div className="space-y-4">
          {deployments.map((deploy) => (
            <div
              key={deploy.id}
              className={`border rounded-lg p-4 ${
                deploy.status === 'failed' || deploy.status === 'rolled_back'
                  ? 'border-red-500/50 bg-red-500/5'
                  : deploy.status === 'in_progress'
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{deploy.version}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        deploy.environment === 'production'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : deploy.environment === 'staging'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {deploy.environment.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        deploy.status === 'completed'
                          ? 'status-active'
                          : deploy.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-300'
                          : deploy.status === 'failed' || deploy.status === 'rolled_back'
                          ? 'status-error'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {deploy.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-foreground-muted mb-2">
                    Commit: <span className="font-mono text-primary">{deploy.commitHash}</span> • 
                    Started: {new Date(deploy.startedAt).toLocaleString()}
                    {deploy.duration && ` • Duration: ${deploy.duration} minutes`}
                  </div>
                </div>
                {deploy.status === 'completed' && (
                  <button className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 text-sm rounded-lg transition-colors">
                    Rollback
                  </button>
                )}
                {deploy.status === 'in_progress' && (
                  <button className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-sm rounded-lg transition-colors">
                    Cancel
                  </button>
                )}
              </div>

              {/* Changes */}
              <div className="border-t border-slate-700 pt-3">
                <div className="text-xs text-foreground-muted mb-2">Changes:</div>
                <ul className="space-y-1">
                  {deploy.changes.map((change, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start">
                      <span className="text-primary mr-2">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Deploy Info */}
              <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-slate-700 text-xs text-foreground-muted">
                <span>Deployed by: {deploy.deployedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
