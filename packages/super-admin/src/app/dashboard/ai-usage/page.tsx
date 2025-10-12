'use client';

import { useEffect, useState } from 'react';
import { exportAIUsage } from '@/lib/exportUtils';

interface AIUsageData {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  callsToday: number;
  tokensToday: number;
  costToday: number;
  averageCallsPerDay: number;
  topModel: string;
  topModelUsage: number;
}

interface ModelUsage {
  model: string;
  calls: number;
  tokens: number;
  cost: number;
  avgResponseTime: number;
}

interface OrganizationAIUsage {
  organizationId: string;
  organizationName: string;
  plan: 'free' | 'pro' | 'enterprise';
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  limitExceeded: boolean;
}

export default function AIUsagePage() {
  const [usageData, setUsageData] = useState<AIUsageData | null>(null);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [orgUsage, setOrgUsage] = useState<OrganizationAIUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch AI usage data from API
    async function fetchAIUsage() {
      try {
        const response = await fetch('/api/ai-usage');
        if (!response.ok) {
          throw new Error('Failed to fetch AI usage data');
        }
        const data = await response.json();
        setUsageData(data.usageData);
        setModelUsage(data.modelUsage);
        setOrgUsage(data.orgUsage);
      } catch (error) {
        console.error('Error fetching AI usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAIUsage();
  }, []);

  if (loading || !usageData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading AI usage data...</p>
        </div>
      </div>
    );
  }

  const overLimitOrgs = orgUsage.filter(o => o.limitExceeded).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">🤖 AI Usage Tracking</h1>
          <p className="text-foreground-muted">
            Monitor AI API usage, costs, and model performance
          </p>
        </div>
        <button 
          onClick={() => exportAIUsage(orgUsage)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          Export Report
        </button>
      </div>

      {/* Alert Banner */}
      {overLimitOrgs > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-amber-400 font-semibold">Usage Limit Alert</h3>
              <p className="text-sm text-amber-300">
                {overLimitOrgs} {overLimitOrgs === 1 ? 'organization has' : 'organizations have'} exceeded their AI usage limits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total AI Calls</div>
          <div className="text-3xl font-bold text-primary">
            {(usageData.totalCalls / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {usageData.callsToday.toLocaleString()} today
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Tokens</div>
          <div className="text-3xl font-bold text-primary">
            {(usageData.totalTokens / 1000000).toFixed(0)}M
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {(usageData.tokensToday / 1000000).toFixed(1)}M today
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Cost</div>
          <div className="text-3xl font-bold text-emerald-400">
            ${(usageData.totalCost / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            ${usageData.costToday.toFixed(0)} today
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Avg Calls/Day</div>
          <div className="text-3xl font-bold text-primary">
            {(usageData.averageCallsPerDay / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            30-day average
          </div>
        </div>
      </div>

      {/* Model Usage Breakdown */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">🔮 Model Usage Breakdown</h2>
        <div className="space-y-4">
          {modelUsage.map((model) => {
            const percentage = (model.calls / usageData.totalCalls) * 100;
            
            return (
              <div key={model.model} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-foreground font-medium text-lg">{model.model}</div>
                    <div className="text-sm text-foreground-muted">
                      {model.calls.toLocaleString()} calls ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      ${(model.cost / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-foreground-muted">
                      {model.avgResponseTime}s avg
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-foreground-muted">Tokens</div>
                    <div className="text-sm font-medium text-foreground">
                      {(model.tokens / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-muted">Avg Cost/Call</div>
                    <div className="text-sm font-medium text-foreground">
                      ${(model.cost / model.calls).toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground-muted">Response Time</div>
                    <div className="text-sm font-medium text-foreground">
                      {model.avgResponseTime}s
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Organization Usage */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">🏢 Top Organizations by AI Usage</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                  Organization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                  Total Calls
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                  Tokens
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-secondary uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {orgUsage
                .sort((a, b) => b.totalCalls - a.totalCalls)
                .map((org) => (
                  <tr key={org.organizationId} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">
                        {org.organizationName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          org.plan === 'enterprise'
                            ? 'bg-amber-500/20 text-amber-300'
                            : org.plan === 'pro'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-slate-500/20 text-slate-300'
                        }`}
                      >
                        {org.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">
                        {org.totalCalls.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground">
                        {(org.totalTokens / 1000000).toFixed(1)}M
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-emerald-400">
                        ${org.totalCost.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {org.limitExceeded ? (
                        <span className="text-xs text-red-400 flex items-center">
                          ⚠️ Over Limit
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400">✓ Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Cost per 1K Calls</div>
          <div className="text-3xl font-bold text-primary">
            ${((usageData.totalCost / usageData.totalCalls) * 1000).toFixed(2)}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Platform average
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Most Used Model</div>
          <div className="text-2xl font-bold text-primary">
            {usageData.topModel}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {usageData.topModelUsage}% of all calls
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Projected Monthly Cost</div>
          <div className="text-3xl font-bold text-amber-400">
            ${((usageData.costToday * 30) / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Based on today
          </div>
        </div>
      </div>
    </div>
  );
}
