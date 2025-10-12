import Stripe from 'stripe';

// Centralised helpers for reading environment variables and instantiating the Stripe SDK. The demo throws a
// descriptive error when placeholders are still present so operators know to configure real keys first.
const STRIPE_API_VERSION = '2025-09-30.clover';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Set ${name} in your environment (e.g. .env.local) before using the Stripe billing features.`,
    );
  }

  if (value.trim().includes('YOUR_') || value.trim().includes('sk_test_123')) {
    throw new Error(
      `The environment variable ${name} still contains a placeholder value. Replace it with the real value from your Stripe dashboard before running the Stripe billing features.`,
    );
  }

  return value;
}

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    const secretKey = requireEnv('STRIPE_SECRET_KEY');
    stripeClient = new Stripe(secretKey, {
      // Cast because the typings lag behind the requested preview version.
      apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
      appInfo: {
        name: 'Fortistate Connect Demo',
      },
    });
  }

  return stripeClient;
}

export function getPublishableKey() {
  return requireEnv('STRIPE_PUBLISHABLE_KEY');
}

export function getWebhookSecret() {
  return requireEnv('STRIPE_WEBHOOK_SECRET');
}

const PLAN_PRICE_ENV = {
  pro: 'STRIPE_PRICE_PRO',
  enterprise: 'STRIPE_PRICE_ENTERPRISE',
} as const;

export function getPlanPriceId(plan: 'free' | 'pro' | 'enterprise') {
  if (plan === 'free') {
    return null;
  }

  const envVar = PLAN_PRICE_ENV[plan];
  if (!envVar) {
    throw new Error(`No environment mapping configured for plan "${plan}".`);
  }

  return requireEnv(envVar);
}

export function getDemoBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4300';
  return url.replace(/\/$/, '');
}

export function optionalEnv(name: string) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return null;
  }
  if (value.trim().includes('YOUR_') || value.trim().includes('placeholder')) {
    return null;
  }
  return value;
}

export function isStripeConnectEnabled() {
  const raw =
    optionalEnv('NEXT_PUBLIC_ENABLE_STRIPE_CONNECT') ??
    optionalEnv('ENABLE_STRIPE_CONNECT') ??
    process.env.NEXT_PUBLIC_ENABLE_STRIPE_CONNECT ??
    process.env.ENABLE_STRIPE_CONNECT;

  if (!raw) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.toString().toLowerCase());
}
