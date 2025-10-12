import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePlanSchema = z.object({
  plan: z.enum(['free', 'pro', 'enterprise']),
});

const PLAN_LIMITS: Record<
  'free' | 'pro' | 'enterprise',
  {
    members: number | null;
    universes: number | null;
    apiKeys: number | null;
    apiCalls: number | null;
  }
> = {
  free: {
    members: 5,
    universes: 2,
    apiKeys: 3,
    apiCalls: 5_000,
  },
  pro: {
    members: 20,
    universes: 10,
    apiKeys: 25,
    apiCalls: 100_000,
  },
  enterprise: {
    members: null,
    universes: null,
    apiKeys: null,
    apiCalls: null,
  },
};

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

function parsePaymentMethod(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  try {
    const method = JSON.parse(raw);
    if (method && typeof method === 'object') {
      return method;
    }
  } catch {
    // ignore JSON errors
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [organization, billingInfo, memberCount, universeCount, apiKeyCount, metricsAggregate, membership] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          name: true,
          plan: true,
          createdAt: true,
        },
      }),
      prisma.billingInfo.findUnique({
        where: { orgId },
      }),
      prisma.orgUser.count({ where: { orgId } }),
      prisma.universe.count({ where: { orgId } }),
      prisma.apiKey.count({ where: { orgId } }),
      prisma.universeMetrics.aggregate({
        where: {
          universe: {
            orgId,
          },
        },
        _sum: {
          apiCalls: true,
          stateOps: true,
          errors: true,
        },
      }),
      getMembership(orgId, userId),
    ]);

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const plan = (billingInfo?.plan ?? organization.plan ?? 'free') as 'free' | 'pro' | 'enterprise';
    const limits = PLAN_LIMITS[plan];

    const usage = {
      members: {
        value: memberCount,
        limit: limits.members,
      },
      universes: {
        value: universeCount,
        limit: limits.universes,
      },
      apiKeys: {
        value: apiKeyCount,
        limit: limits.apiKeys,
      },
      apiCalls: {
        value: metricsAggregate._sum.apiCalls ?? 0,
        limit: limits.apiCalls,
      },
    };

    const invoicePlan = billingInfo?.plan ?? plan;

    const invoices = billingInfo?.paymentMethod
      ? [
          {
            id: 'tmp-invoice-001',
            status: 'paid',
            amount: invoicePlan === 'pro' ? 49_00 : invoicePlan === 'enterprise' ? 249_00 : 0,
            issuedAt: billingInfo.updatedAt ?? organization.createdAt,
            downloadUrl: '#',
          },
        ]
      : [];

    return NextResponse.json({
      organization: {
        name: organization.name,
        createdAt: organization.createdAt,
      },
      plan: {
        current: plan,
        limits,
        nextRenewal: billingInfo?.currentPeriodEnd ?? null,
        subscriptionStatus: billingInfo?.subscriptionStatus ?? null,
        canManage: canManageBilling(membership?.role),
      },
      billingContact: {
        email: billingInfo?.billingEmail ?? null,
      },
      paymentMethod: parsePaymentMethod(billingInfo?.paymentMethod),
      usage,
      invoices,
      suggestions: plan === 'free'
        ? 'Upgrade to Pro to unlock higher API rate limits and additional universes.'
        : plan === 'pro'
        ? 'Consider Enterprise for unlimited universes and concierge support.'
        : 'Need tailored pricing? Contact support for enterprise add-ons.',
    });
  } catch (error) {
    console.error('Billing fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
      return NextResponse.json({ error: 'Only owners can manage billing plans' }, { status: 403 });
    }

    const body = await request.json();
    const { plan } = updatePlanSchema.parse(body);

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (organization.plan === plan) {
      return NextResponse.json({ success: true, plan });
    }

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: orgId },
        data: { plan },
      }),
      prisma.billingInfo.upsert({
        where: { orgId },
        create: {
          orgId,
          plan,
        },
        update: {
          plan,
          subscriptionStatus: plan === 'free' ? 'inactive' : 'active',
        },
      }),
      prisma.activity.create({
        data: {
          type: 'plan_updated',
          action: `Organization plan changed to ${plan}`,
          metadata: JSON.stringify({ plan }),
          orgId,
          userId,
        },
      }),
    ]);

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Billing update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
