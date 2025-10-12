import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { parsePermissions, serializePermissions, validatePermissions } from '../utils';

type Role = 'owner' | 'admin' | 'member';

const updateSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(100, 'Name must be 100 characters or fewer')
      .transform((value) => value.trim())
      .optional(),
    permissions: z.array(z.enum(['read', 'write', 'admin'])).optional(),
    isActive: z.boolean().optional(),
    revoke: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided to update the API key',
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

export async function PATCH(request: NextRequest, { params }: { params: { apiKeyId: string } }) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');
    const { apiKeyId } = params;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await getMembership(orgId, userId);
    if (!canManageApiKeys(membership?.role as Role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const payload = updateSchema.parse(body);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        orgId,
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

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (payload.name && payload.name !== apiKey.name) {
      updateData.name = payload.name;
    }

    if (payload.permissions) {
      const permissions = validatePermissions(payload.permissions);
      updateData.permissions = serializePermissions(permissions);
    }

    if (payload.isActive !== undefined) {
      updateData.isActive = payload.isActive;
    }

    if (payload.revoke) {
      updateData.isActive = false;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, apiKey: formatKey(apiKey) });
    }

    const updated = await prisma.apiKey.update({
      where: {
        id: apiKeyId,
      },
      data: updateData,
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

    const changes = Object.keys(updateData);

    prisma.activity
      .create({
        data: {
          type: 'api_key_updated',
          action: `${apiKey.name} API key updated`,
          metadata: JSON.stringify({ apiKeyId, changes }),
          orgId,
          userId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (api key update):', activityError);
      });

    return NextResponse.json({ success: true, apiKey: formatKey(updated) });
  } catch (error) {
    console.error('API key update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { apiKeyId: string } }) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');
    const { apiKeyId } = params;

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await getMembership(orgId, userId);
    if (!canManageApiKeys(membership?.role as Role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        orgId,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await prisma.apiKey.delete({
      where: {
        id: apiKeyId,
      },
    });

    prisma.activity
      .create({
        data: {
          type: 'api_key_deleted',
          action: `${apiKey.name} API key revoked`,
          metadata: JSON.stringify({ apiKeyId, prefix: apiKey.prefix }),
          orgId,
          userId,
        },
      })
      .catch((activityError) => {
        console.error('Activity log error (api key delete):', activityError);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API key delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
