import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get org ID from middleware headers
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');
    
    if (!orgId || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch dashboard data in parallel
    const [
      organization,
      teamCount,
      universeCount,
      apiKeyCount,
      recentActivities,
    ] = await Promise.all([
      // Organization info
      prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          createdAt: true,
        },
      }),
      
      // Team member count
      prisma.orgUser.count({
        where: { orgId },
      }),
      
      // Universe count (active only)
      prisma.universe.count({
        where: { 
          orgId,
          isActive: true,
        },
      }),
      
      // API key count (active only)
      prisma.apiKey.count({
        where: { 
          orgId,
          isActive: true,
        },
      }),
      
      // Recent activities (last 10)
      prisma.activity.findMany({
        where: { orgId },
        take: 10,
        orderBy: { createdAt: 'desc' },
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
    ]);
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });
    
    // Get user's role in this org
    const orgUser = await prisma.orgUser.findUnique({
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
    
    return NextResponse.json({
      organization: {
        ...organization,
        memberCount: teamCount,
      },
      currentUser: {
        ...currentUser,
        role: orgUser?.role || 'member',
      },
      stats: {
        teamMembers: teamCount,
        universes: universeCount,
        apiKeys: apiKeyCount,
        apiCalls: 0, // TODO: Calculate from metrics
      },
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        action: activity.action,
        user: activity.user ? {
          name: `${activity.user.firstName} ${activity.user.lastName}`,
          email: activity.user.email,
        } : null,
        createdAt: activity.createdAt,
      })),
    });
    
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
