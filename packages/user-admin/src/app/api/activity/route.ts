import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const typeFilter = request.nextUrl.searchParams.get('type');
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 50, 200);

    const where: { orgId: string; type?: string } = { orgId };
    if (typeFilter && typeFilter !== 'all') {
      where.type = typeFilter;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      action: activity.action,
      metadata: JSON.parse(activity.metadata),
      userId: activity.userId,
      createdAt: activity.createdAt.toISOString(),
      user: activity.user,
    }));

    return NextResponse.json({
      activities: formattedActivities,
      total,
    });
  } catch (error) {
    console.error('Activity endpoint error', error);
    return NextResponse.json(
      {
        error: 'Failed to load activity log.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}
