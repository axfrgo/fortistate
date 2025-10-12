import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { buildConnectionString, parseConfig, serializeConfig } from './utils';

const createUniverseSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be 100 characters or fewer')
    .transform((value) => value.trim()),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer')
    .optional()
    .transform((value) => (value ? value.trim() : value)),
  config: z.unknown().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [membership, universes] = await Promise.all([
      prisma.orgUser.findUnique({
        where: {
          userId_orgId: {
            userId,
            orgId,
          },
        },
        select: { role: true },
      }),
      prisma.universe.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        include: {
          metrics: true,
        },
      }),
    ]);

    const formatted = universes.map((universe) => ({
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
    }));

    const summary = formatted.reduce(
      (acc, universe) => {
        acc.total += 1;
        if (universe.isActive) {
          acc.active += 1;
        } else {
          acc.inactive += 1;
        }

        acc.apiCalls += universe.metrics.apiCalls;
        acc.stateOps += universe.metrics.stateOps;
        acc.errors += universe.metrics.errors;

        if (!acc.latestActivity || new Date(universe.metrics.lastActivity) > acc.latestActivity) {
          acc.latestActivity = new Date(universe.metrics.lastActivity);
        }

        return acc;
      },
      {
        total: 0,
        active: 0,
        inactive: 0,
        apiCalls: 0,
        stateOps: 0,
        errors: 0,
        latestActivity: null as Date | null,
      },
    );

    return NextResponse.json({
      currentUserRole: (membership?.role ?? 'member') as 'owner' | 'admin' | 'member',
      universes: formatted,
      summary,
    });
  } catch (error) {
    console.error('Universes fetch error:', error);
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

    const membership = await prisma.orgUser.findUnique({
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

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = createUniverseSchema.parse(body);

    const name = data.name;
    const description = data.description && data.description.length ? data.description : null;

    const existingUniverse = await prisma.universe.findFirst({
      where: {
        orgId,
        name: {
          equals: name,
        },
      },
    });

    if (existingUniverse) {
      return NextResponse.json(
        { error: 'A universe with this name already exists in your organization' },
        { status: 400 },
      );
    }

    let configString = '{}';
    try {
      configString = serializeConfig(data.config);
    } catch (configError) {
      const message = configError instanceof Error ? configError.message : 'Invalid configuration payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const universe = await prisma.universe.create({
      data: {
        name,
        description,
        orgId,
        config: configString,
        isActive: true,
        metrics: {
          create: {},
        },
      },
      include: {
        metrics: true,
      },
    });

    prisma.activity
      .create({
        data: {
          type: 'universe_created',
          action: `${universe.name} universe created`,
          metadata: JSON.stringify({
            universeId: universe.id,
            name: universe.name,
            description: universe.description,
          }),
          orgId,
          userId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (universe created):', activityError);
      });

    return NextResponse.json(
      {
        success: true,
        universe: {
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
                lastActivity: universe.createdAt,
              },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Universe create error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
