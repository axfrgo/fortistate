import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production'
);

const SESSION_EXPIRY = parseInt(process.env.SESSION_EXPIRY || '28800'); // 8 hours default

export interface SessionPayload {
  adminId: string;
  email: string;
  ipAddress: string;
  mfaVerified: boolean;
  iat: number;
  exp: number;
}

// Create a new session token
export async function createSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY}s`)
    .sign(JWT_SECRET);
  
  return token;
}

// Verify a session token
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Validate payload has required fields
    if (
      payload &&
      typeof payload === 'object' &&
      'adminId' in payload &&
      'email' in payload &&
      'ipAddress' in payload &&
      'mfaVerified' in payload
    ) {
      return payload as unknown as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

// Verify secret key
export function verifySecretKey(secretKey: string): boolean {
  const expectedSecret = process.env.SUPER_ADMIN_SECRET_KEY;
  
  if (!expectedSecret) {
    throw new Error('SUPER_ADMIN_SECRET_KEY not configured');
  }
  
  // Use constant-time comparison to prevent timing attacks
  if (secretKey.length !== expectedSecret.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < secretKey.length; i++) {
    result |= secretKey.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
  }
  
  return result === 0;
}

// Check if IP is allowed
export function isIpAllowed(ipAddress: string): boolean {
  const allowedIps = process.env.SUPER_ADMIN_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];
  
  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    const localhostIps = ['127.0.0.1', '::1', 'localhost'];
    if (localhostIps.includes(ipAddress)) {
      return true;
    }
  }
  
  return allowedIps.includes(ipAddress);
}

// Log audit event
export async function logAuditEvent(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
}) {
  // TODO: Enable when PostgreSQL is connected
  // const { prisma } = await import('./prisma');
  // 
  // await prisma.auditLog.create({
  //   data: {
  //     adminId: params.adminId,
  //     action: params.action,
  //     targetType: params.targetType,
  //     targetId: params.targetId,
  //     description: params.description,
  //     ipAddress: params.ipAddress,
  //     userAgent: params.userAgent,
  //     metadata: params.metadata,
  //   },
  // });
  
  // For now, just log to console
  console.log('📋 Audit Event:', {
    action: params.action,
    description: params.description,
    adminId: params.adminId,
  });
}
