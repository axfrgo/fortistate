import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDemoBaseUrl, getStripe, isStripeConnectEnabled } from '@/lib/stripe';

const bodySchema = z.object({
  refreshPath: z.string().optional(),
  returnPath: z.string().optional(),
});

// Generate a fresh account onboarding link. Express users should always be sent through this flow until
// `details_submitted` returns true. We derive the base URL from environment config so the sample works locally
// or when deployed.
export async function POST(request: Request, { params }: { params: { accountId: string } }) {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const { refreshPath, returnPath } = bodySchema.parse(await request.json().catch(() => ({})));

    const baseUrl = getDemoBaseUrl();
    const refreshUrl = `${baseUrl}${refreshPath ?? '/dashboard/stripe-connect?onboarding=refresh'}`;
    const returnUrl = `${baseUrl}${returnPath ?? '/dashboard/stripe-connect?onboarding=success'}`;

    const stripe = getStripe();

    const accountLink = await stripe.accountLinks.create({
      account: params.accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect onboarding link error', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid onboarding request payload.', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'Unable to generate onboarding link for the connected account.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}
