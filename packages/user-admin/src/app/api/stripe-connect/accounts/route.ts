import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStripe, isStripeConnectEnabled } from '@/lib/stripe';

// This route handles two responsibilities:
// 1. Listing the most recent connected accounts so the dashboard can show live status.
// 2. Creating new controller-based accounts where the platform manages pricing, fees, and losses.

const createAccountSchema = z.object({
  email: z.string().email('Provide a valid email address for the connected account.'),
  country: z.string().length(2, 'Country must be a 2-letter ISO code.').default('US'),
  businessType: z.enum(['individual', 'company']).default('individual'),
});

export async function GET(request: NextRequest) {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const stripe = getStripe();
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? Math.min(Number(limitParam) || 10, 25) : 10;

    const list = await stripe.accounts.list({ limit });
    const accounts = await Promise.all(
      list.data.map(async (accountSummary) => {
        const account = await stripe.accounts.retrieve(accountSummary.id);
        const requirements = account.requirements ?? null;

        return {
          id: account.id,
          email: account.email ?? null,
          controller: account.controller ?? null,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          created: account.created,
          defaultCurrency: account.default_currency,
          currentRequirements: requirements?.currently_due ?? [],
          pastDueRequirements: requirements?.past_due ?? [],
          disabledReason: requirements?.disabled_reason ?? null,
        };
      }),
    );

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Stripe Connect accounts GET error', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve Stripe connected accounts.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}

// Create a controller-based connected account. We rely solely on the controller block so the
// platform retains control over fees, pricing, and losses as requested in the spec.
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const body = await request.json();
    const { email, country, businessType } = createAccountSchema.parse(body);

    const stripe = getStripe();

    const account = await stripe.accounts.create({
      email,
      country,
      business_type: businessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      controller: {
        fees: {
          payer: 'application',
        },
        losses: {
          payments: 'application',
        },
        stripe_dashboard: {
          type: 'express',
        },
      },
    });

    return NextResponse.json({
      accountId: account.id,
      email: account.email,
      controller: account.controller,
    });
  } catch (error) {
    console.error('Stripe Connect accounts POST error', error);
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json(
      {
        error: error instanceof z.ZodError ? 'Validation failed for account creation.' : 'Failed to create Stripe connected account.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status },
    );
  }
}
