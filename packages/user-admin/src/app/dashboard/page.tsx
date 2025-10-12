'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity as ActivityIcon, ArrowUpRight, Globe, Key, Plus, Sparkles, TrendingUp, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface DashboardData {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    createdAt: string;
  };
  currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  stats: {
    teamMembers: number;
    universes: number;
    apiKeys: number;
    apiCalls: number;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    } | null;
  }>;
}

const LoadingState = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4" />
      <p className="text-vscode-text-secondary">Loading dashboard...</p>
    </div>
  </div>
);

const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <p className="text-red-400 mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/80"
      >
        Retry
      </button>
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = (await response.json()) as DashboardData;
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return (
      <ErrorState
        message={error ?? 'Failed to load dashboard'}
        onRetry={() => void fetchDashboardData()}
      />
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-vscode-text mb-2">
          Welcome back, {data.currentUser.firstName}! 
        </h1>
        <p className="text-vscode-text-secondary">
          Here&apos;s what&apos;s happening with {data.organization.name} today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/team"
          className="vscode-card p-6 hover:border-accent-primary transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-primary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-vscode-text-secondary" />
          </div>
          <p className="text-sm text-vscode-text-secondary mb-1">Team Members</p>
          <p className="text-3xl font-bold text-vscode-text">{data.stats.teamMembers}</p>
        </Link>

        <Link
          href="/dashboard/universes"
          className="vscode-card p-6 hover:border-accent-secondary transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-secondary/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-accent-secondary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-vscode-text-secondary" />
          </div>
          <p className="text-sm text-vscode-text-secondary mb-1">Active Universes</p>
          <p className="text-3xl font-bold text-vscode-text">{data.stats.universes}</p>
        </Link>

        <Link
          href="/dashboard/api-keys"
          className="vscode-card p-6 hover:border-accent-tertiary transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-tertiary/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-accent-tertiary" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-vscode-text-secondary" />
          </div>
          <p className="text-sm text-vscode-text-secondary mb-1">API Keys</p>
          <p className="text-3xl font-bold text-vscode-text">{data.stats.apiKeys}</p>
        </Link>

        <div className="vscode-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="text-sm text-vscode-text-secondary mb-1">API Calls (30d)</p>
          <p className="text-3xl font-bold text-vscode-text">
            {data.stats.apiCalls.toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-vscode-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/team"
            className="vscode-card p-6 hover:border-accent-primary transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-accent-primary" />
              </div>
              <h3 className="font-semibold text-vscode-text">Invite Team Member</h3>
            </div>
            <p className="text-sm text-vscode-text-secondary">
              Add new members to your organization.
            </p>
          </Link>

          <Link
            href="/dashboard/universes"
            className="vscode-card p-6 hover:border-accent-secondary transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-accent-secondary" />
              </div>
              <h3 className="font-semibold text-vscode-text">Create Universe</h3>
            </div>
            <p className="text-sm text-vscode-text-secondary">
              Spin up a new state universe for your app.
            </p>
          </Link>

          <Link
            href="/dashboard/api-keys"
            className="vscode-card p-6 hover:border-accent-tertiary transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent-tertiary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-tertiary" />
              </div>
              <h3 className="font-semibold text-vscode-text">Generate API Key</h3>
            </div>
            <p className="text-sm text-vscode-text-secondary">
              Create and manage API keys.
            </p>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-vscode-text mb-4">Recent Activity</h2>
        <div className="vscode-card">
          {data.recentActivities.length === 0 ? (
            <div className="p-12 text-center">
              <ActivityIcon className="w-12 h-12 text-vscode-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-vscode-text-secondary mb-2">No activity yet</p>
              <p className="text-sm text-vscode-text-secondary">
                Activity will appear here as you and your team use the platform.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-vscode-border">
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-vscode-hover transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                      <ActivityIcon className="w-4 h-4 text-accent-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-vscode-text">
                        <span className="font-medium">
                          {activity.user
                            ? `${activity.user.firstName} ${activity.user.lastName}`
                            : 'System'}
                        </span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-vscode-text-secondary mt-1">
                        {format(new Date(activity.createdAt), 'MMM d, yyyy  h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
