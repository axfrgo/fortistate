'use client';

import { useEffect, useState } from 'react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
}

interface Service {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  lastChecked: string;
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch system health from API
    async function fetchSystemHealth() {
      try {
        const response = await fetch('/api/system-health');
        if (!response.ok) {
          throw new Error('Failed to fetch system health');
        }
        const data = await response.json();
        setMetrics(data.metrics);
        setServices(data.services);
      } catch (error) {
        console.error('Error fetching system health:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSystemHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading system health...</p>
        </div>
      </div>
    );
  }

  const overallHealth = services.filter(s => s.status === 'operational').length / services.length * 100;
  const avgUptime = services.reduce((sum, s) => sum + s.uptime, 0) / services.length;
  const criticalMetrics = metrics.filter(m => m.status === 'critical').length;
  const warningMetrics = metrics.filter(m => m.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">❤️ System Health</h1>
          <p className="text-foreground-muted">
            Monitor infrastructure and service health
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-4 py-2 rounded-lg font-medium ${
            overallHealth >= 95 ? 'status-active' : overallHealth >= 80 ? 'bg-amber-500/20 text-amber-300' : 'status-error'
          }`}>
            {overallHealth >= 95 ? '✓ All Systems Operational' : overallHealth >= 80 ? '⚠️ Degraded Performance' : '🚨 System Issues'}
          </span>
          <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {criticalMetrics > 0 && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="text-red-400 font-semibold">Critical System Alert</h3>
              <p className="text-sm text-red-300">
                {criticalMetrics} critical {criticalMetrics === 1 ? 'metric' : 'metrics'} detected. Immediate attention required.
              </p>
            </div>
          </div>
        </div>
      )}

      {warningMetrics > 0 && !criticalMetrics && (
        <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-amber-400 font-semibold">Warning</h3>
              <p className="text-sm text-amber-300">
                {warningMetrics} {warningMetrics === 1 ? 'metric is' : 'metrics are'} approaching threshold limits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Overall Health</div>
          <div className={`text-3xl font-bold ${overallHealth >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {overallHealth.toFixed(1)}%
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {services.filter(s => s.status === 'operational').length} / {services.length} services
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Average Uptime</div>
          <div className="text-3xl font-bold text-emerald-400">
            {avgUptime.toFixed(2)}%
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Last 30 days
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Critical Issues</div>
          <div className={`text-3xl font-bold ${criticalMetrics > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {criticalMetrics}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {criticalMetrics === 0 ? 'All clear' : 'Requires action'}
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Warnings</div>
          <div className={`text-3xl font-bold ${warningMetrics > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {warningMetrics}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Monitor closely
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">📊 System Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className={`border rounded-lg p-4 ${
                metric.status === 'critical'
                  ? 'border-red-500/50 bg-red-500/5'
                  : metric.status === 'warning'
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-foreground-muted">{metric.name}</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    metric.status === 'healthy'
                      ? 'status-active'
                      : metric.status === 'warning'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'status-error'
                  }`}
                >
                  {metric.status.toUpperCase()}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground mb-2">
                {metric.value} <span className="text-lg text-foreground-muted">{metric.unit}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    metric.status === 'healthy'
                      ? 'bg-emerald-500'
                      : metric.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-foreground-muted">
                Threshold: {metric.threshold} {metric.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">🔧 Services Status</h2>
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="border border-slate-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    service.status === 'operational'
                      ? 'bg-emerald-500'
                      : service.status === 'degraded'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                ></div>
                <div>
                  <div className="text-foreground font-medium">{service.name}</div>
                  <div className="text-xs text-foreground-muted">
                    Last checked: {new Date(service.lastChecked).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-foreground-muted">Uptime</div>
                  <div className="text-foreground font-medium">{service.uptime}%</div>
                </div>
                <div className="text-center">
                  <div className="text-foreground-muted">Latency</div>
                  <div className="text-foreground font-medium">{service.latency}ms</div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    service.status === 'operational'
                      ? 'status-active'
                      : service.status === 'degraded'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'status-error'
                  }`}
                >
                  {service.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
