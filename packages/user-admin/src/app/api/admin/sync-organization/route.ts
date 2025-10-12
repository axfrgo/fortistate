import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

// POST /api/admin/sync-organization
// Called by Super Admin to sync organization data
export async function POST(request: Request) {
  try {
    // Verify request is from Super Admin
    const headersList = headers();
    const superAdminKey = headersList.get('X-Super-Admin-Key');
    
    if (superAdminKey !== process.env.SUPER_ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid Super Admin key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orgId, name, slug, hasEnterpriseAccess, subscriptionTier } = body;

    // Validate required fields
    if (!orgId || !name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: orgId, name, slug' },
        { status: 400 }
      );
    }

    // Upsert organization in User Admin database
    const organization = await prisma.organization.upsert({
      where: { id: orgId },
      update: {
        name,
        slug,
        hasEnterpriseAccess: hasEnterpriseAccess || false,
        subscriptionTier: subscriptionTier || 'free',
        updatedAt: new Date(),
      } as any, // Type assertion until Prisma client regenerates
      create: {
        id: orgId,
        name,
        slug,
        hasEnterpriseAccess: hasEnterpriseAccess || false,
        subscriptionTier: subscriptionTier || 'free',
        status: 'active',
      } as any, // Type assertion until Prisma client regenerates
    });

    // TODO: If org admin email provided, send invitation or assign role

    return NextResponse.json({
      message: 'Organization synced successfully',
      organization,
    });
  } catch (error) {
    console.error('Error syncing organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
