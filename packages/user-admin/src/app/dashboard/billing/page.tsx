'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  Mail,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

type PlanTier = 'free' | 'pro' | 'enterprise';

type UsageMetric = {
  value: number;
  limit: number | null;
};

type BillingData = {
  organization: {
    name: string;
    createdAt: string;
  };
  plan: {
    current: PlanTier;
    limits: Record<'members' | 'universes' | 'apiKeys' | 'apiCalls', number | null>;
    nextRenewal: string | null;
    subscriptionStatus: string | null;
    canManage: boolean;
  };
  billingContact: {
    email: string | null;
  };
  paymentMethod: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
  } | null;
  usage: Record<'members' | 'universes' | 'apiKeys' | 'apiCalls', UsageMetric>;
  invoices: Array<{
    id: string;
    status: string;
    amount: number;
    issuedAt: string;
    downloadUrl: string;
  }>;
  suggestions: string;
};

const PLAN_OPTIONS: Record<PlanTier, {
  name: string;
  price: string;
  description: string;
  highlight?: boolean;
  cta: string;
  features: string[];
}> = {
  free: {
    name: 'Free',
    price: '$0/mo',
    description: 'Everything you need to experiment with Fortistate.',
    cta: 'Stay on Free',
    features: [
      'Up to 5 team members',
      '2 universes',
      '3 API keys',
      '5,000 API calls per month',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$49/mo',
    description: 'For growing teams building production workloads.',
    highlight: true,
    cta: 'Upgrade to Pro',
    features: [
      'Up to 20 team members',
      '10 universes',
      '25 API keys',
      '100,000 API calls per month',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Contact us',
    description: 'Unlimited scale, dedicated support, and custom contracts.',
    cta: 'Talk to Sales',
    features: [
      'Unlimited team members',
      'Unlimited universes',
      'Unlimited API keys',
      'Dedicated success engineer',
    ],
  },
};

function formatLimit(limit: number | null) {
  if (limit === null) {
    return 'Unlimited';
  }

  if (limit >= 1000) {
    return limit.toLocaleString();
  }

  return `${limit}`;
}

function usagePercentage(metric: UsageMetric) {
  if (metric.limit === null || metric.limit === 0) {
    return metric.limit === null ? 0 : 100;
  }

  return Math.min(100, Math.round((metric.value / metric.limit) * 100));
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState<PlanTier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();

  const fetchBilling = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setFeedback(null);

      const response = await fetch('/api/billing');
      const body = await response.json().catch(() => ({ error: 'Failed to load billing data' }));

      if (!response.ok) {
        throw new Error(body.error || 'Failed to load billing data');
      }

      setData(body as BillingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBilling();
  }, [fetchBilling]);

  useEffect(() => {
    const upgradeStatus = searchParams?.get('upgrade');
    if (upgradeStatus === 'success') {
      setFeedback('Plan change completed successfully. It may take a few seconds for Stripe to reflect the latest usage.');
    } else if (upgradeStatus === 'cancelled') {
      setFeedback('Checkout cancelled. No changes were made to your subscription.');
    }

    if (searchParams?.get('portal') === 'return') {
      setFeedback('Returned from the Stripe billing portal. Any changes you made there will sync shortly.');
    }
  }, [searchParams]);

  const usageEntries = useMemo(
    () =>
      data
        ? ([
            {
              key: 'members',
              label: 'Team members',
              description: 'Total active members across your organization.',
              metric: data.usage.members,
            },
            {
              key: 'universes',
              label: 'Universes',
              description: 'Published universes available to your applications.',
              metric: data.usage.universes,
            },
            {
              key: 'apiKeys',
              label: 'API keys',
              description: 'Active API keys for client and server integrations.',
              metric: data.usage.apiKeys,
            },
            {
              key: 'apiCalls',
              label: 'API calls (30d)',
              description: 'Requests processed over the last rolling 30 days.',
              metric: data.usage.apiCalls,
            },
          ] as const)
        : [],
    [data],
  );

  const currentPlanState = data?.plan;

  const handlePlanChange = useCallback(
    async (targetPlan: PlanTier) => {
      if (!currentPlanState?.canManage || targetPlan === currentPlanState.current) {
        return;
      }

      try {
        setUpdatingPlan(targetPlan);
        setFeedback(null);

        if (targetPlan === 'free') {
          const response = await fetch('/api/billing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan: targetPlan }),
          });

          const body = await response.json().catch(() => ({ error: 'Plan update failed' }));
          if (!response.ok) {
            throw new Error(body.error || 'Plan update failed');
          }

          setFeedback(`Plan updated to ${PLAN_OPTIONS[targetPlan].name}.`);
          await fetchBilling();
          return;
        }

        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: targetPlan }),
        });

        const body = await response.json().catch(() => ({ error: 'Unable to start checkout' }));
        if (!response.ok) {
          throw new Error(body.error || 'Unable to start checkout');
        }

        if (!body.url) {
          throw new Error('Stripe did not return a checkout URL.');
        }

        window.location.href = body.url as string;
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : 'Failed to update plan');
      } finally {
        setUpdatingPlan(null);
      }
    },
    [currentPlanState, fetchBilling],
  );

  const handlePortal = useCallback(async () => {
    if (!currentPlanState?.canManage) {
      return;
    }

    try {
      setPortalLoading(true);
      setFeedback(null);

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const body = await response.json().catch(() => ({ error: 'Unable to open the billing portal' }));
      if (!response.ok) {
        throw new Error(body.error || 'Unable to open the billing portal');
      }

      if (!body.url) {
        throw new Error('Stripe did not return a billing portal URL.');
      }

      window.location.href = body.url as string;
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to launch billing portal');
    } finally {
      setPortalLoading(false);
    }
  }, [currentPlanState?.canManage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent-primary mx-auto mb-4" />
          <p className="text-vscode-text-secondary">Loading billing...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error ?? 'Failed to load billing data.'}</p>
          <button
            type="button"
            onClick={() => void fetchBilling()}
            className="px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const plan = PLAN_OPTIONS[data.plan.current];

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-vscode-text mb-2">Billing</h1>
          <p className="text-vscode-text-secondary">
            Manage your plan, keep track of usage, and review invoices for {data.organization.name}.
          </p>
        </div>
        <div className="vscode-card p-4 flex items-center gap-3 border border-accent-primary/30 bg-accent-primary/5">
          <ShieldCheck className="w-5 h-5 text-accent-primary" />
          <div>
            <p className="text-sm text-vscode-text-secondary">Current plan</p>
            <p className="text-sm font-semibold text-vscode-text">{plan.name}</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="vscode-card border border-vscode-border p-4 bg-vscode-sidebar">
          <p className="text-sm text-vscode-text">{feedback}</p>
        </div>
      )}

      {!data.plan.canManage && (
        <div className="vscode-card border border-vscode-border p-4 bg-vscode-sidebar">
          <p className="text-sm text-vscode-text">
            You have read-only access to billing. Contact an owner to make changes to your plan or payment
            details.
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="vscode-card p-6 space-y-4 xl:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-vscode-text-secondary">Current plan</p>
              <h2 className="text-2xl font-semibold text-vscode-text">{plan.name}</h2>
              <p className="text-sm text-vscode-text-secondary">{plan.description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-vscode-text">{plan.price}</p>
              <p className="text-xs text-vscode-text-tertiary">Renews {data.plan.nextRenewal ? format(new Date(data.plan.nextRenewal), 'MMM d, yyyy') : 'monthly'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-vscode-border p-4">
              <p className="text-xs uppercase tracking-wide text-vscode-text-tertiary mb-2">Subscription status</p>
              <p className="text-sm text-vscode-text font-medium">
                {data.plan.subscriptionStatus ? data.plan.subscriptionStatus.replace(/_/g, ' ') : 'Inactive'}
              </p>
              {data.plan.subscriptionStatus === 'pending' && (
                <p className="mt-2 text-xs text-amber-400">
                  Your upgrade is processing. You will receive an email once Stripe confirms the subscription.
                </p>
              )}
            </div>
            <div className="rounded-lg border border-vscode-border p-4">
              <p className="text-xs uppercase tracking-wide text-vscode-text-tertiary mb-2">Billing contact</p>
              <p className="text-sm text-vscode-text font-medium">{data.billingContact.email ?? 'Not set'}</p>
            </div>
          </div>
        </div>

        <div className="vscode-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-10 h-10 text-accent-secondary" />
            <div>
              <p className="text-sm text-vscode-text-secondary">Payment method</p>
              {data.paymentMethod ? (
                <p className="text-sm text-vscode-text font-medium">
                  {data.paymentMethod.brand ? `${data.paymentMethod.brand} •••• ${data.paymentMethod.last4}` : 'Saved payment method'}
                </p>
              ) : (
                <p className="text-sm text-vscode-text font-medium">Add a payment method to enable automatic renewals.</p>
              )}
            </div>
          </div>
          {data.paymentMethod && (
            <p className="text-xs text-vscode-text-tertiary">
              Expires {data.paymentMethod.expMonth?.toString().padStart(2, '0') ?? '--'}/
              {data.paymentMethod.expYear ?? '--'}
            </p>
          )}
          <button
            type="button"
            className="btn-secondary w-full inline-flex items-center justify-center gap-2"
            onClick={() => void handlePortal()}
            disabled={!data.plan.canManage || portalLoading}
          >
            <CreditCard className="w-4 h-4" />
            {portalLoading ? 'Opening portal…' : 'Manage payment method'}
          </button>
        </div>
      </section>

      <section className="vscode-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-vscode-text">Usage overview</h2>
            <p className="text-sm text-vscode-text-secondary">Track how your organization consumes plan limits.</p>
          </div>
          <span className="text-xs text-vscode-text-tertiary">Resets on plan renewal</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usageEntries.map(({ key, label, description, metric }) => (
            <div key={key} className="rounded-lg border border-vscode-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-vscode-text">{label}</p>
                  <p className="text-xs text-vscode-text-secondary">{description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-vscode-text font-semibold">{metric.value.toLocaleString()}</p>
                  <p className="text-xs text-vscode-text-tertiary">Limit: {formatLimit(metric.limit)}</p>
                </div>
              </div>
              {metric.limit !== null ? (
                <div className="h-2 bg-vscode-border rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full', {
                      'bg-accent-primary': usagePercentage(metric) < 80,
                      'bg-amber-500': usagePercentage(metric) >= 80 && usagePercentage(metric) < 100,
                      'bg-status-error': usagePercentage(metric) >= 100,
                    })}
                    style={{ width: `${usagePercentage(metric)}%` }}
                    aria-hidden="true"
                  />
                </div>
              ) : (
                <p className="text-xs text-vscode-text-tertiary">Unlimited usage on current plan.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-vscode-text">Choose the right plan</h2>
            <p className="text-sm text-vscode-text-secondary">Upgrade or downgrade any time. Changes take effect immediately.</p>
          </div>
          {data.plan.canManage && (
            <p className="text-xs text-vscode-text-tertiary">Only owners can change plans.</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(PLAN_OPTIONS) as Array<[PlanTier, (typeof PLAN_OPTIONS)[PlanTier]]>).map(([planId, details]) => {
            const isCurrent = data.plan.current === planId;
            const isUpdating = updatingPlan === planId;
            const disabled = !data.plan.canManage || isCurrent || Boolean(updatingPlan);

            return (
              <div
                key={planId}
                className={clsx(
                  'vscode-card p-6 space-y-4 flex flex-col justify-between border transition-shadow',
                  details.highlight ? 'border-accent-secondary/60 shadow-lg shadow-accent-secondary/10' : 'border-vscode-border',
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-vscode-text">{details.name}</h3>
                      <p className="text-sm text-vscode-text-secondary">{details.description}</p>
                    </div>
                    {planId === 'pro' ? (
                      <Rocket className="w-6 h-6 text-accent-secondary" />
                    ) : planId === 'enterprise' ? (
                      <Crown className="w-6 h-6 text-accent-tertiary" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-accent-primary" />
                    )}
                  </div>
                  <p className="text-3xl font-bold text-vscode-text">{details.price}</p>
                  <ul className="space-y-2">
                    {details.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-vscode-text">
                        <CheckCircle2 className="w-4 h-4 text-accent-primary mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  className={clsx(
                    'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isCurrent
                      ? 'bg-vscode-button text-vscode-text-secondary cursor-default'
                      : details.highlight
                      ? 'bg-accent-secondary text-white hover:bg-accent-secondary/80'
                      : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20',
                  )}
                  disabled={disabled}
                  onClick={() => void handlePlanChange(planId)}
                >
                  {isCurrent ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Current plan
                    </>
                  ) : isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      {details.cta}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="vscode-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-accent-primary" />
            <div>
              <h2 className="text-lg font-semibold text-vscode-text">Plan suggestions</h2>
              <p className="text-sm text-vscode-text-secondary">Right-sized recommendations for your workload.</p>
            </div>
          </div>
          <p className="text-sm text-vscode-text">{data.suggestions}</p>
          <p className="text-xs text-vscode-text-tertiary">
            Organization created {format(new Date(data.organization.createdAt), 'MMM d, yyyy')}.
          </p>
        </div>

        <div className="vscode-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-vscode-text">Invoices</h2>
              <p className="text-sm text-vscode-text-secondary">Download past statements for your records.</p>
            </div>
            <CreditCard className="w-5 h-5 text-accent-secondary" />
          </div>
          {data.invoices.length === 0 ? (
            <div className="text-sm text-vscode-text-secondary">
              No invoices yet. Add a payment method and upgrade to generate invoices.
            </div>
          ) : (
            <div className="space-y-3">
              {data.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-vscode-border rounded-lg p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-vscode-text">{currency.format(invoice.amount / 100)}</p>
                    <p className="text-xs text-vscode-text-secondary">Issued {format(new Date(invoice.issuedAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        'px-3 py-1 rounded-full text-xs font-medium capitalize',
                        invoice.status === 'paid'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/40'
                          : 'bg-vscode-button text-vscode-text-secondary border border-vscode-border',
                      )}
                    >
                      {invoice.status}
                    </span>
                    <a
                      href={invoice.downloadUrl}
                      className="inline-flex items-center gap-2 text-sm text-accent-primary hover:underline"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
