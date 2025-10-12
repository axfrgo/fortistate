import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, isStripeConnectEnabled } from '@/lib/stripe';

function simplifyAccount(account: Stripe.Account) {
  const requirements = account.requirements ?? null;
  const futureRequirements = account.future_requirements ?? null;
  return {
    id: account.id,
    email: account.email ?? null,
    created: account.created,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    defaultCurrency: account.default_currency,
  futureRequirements: futureRequirements?.currently_due ?? [],
    currentlyDue: requirements?.currently_due ?? [],
    pastDue: requirements?.past_due ?? [],
    disabledReason: requirements?.disabled_reason ?? null,
  };
}

function simplifyProduct(product: Stripe.Product & { default_price?: Stripe.Price | null }) {
  const price = product.default_price;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    connectedAccountId: product.metadata.connected_account_id ?? null,
    defaultPrice:
      price && typeof price !== 'string'
        ? {
            id: price.id,
            amount: price.unit_amount,
            currency: price.currency,
          }
        : null,
  };
}

// Provide the dashboard with a single payload containing the latest accounts and products so it can render
// statuses without juggling multiple requests.
export async function GET() {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const stripe = getStripe();
    const [accountsList, productsList] = await Promise.all([
      stripe.accounts.list({ limit: 10 }),
      stripe.products.list({ limit: 50, expand: ['data.default_price'] }),
    ]);

    const accounts = await Promise.all(
      accountsList.data.map((summary) => stripe.accounts.retrieve(summary.id).then(simplifyAccount)),
    );

    const products = productsList.data.map((product) => simplifyProduct(product as Stripe.Product & { default_price?: Stripe.Price | null }));

    return NextResponse.json({ accounts, products });
  } catch (error) {
    console.error('Stripe Connect overview error', error);
    return NextResponse.json(
      {
        error: 'Unable to load Stripe Connect overview data.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}
