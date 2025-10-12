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

    const deployments = await prisma.deployment.findMany({
      select: {
        id: true,
        timestamp: true,
        service: true,
        version: true,
        environment: true,
        status: true,
        deployedBy: true,
        commitHash: true,
        releaseNotes: true,
        duration: true,
        errorMessage: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    // Transform for frontend
    const transformedDeployments = deployments.map(deploy => ({
      ...deploy,
      startedAt: deploy.timestamp,
      completedAt: deploy.duration 
        ? new Date(new Date(deploy.timestamp).getTime() + deploy.duration * 1000).toISOString()
        : null,
      changes: deploy.releaseNotes ? [deploy.releaseNotes] : [],
    }));

    return NextResponse.json({ deployments: transformedDeployments });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
