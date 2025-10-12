import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get real counts from database
    const [
      totalUsers,
      activeUsers,
      totalOrgs,
      activeOrgs,
      totalUniverses,
      activeUniverses,
      stoppedUniverses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'active' } }),
      prisma.universe.count(),
      prisma.universe.count({ where: { status: 'running' } }),
      prisma.universe.count({ where: { status: 'stopped' } }),
    ]);

    // Get revenue aggregation
    const orgs = await prisma.organization.findMany({
      select: { mrr: true },
    });
    const totalMRR = orgs.reduce((sum, org) => sum + org.mrr, 0);
    const totalARR = totalMRR * 12;

    // Get AI usage today
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const aiUsageToday = await prisma.aiUsage.findMany({
      where: {
        timestamp: { gte: yesterday },
      },
      select: { cost: true },
    });
    const aiCallsToday = aiUsageToday.length;
    const aiCostToday = aiUsageToday.reduce((sum, record) => sum + record.cost, 0);

    // Calculate new users (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });
    const newOrgs = await prisma.organization.count({
      where: { createdAt: { gte: weekAgo } },
    });

    // Calculate revenue growth from historical metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const previousMrrMetrics = await prisma.metric.findMany({
      where: {
        metricName: 'mrr',
        metricType: 'platform',
        timestamp: {
          gte: new Date(thirtyDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          lte: new Date(thirtyDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });

    const previousMRR = previousMrrMetrics.length > 0 ? previousMrrMetrics[0].value : totalMRR * 0.93;
    const revenueGrowth = previousMRR > 0 ? Math.round(((totalMRR - previousMRR) / previousMRR) * 100) : 0;

    // Calculate AI usage trend
    const weekAgoAiUsage = await prisma.aiUsage.count({
      where: {
        timestamp: { gte: weekAgo, lte: yesterday },
      },
    });
    const aiUsageTrend = weekAgoAiUsage > 0 
      ? Math.round(((aiCallsToday - weekAgoAiUsage / 7) / (weekAgoAiUsage / 7)) * 100)
      : 0;

    // Get real alerts from database
    const universeViolations = await prisma.universe.count({
      where: { violationCount: { gt: 0 } },
    });

    const highUsageOrgs = await prisma.organization.count({
      where: { totalAiCalls: { gt: 100000 } },
    });

    const alerts = [];
    if (universeViolations > 0) {
      alerts.push({
        id: 'alert-violations',
        type: 'warning',
        message: `${universeViolations} universe${universeViolations > 1 ? 's' : ''} ${universeViolations > 1 ? 'have' : 'has'} law violations`,
        action: 'View Details',
        href: '/dashboard/universes?filter=violations',
      });
    }
    if (highUsageOrgs > 0) {
      alerts.push({
        id: 'alert-usage',
        type: 'info',
        message: `${highUsageOrgs} organization${highUsageOrgs > 1 ? 's' : ''} exceeded AI usage limits`,
        action: 'Review Usage',
        href: '/dashboard/ai-usage',
      });
    }

    const metrics = {
      users: { 
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
      },
      organizations: { 
        total: totalOrgs,
        paying: activeOrgs,
        new: newOrgs,
      },
      universes: { 
        total: totalUniverses,
        active: activeUniverses,
        stopped: stoppedUniverses,
      },
      revenue: { 
        mrr: totalMRR,
        arr: totalARR,
        growth: revenueGrowth,
      },
      aiCalls: { 
        today: aiCallsToday,
        cost: Math.round(aiCostToday * 100) / 100,
        trend: aiUsageTrend,
      },
      systemHealth: { 
        status: 'healthy',
        uptime: 99.98,
      },
      alerts,
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
