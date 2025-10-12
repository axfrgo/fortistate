import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type Stripe from 'stripe';
import { getDemoBaseUrl, getStripe, isStripeConnectEnabled, optionalEnv } from '@/lib/stripe';

const checkoutSchema = z.object({
  productId: z.string().min(5),
  quantity: z.number().int().positive().max(10).default(1),
});

// Allow operators to tweak the platform fee by setting STRIPE_APPLICATION_FEE_BPS. Defaults to 10% (1000 bps).
function computeApplicationFee(unitAmount: number, quantity: number) {
  const feeBps = Number(optionalEnv('STRIPE_APPLICATION_FEE_BPS') ?? '1000'); // Default to 10%
  if (Number.isNaN(feeBps) || feeBps < 0) {
    throw new Error('STRIPE_APPLICATION_FEE_BPS must be a non-negative number if provided.');
  }

  return Math.round((unitAmount * quantity * feeBps) / 10_000);
}

// Create a one-time Checkout Session that performs a destination charge and retains an application fee.
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const { productId, quantity } = checkoutSchema.parse(await request.json());
    const stripe = getStripe();
    const product = await stripe.products.retrieve(productId, {
      expand: ['default_price'],
    });

    const defaultPrice = product.default_price as Stripe.Price | null;
    if (!defaultPrice || defaultPrice.unit_amount === null || !defaultPrice.currency) {
      return NextResponse.json({
        error: 'Product is missing a default price; cannot create checkout session.',
      }, { status: 400 });
    }

    const connectedAccountId = product.metadata.connected_account_id;
    if (!connectedAccountId) {
      return NextResponse.json({
        error: 'Product is not linked to a connected account. Update metadata and try again.',
      }, { status: 400 });
    }

    const unitAmount = defaultPrice.unit_amount;
    const applicationFeeAmount = computeApplicationFee(unitAmount, quantity);
    const baseUrl = getDemoBaseUrl();

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: defaultPrice.currency,
            unit_amount: unitAmount,
            product_data: {
              name: product.name,
              description: product.description ?? undefined,
            },
          },
          quantity,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: connectedAccountId,
        },
      },
      success_url: `${baseUrl}/dashboard/stripe-connect/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/stripe-connect?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe Connect checkout error', error);
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json(
      {
        error: error instanceof z.ZodError ? 'Invalid checkout payload.' : 'Unable to create checkout session.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status },
    );
  }
}
