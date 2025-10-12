import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConnectEnabled } from '@/lib/stripe';

// Fetch the latest account status directly from Stripe every time instead of caching it locally.
// This keeps the sample stateless and mirrors best practices when polling during onboarding flows.

export async function GET(_request: NextRequest, { params }: { params: { accountId: string } }) {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(params.accountId);

    return NextResponse.json({
      id: account.id,
      email: account.email ?? null,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      futureRequirements: account.future_requirements ?? null,
      requirements: account.requirements ?? null,
      controller: account.controller ?? null,
      businessProfile: account.business_profile ?? null,
      tosAcceptance: account.tos_acceptance ?? null,
    });
  } catch (error) {
    console.error('Stripe Connect account retrieve error', error);
    return NextResponse.json(
      {
        error: 'Unable to fetch account status. Ensure the account ID is correct and exists.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}
