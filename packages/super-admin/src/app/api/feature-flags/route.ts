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

    const flags = await prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to match frontend expectations
    const transformedFlags = flags.map(flag => {
      const targetOrgs = flag.targetOrgIds 
        ? String(flag.targetOrgIds).split(',').filter(Boolean)
        : [];
      
      return {
        id: flag.id,
        name: flag.name,
        key: flag.name.toLowerCase().replace(/\s+/g, '_'),
        description: flag.description,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercent,
        targetOrganizations: targetOrgs,
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt,
      };
    });

    return NextResponse.json({ flags: transformedFlags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
