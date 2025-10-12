import { NextRequest, NextResponse } from 'next/server';
import { createSession, verifySecretKey, isIpAllowed } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secretKey } = body;

    // Get client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || '127.0.0.1';
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Check IP whitelist
    if (!isIpAllowed(ipAddress)) {
      return NextResponse.json(
        { error: 'Access denied. IP not whitelisted.' },
        { status: 403 }
      );
    }

    // Verify secret key
    if (!verifySecretKey(secretKey)) {
      // Log failed attempt
      console.warn(`Failed login attempt from IP: ${ipAddress}`);
      
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }

    // Create admin session (using a default admin ID for now)
    const adminId = 'super-admin';
    const email = 'admin@fortistate.io';

    // Create JWT session token
    const sessionToken = await createSession({
      adminId,
      email,
      ipAddress,
      mfaVerified: false, // TODO: Implement MFA
    });

    // Session expiry
    const expiresAt = new Date(Date.now() + parseInt(process.env.SESSION_EXPIRY || '28800') * 1000);
    
    // TODO: Store session in database when PostgreSQL is connected
    // await prisma.adminSession.create({
    //   data: {
    //     adminId,
    //     token: sessionToken,
    //     ipAddress,
    //     userAgent,
    //     mfaVerified: false,
    //     expiresAt,
    //   },
    // });

    // TODO: Log successful login when database is connected
    // await logAuditEvent({
    //   adminId,
    //   action: 'admin_login',
    //   targetType: 'system',
    //   description: 'Super admin logged in successfully',
    //   ipAddress,
    //   userAgent,
    //   metadata: {
    //     sessionExpiry: expiresAt.toISOString(),
    //   },
    // });

    console.log(`✅ Super admin logged in successfully from IP: ${ipAddress}`);

    // Set session cookie
    const response = NextResponse.json(
      { 
        success: true,
        message: 'Authentication successful',
        expiresAt: expiresAt.toISOString(),
      },
      { status: 200 }
    );

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseInt(process.env.SESSION_EXPIRY || '28800'),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
