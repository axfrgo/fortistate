import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe, getWebhookSecret } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

function normalizePlan(plan?: string | null) {
  if (plan === 'pro' || plan === 'enterprise') {
    return plan;
  }

  return 'free';
}

function serializePaymentMethod(paymentMethod: Stripe.PaymentMethod | null | undefined) {
  if (!paymentMethod || paymentMethod.type !== 'card' || !paymentMethod.card) {
    return null;
  }

  const { brand, last4, exp_month, exp_year } = paymentMethod.card;
  return JSON.stringify({
    brand,
    last4,
    expMonth: exp_month,
    expYear: exp_year,
  });
}

async function applySubscriptionState({
  orgId,
  plan,
  subscription,
  customerId,
  paymentMethod,
}: {
  orgId: string;
  plan: 'free' | 'pro' | 'enterprise';
  subscription: Stripe.Subscription | null;
  customerId?: string | null;
  paymentMethod?: Stripe.PaymentMethod | null;
}) {
  const status = subscription?.status ?? (plan === 'free' ? 'inactive' : null);
  const currentPeriodEnd = subscription ? new Date(subscription.current_period_end * 1000) : null;

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        plan,
      },
    }),
    prisma.billingInfo.upsert({
      where: { orgId },
      create: {
        orgId,
        plan,
        stripeCustomerId: customerId ?? undefined,
        subscriptionId: subscription?.id,
        subscriptionStatus: status,
        currentPeriodEnd,
        paymentMethod: serializePaymentMethod(paymentMethod) ?? undefined,
      },
      update: {
        plan,
        stripeCustomerId: customerId ?? undefined,
        subscriptionId: subscription?.id ?? undefined,
        subscriptionStatus: status,
        currentPeriodEnd,
        paymentMethod: serializePaymentMethod(paymentMethod),
      },
    }),
  ]);
}

async function logActivity(orgId: string, type: string, action: string, metadata: Record<string, unknown>) {
  await prisma.activity.create({
    data: {
      type,
      action,
      metadata: JSON.stringify(metadata),
      orgId,
    },
  });
}

async function parseEvent(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    throw new Error('Missing Stripe signature header.');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error constructing Stripe webhook event';
    throw new Error(`Stripe billing webhook verification failed: ${message}`);
  }
}

async function handleCheckoutCompleted(stripe: Stripe, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const orgId = session.metadata?.orgId;
  const planFromMetadata = normalizePlan(session.metadata?.plan);

  if (!orgId) {
    console.warn('Checkout session completed without orgId metadata');
    return;
  }

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  let subscription: Stripe.Subscription | null = null;
  let paymentMethod: Stripe.PaymentMethod | null = null;

  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });
    const defaultPaymentMethod = subscription.default_payment_method;

    if (defaultPaymentMethod && typeof defaultPaymentMethod !== 'string') {
      paymentMethod = defaultPaymentMethod as Stripe.PaymentMethod;
    }
  }

  await applySubscriptionState({
    orgId,
    plan: planFromMetadata,
    subscription,
    customerId: session.customer && typeof session.customer === 'string' ? session.customer : undefined,
    paymentMethod,
  });

  await logActivity(orgId, 'billing_plan_activated', `Activated ${planFromMetadata} plan via Checkout`, {
    sessionId: session.id,
    subscriptionId: subscription?.id ?? null,
  });
}

async function handleSubscriptionUpdated(stripe: Stripe, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const orgId = subscription.metadata.orgId ?? subscription.metadata.org_id;

  if (!orgId) {
    console.warn('Subscription updated without orgId metadata');
    return;
  }

  const plan = normalizePlan(subscription.metadata.plan);
  let paymentMethod: Stripe.PaymentMethod | null = null;
  const defaultPaymentMethod = subscription.default_payment_method;
  if (defaultPaymentMethod && typeof defaultPaymentMethod !== 'string') {
    paymentMethod = defaultPaymentMethod as Stripe.PaymentMethod;
  } else if (subscription.latest_invoice && typeof subscription.latest_invoice === 'string') {
    try {
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice, {
        expand: ['payment_intent.payment_method'],
      });
      const paymentIntent = invoice.payment_intent;
      if (paymentIntent && typeof paymentIntent !== 'string') {
        const paymentIntentObj = paymentIntent as Stripe.PaymentIntent;
        if (paymentIntentObj.payment_method && typeof paymentIntentObj.payment_method !== 'string') {
          paymentMethod = paymentIntentObj.payment_method as Stripe.PaymentMethod;
        }
      }
    } catch (error) {
      console.warn('Unable to expand latest invoice payment method', error);
    }
  }

  await applySubscriptionState({
    orgId,
    plan,
    subscription,
    customerId: subscription.customer && typeof subscription.customer === 'string' ? subscription.customer : undefined,
    paymentMethod,
  });

  await logActivity(orgId, 'billing_subscription_updated', 'Stripe subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
  });
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const orgId = subscription.metadata.orgId ?? subscription.metadata.org_id;

  if (!orgId) {
    console.warn('Subscription deleted without orgId metadata');
    return;
  }

  await applySubscriptionState({
    orgId,
    plan: 'free',
    subscription: null,
    customerId: subscription.customer && typeof subscription.customer === 'string' ? subscription.customer : undefined,
  });

  await logActivity(orgId, 'billing_subscription_cancelled', 'Subscription cancelled, reverted to free plan', {
    subscriptionId: subscription.id,
  });
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;

  if (!subscriptionId) {
    return;
  }

  const subscription = await prisma.billingInfo.findFirst({ where: { subscriptionId } });
  if (!subscription) {
    return;
  }

  await prisma.billingInfo.update({
    where: { orgId: subscription.orgId },
    data: {
      subscriptionStatus: 'past_due',
    },
  });

  await logActivity(subscription.orgId, 'billing_invoice_failed', 'Subscription invoice payment failed', {
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
  });
}

export async function POST(request: NextRequest) {
  try {
    const event = await parseEvent(request);
    const stripe = getStripe();

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripe, event);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripe, event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;
      default:
        console.debug(`[Billing webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Billing webhook error', error);
    return NextResponse.json(
      {
        error: 'Failed to process Stripe billing webhook.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 400 },
    );
  }
}
