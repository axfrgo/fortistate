import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateRandomToken } from '@/lib/auth';
import { addDays } from 'date-fns';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
});

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [members, invitations, currentMembership] = await Promise.all([
      prisma.orgUser.findMany({
        where: { orgId },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.orgInvitation.findMany({
        where: { orgId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.orgUser.findUnique({
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
      }),
    ]);

    const inviterIds = Array.from(new Set(invitations.map((invite) => invite.invitedBy)));
    const inviters = inviterIds.length
      ? await prisma.user.findMany({
          where: { id: { in: inviterIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];

    const inviterMap = new Map(inviters.map((inviter) => [inviter.id, inviter]));

    return NextResponse.json({
      currentUserRole: currentMembership?.role ?? 'member',
      currentUserId: userId,
      members: members.map((member) => ({
        id: member.id,
        role: member.role as 'owner' | 'admin' | 'member',
        joinedAt: member.createdAt,
        user: {
          id: member.user.id,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          email: member.user.email,
        },
      })),
      invitations: invitations.map((invitation) => {
        const inviter = inviterMap.get(invitation.invitedBy);
        return {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role as 'owner' | 'admin' | 'member',
          invitedBy: inviter
            ? {
                id: inviter.id,
                firstName: inviter.firstName,
                lastName: inviter.lastName,
                email: inviter.email,
              }
            : null,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
        };
      }),
    });
  } catch (error) {
    console.error('Team fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMembership = await prisma.orgUser.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!currentMembership || (currentMembership.role !== 'owner' && currentMembership.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = inviteSchema.parse(body);
    const normalizedEmail = data.email.trim().toLowerCase();

    // Ensure email is not already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      const existingMembership = await prisma.orgUser.findUnique({
        where: {
          userId_orgId: {
            userId: existingUser.id,
            orgId,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 400 },
        );
      }
    }

    // Prevent duplicate pending invitations
    const existingInvitation = await prisma.orgInvitation.findFirst({
      where: {
        orgId,
        email: normalizedEmail,
        status: 'pending',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 },
      );
    }

    if (data.role === 'owner' && currentMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can invite new owners' },
        { status: 403 },
      );
    }

    const invitation = await prisma.orgInvitation.create({
      data: {
        email: normalizedEmail,
        role: data.role,
        orgId,
        invitedBy: userId,
        token: generateRandomToken(),
        expiresAt: addDays(new Date(), 7),
        status: 'pending',
      },
    });

    // Activity log (non-blocking)
    prisma.activity
      .create({
        data: {
          type: 'member_invited',
          action: `Invitation sent to ${normalizedEmail} with role ${data.role}`,
          metadata: JSON.stringify({
            email: normalizedEmail,
            role: data.role,
            invitationId: invitation.id,
          }),
          orgId,
          userId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (invite):', activityError);
      });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Team invite error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
