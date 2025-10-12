import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDemoBaseUrl, getStripe } from '@/lib/stripe';

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

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await getMembership(orgId, userId);
    if (!canManageBilling(membership?.role)) {
      return NextResponse.json({ error: 'Only owners can manage billing settings' }, { status: 403 });
    }

    const billingInfo = await prisma.billingInfo.findUnique({ where: { orgId } });
    if (!billingInfo?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found. Start a checkout session first.' }, { status: 400 });
    }

    const baseUrl = getDemoBaseUrl();
    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billingInfo.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/billing?portal=return`,
    });

    await prisma.activity.create({
      data: {
        type: 'billing_portal_opened',
        action: 'Opened Stripe billing portal',
        metadata: JSON.stringify({ portalSessionId: portalSession.id }),
        orgId,
        userId,
      },
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Billing portal error', error);
    return NextResponse.json(
      {
        error: 'Failed to create billing portal session.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}
