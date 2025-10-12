import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});

async function ensureActorCanManage(orgId: string, userId: string) {
  const membership = await prisma.orgUser.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
    select: {
      role: true,
      userId: true,
    },
  });

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return null;
  }

  return membership;
}

export async function PATCH(request: NextRequest, { params }: { params: { memberId: string } }) {
  try {
    const orgId = request.headers.get('x-org-id');
    const actorId = request.headers.get('x-user-id');
    const memberId = params.memberId;

    if (!orgId || !actorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actorMembership = await ensureActorCanManage(orgId, actorId);
    if (!actorMembership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateRoleSchema.parse(body);

    const member = await prisma.orgUser.findFirst({
      where: {
        id: memberId,
        orgId,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, id: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    if (member.role === data.role) {
      return NextResponse.json({ success: true, member });
    }

    const ownerCount = await prisma.orgUser.count({
      where: { orgId, role: 'owner' },
    });

    const isActorOwner = actorMembership.role === 'owner';

    if (member.role === 'owner' && data.role !== 'owner') {
      if (!isActorOwner) {
        return NextResponse.json({ error: 'Only owners can change owner roles' }, { status: 403 });
      }

      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'Organization must have at least one owner' }, { status: 400 });
      }
    }

    if (data.role === 'owner' && !isActorOwner) {
      return NextResponse.json({ error: 'Only owners can promote members to owner' }, { status: 403 });
    }

    const updatedMember = await prisma.orgUser.update({
      where: { id: member.id },
      data: {
        role: data.role,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, id: true },
        },
      },
    });

    prisma.activity
      .create({
        data: {
          type: 'member_role_updated',
          action: `${member.user.firstName} ${member.user.lastName} role changed to ${data.role}`,
          metadata: JSON.stringify({
            memberId: member.user.id,
            newRole: data.role,
            previousRole: member.role,
          }),
          orgId,
          userId: actorId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (role change):', activityError);
      });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error) {
    console.error('Update team member error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { memberId: string } }) {
  try {
    const orgId = request.headers.get('x-org-id');
    const actorId = request.headers.get('x-user-id');
    const memberId = params.memberId;

    if (!orgId || !actorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actorMembership = await ensureActorCanManage(orgId, actorId);
    if (!actorMembership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const member = await prisma.orgUser.findFirst({
      where: {
        id: memberId,
        orgId,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, id: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const ownerCount = await prisma.orgUser.count({
      where: { orgId, role: 'owner' },
    });

    if (member.role === 'owner') {
      if (actorMembership.role !== 'owner') {
        return NextResponse.json({ error: 'Only owners can remove another owner' }, { status: 403 });
      }

      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'Organization must have at least one owner' }, { status: 400 });
      }
    }

    if (member.user.id === actorId) {
      return NextResponse.json({ error: 'You cannot remove yourself from the organization' }, { status: 400 });
    }

    await prisma.orgUser.delete({
      where: { id: member.id },
    });

    prisma.activity
      .create({
        data: {
          type: 'member_removed',
          action: `${member.user.firstName} ${member.user.lastName} was removed from the organization`,
          metadata: JSON.stringify({
            memberId: member.user.id,
            role: member.role,
          }),
          orgId,
          userId: actorId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (member removal):', activityError);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
