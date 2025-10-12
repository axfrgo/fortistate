'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  message: string;
  action: string;
  href: string;
}

interface PlatformMetrics {
  users: { total: number; active: number; new: number };
  organizations: { total: number; paying: number; new: number };
  universes: { total: number; active: number; stopped: number };
  revenue: { mrr: number; arr: number; growth: number };
  aiCalls: { today: number; cost: number; trend: number };
  systemHealth: { status: string; uptime: number };
  alerts: Alert[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch dashboard metrics from API
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard metrics');
        }
        const data = await response.json();
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading platform metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          🌐 Global Platform Overview
        </h1>
        <p className="text-foreground-muted">
          Real-time metrics across the entire FortiState platform
        </p>
      </div>

      {/* Alerts */}
      {metrics.alerts && metrics.alerts.length > 0 && (
        <div className="space-y-3">
          {metrics.alerts.map((alert) => {
            const alertStyles = {
              warning: {
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/50',
                icon: '⚠️',
                textColor: 'text-amber-400',
                buttonBg: 'bg-amber-500/20 hover:bg-amber-500/30',
                buttonBorder: 'border-amber-500',
                buttonText: 'text-amber-300',
              },
              critical: {
                bg: 'bg-red-500/10',
                border: 'border-red-500/50',
                icon: '🚨',
                textColor: 'text-red-400',
                buttonBg: 'bg-red-500/20 hover:bg-red-500/30',
                buttonBorder: 'border-red-500',
                buttonText: 'text-red-300',
              },
              info: {
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/50',
                icon: 'ℹ️',
                textColor: 'text-blue-400',
                buttonBg: 'bg-blue-500/20 hover:bg-blue-500/30',
                buttonBorder: 'border-blue-500',
                buttonText: 'text-blue-300',
              },
            };

            const style = alertStyles[alert.type];

            return (
              <div key={alert.id} className={`${style.bg} border ${style.border} rounded-lg p-4 flex items-start space-x-3`}>
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${style.textColor}`}>{alert.type === 'warning' ? 'Warning' : alert.type === 'critical' ? 'Critical Alert' : 'Info'}</p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {alert.message}
                  </p>
                </div>
                <button 
                  onClick={() => router.push(alert.href)}
                  className={`text-xs px-3 py-1 ${style.buttonBg} border ${style.buttonBorder} ${style.buttonText} rounded transition-colors`}
                >
                  {alert.action}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Users */}
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-secondary">Total Users</h3>
            <span className="text-2xl">👥</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-foreground">{metrics.users.total.toLocaleString()}</span>
              <span className="text-sm text-emerald-400">+{metrics.users.new} today</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Active now</span>
              <span className="text-foreground font-medium">{metrics.users.active.toLocaleString()}</span>
            </div>
            <div className="w-full bg-background h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(metrics.users.active / metrics.users.total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Organizations */}
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-secondary">Organizations</h3>
            <span className="text-2xl">🏢</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-foreground">{metrics.organizations.total}</span>
              <span className="text-sm text-emerald-400">+{metrics.organizations.new} today</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Paying</span>
              <span className="text-foreground font-medium">{metrics.organizations.paying}</span>
            </div>
            <div className="w-full bg-background h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${(metrics.organizations.paying / metrics.organizations.total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Universes */}
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-secondary">Universes</h3>
            <span className="text-2xl">🌌</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-foreground">{metrics.universes.total.toLocaleString()}</span>
              <span className="text-sm text-foreground-muted">total</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Running</span>
              <span className="text-emerald-400 font-medium">{metrics.universes.active.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Stopped</span>
              <span className="text-amber-400 font-medium">{metrics.universes.stopped.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-secondary">Monthly Revenue</h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-foreground">${(metrics.revenue.mrr / 1000).toFixed(1)}K</span>
              <span className="text-sm text-emerald-400">+{metrics.revenue.growth}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">ARR</span>
              <span className="text-foreground font-medium">${(metrics.revenue.arr / 1000).toFixed(0)}K</span>
            </div>
            <div className="pt-2">
              <div className="flex items-center space-x-1 text-xs text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Growing {metrics.revenue.growth}% MoM</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Usage */}
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-secondary">AI Usage Today</h3>
            <span className="text-2xl">🤖</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-foreground">{(metrics.aiCalls.today / 1000).toFixed(0)}K</span>
              <span className="text-sm text-amber-400">+{metrics.aiCalls.trend}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Cost</span>
              <span className="text-foreground font-medium">${metrics.aiCalls.cost}</span>
            </div>
            <div className="pt-2">
              <div className="flex items-center space-x-1 text-xs text-amber-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Usage spike detected</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground-secondary">System Health</h3>
            <span className="text-2xl">❤️</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-emerald-400">Healthy</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Uptime</span>
              <span className="text-foreground font-medium">{metrics.systemHealth.uptime}%</span>
            </div>
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">Core API</span>
                <span className="text-emerald-400">✓ Online</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">Inspector</span>
                <span className="text-emerald-400">✓ Online</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">Visual Studio</span>
                <span className="text-emerald-400">✓ Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/dashboard/users')}
            className="px-4 py-3 bg-background hover:bg-background-tertiary border border-slate-600 rounded-lg text-sm text-foreground transition-colors"
          >
            👥 View All Users
          </button>
          <button 
            onClick={() => router.push('/dashboard/security')}
            className="px-4 py-3 bg-background hover:bg-background-tertiary border border-slate-600 rounded-lg text-sm text-foreground transition-colors"
          >
            🛡️ Security Dashboard
          </button>
          <button 
            onClick={() => router.push('/dashboard/revenue')}
            className="px-4 py-3 bg-background hover:bg-background-tertiary border border-slate-600 rounded-lg text-sm text-foreground transition-colors"
          >
            💰 Revenue Analytics
          </button>
          <button 
            onClick={() => router.push('/dashboard/audit')}
            className="px-4 py-3 bg-background hover:bg-background-tertiary border border-slate-600 rounded-lg text-sm text-foreground transition-colors"
          >
            📋 View Audit Logs
          </button>
        </div>
      </div>
    </div>
  );
}
