import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  domain: z.string().nullable().optional(),
  allowPublicUniverses: z.boolean().optional(),
  requireTwoFactor: z.boolean().optional(),
  sessionTimeout: z.number().int().min(1).max(168).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [organization, orgSettings] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
        },
      }),
      prisma.orgSettings.findUnique({
        where: { orgId },
        select: {
          settings: true,
        },
      }),
    ]);

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const parsedSettings = orgSettings?.settings ? JSON.parse(orgSettings.settings) : {};

    return NextResponse.json({
      organization,
      settings: {
        allowPublicUniverses: parsedSettings.allowPublicUniverses ?? false,
        requireTwoFactor: parsedSettings.requireTwoFactor ?? false,
        sessionTimeout: parsedSettings.sessionTimeout ?? 24,
      },
    });
  } catch (error) {
    console.error('Settings GET error', error);
    return NextResponse.json(
      {
        error: 'Failed to load settings.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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

    if (membership?.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can update organization settings' }, { status: 403 });
    }

    const payload = updateSettingsSchema.parse(await request.json());

    if (payload.name !== undefined || payload.domain !== undefined) {
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          ...(payload.name && { name: payload.name }),
          ...(payload.domain !== undefined && { domain: payload.domain }),
        },
      });
    }

    const settingsPayload: Record<string, unknown> = {};
    if (payload.allowPublicUniverses !== undefined) {
      settingsPayload.allowPublicUniverses = payload.allowPublicUniverses;
    }
    if (payload.requireTwoFactor !== undefined) {
      settingsPayload.requireTwoFactor = payload.requireTwoFactor;
    }
    if (payload.sessionTimeout !== undefined) {
      settingsPayload.sessionTimeout = payload.sessionTimeout;
    }

    if (Object.keys(settingsPayload).length > 0) {
      const existing = await prisma.orgSettings.findUnique({
        where: { orgId },
      });

      const existingSettings = existing?.settings ? JSON.parse(existing.settings) : {};
      const mergedSettings = { ...existingSettings, ...settingsPayload };

      await prisma.orgSettings.upsert({
        where: { orgId },
        create: {
          orgId,
          settings: JSON.stringify(mergedSettings),
        },
        update: {
          settings: JSON.stringify(mergedSettings),
        },
      });
    }

    await prisma.activity.create({
      data: {
        type: 'settings_updated',
        action: 'Updated organization settings',
        metadata: JSON.stringify(payload),
        orgId,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings PUT error', error);
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json(
      {
        error: error instanceof z.ZodError ? 'Invalid settings payload' : 'Failed to update settings.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status },
    );
  }
}
