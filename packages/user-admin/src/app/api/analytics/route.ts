import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sevenDaysAgo = subDays(new Date(), 7);
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [totalMembers, totalUniverses, totalApiKeys, recentActivity, universes] = await Promise.all([
      prisma.orgUser.count({
        where: { orgId },
      }),
      prisma.universe.count({
        where: { orgId },
      }),
      prisma.apiKey.count({
        where: { orgId, isActive: true },
      }),
      prisma.activity.findMany({
        where: {
          orgId,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          createdAt: true,
          type: true,
        },
      }),
      prisma.universe.findMany({
        where: { orgId },
        include: {
          metrics: true,
        },
        orderBy: {
          metrics: {
            apiCalls: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Group activities by day
    const activityByDay = new Map<string, { apiCalls: number; events: number }>();
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i).toISOString().split('T')[0];
      activityByDay.set(date, { apiCalls: 0, events: 0 });
    }

    recentActivity.forEach((activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      const entry = activityByDay.get(date);
      if (entry) {
        entry.events += 1;
        if (activity.type.includes('api')) {
          entry.apiCalls += 1;
        }
      }
    });

    const activity = Array.from(activityByDay.entries())
      .map(([date, data]) => ({ date, ...data }))
      .reverse();

    const topUniverses = universes
      .filter((u) => u.metrics && u.metrics.apiCalls > 0)
      .map((u) => ({
        id: u.id,
        name: u.name,
        apiCalls: u.metrics?.apiCalls ?? 0,
      }));

    // Calculate total API calls in last 30 days from universe metrics
    const allUniverseMetrics = await prisma.universeMetrics.findMany({
      where: {
        universe: {
          orgId,
        },
        lastActivity: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        apiCalls: true,
      },
    });

    const apiCallsLast30Days = allUniverseMetrics.reduce((sum, m) => sum + m.apiCalls, 0);

    return NextResponse.json({
      overview: {
        totalMembers,
        totalUniverses,
        totalApiKeys,
        apiCallsLast30Days,
      },
      activity,
      topUniverses,
    });
  } catch (error) {
    console.error('Analytics endpoint error', error);
    return NextResponse.json(
      {
        error: 'Failed to load analytics data.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}
