'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const STRIPE_CONNECT_ENABLED = ['1', 'true', 'yes', 'on'].includes(
  (process.env.NEXT_PUBLIC_ENABLE_STRIPE_CONNECT ?? '').toLowerCase(),
);

/**
 * Tiny helper for API requests so we can surface meaningful errors to the operator.
 */
async function request<TResponse>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.error ?? 'Unexpected error while talking to the Stripe demo API.');
  }

  return body as TResponse;
}

interface AccountSummary {
  id: string;
  email: string | null;
  created: number;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  defaultCurrency: string | null;
  futureRequirements: string[];
  currentlyDue: string[];
  pastDue: string[];
  disabledReason: string | null;
}

interface ProductSummary {
  id: string;
  name: string;
  description: string | null;
  connectedAccountId: string | null;
  defaultPrice: {
    id: string;
    amount: number | null;
    currency: string | null;
  } | null;
}

interface OverviewResponse {
  accounts: AccountSummary[];
  products: ProductSummary[];
}

type StatusMessage = { tone: 'success' | 'error' | 'info'; message: string } | null;

function useStripeConnectOverview(enabled: boolean) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      if (!enabled) {
        setLoading(false);
        setError(null);
        setData(null);
        return;
      }

      setLoading(true);
      setError(null);
      const payload = await request<OverviewResponse>('/api/stripe-connect/overview');
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the Stripe Connect overview API.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
}

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null || currency === null) {
    return '—';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });

  return formatter.format(amount / 100);
}

