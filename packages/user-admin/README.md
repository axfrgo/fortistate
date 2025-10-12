# Fortistate User Admin Dashboard

This package hosts the VS Code-inspired admin dashboard used throughout the Fortistate roadmap. Key features include:

- Authentication and multi-tenant organization management
- Dashboard modules for team members, universes, API keys, and billing
- Optional Stripe Connect demo (disabled by default) for testing marketplace flows

## Getting started

```powershell
cd packages/user-admin
npm install
npm run dev
```

Login or register at http://localhost:4300/auth/login to access the dashboard.

## Stripe demos

The dashboard ships with two guided Stripe experiences:

- **Billing upgrades** via hosted Checkout, billing portal redirects, and webhooks that keep organization plans in sync.
- **Stripe Connect demo** (opt-in) for onboarding creators, generating products, and selling them through destination charges.

Both flows use the latest Stripe API (2025-09-30.clover). Subscription billing is enabled out of the box; the Connect UI is hidden until you set `NEXT_PUBLIC_ENABLE_STRIPE_CONNECT=true`. Configuration, workflow, and webhook instructions for Connect live in [`docs/STRIPE_CONNECT_DEMO.md`](docs/STRIPE_CONNECT_DEMO.md).

➡️ Looking for the hosted subscription flow? See the dedicated [Billing guide](docs/BILLING.md) for environment setup, webhook forwarding, and end-to-end walkthroughs.

### Required environment keys

Add the following to `.env.local` inside `packages/user-admin/`, replacing placeholders with real values before running the app:

```env
STRIPE_SECRET_KEY=sk_test_your_platform_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:4300

# Hosted billing plans
STRIPE_PRICE_PRO=price_123pro
STRIPE_PRICE_ENTERPRISE=price_456enterprise

# Optional: enable the Stripe Connect demo & application fee
NEXT_PUBLIC_ENABLE_STRIPE_CONNECT=true
STRIPE_APPLICATION_FEE_BPS=1000
```

The helper in `src/lib/stripe.ts` throws descriptive errors when any key is missing or still set to a placeholder.

When developing locally, run the Stripe CLI to forward webhooks so plan changes sync back to Prisma:

```powershell
stripe listen --forward-to localhost:4300/api/billing/webhook
```

Checkout redirects back to `NEXT_PUBLIC_APP_URL` with status query parameters (e.g. `?upgrade=success`), and the billing portal sends users back with `?portal=return`.

## Development scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js locally on port 4300 |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint (includes TypeScript checks) |
| `npm run db:push` | Sync Prisma schema with the local database |
| `npm run db:studio` | Launch Prisma Studio |

---

Happy shipping! 🚀
