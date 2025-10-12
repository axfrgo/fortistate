import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Universe, UniverseMetrics } from '@prisma/client';
import { buildConnectionString, parseConfig, serializeConfig } from '../utils';

type Role = 'owner' | 'admin' | 'member';
type UniverseWithMetrics = Universe & { metrics: UniverseMetrics | null };

const updateUniverseSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(100, 'Name must be 100 characters or fewer')
      .optional(),
    description: z.string().max(500, 'Description must be 500 characters or fewer').nullable().optional(),
    config: z.unknown().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided to update the universe',
  });

async function getMembership(orgId: string, userId: string) {
  return prisma.orgUser.findUnique({
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
}

function formatUniverse(orgId: string, universe: UniverseWithMetrics | null) {
  if (!universe) {
    return null;
  }

  return {
    id: universe.id,
    name: universe.name,
    description: universe.description,
    isActive: universe.isActive,
    createdAt: universe.createdAt,
    updatedAt: universe.updatedAt,
    config: parseConfig(universe.config),
    connectionString: buildConnectionString(orgId, universe.id),
    metrics: universe.metrics
      ? {
          apiCalls: universe.metrics.apiCalls,
          stateOps: universe.metrics.stateOps,
          errors: universe.metrics.errors,
          lastActivity: universe.metrics.lastActivity,
        }
      : {
          apiCalls: 0,
          stateOps: 0,
          errors: 0,
          lastActivity: universe.updatedAt,
        },
  };
}

function requireManager(role: string | null | undefined) {
  return role === 'owner' || role === 'admin';
}

export async function GET(request: NextRequest, { params }: { params: { universeId: string } }) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');
    const { universeId } = params;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [membership, universe] = await Promise.all([
      getMembership(orgId, userId),
      prisma.universe.findFirst({
        where: {
          id: universeId,
          orgId,
        },
        include: {
          metrics: true,
        },
      }),
    ]);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    return NextResponse.json({
      currentUserRole: (membership?.role ?? 'member') as Role,
      universe: formatUniverse(orgId, universe),
    });
  } catch (error) {
    console.error('Universe detail fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { universeId: string } }) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');
    const { universeId } = params;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await getMembership(orgId, userId);
  if (!requireManager(membership?.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateUniverseSchema.parse(body);

    const universe = await prisma.universe.findFirst({
      where: {
        id: universeId,
        orgId,
      },
      include: {
        metrics: true,
      },
    });

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    if (data.name) {
      const duplicate = await prisma.universe.findFirst({
        where: {
          orgId,
          name: data.name.trim(),
          NOT: { id: universeId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Another universe with this name already exists' },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.name) {
      updateData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      const trimmed = data.description?.trim();
      updateData.description = trimmed && trimmed.length ? trimmed : null;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.config !== undefined) {
      try {
        updateData.config = serializeConfig(data.config);
      } catch (configError) {
        const message = configError instanceof Error ? configError.message : 'Invalid configuration payload';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const updatedUniverse = await prisma.universe.update({
      where: { id: universe.id },
      data: updateData,
      include: {
        metrics: true,
      },
    });

    prisma.activity
      .create({
        data: {
          type: 'universe_updated',
          action: `${universe.name} universe updated`,
          metadata: JSON.stringify({
            universeId,
            changes: Object.keys(updateData),
          }),
          orgId,
          userId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (universe updated):', activityError);
      });

    return NextResponse.json({
      success: true,
      universe: formatUniverse(orgId, updatedUniverse),
    });
  } catch (error) {
    console.error('Universe update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { universeId: string } }) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');
    const { universeId } = params;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await getMembership(orgId, userId);
  if (!requireManager(membership?.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const universe = await prisma.universe.findFirst({
      where: {
        id: universeId,
        orgId,
      },
    });

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    await prisma.universe.delete({
      where: { id: universe.id },
    });

    prisma.activity
      .create({
        data: {
          type: 'universe_deleted',
          action: `${universe.name} universe deleted`,
          metadata: JSON.stringify({
            universeId,
          }),
          orgId,
          userId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (universe deleted):', activityError);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Universe delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
