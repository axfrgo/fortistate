import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// POST /api/organizations/[id]/revoke-enterprise - Revoke User Admin access
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Update organization to revoke enterprise access
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: {
        hasEnterpriseAccess: false,
        enterpriseAccessGrantedAt: null,
        enterpriseAccessGrantedBy: null,
      },
    });

    // Sync to User Admin
    try {
      await fetch(`${process.env.USER_ADMIN_URL}/api/admin/sync-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Super-Admin-Key': process.env.SUPER_ADMIN_API_KEY || '',
        },
        body: JSON.stringify({
          orgId: organization.id,
          name: organization.name,
          slug: organization.slug,
          hasEnterpriseAccess: false,
          subscriptionTier: organization.plan,
          orgAdminEmail: organization.orgAdminEmail,
        }),
      });
    } catch (syncError) {
      console.error('Failed to sync organization to User Admin:', syncError);
      // Don't fail the request if sync fails
    }

    return NextResponse.json({ 
      message: 'Enterprise access revoked successfully',
      organization 
    });
  } catch (error) {
    console.error('Error revoking enterprise access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
