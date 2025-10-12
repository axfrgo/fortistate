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

    const universes = await prisma.universe.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
        status: true,
        stateSize: true,
        storeCount: true,
        lawCount: true,
        eventCount: true,
        violationCount: true,
        totalApiCalls: true,
        createdAt: true,
        lastActiveAt: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    // Transform to match frontend expectations
    const transformedUniverses = universes.map(u => ({
      id: u.id,
      name: u.name,
      organizationId: u.organizationId,
      organizationName: u.organization.name,
      status: u.status as 'running' | 'stopped' | 'error',
      lawViolations: u.violationCount,
      entityCount: u.storeCount,
      stateSize: Math.round(u.stateSize / 1024), // Convert bytes to KB
      totalOperations: u.totalApiCalls,
      createdAt: u.createdAt.toISOString(),
      lastActiveAt: u.lastActiveAt.toISOString(),
    }));

    return NextResponse.json({ universes: transformedUniverses });
  } catch (error) {
    console.error('Error fetching universes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
