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

    // Fetch all AI usage records
    const aiUsageRecords = await prisma.aiUsage.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Fetch organizations separately for mapping
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true, plan: true },
    });
    const organizationMap = new Map(organizations.map(o => [o.id, o]));

    // Calculate overall usage statistics
    const totalCalls = aiUsageRecords.length;
    const totalTokens = aiUsageRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const totalCost = aiUsageRecords.reduce((sum, r) => sum + r.cost, 0);

    // Get today's data (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayRecords = aiUsageRecords.filter(r => new Date(r.timestamp) > yesterday);
    const callsToday = todayRecords.length;
    const tokensToday = todayRecords.reduce((sum, r) => sum + r.totalTokens, 0);
    const costToday = todayRecords.reduce((sum, r) => sum + r.cost, 0);

    // Aggregate by model with real response time metrics
    const modelMap = new Map<string, { calls: number; tokens: number; cost: number; responseTimes: number[] }>();
    aiUsageRecords.forEach(record => {
      const existing = modelMap.get(record.model) || { calls: 0, tokens: 0, cost: 0, responseTimes: [] };
      modelMap.set(record.model, {
        calls: existing.calls + 1,
        tokens: existing.tokens + record.totalTokens,
        cost: existing.cost + record.cost,
        responseTimes: existing.responseTimes,
      });
    });

    // Get response time metrics for each model
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const responseTimeMetrics = await prisma.metric.findMany({
      where: {
        metricName: { startsWith: 'ai_response_time_' },
        timestamp: { gte: oneHourAgo },
      },
      select: { metricName: true, value: true },
    });

    const modelResponseTimes = new Map<string, number[]>();
    responseTimeMetrics.forEach(metric => {
      const model = metric.metricName.replace('ai_response_time_', '');
      const times = modelResponseTimes.get(model) || [];
      times.push(metric.value);
      modelResponseTimes.set(model, times);
    });

    const modelUsage = Array.from(modelMap.entries()).map(([model, stats]) => {
      const responseTimes = modelResponseTimes.get(model) || [];
      const avgResponseTime = responseTimes.length > 0
        ? Math.round((responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length) * 100) / 100
        : 0;

      return {
        model,
        calls: stats.calls,
        tokens: stats.tokens,
        cost: Math.round(stats.cost * 100) / 100,
        avgResponseTime: avgResponseTime || 1.5, // Fallback for models without metrics
      };
    }).sort((a, b) => b.calls - a.calls);

    const topModel = modelUsage[0]?.model || 'gpt-4';
    const topModelUsage = modelUsage[0] ? Math.round((modelUsage[0].calls / totalCalls) * 100) : 0;

    // Aggregate by organization
    const orgUsageMap = new Map<string, { name: string; plan: string; calls: number; tokens: number; cost: number }>();
    aiUsageRecords.forEach(record => {
      const org = organizationMap.get(record.organizationId);
      if (!org) return;
      
      const existing = orgUsageMap.get(record.organizationId) || { 
        name: org.name, 
        plan: org.plan,
        calls: 0, 
        tokens: 0, 
        cost: 0 
      };
      orgUsageMap.set(record.organizationId, {
        name: existing.name,
        plan: existing.plan,
        calls: existing.calls + 1,
        tokens: existing.tokens + record.totalTokens,
        cost: existing.cost + record.cost,
      });
    });

    const orgUsage = Array.from(orgUsageMap.entries()).map(([orgId, stats]) => ({
      organizationId: orgId,
      organizationName: stats.name,
      plan: stats.plan,
      totalCalls: stats.calls,
      totalTokens: stats.tokens,
      totalCost: Math.round(stats.cost * 100) / 100,
      limitExceeded: stats.calls > 100000, // Simple threshold
    })).sort((a, b) => b.totalCalls - a.totalCalls);

    const usageData = {
      totalCalls,
      totalTokens,
      totalCost: Math.round(totalCost * 100) / 100,
      callsToday,
      tokensToday,
      costToday: Math.round(costToday * 100) / 100,
      averageCallsPerDay: Math.round(totalCalls / 30), // Assume 30 days
      topModel,
      topModelUsage,
    };

    return NextResponse.json({ usageData, modelUsage, orgUsage });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
