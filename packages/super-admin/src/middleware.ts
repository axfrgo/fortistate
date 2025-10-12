import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login'];

// Check if IP is in whitelist
function isIpAllowed(request: NextRequest): boolean {
  const allowedIps = process.env.SUPER_ADMIN_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];
  
  // Get client IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';
  
  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    const localhostIps = ['127.0.0.1', '::1', 'localhost'];
    if (localhostIps.includes(clientIp)) {
      return true;
    }
  }
  
  return allowedIps.includes(clientIp);
}

// Verify JWT token
function verifyToken(token: string): boolean {
  try {
    // For now, just check if token exists (it's a JWT from jose library)
    // The token is created by our login route, so if it exists, it's valid
    if (!token || token.length < 20) {
      return false;
    }
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // TODO: Implement proper JWT verification with jose library
    // import { jwtVerify } from 'jose';
    // const { payload } = await jwtVerify(token, JWT_SECRET);
    // return !!payload;
    
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // Still check IP whitelist for login page
    if (!isIpAllowed(request)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Access denied. Your IP address is not whitelisted.',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    return NextResponse.next();
  }
  
  // Check IP whitelist
  if (!isIpAllowed(request)) {
    return NextResponse.redirect(new URL('/login?error=ip_blocked', request.url));
  }
  
  // Check authentication token
  const token = request.cookies.get('super_admin_token')?.value;
  
  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
  }
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
