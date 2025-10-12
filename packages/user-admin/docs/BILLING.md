# Hosted Billing Guide

Fortistate ships a turnkey Stripe billing workflow that upgrades organizations through hosted Checkout and lets owners manage plans in the Stripe Billing Portal. This document walks through the required environment variables, local setup, and the end-to-end flows.

## Prerequisites

- A Stripe account with test mode enabled
- The [Stripe CLI](https://stripe.com/docs/stripe-cli) installed locally
- `npm install` completed inside `packages/user-admin`
- The Fortistate user admin app running at the URL referenced by `NEXT_PUBLIC_APP_URL` (defaults to `http://localhost:4300`)

## Environment configuration

Populate `.env.local` inside `packages/user-admin` with the following keys (replace placeholders with your real test credentials):

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:4300

# Billing price IDs
STRIPE_PRICE_PRO=price_replace_with_your_basic_plan
STRIPE_PRICE_ENTERPRISE=price_replace_with_your_enterprise_plan

# Optional: enable the Stripe Connect demo & application fee
NEXT_PUBLIC_ENABLE_STRIPE_CONNECT=true
STRIPE_APPLICATION_FEE_BPS=1000
```

> The helper in `src/lib/stripe.ts` intentionally throws descriptive errors whenever a key is missing or still contains a placeholder to prevent running the demo with incomplete configuration.

### Creating subscription prices

1. In the Stripe dashboard, create two recurring prices (one for Pro, one for Enterprise).
2. Copy their price IDs into `STRIPE_PRICE_PRO` and `STRIPE_PRICE_ENTERPRISE` respectively.
3. Ensure both prices share the same billing cycle (monthly by default) so the webhook logic can reconcile plan renewals consistently.

## Running the app with live webhooks

Start the Next.js dev server:

```powershell
cd packages/user-admin
npm run dev
```

In a separate terminal, forward Stripe events to the billing webhook route:

```powershell
stripe listen --forward-to localhost:4300/api/billing/webhook
```

Assign the generated webhook signing secret to `STRIPE_WEBHOOK_SECRET` if it differs from your existing value.

## Owner experience flow

1. **Visit** `/dashboard/billing` while signed in as an organization owner.
2. **Upgrade** to the Pro plan: clicking the call-to-action launches Stripe Checkout via `/api/billing/checkout`.
3. **Complete Checkout** using a test card (e.g., `4242 4242 4242 4242`).
4. **Return to the dashboard** on the success URL (`?upgrade=success`). The page shows a confirmation banner while the webhook finalizes the subscription.
5. **Webhook processing** updates Prisma records (`Organization`, `BillingInfo`) once Stripe emits `checkout.session.completed` / `customer.subscription.updated` events.
6. **Manage billing** anytime through the “Manage payment method” button, which opens a billing portal session at `/api/billing/portal` and returns with `?portal=return`.

Downgrades to the Free tier are handled immediately inside the app without Stripe involvement.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Checkout button returns an error | Missing or placeholder plan price ID | Confirm `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE` match live price IDs |
| Portal button shows “No Stripe customer found” | Organization has never visited Checkout | Run an upgrade once to create the customer record automatically |
| Plan stuck in `pending` | Webhook not reaching dev server | Verify the Stripe CLI tunnel is active and `STRIPE_WEBHOOK_SECRET` matches the CLI output |
| Activity log missing events | Prisma DB not seeded or migrations pending | Run `npm run db:push` to sync the local database |

## Related files

- API routes: `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/webhook`
- Stripe helper: `src/lib/stripe.ts`
- Billing dashboard UI: `src/app/dashboard/billing/page.tsx`

Happy billing experiments! 💳
