# Stripe Connect Demo Guide

This demo shows how to onboard creators with **Stripe Connect**, create products on the platform account, and sell them through a small storefront using destination charges with application fees. It pairs with the dashboard page at `/dashboard/stripe-connect` and the API routes under `/api/stripe-connect/*`.

> 🔒 The Connect UI is disabled by default so user admins only see subscription billing. Set `NEXT_PUBLIC_ENABLE_STRIPE_CONNECT=true` in `.env.local` before running the demo.

## 1. Environment variables

Create or update `.env.local` (or `.env`) inside `packages/user-admin/` with the following keys. Placeholder values intentionally trigger runtime errors until you replace them with real secrets from the Stripe dashboard.

```env
# Platform keys
STRIPE_SECRET_KEY=sk_test_your_platform_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional tweaks (defaults shown)
NEXT_PUBLIC_APP_URL=http://localhost:4300
NEXT_PUBLIC_ENABLE_STRIPE_CONNECT=true
STRIPE_APPLICATION_FEE_BPS=1000 # 10% application fee
```

> ℹ️ The helper in `src/lib/stripe.ts` throws descriptive errors if any key is missing or still uses a placeholder. This prevents accidentally shipping the demo without configuring Stripe first.

## 2. Install dependencies

```powershell
cd packages/user-admin
npm install
```

## 3. Start the dev server

```powershell
npm run dev
```

Visit http://localhost:4300/dashboard/stripe-connect to use the demo.

## 4. Webhook forwarding (optional but recommended)

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Start forwarding webhooks:
   ```powershell
   stripe listen --forward-to localhost:4300/api/stripe-connect/webhook
   ```
3. The webhook handler logs key events (`checkout.session.completed`, `account.updated`, etc.) so you can verify payments and onboarding progress from the terminal.

## 5. Demo workflow

1. **Create a connected account**
   - Provide an email address and optional country/business type.
   - Accounts are created in controller mode: the platform controls pricing, fees, and losses.

2. **Onboard the account**
   - Click **“Onboard to collect payments”** to generate an Express account link.
   - Complete onboarding and return to the dashboard; press **Refresh status** to view live verification state.

3. **Create a product**
   - Products are created on the platform account.
   - The selected connected account ID is stored in product metadata (`connected_account_id`) so the storefront can route payouts correctly.

4. **Sell the product**
   - In the storefront section, click **“Buy with Stripe Checkout.”**
   - The backend creates a hosted Checkout Session using a destination charge and collects the application fee defined above.

5. **Inspect results**
   - Use the Stripe dashboard or CLI to inspect accounts, products, Checkout Sessions, and transfers.
   - Webhook logs in your terminal confirm when payments succeed, fail, or when account capabilities change.

## 6. Cleanup tips

- Delete test data from the Stripe dashboard when finished.
- If you change `NEXT_PUBLIC_APP_URL`, restart the dev server to propagate the new base URL into onboarding/checkout redirects.

Enjoy exploring Stripe Connect with Fortistate! 🎉
