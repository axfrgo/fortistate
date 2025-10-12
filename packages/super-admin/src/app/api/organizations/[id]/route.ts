import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// PATCH /api/organizations/[id] - Update organization
export async function PATCH(
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

    const body = await request.json();
    const { status, plan, mrr } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (plan) updateData.plan = plan;
    if (mrr !== undefined) updateData.mrr = mrr;

    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ 
      message: 'Organization updated successfully',
      organization 
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
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

    // Soft delete by setting status to 'deleted'
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: { status: 'deleted' },
    });

    return NextResponse.json({ 
      message: 'Organization deleted successfully',
      organization 
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
