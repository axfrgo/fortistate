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

    // Aggregate revenue from organizations
    const organizations = await prisma.organization.findMany({
      where: { status: 'active' },
      select: { mrr: true, plan: true },
    });

    const totalMRR = organizations.reduce((sum, org) => sum + org.mrr, 0);
    const totalARR = totalMRR * 12;

    // Calculate plan breakdown
    const planBreakdown = [
      {
        plan: 'enterprise',
        count: organizations.filter(o => o.plan === 'enterprise').length,
        mrr: organizations.filter(o => o.plan === 'enterprise').reduce((sum, o) => sum + o.mrr, 0),
        arr: organizations.filter(o => o.plan === 'enterprise').reduce((sum, o) => sum + o.mrr, 0) * 12,
      },
      {
        plan: 'pro',
        count: organizations.filter(o => o.plan === 'pro').length,
        mrr: organizations.filter(o => o.plan === 'pro').reduce((sum, o) => sum + o.mrr, 0),
        arr: organizations.filter(o => o.plan === 'pro').reduce((sum, o) => sum + o.mrr, 0) * 12,
      },
      {
        plan: 'free',
        count: organizations.filter(o => o.plan === 'free').length,
        mrr: 0,
        arr: 0,
      },
    ];

    // Calculate growth from historical metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const previousMrrMetrics = await prisma.metric.findMany({
      where: {
        metricName: 'mrr',
        metricType: 'platform',
        timestamp: {
          gte: new Date(thirtyDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000), // 37 days ago
          lte: new Date(thirtyDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000), // 23 days ago
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });

    const previousMRR = previousMrrMetrics.length > 0 ? previousMrrMetrics[0].value : totalMRR * 0.93;
    const growthPercent = previousMRR > 0 ? ((totalMRR - previousMRR) / previousMRR) * 100 : 0;

    // Calculate new/churned MRR from organization changes in last 30 days
    const newOrgs = await prisma.organization.count({
      where: {
        status: 'active',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const churnedOrgs = await prisma.organization.count({
      where: {
        status: { in: ['suspended', 'deleted'] },
        lastActiveAt: { gte: thirtyDaysAgo },
      },
    });

    const avgMrrPerOrg = organizations.length > 0 ? totalMRR / organizations.length : 0;
    const newMRR = newOrgs * avgMrrPerOrg;
    const churnedMRR = churnedOrgs * avgMrrPerOrg;
    const churnRate = organizations.length > 0 ? (churnedOrgs / (organizations.length + churnedOrgs)) * 100 : 0;

    const revenueData = {
      currentMRR: totalMRR,
      previousMRR: previousMRR,
      currentARR: totalARR,
      totalRevenue: totalMRR * 3, // Last 3 months approximation
      newMRR: Math.round(newMRR * 100) / 100,
      churnedMRR: Math.round(churnedMRR * 100) / 100,
      upgradeMRR: totalMRR * 0.08, // TODO: Track plan changes for accurate data
      downgradeMRR: totalMRR * 0.02, // TODO: Track plan changes for accurate data
      activeSubscriptions: organizations.length,
      churnRate: Math.round(churnRate * 10) / 10,
      growthPercent: Math.round(growthPercent * 10) / 10,
    };

    return NextResponse.json({ revenueData, planBreakdown });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
