'use client';

import { useCallback, useEffect } from 'react';
import useStore from 'fortistate/useStore';
import { activityStore } from '@/stores/stores';
import { Clock, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

type ActivityEntry = {
  id: string;
  type: string;
  action: string;
  metadata: Record<string, unknown>;
  userId: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type ActivityData = {
  activities: ActivityEntry[];
  total: number;
};

export default function ActivityPage() {
  const [activityState, activityUtils] = useStore(activityStore);

  const fetchActivity = useCallback(async () => {
    try {
      activityUtils.set({ ...activityState.value, loading: true, error: null });

      const params = new URLSearchParams();
      if (activityState.value.filterType !== 'all') {
        params.set('type', activityState.value.filterType);
      }

      const response = await fetch(`/api/activity?${params.toString()}`);
      const body = await response.json().catch(() => ({ error: 'Failed to load activity' }));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to load activity');
      }

      const data = body as ActivityData;
      activityUtils.set({
        value: {
          activities: data.activities,
          total: data.total,
          filterType: activityState.value.filterType,
          loading: false,
          error: null,
        },
      });
    } catch (err) {
      activityUtils.set({
        ...activityState,
        value: {
          ...activityState.value,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load activity',
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetchActivity();
  }, [fetchActivity]);

  const { loading, error, activities, total, filterType } = activityState?.value || {
    loading: false,
    error: null,
    activities: [],
    total: 0,
    filterType: 'all',
  };

  const handleFilterChange = (newFilter: string) => {
    activityUtils.set({
      value: {
        ...activityState.value,
        filterType: newFilter,
      },
    });
  };

  const activityTypes = [
    { value: 'all', label: 'All events' },
    { value: 'user_invited', label: 'User invited' },
    { value: 'universe_created', label: 'Universe created' },
    { value: 'api_key_generated', label: 'API key generated' },
    { value: 'billing', label: 'Billing events' },
    { value: 'settings_updated', label: 'Settings updated' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Clock className="w-10 h-10 animate-pulse text-accent-primary mx-auto mb-4" />
          <p className="text-vscode-text-secondary">Loading activity...</p>
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
            onClick={() => void fetchActivity()}
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-vscode-text mb-2">Activity</h1>
          <p className="text-vscode-text-secondary">
            Real-time audit log of organization events, member actions, and system changes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchActivity()}
          className="btn-secondary inline-flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <section className="vscode-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-accent-primary" />
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="vscode-input w-48"
            >
              {activityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-vscode-text-tertiary">{total} events</p>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-vscode-text-tertiary">No activity to display.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity: ActivityEntry) => (
              <div
                key={activity.id}
                className="border border-vscode-border rounded-lg p-4 hover:bg-vscode-sidebar transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-vscode-text">{activity.action}</p>
                    <p className="text-xs text-vscode-text-secondary mt-1">
                      {activity.user
                        ? `${activity.user.firstName} ${activity.user.lastName} (${activity.user.email})`
                        : 'System'}
                    </p>
                    {Object.keys(activity.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-vscode-text-tertiary cursor-pointer hover:text-vscode-text">
                          View metadata
                        </summary>
                        <pre className="mt-2 text-xs bg-vscode-sidebar border border-vscode-border rounded p-2 overflow-x-auto">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-accent-primary/10 text-accent-primary">
                      {activity.type.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-vscode-text-tertiary whitespace-nowrap">
                      {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
