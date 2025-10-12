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

    const events = await prisma.abuseEvent.findMany({
      select: {
        id: true,
        timestamp: true,
        userId: true,
        organizationId: true,
        eventType: true,
        severity: true,
        description: true,
        ipAddress: true,
        resolved: true,
        resolvedAt: true,
        action: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    // Fetch users and organizations separately for mapping
    const userIds = [...new Set(events.map(e => e.userId))];
    const orgIds = [...new Set(events.map(e => e.organizationId).filter(Boolean))];

    const [users, organizations] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      }),
      prisma.organization.findMany({
        where: { id: { in: orgIds as string[] } },
        select: { id: true, name: true },
      }),
    ]);

    const userMap = new Map(users.map(u => [u.id, u]));
    const orgMap = new Map(organizations.map(o => [o.id, o]));

    // Transform to match frontend expectations
    const transformedEvents = events.map(evt => {
      const user = userMap.get(evt.userId);
      const org = evt.organizationId ? orgMap.get(evt.organizationId) : null;

      return {
        id: evt.id,
        type: evt.eventType,
        severity: evt.severity,
        userId: evt.userId,
        userEmail: user?.email || 'unknown@example.com',
        organizationName: org?.name || 'N/A',
        description: evt.description,
        timestamp: evt.timestamp.toISOString(),
        ipAddress: evt.ipAddress,
        resolved: evt.resolved,
        resolvedAt: evt.resolvedAt?.toISOString(),
        action: evt.action,
      };
    });

    return NextResponse.json({ events: transformedEvents });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
