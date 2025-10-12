import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, getWebhookSecret, isStripeConnectEnabled } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// Stripe delivers mission critical events (checkout completions, onboarding statuses) to this endpoint. We verify
// the signature using the webhook secret and fan out to lightweight handlers.
async function parseEvent(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    throw new Error('Missing Stripe signature header. Is the webhook endpoint configured correctly?');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error constructing Stripe webhook event';
    throw new Error(`Stripe webhook signature verification failed: ${message}`);
  }
}

async function handleCheckoutSessionCompleted(stripe: Stripe, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (!session.payment_intent) {
    return;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
    expand: ['transfer_data.destination'],
  });

  console.info('[Stripe Connect] Checkout completed', {
    sessionId: session.id,
    paymentIntent: paymentIntent.id,
    amount: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    destination: paymentIntent.transfer_data?.destination,
  });
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.info('[Stripe Connect] Subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
  });
}

async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  console.info('[Stripe Connect] Account updated', {
    accountId: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConnectEnabled()) {
      return NextResponse.json({ error: 'Stripe Connect demo is disabled.' }, { status: 404 });
    }

    const event = await parseEvent(request);
    const stripe = getStripe();

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripe, event);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionUpdated(event);
        break;
      case 'account.updated':
        await handleAccountUpdated(event);
        break;
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.warn('[Stripe Connect] Payment failed', {
          paymentIntent: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          lastPaymentError: paymentIntent.last_payment_error?.message,
        });
        break;
      }
      default:
        console.debug(`[Stripe Connect] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe Connect webhook error', error);
    return NextResponse.json(
      {
        error: 'Failed to process Stripe webhook.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 400 },
    );
  }
}
