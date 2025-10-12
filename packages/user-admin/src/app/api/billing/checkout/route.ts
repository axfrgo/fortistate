import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getDemoBaseUrl, getPlanPriceId, getStripe } from '@/lib/stripe';

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
});

async function getMembership(orgId: string, userId: string) {
  return prisma.orgUser.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
    select: {
      role: true,
    },
  });
}

function canManageBilling(role: string | undefined | null) {
  return role === 'owner';
}

async function ensureStripeCustomer({
  orgId,
  userId,
  stripe,
}: {
  orgId: string;
  userId: string;
  stripe: Stripe;
}) {
  const [billingInfo, organization, user] = await Promise.all([
    prisma.billingInfo.findUnique({ where: { orgId } }),
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!organization) {
    throw new Error('Organization not found.');
  }

  let stripeCustomerId = billingInfo?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: organization.name,
      email: user?.email ?? billingInfo?.billingEmail ?? undefined,
      metadata: {
        orgId,
      },
    });
    stripeCustomerId = customer.id;
  }

  const updatedBilling = await prisma.billingInfo.upsert({
    where: { orgId },
    create: {
      orgId,
      plan: organization.plan,
      stripeCustomerId,
      billingEmail: user?.email ?? billingInfo?.billingEmail ?? null,
      subscriptionStatus: billingInfo?.subscriptionStatus ?? null,
    },
    update: {
      stripeCustomerId,
      billingEmail: user?.email ?? billingInfo?.billingEmail ?? null,
    },
  });

  return { billingInfo: updatedBilling, stripeCustomerId };
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = checkoutSchema.parse(await request.json());
    const membership = await getMembership(orgId, userId);

    if (!canManageBilling(membership?.role)) {
      return NextResponse.json({ error: 'Only owners can manage billing plans' }, { status: 403 });
    }

    const stripe = getStripe();
    const priceId = getPlanPriceId(plan);

    if (!priceId) {
      return NextResponse.json({ error: 'Cannot start checkout for the free plan.' }, { status: 400 });
    }

    const { stripeCustomerId } = await ensureStripeCustomer({ orgId, userId, stripe });

    const baseUrl = getDemoBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          orgId,
          plan,
        },
      },
      metadata: {
        orgId,
        plan,
        initiatedBy: userId,
      },
      client_reference_id: orgId,
      success_url: `${baseUrl}/dashboard/billing?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/billing?upgrade=cancelled`,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
    });

    await prisma.billingInfo.update({
      where: { orgId },
      data: {
        subscriptionStatus: 'pending',
      },
    });

    await prisma.activity.create({
      data: {
        type: 'billing_checkout_created',
        action: `Started Stripe Checkout for ${plan} plan`,
        metadata: JSON.stringify({ plan, sessionId: session.id }),
        orgId,
        userId,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Billing checkout error', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request payload', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'Failed to create billing checkout session.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}
