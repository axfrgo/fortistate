'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { exportRevenueReport } from '@/lib/exportUtils';

interface RevenueData {
  currentMRR: number;
  previousMRR: number;
  currentARR: number;
  totalRevenue: number;
  newMRR: number;
  churnedMRR: number;
  upgradeMRR: number;
  downgradeMRR: number;
  activeSubscriptions: number;
  churnRate: number;
}

interface PlanBreakdown {
  plan: 'free' | 'pro' | 'enterprise';
  count: number;
  mrr: number;
  arr: number;
}

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [planBreakdown, setPlanBreakdown] = useState<PlanBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForecast, setShowForecast] = useState(false);
  const [showChurnAnalysis, setShowChurnAnalysis] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch revenue data from API
    async function fetchRevenue() {
      try {
        const response = await fetch('/api/revenue');
        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }
        const data = await response.json();
        setRevenueData(data.revenueData);
        setPlanBreakdown(data.planBreakdown);
      } catch (error) {
        console.error('Error fetching revenue:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRevenue();
  }, []);

  if (loading || !revenueData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  const mrrGrowth = ((revenueData.currentMRR - revenueData.previousMRR) / revenueData.previousMRR) * 100;
  const netNewMRR = revenueData.newMRR - revenueData.churnedMRR + revenueData.upgradeMRR - revenueData.downgradeMRR;

  // Calculate forecast metrics
  const forecastGrowthRate = mrrGrowth / 100;
  const projectedNextMonthMRR = revenueData.currentMRR * (1 + forecastGrowthRate);
  const projected3MonthMRR = revenueData.currentMRR * Math.pow(1 + forecastGrowthRate, 3);
  const projected6MonthMRR = revenueData.currentMRR * Math.pow(1 + forecastGrowthRate, 6);
  const projected12MonthMRR = revenueData.currentMRR * Math.pow(1 + forecastGrowthRate, 12);
  const projectedNextYearARR = projected12MonthMRR * 12;

  // Calculate churn metrics
  const churnPercentage = (revenueData.churnedMRR / revenueData.previousMRR) * 100;
  const atRiskThreshold = 5; // 5% churn is considered high risk
  const isChurnCritical = churnPercentage > atRiskThreshold;

  return (
    <div className="space-y-6">
      {/* Forecast Modal */}
      {showForecast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border-2 border-primary rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background-secondary border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Revenue Forecast</h2>
                  <p className="text-sm text-foreground-muted">Based on current growth trends</p>
                </div>
              </div>
              <button
                onClick={() => setShowForecast(false)}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Current Metrics */}
              <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/50 rounded-lg p-4">
                <div className="text-sm text-foreground-muted mb-1">Current Monthly Recurring Revenue</div>
                <div className="text-4xl font-bold text-primary mb-2">
                  ${(revenueData.currentMRR / 1000).toFixed(1)}K
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={`font-medium ${mrrGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {mrrGrowth >= 0 ? '↑' : '↓'} {Math.abs(mrrGrowth).toFixed(1)}% growth rate
                  </span>
                </div>
              </div>

              {/* Forecast Timeline */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Projected Growth</h3>
                
                <div className="space-y-2">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-foreground-muted">Next Month</div>
                      <div className="text-xl font-bold text-foreground">
                        ${(projectedNextMonthMRR / 1000).toFixed(1)}K MRR
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-emerald-400">
                        +${((projectedNextMonthMRR - revenueData.currentMRR) / 1000).toFixed(1)}K
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-foreground-muted">3 Months</div>
                      <div className="text-xl font-bold text-foreground">
                        ${(projected3MonthMRR / 1000).toFixed(1)}K MRR
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-emerald-400">
                        +${((projected3MonthMRR - revenueData.currentMRR) / 1000).toFixed(1)}K
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-foreground-muted">6 Months</div>
                      <div className="text-xl font-bold text-foreground">
                        ${(projected6MonthMRR / 1000).toFixed(1)}K MRR
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-emerald-400">
                        +${((projected6MonthMRR - revenueData.currentMRR) / 1000).toFixed(1)}K
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-2 border-primary rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-primary font-medium">12 Months (Next Year)</div>
                      <div className="text-2xl font-bold text-foreground">
                        ${(projected12MonthMRR / 1000).toFixed(1)}K MRR
                      </div>
                      <div className="text-xs text-foreground-muted mt-1">
                        ${(projectedNextYearARR / 1000).toFixed(0)}K ARR
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        +${((projected12MonthMRR - revenueData.currentMRR) / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-foreground-muted">
                        +{(((projected12MonthMRR - revenueData.currentMRR) / revenueData.currentMRR) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Assumptions */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-amber-400 text-xl">💡</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-amber-400 mb-1">Forecast Assumptions</div>
                    <ul className="text-xs text-foreground-muted space-y-1">
                      <li>• Based on {Math.abs(mrrGrowth).toFixed(1)}% monthly growth rate</li>
                      <li>• Assumes consistent customer acquisition and retention</li>
                      <li>• Does not account for seasonal variations or market changes</li>
                      <li>• Actual results may vary based on business execution</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowForecast(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-foreground rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    exportRevenueReport(revenueData);
                    // Show success message
                    alert('Revenue forecast report downloaded successfully!');
                  }}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
                >
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Churn Analysis Modal */}
      {showChurnAnalysis && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`border-2 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            isChurnCritical 
              ? 'bg-red-950/90 border-red-500' 
              : 'bg-background-secondary border-emerald-500'
          }`}>
            {/* Header */}
            <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
              isChurnCritical 
                ? 'bg-red-950/90 border-red-800' 
                : 'bg-background-secondary border-slate-700'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{isChurnCritical ? '🚨' : '✅'}</span>
                <div>
                  <h2 className={`text-2xl font-bold ${
                    isChurnCritical ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    Churn Analysis
                  </h2>
                  <p className="text-sm text-foreground-muted">
                    {isChurnCritical ? 'Critical churn detected - immediate action required' : 'Churn is within healthy range'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChurnAnalysis(false)}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Critical Alert Banner */}
              {isChurnCritical && (
                <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">⚠️</span>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-red-300">HIGH CHURN ALERT</div>
                      <div className="text-sm text-red-200">
                        Churn rate exceeds healthy threshold - Customer retention at risk
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`border-2 rounded-lg p-4 ${
                  isChurnCritical 
                    ? 'bg-red-900/30 border-red-500/50' 
                    : 'bg-emerald-900/20 border-emerald-500/50'
                }`}>
                  <div className="text-sm text-foreground-muted mb-2">Current Churn Rate</div>
                  <div className={`text-4xl font-bold ${
                    isChurnCritical ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {churnPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-foreground-muted mt-2">
                    {isChurnCritical 
                      ? `${(churnPercentage - atRiskThreshold).toFixed(1)}% above threshold`
                      : `${(atRiskThreshold - churnPercentage).toFixed(1)}% below threshold`
                    }
                  </div>
                </div>

                <div className="bg-slate-800/50 border-2 border-slate-600 rounded-lg p-4">
                  <div className="text-sm text-foreground-muted mb-2">MRR Lost to Churn</div>
                  <div className="text-4xl font-bold text-red-400">
                    -${(revenueData.churnedMRR / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-foreground-muted mt-2">
                    {((revenueData.churnedMRR / revenueData.currentMRR) * 100).toFixed(1)}% of current MRR
                  </div>
                </div>
              </div>

              {/* Impact Analysis */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">📊 Impact Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Monthly Revenue Impact</span>
                    <span className="text-sm font-medium text-red-400">
                      -${(revenueData.churnedMRR / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Annual Revenue Impact</span>
                    <span className="text-sm font-medium text-red-400">
                      -${((revenueData.churnedMRR * 12) / 1000).toFixed(1)}K ARR
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Average per Churned Customer</span>
                    <span className="text-sm font-medium text-foreground">
                      ${(revenueData.churnedMRR / Math.max(1, Math.ceil(revenueData.churnedMRR / 1000))).toFixed(0)}/mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className={`border-2 rounded-lg p-4 ${
                isChurnCritical 
                  ? 'bg-red-900/20 border-red-500/50' 
                  : 'bg-emerald-900/20 border-emerald-500/50'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 flex items-center space-x-2 ${
                  isChurnCritical ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  <span>{isChurnCritical ? '🎯' : '📋'}</span>
                  <span>{isChurnCritical ? 'Immediate Actions Required' : 'Monitoring Recommendations'}</span>
                </h3>
                
                {isChurnCritical ? (
                  <ul className="space-y-2 text-sm text-foreground-muted">
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">1.</span>
                      <span><strong className="text-foreground">Contact churned customers</strong> - Conduct exit interviews to understand reasons</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">2.</span>
                      <span><strong className="text-foreground">Review at-risk accounts</strong> - Identify patterns in usage decline</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">3.</span>
                      <span><strong className="text-foreground">Launch retention campaign</strong> - Offer incentives or feature upgrades</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">4.</span>
                      <span><strong className="text-foreground">Analyze support tickets</strong> - Look for common pain points</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">5.</span>
                      <span><strong className="text-foreground">Improve onboarding</strong> - Reduce time to value for new customers</span>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-2 text-sm text-foreground-muted">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Monitor <strong className="text-foreground">customer satisfaction scores</strong> regularly</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Track <strong className="text-foreground">usage patterns</strong> for early warning signs</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Maintain proactive <strong className="text-foreground">customer success outreach</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Continue improving <strong className="text-foreground">product features</strong> and documentation</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Benchmarks */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">📈 Industry Benchmarks</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">Excellent</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-slate-700 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                      <span className="text-emerald-400 font-medium">{'< 2%'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">Good</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-slate-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-blue-400 font-medium">2-5%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">Warning</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-slate-700 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                      <span className="text-amber-400 font-medium">5-10%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">Critical</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-slate-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      <span className="text-red-400 font-medium">{'> 10%'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Your Current Rate:</span>
                      <span className={`text-lg font-bold ${
                        churnPercentage < 2 ? 'text-emerald-400' :
                        churnPercentage < 5 ? 'text-blue-400' :
                        churnPercentage < 10 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {churnPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowChurnAnalysis(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-foreground rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowChurnAnalysis(false);
                    router.push('/dashboard/organizations');
                  }}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    isChurnCritical 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-primary hover:bg-primary-hover'
                  }`}
                >
                  {isChurnCritical ? 'Review At-Risk Accounts' : 'View All Organizations'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">💰 Revenue Analytics</h1>
          <p className="text-foreground-muted">
            Track MRR, ARR, churn, and revenue metrics
          </p>
        </div>
        <button 
          onClick={() => exportRevenueReport(revenueData)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
        >
          Export Report
        </button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Current MRR</div>
          <div className="text-3xl font-bold text-emerald-400">
            ${(revenueData.currentMRR / 1000).toFixed(1)}K
          </div>
          <div className={`text-xs mt-1 ${mrrGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {mrrGrowth >= 0 ? '↑' : '↓'} {Math.abs(mrrGrowth).toFixed(1)}% from last month
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Annual Recurring Revenue</div>
          <div className="text-3xl font-bold text-primary">
            ${(revenueData.currentARR / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            ${(revenueData.currentMRR * 12 / 1000).toFixed(0)}K projected
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Total Revenue (YTD)</div>
          <div className="text-3xl font-bold text-primary">
            ${(revenueData.totalRevenue / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Year to date
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Active Subscriptions</div>
          <div className="text-3xl font-bold text-primary">
            {revenueData.activeSubscriptions}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Paying customers
          </div>
        </div>
      </div>

      {/* MRR Movement */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">📊 MRR Movement</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="text-sm text-emerald-300 mb-2">New MRR</div>
            <div className="text-2xl font-bold text-emerald-400">
              +${(revenueData.newMRR / 1000).toFixed(1)}K
            </div>
          </div>
          <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-sm text-red-300 mb-2">Churned MRR</div>
            <div className="text-2xl font-bold text-red-400">
              -${(revenueData.churnedMRR / 1000).toFixed(1)}K
            </div>
          </div>
          <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="text-sm text-purple-300 mb-2">Upgrades</div>
            <div className="text-2xl font-bold text-purple-400">
              +${(revenueData.upgradeMRR / 1000).toFixed(1)}K
            </div>
          </div>
          <div className="text-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="text-sm text-amber-300 mb-2">Downgrades</div>
            <div className="text-2xl font-bold text-amber-400">
              -${(revenueData.downgradeMRR / 1000).toFixed(1)}K
            </div>
          </div>
          <div className="text-center p-4 bg-slate-700 border border-slate-600 rounded-lg">
            <div className="text-sm text-foreground-muted mb-2">Net New MRR</div>
            <div className={`text-2xl font-bold ${netNewMRR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netNewMRR >= 0 ? '+' : ''}${(netNewMRR / 1000).toFixed(1)}K
            </div>
          </div>
        </div>
      </div>

      {/* Plan Breakdown */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">📋 Plan Breakdown</h2>
        <div className="space-y-4">
          {planBreakdown.map((plan) => {
            const totalOrgs = planBreakdown.reduce((sum, p) => sum + p.count, 0);
            const percentage = (plan.count / totalOrgs) * 100;
            
            return (
              <div key={plan.plan} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded ${
                        plan.plan === 'enterprise'
                          ? 'bg-amber-500/20 text-amber-300'
                          : plan.plan === 'pro'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {plan.plan.toUpperCase()}
                    </span>
                    <div>
                      <div className="text-foreground font-medium">{plan.count} organizations</div>
                      <div className="text-sm text-foreground-muted">{percentage.toFixed(1)}% of total</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      ${(plan.mrr / 1000).toFixed(1)}K MRR
                    </div>
                    <div className="text-sm text-foreground-muted">
                      ${(plan.arr / 1000).toFixed(0)}K ARR
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      plan.plan === 'enterprise'
                        ? 'bg-amber-500'
                        : plan.plan === 'pro'
                        ? 'bg-purple-500'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Churn Rate</div>
          <div className={`text-3xl font-bold ${revenueData.churnRate <= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {revenueData.churnRate.toFixed(1)}%
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {revenueData.churnRate <= 5 ? '✓ Healthy' : '⚠️ Monitor closely'}
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">ARPU (Average Revenue Per User)</div>
          <div className="text-3xl font-bold text-primary">
            ${(revenueData.currentMRR / revenueData.activeSubscriptions).toFixed(0)}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Per paying customer
          </div>
        </div>
        <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
          <div className="text-sm text-foreground-muted mb-2">Free-to-Paid Conversion</div>
          <div className="text-3xl font-bold text-primary">
            {((revenueData.activeSubscriptions / planBreakdown.reduce((s, p) => s + p.count, 0)) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            Conversion rate
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-background-secondary border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => router.push('/dashboard/organizations')}
            className="group p-6 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-xl text-left transition-all duration-200 border border-slate-600 hover:border-primary"
          >
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">💳</span>
              <div className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                Payment History
              </div>
            </div>
            <div className="text-sm text-foreground-muted">
              View all {revenueData.activeSubscriptions} paying organizations and their transaction history
            </div>
          </button>
          
          <button 
            onClick={() => setShowChurnAnalysis(true)}
            className={`group p-6 rounded-xl text-left transition-all duration-200 border ${
              isChurnCritical 
                ? 'bg-gradient-to-br from-red-900/20 to-red-800/20 hover:from-red-800/30 hover:to-red-700/30 border-red-500/50 hover:border-red-400'
                : 'bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border-slate-600 hover:border-primary'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {isChurnCritical ? '🚨' : '📉'}
              </span>
              <div className={`text-lg font-semibold transition-colors ${
                isChurnCritical ? 'text-red-400 group-hover:text-red-300' : 'text-foreground group-hover:text-primary'
              }`}>
                Analyze Churn
              </div>
            </div>
            <div className="text-sm text-foreground-muted mb-2">
              {isChurnCritical 
                ? `High churn detected: ${churnPercentage.toFixed(1)}% - Take action now`
                : `Current churn: ${churnPercentage.toFixed(1)}% - Monitor trends`
              }
            </div>
            <div className={`text-xs font-medium ${isChurnCritical ? 'text-red-400' : 'text-emerald-400'}`}>
              -${(revenueData.churnedMRR / 1000).toFixed(1)}K MRR lost this period
            </div>
          </button>
          
          <button 
            onClick={() => setShowForecast(true)}
            className="group p-6 bg-gradient-to-br from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 rounded-xl text-left transition-all duration-200 border border-primary/50 hover:border-primary"
          >
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">📊</span>
              <div className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                Revenue Forecast
              </div>
            </div>
            <div className="text-sm text-foreground-muted mb-2">
              Project revenue growth over next 12 months
            </div>
            <div className="text-xs font-medium text-primary">
              Projected: ${(projectedNextYearARR / 1000).toFixed(0)}K ARR next year
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
