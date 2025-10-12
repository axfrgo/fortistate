import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        organizations: {
          include: {
            organization: true,
          },
          orderBy: {
            createdAt: 'asc', // Get the first organization they joined
          },
          take: 1,
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(
      validatedData.password,
      user.password
    );
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check if user has any organizations
    if (user.organizations.length === 0) {
      return NextResponse.json(
        { error: 'User has no associated organizations' },
        { status: 400 }
      );
    }
    
    const orgUser = user.organizations[0];
    const organization = orgUser.organization;
    
    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      orgId: organization.id,
      role: orgUser.role,
      email: user.email,
    });
    
    // Set cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        role: orgUser.role,
      },
      { status: 200 }
    );
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    try {
      await prisma.activity.create({
        data: {
          type: 'user_logged_in',
          action: `${user.firstName} ${user.lastName} logged in`,
          metadata: JSON.stringify({
            userId: user.id,
            organizationId: organization.id,
            role: orgUser.role,
          }),
          orgId: organization.id,
          userId: user.id,
        },
      });
    } catch (activityError) {
      console.error('Activity log error (login):', activityError);
    }
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
