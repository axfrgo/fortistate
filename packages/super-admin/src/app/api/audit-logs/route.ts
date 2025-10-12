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

    const logs = await prisma.auditLog.findMany({
      select: {
        id: true,
        timestamp: true,
        adminId: true,
        action: true,
        targetType: true,
        targetId: true,
        description: true,
        ipAddress: true,
        userAgent: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    // Transform for frontend
    const transformedLogs = logs.map(log => ({
      ...log,
      resource: log.targetType,
      resourceId: log.targetId,
      details: log.description,
      severity: log.action.includes('suspend') || log.action.includes('delete') ? 'critical' : 'medium',
      adminEmail: log.user?.email || 'system@fortistate.com',
      adminName: log.user?.name || 'System',
    }));

    return NextResponse.json({ logs: transformedLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
