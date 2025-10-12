import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const supportSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id');
    const userId = request.headers.get('x-user-id');

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = supportSchema.parse(await request.json());

    // In production, this would send to a ticketing system or email service
    // For now, log to the activity stream and return success
    await prisma.activity.create({
      data: {
        type: 'support_ticket_submitted',
        action: `Support ticket: ${payload.subject}`,
        metadata: JSON.stringify({
          subject: payload.subject,
          message: payload.message,
        }),
        orgId,
        userId,
      },
    });

    // In production, you would also:
    // - Send an email to support@fortistate.dev
    // - Create a ticket in your support system (Zendesk, Intercom, etc.)
    // - Send a confirmation email to the user

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support endpoint error', error);
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json(
      {
        error: error instanceof z.ZodError ? 'Invalid support request' : 'Failed to submit ticket.',
        details: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status },
    );
  }
}
