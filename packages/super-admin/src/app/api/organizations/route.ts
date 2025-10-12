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

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        hasEnterpriseAccess: true,
        orgAdminEmail: true,
        orgAdminId: true,
        mrr: true,
        userCount: true,
        universeCount: true,
        totalApiCalls: true,
        createdAt: true,
        enterpriseAccessGrantedAt: true,
        enterpriseAccessGrantedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, slug, plan, orgAdminEmail, grantEnterpriseAccess } = body;

    // Validate required fields
    if (!name || !slug || !plan || !orgAdminEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, plan, orgAdminEmail' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already exists' },
        { status: 409 }
      );
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        plan,
        status: 'active',
        orgAdminEmail,
        hasEnterpriseAccess: grantEnterpriseAccess || false,
        enterpriseAccessGrantedAt: grantEnterpriseAccess ? new Date() : null,
        enterpriseAccessGrantedBy: grantEnterpriseAccess ? session.email : null,
      },
    });

    // TODO: Send invitation email to org admin
    // TODO: Sync organization to User Admin if enterprise access granted
    if (grantEnterpriseAccess) {
      try {
        // Call User Admin API to sync organization
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
            hasEnterpriseAccess: true,
            subscriptionTier: plan,
            orgAdminEmail: orgAdminEmail,
          }),
        });
      } catch (syncError) {
        console.error('Failed to sync organization to User Admin:', syncError);
        // Don't fail the request if sync fails
      }
    }

    return NextResponse.json(
      { 
        message: 'Organization created successfully',
        organization 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
