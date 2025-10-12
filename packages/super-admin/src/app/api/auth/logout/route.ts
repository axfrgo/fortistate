import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value;
    
    if (token) {
      // TODO: Delete session from database when PostgreSQL is connected
      // await prisma.adminSession.deleteMany({
      //   where: { token },
      // });

      // Log logout
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                        request.headers.get('x-real-ip') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      
      console.log(`✅ Super admin logged out from IP: ${ipAddress}`);
      
      // TODO: Log audit event when database is connected
      // await logAuditEvent({
      //   adminId: 'super-admin',
      //   action: 'admin_logout',
      //   targetType: 'system',
      //   description: 'Super admin logged out',
      //   ipAddress,
      //   userAgent,
      // });
    }

    // Clear session cookie
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    response.cookies.delete('admin_session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
