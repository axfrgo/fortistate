import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { prisma } from './lib/prisma';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for auth routes and API auth routes
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/upgrade' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // Verify token
  const payload = await verifyToken(token);
  
  if (!payload) {
    // Redirect to login if token is invalid
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
  
  // Check enterprise access for dashboard routes
  if (pathname.startsWith('/dashboard')) {
    try {
      // Get organization and check enterprise access
      const organization = await prisma.organization.findUnique({
        where: { id: payload.orgId },
        select: { 
          hasEnterpriseAccess: true,
          status: true,
          name: true,
        } as any, // Type assertion until Prisma client regenerates
      }) as any; // Type assertion for return value
      
      if (!organization) {
        // Organization not found - redirect to login
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
      
      // Check if organization is suspended
      if (organization.status === 'suspended' || organization.status === 'inactive') {
        return NextResponse.redirect(new URL('/auth/suspended', request.url));
      }
      
      // Check if organization has enterprise access
      if (!organization.hasEnterpriseAccess) {
        return NextResponse.redirect(new URL('/upgrade', request.url));
      }
      
      // Check if user has org_admin role
      if (payload.role !== 'org_admin') {
        return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
      }
    } catch (error) {
      console.error('Error checking enterprise access:', error);
      // On error, allow access but log the issue
      // In production, you might want to redirect to an error page
    }
  }
  
  // Add user info to headers for use in API routes/pages
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-org-id', payload.orgId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
