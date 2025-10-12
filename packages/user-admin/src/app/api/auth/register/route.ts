import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, createSlug } from '@/lib/auth';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create organization slug
    const baseSlug = createSlug(validatedData.organizationName);

    // Ensure slug uniqueness
    let finalSlug = baseSlug;
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: finalSlug },
    });

    if (existingOrg) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Create user, organization, and orgUser in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
        },
      });
      
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          slug: finalSlug,
          plan: 'free',
        },
      });
      
      // Create orgUser relationship with owner role
      await tx.orgUser.create({
        data: {
          userId: user.id,
          orgId: organization.id,
          role: 'owner',
        },
      });
      
      return { user, organization };
    });

    // Log organization creation activity (non-blocking)
    try {
      await prisma.activity.create({
        data: {
          type: 'organization_created',
          action: `${result.user.firstName} ${result.user.lastName} created the organization "${result.organization.name}"`,
          metadata: JSON.stringify({
            organizationId: result.organization.id,
            createdBy: result.user.id,
            organizationSlug: result.organization.slug,
          }),
          orgId: result.organization.id,
          userId: result.user.id,
        },
      });
    } catch (activityError) {
      console.error('Activity log error (registration):', activityError);
    }
    
    // Generate JWT token
    const token = await generateToken({
      userId: result.user.id,
      orgId: result.organization.id,
      role: 'owner',
      email: result.user.email,
    });
    
    // Set cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        },
      },
      { status: 201 }
    );
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Registration error:', error);
    
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
