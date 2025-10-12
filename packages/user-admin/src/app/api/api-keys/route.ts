import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { addDays } from 'date-fns';
import { buildApiKey, hashApiKey, parsePermissions, serializePermissions, validatePermissions } from './utils';

type Role = 'owner' | 'admin' | 'member';

const createSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be 100 characters or fewer')
    .transform((value) => value.trim()),
  permissions: z
    .array(z.enum(['read', 'write', 'admin']))
    .nonempty('At least one permission is required')
    .default(['read']),
  expiresInDays: z.number().int().min(1).max(365).optional(),
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

function canManageApiKeys(role: Role | undefined) {
  return role === 'owner' || role === 'admin';
}

function formatKey(key: {
  id: string;
  name: string;
  prefix: string;
  permissions: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  isActive: boolean;
}) {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    permissions: parsePermissions(key.permissions),
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    lastUsedAt: key.lastUsedAt,
    isActive: key.isActive,
  };
}

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [membership, keys] = await Promise.all([
      getMembership(orgId, userId),
      prisma.apiKey.findMany({
        where: {
          orgId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          prefix: true,
          permissions: true,
          createdAt: true,
          expiresAt: true,
          lastUsedAt: true,
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      currentUserRole: (membership?.role ?? 'member') as Role,
      canManage: canManageApiKeys(membership?.role as Role),
      keys: keys.map(formatKey),
    });
  } catch (error) {
    console.error('API key list error:', error);
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

    const membership = await getMembership(orgId, userId);

    if (!canManageApiKeys(membership?.role as Role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const payload = createSchema.parse(body);

    const permissions = validatePermissions(payload.permissions);

    const { token, prefix } = buildApiKey();
    const hashed = hashApiKey(token);

    const now = new Date();
    const expiresAt = payload.expiresInDays ? addDays(now, payload.expiresInDays) : null;

    const apiKey = await prisma.apiKey.create({
      data: {
        name: payload.name,
        orgId,
        userId,
        prefix,
        key: hashed,
        permissions: serializePermissions(permissions),
        expiresAt,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
        isActive: true,
      },
    });

    prisma.activity
      .create({
        data: {
          type: 'api_key_created',
          action: `${payload.name} API key generated`,
          metadata: JSON.stringify({
            apiKeyId: apiKey.id,
            prefix,
            permissions,
            expiresAt,
          }),
          orgId,
          userId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (api key create):', activityError);
      });

    return NextResponse.json(
      {
        success: true,
        apiKey: formatKey(apiKey),
        plainTextKey: token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('API key create error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
