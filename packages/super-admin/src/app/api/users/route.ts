import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Verify authentication
    const cookieStore = cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        organizationId: true,
        role: true,
        plan: true,
        status: true,
        isAbuser: true,
        abuseScore: true,
        totalApiCalls: true,
        totalAiCalls: true,
        createdAt: true,
        lastActiveAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