export default function StripeConnectDemoPage() {
  const { data, loading, error, refresh } = useStripeConnectOverview(STRIPE_CONNECT_ENABLED);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [launchingCheckout, setLaunchingCheckout] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Read query string for success states (e.g. returning from Checkout or onboarding).
  const successMessage = useMemo(() => {
    if (searchParams?.get('onboarding') === 'success') {
      return 'Onboarding completed! Refresh the account list to view the latest verification status.';
    }
    if (searchParams?.get('checkout') === 'cancelled') {
      return 'Checkout was cancelled. Feel free to try again when ready.';
    }
    if (searchParams?.has('session_id')) {
      return 'Checkout success! Retrieve the session in the dashboard or via webhook logs to inspect payment details.';
    }
    return null;
  }, [searchParams]);

  const handleCreateAccount = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus(null);
      setCreatingAccount(true);

      const form = new FormData(event.currentTarget);
      const email = form.get('email')?.toString().trim();
      const country = form.get('country')?.toString().trim() || 'US';
      const businessType = form.get('businessType')?.toString() || 'individual';

      if (!email) {
        setStatus({ tone: 'error', message: 'Email is required to create a connected account.' });
        setCreatingAccount(false);
        return;
      }

      try {
        await request('/api/stripe-connect/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, country, businessType }),
        });

        setStatus({
          tone: 'success',
          message: 'Connected account created successfully. Next, send them through onboarding.',
        });
        await refresh();
        event.currentTarget.reset();
      } catch (err) {
        setStatus({
          tone: 'error',
          message: err instanceof Error ? err.message : 'Failed to create the connected account.',
        });
      } finally {
        setCreatingAccount(false);
      }
    },
    [refresh],
  );

  const handleOnboard = useCallback(async (accountId: string) => {
    try {
      setStatus(null);
      const { url } = await request<{ url: string }>(`/api/stripe-connect/accounts/${accountId}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      window.location.href = url;
    } catch (err) {
      setStatus({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to start onboarding for that account.',
      });
    }
  }, []);

  const handleCreateProduct = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus(null);
      setCreatingProduct(true);

      const form = new FormData(event.currentTarget);
      const name = form.get('name')?.toString().trim();
      const description = form.get('description')?.toString().trim() || undefined;
      const priceInput = form.get('price')?.toString().trim();
      const currency = form.get('currency')?.toString().trim().toLowerCase() || 'usd';
      const connectedAccountId = form.get('connectedAccountId')?.toString().trim();

      if (!name || !priceInput || !connectedAccountId) {
        setStatus({ tone: 'error', message: 'Name, price, and connected account are required.' });
        setCreatingProduct(false);
        return;
      }

      const dollars = Number(priceInput);
      if (Number.isNaN(dollars) || dollars <= 0) {
        setStatus({ tone: 'error', message: 'Enter a valid positive price in dollars.' });
        setCreatingProduct(false);
        return;
      }

      const priceInCents = Math.round(dollars * 100);

      try {
        await request('/api/stripe-connect/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            price: priceInCents,
            currency,
            connectedAccountId,
          }),
        });

        setStatus({
          tone: 'success',
          message: 'Product created on the platform. Customers can now purchase it via the storefront.',
        });
        await refresh();
        event.currentTarget.reset();
      } catch (err) {
        setStatus({
          tone: 'error',
          message: err instanceof Error ? err.message : 'Unable to create product.',
        });
      } finally {
        setCreatingProduct(false);
      }
    },
    [refresh],
  );

  const handleCheckout = useCallback(async (product: ProductSummary) => {
    if (!product.defaultPrice || !product.defaultPrice.amount || !product.defaultPrice.currency) {
      setStatus({ tone: 'error', message: 'Product is missing pricing information.' });
      return;
    }

    setLaunchingCheckout(product.id);
    setStatus(null);

    try {
      const { url } = await request<{ url: string; sessionId: string }>('/api/stripe-connect/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      window.location.href = url;
    } catch (err) {
      setStatus({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to start checkout for that product.',
      });
    } finally {
      setLaunchingCheckout(null);
    }
  }, []);

  if (!STRIPE_CONNECT_ENABLED) {
    return (
      <div className="p-8 space-y-6">
        <div className="vscode-card p-6 border border-vscode-border space-y-4">
          <h1 className="text-3xl font-bold text-vscode-text">Stripe Connect Disabled</h1>
          <p className="text-sm text-vscode-text-secondary">
            This workspace only uses Stripe for subscription billing. Connect tooling for onboarding creators has been disabled by default. To enable the developer demo, set
            <code className="mx-1 rounded bg-vscode-button px-1.5 py-0.5 text-xs">NEXT_PUBLIC_ENABLE_STRIPE_CONNECT=true</code> in your environment and restart the app.
          </p>
          <p className="text-sm text-vscode-text-secondary">
            Subscription upgrades remain available through the billing page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-vscode-text">Stripe Connect Demo</h1>
        <p className="text-vscode-text-secondary">
          Onboard connected accounts, create products, and run a destination charge with an application fee. This
          demo uses the 2025-09-30.clover Stripe API version and purposely keeps state in Stripe so you can inspect
          results from the dashboard or webhook logs.
        </p>
      </header>

      {successMessage && (
        <div className="vscode-card border border-accent-primary/40 bg-accent-primary/5 p-4 text-sm text-vscode-text">
          {successMessage}
        </div>
      )}

      {status && (
        <div
          className={`vscode-card border p-4 text-sm ${
            status.tone === 'success'
              ? 'border-green-500/50 bg-green-500/10 text-green-200'
              : status.tone === 'error'
              ? 'border-status-error/60 bg-status-error/10 text-status-error'
              : 'border-vscode-border bg-vscode-sidebar text-vscode-text'
          }`}
        >
          {status.message}
        </div>
      )}

      {error && (
        <div className="vscode-card border border-status-error/60 bg-status-error/10 p-4 text-status-error text-sm">
          {error}
        </div>
      )}

      <section className="vscode-card p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-vscode-text">Connected accounts</h2>
            <p className="text-sm text-vscode-text-secondary">
              Create accounts on demand and send them through Express onboarding. Status is fetched live from Stripe—no
              database persistence is required for this sample.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="btn-secondary"
            disabled={loading}
          >
            Refresh status
          </button>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleCreateAccount}>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-vscode-text-tertiary">
              Email
            </label>
            <input
              required
              name="email"
              type="email"
              className="input-field mt-1"
              placeholder="creator@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-vscode-text-tertiary">Country</label>
            <input name="country" defaultValue="US" className="input-field mt-1" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-vscode-text-tertiary">
              Business type
            </label>
            <select name="businessType" className="input-field mt-1">
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary" disabled={creatingAccount}>
              {creatingAccount ? 'Creating…' : 'Create connected account'}
            </button>
          </div>
        </form>

        <div className="overflow-x-auto border border-vscode-border rounded-lg">
          <table className="min-w-full divide-y divide-vscode-border text-sm">
            <thead className="bg-vscode-hover">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-vscode-text">Account</th>
                <th className="px-4 py-2 text-left font-medium text-vscode-text">Verification</th>
                <th className="px-4 py-2 text-left font-medium text-vscode-text">Capabilities</th>
                <th className="px-4 py-2 text-left font-medium text-vscode-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vscode-border">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-vscode-text-secondary">
                    Loading accounts…
                  </td>
                </tr>
              )}
              {data?.accounts.map((account) => {
                const needsAttention = account.pastDue.length > 0 || account.currentlyDue.length > 0;

                return (
                  <tr key={account.id} className="hover:bg-vscode-hover">
                    <td className="px-4 py-3 align-top">
                      <div className="font-mono text-xs text-vscode-text">{account.id}</div>
                      <div className="text-xs text-vscode-text-secondary">{account.email ?? 'No email on file'}</div>
                      <div className="text-xs text-vscode-text-tertiary mt-1">
                        Created {formatTimestamp(account.created)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
                      <div className="text-vscode-text">
                        {account.detailsSubmitted ? 'Details submitted' : 'Awaiting onboarding'}
                      </div>
                      {account.disabledReason && (
                        <div className="text-status-error mt-1">Disabled: {account.disabledReason}</div>
                      )}
                      {needsAttention && (
                        <ul className="mt-2 space-y-1 text-status-error">
                          {[...account.pastDue, ...account.currentlyDue].map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
                      <div className="text-vscode-text">Charges: {account.chargesEnabled ? 'Enabled' : 'Disabled'}</div>
                      <div className="text-vscode-text">Payouts: {account.payoutsEnabled ? 'Enabled' : 'Disabled'}</div>
                      <div className="text-vscode-text-secondary">
                        Default currency: {account.defaultCurrency ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => void handleOnboard(account.id)}
                        >
                          Onboard to collect payments
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => void refresh()}>
                          Refresh status
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data?.accounts.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-vscode-text-secondary">
                    No connected accounts yet. Create one above to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="vscode-card p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-vscode-text">Create products</h2>
          <p className="text-sm text-vscode-text-secondary">
            Products are created on the platform account. We store the connected account ID inside product metadata so
            storefront purchases know which creator should receive the transfer.
          </p>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-6 gap-4" onSubmit={handleCreateProduct}>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-vscode-text-tertiary">Name</label>
            <input name="name" required className="input-field mt-1" placeholder="Premium course" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-vscode-text-tertiary">
              Description
            </label>
            <input name="description" className="input-field mt-1" placeholder="Optional summary" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-vscode-text-tertiary">Price</label>
            <input name="price" required className="input-field mt-1" placeholder="49.00" type="number" min="1" step="0.01" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-vscode-text-tertiary">
              Currency
            </label>
            <input name="currency" defaultValue="usd" className="input-field mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-vscode-text-tertiary">
              Connected account
            </label>
            <select name="connectedAccountId" required className="input-field mt-1">
              <option value="">Select an account…</option>
              {data?.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.id} ({account.email ?? 'no email'})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-6 flex justify-end">
            <button type="submit" className="btn-primary" disabled={creatingProduct}>
              {creatingProduct ? 'Creating…' : 'Create product'}
            </button>
          </div>
        </form>
      </section>

      <section className="vscode-card p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-vscode-text">Storefront</h2>
          <p className="text-sm text-vscode-text-secondary">
            Customers can buy any product. We create a destination charge, transfer earnings to the connected account,
            and retain an application fee using hosted Checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.products.map((product) => (
            <article key={product.id} className="border border-vscode-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-vscode-text">{product.name}</h3>
                <span className="text-sm text-vscode-text-tertiary">{product.id}</span>
              </div>
              <p className="text-sm text-vscode-text-secondary min-h-[48px]">
                {product.description ?? 'No description provided.'}
              </p>
              <p className="text-xl font-bold text-vscode-text">
                {formatAmount(product.defaultPrice?.amount ?? null, product.defaultPrice?.currency ?? null)}
              </p>
              <p className="text-xs text-vscode-text-tertiary">
                Connected account: {product.connectedAccountId ?? 'missing metadata'}
              </p>
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => void handleCheckout(product)}
                disabled={launchingCheckout === product.id}
              >
                {launchingCheckout === product.id ? 'Redirecting…' : 'Buy with Stripe Checkout'}
              </button>
            </article>
          ))}
        </div>

        {data?.products.length === 0 && !loading && (
          <div className="text-sm text-vscode-text-secondary">
            No products yet. Create one above to populate the storefront.
          </div>
        )}
      </section>
    </div>
  );
}
