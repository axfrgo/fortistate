'use client';

import { useCallback, useEffect } from 'react';
import useStore from 'fortistate/useStore';
import { analyticsStore } from '@/stores/stores';
import { BarChart3, TrendingUp, Users, Globe, Key, Activity as ActivityIcon } from 'lucide-react';
import { format } from 'date-fns';

type AnalyticsData = {
  overview: {
    totalMembers: number;
    totalUniverses: number;
    totalApiKeys: number;
    apiCallsLast30Days: number;
  };
  activity: Array<{
    date: string;
    apiCalls: number;
    events: number;
  }>;
  topUniverses: Array<{
    id: string;
    name: string;
    apiCalls: number;
  }>;
};

export default function AnalyticsPage() {
  const [analyticsState, analyticsUtils] = useStore(analyticsStore);

  const fetchAnalytics = useCallback(async () => {
    try {
      analyticsUtils.set({ ...analyticsState, value: { ...analyticsState.value, loading: true, error: null } });

      const response = await fetch('/api/analytics');
      const body = await response.json().catch(() => ({ error: 'Failed to load analytics' }));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to load analytics');
      }

      const data = body as AnalyticsData;
      analyticsUtils.set({
        value: {
          memberCount: data.overview.totalMembers,
          universeCount: data.overview.totalUniverses,
          apiKeyCount: data.overview.totalApiKeys,
          apiCallsLast30Days: data.overview.apiCallsLast30Days,
          activityTrend: data.activity.map((item) => ({ date: item.date, count: item.apiCalls + item.events })),
          topUniverses: data.topUniverses,
          loading: false,
          error: null,
        },
      });
    } catch (err) {
      analyticsUtils.set({
        ...analyticsState,
        value: {
          ...analyticsState.value,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load analytics',
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const { loading, error, memberCount, universeCount, apiKeyCount, apiCallsLast30Days, activityTrend, topUniverses } =
    analyticsState?.value || {
      loading: false,
      error: null,
      memberCount: 0,
      universeCount: 0,
      apiKeyCount: 0,
      apiCallsLast30Days: 0,
      activityTrend: [],
      topUniverses: [],
    };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 animate-pulse text-accent-primary mx-auto mb-4" />
          <p className="text-vscode-text-secondary">Loading analytics...</p>
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
            onClick={() => void fetchAnalytics()}
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
        <h1 className="text-3xl font-bold text-vscode-text mb-2">Analytics</h1>
        <p className="text-vscode-text-secondary">
          Real-time insights into usage patterns, resource consumption, and team activity.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="vscode-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-vscode-text-secondary">Team members</p>
            <Users className="w-5 h-5 text-accent-primary" />
          </div>
          <p className="text-3xl font-bold text-vscode-text">{memberCount}</p>
          <p className="text-xs text-vscode-text-tertiary">Active collaborators</p>
        </div>

        <div className="vscode-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-vscode-text-secondary">Universes</p>
            <Globe className="w-5 h-5 text-accent-secondary" />
          </div>
          <p className="text-3xl font-bold text-vscode-text">{universeCount}</p>
          <p className="text-xs text-vscode-text-tertiary">Configured states</p>
        </div>

        <div className="vscode-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-vscode-text-secondary">API keys</p>
            <Key className="w-5 h-5 text-accent-tertiary" />
          </div>
          <p className="text-3xl font-bold text-vscode-text">{apiKeyCount}</p>
          <p className="text-xs text-vscode-text-tertiary">Active credentials</p>
        </div>

        <div className="vscode-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-vscode-text-secondary">API calls (30d)</p>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-vscode-text">{apiCallsLast30Days.toLocaleString()}</p>
          <p className="text-xs text-vscode-text-tertiary">Rolling monthly usage</p>
        </div>
      </section>

      <section className="vscode-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-vscode-text">Activity trend</h2>
            <p className="text-sm text-vscode-text-secondary">Last 7 days of API calls and events</p>
          </div>
          <ActivityIcon className="w-5 h-5 text-accent-primary" />
        </div>
        {activityTrend.length === 0 ? (
          <p className="text-sm text-vscode-text-tertiary">No recent activity to display.</p>
        ) : (
          <div className="space-y-2">
            {activityTrend.map((entry: { date: string; count: number }) => (
              <div key={entry.date} className="flex items-center justify-between border-b border-vscode-border pb-2">
                <div>
                  <p className="text-sm font-medium text-vscode-text">{format(new Date(entry.date), 'MMM d, yyyy')}</p>
                  <p className="text-xs text-vscode-text-tertiary">{entry.count} total</p>
                </div>
                <p className="text-sm font-semibold text-vscode-text">{entry.count.toLocaleString()} events</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="vscode-card p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-vscode-text">Top universes</h2>
          <p className="text-sm text-vscode-text-secondary">Most active universes by API call volume</p>
        </div>
        {topUniverses.length === 0 ? (
          <p className="text-sm text-vscode-text-tertiary">No universe activity yet.</p>
        ) : (
          <div className="space-y-2">
            {topUniverses.map((universe: { id: string; name: string; apiCalls: number }, index: number) => (
              <div
                key={universe.id}
                className="flex items-center justify-between border border-vscode-border rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-vscode-text">{universe.name}</p>
                    <p className="text-xs text-vscode-text-tertiary">{universe.id}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-vscode-text">{universe.apiCalls.toLocaleString()} calls</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
