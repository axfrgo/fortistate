import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: { invitationId: string } }) {
  try {
    const orgId = request.headers.get('x-org-id');
    const actorId = request.headers.get('x-user-id');
    const invitationId = params.invitationId;

    if (!orgId || !actorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actorMembership = await prisma.orgUser.findUnique({
      where: {
        userId_orgId: {
          userId: actorId,
          orgId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!actorMembership || (actorMembership.role !== 'owner' && actorMembership.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const invitation = await prisma.orgInvitation.findFirst({
      where: {
        id: invitationId,
        orgId,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    await prisma.orgInvitation.delete({
      where: { id: invitation.id },
    });

    prisma.activity
      .create({
        data: {
          type: 'invitation_cancelled',
          action: `Invitation for ${invitation.email} was cancelled`,
          metadata: JSON.stringify({
            invitationId: invitation.id,
            email: invitation.email,
          }),
          orgId,
          userId: actorId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (invitation cancel):', activityError);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
