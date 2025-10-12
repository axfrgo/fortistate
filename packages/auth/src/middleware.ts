/**
 * Middleware functions for Express and Next.js
 */

import type { AuthContext, Role, TokenPayload } from './types';
import { extractTokenFromHeader, verifyToken } from './tokens';
import { validateToken, getValidationErrorMessage } from './validation';
import { canAccess, type AccessCheckOptions } from './roles';

/**
 * Generic request interface (works with Express, Next.js, etc.)
 */
export interface AuthenticatedRequest {
  headers: {
    authorization?: string;
    [key: string]: string | undefined;
  };
  method?: string;
  url?: string;
  auth?: AuthContext;
  user?: TokenPayload;
}

/**
 * Authentication result for middleware
 */
export interface AuthResult {
  success: boolean;
  auth?: AuthContext;
  user?: TokenPayload;
  error?: {
    status: number;
    message: string;
  };
}

/**
 * Authenticate a request from headers
 */
export function authenticateFromHeaders(
  headers: Record<string, string | undefined>,
  options: {
    required?: boolean;
    requiredRole?: Role;
    requiredPermission?: string;
    orgId?: string;
  } = {}
): AuthResult {
  const authHeader = headers.authorization || headers.Authorization;
  const token = extractTokenFromHeader(authHeader);

  const validation = validateToken(token, {
    requiredRole: options.requiredRole,
    requiredPermission: options.requiredPermission,
    orgId: options.orgId,
  });

  if (!validation.valid) {
    if (options.required !== false) {
      return {
        success: false,
        error: {
          status: 401,
          message: validation.error ? getValidationErrorMessage(validation.error) : 'Authentication required',
        },
      };
    }
  }

  return {
    success: true,
    auth: validation.context,
    user: validation.context?.payload,
  };
}

/**
 * Next.js API route auth helper
 */
export interface NextAuthOptions {
  required?: boolean;
  requiredRole?: Role;
  requiredPermission?: string;
  orgId?: string;
}

/**
 * Higher-order function for Next.js API routes
 * 
 * Usage:
 * export const GET = withAuth(async (req, { auth, user }) => {
 *   // Your handler code
 *   return Response.json({ data: '...' });
 * }, { required: true, requiredRole: 'org_admin' });
 */
export function withAuth(
  handler: (req: any, context: { auth?: AuthContext; user?: TokenPayload }) => Promise<Response>,
  options: NextAuthOptions = {}
) {
  return async (req: any) => {
    const authHeader = req.headers.get?.('authorization') || req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    const validation = validateToken(token, {
      requiredRole: options.requiredRole,
      requiredPermission: options.requiredPermission,
      orgId: options.orgId,
    });

    if (!validation.valid && options.required !== false) {
      return Response.json(
        {
          error: 'Unauthorized',
          message: validation.error ? getValidationErrorMessage(validation.error) : 'Authentication required',
        },
        { status: 401 }
      );
    }

    return handler(req, {
      auth: validation.context,
      user: validation.context?.payload,
    });
  };
}

/**
 * Check authorization for current user
 */
export function authorize(
  user: TokenPayload | undefined,
  options: AccessCheckOptions
): { authorized: boolean; reason?: string } {
  if (!user) {
    return { authorized: false, reason: 'Not authenticated' };
  }

  const result = canAccess(user, options);
  return {
    authorized: result.allowed,
    reason: result.reason,
  };
}

/**
 * CORS headers for cross-app communication
 */
export function getCorsHeaders(origin: string | undefined, options: {
  allowedOrigins?: string[];
  allowedMethods?: string[];
} = {}): Record<string, string> {
  const defaultOrigins = [
    'http://localhost:4200', // Super Admin
    'http://localhost:4300', // User Admin
    'http://localhost:5173', // Visual Studio
  ];

  const allowedOrigins = options.allowedOrigins || defaultOrigins;
  const allowedMethods = options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': allowedMethods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-fortistate-token',
    };
  }

  return {};
}

/**
 * Rate limiting by user ID
 */
interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export function checkRateLimit(
  userId: string,
  options: {
    maxRequests?: number;
    windowMs?: number;
  } = {}
): RateLimitResult {
  const maxRequests = options.maxRequests || 100;
  const windowMs = options.windowMs || 60000; // 1 minute
  const now = Date.now();

  if (!rateLimitStore[userId] || rateLimitStore[userId].resetAt < now) {
    rateLimitStore[userId] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return { allowed: true };
  }

  rateLimitStore[userId].count++;

  if (rateLimitStore[userId].count > maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((rateLimitStore[userId].resetAt - now) / 1000),
    };
  }

  return { allowed: true };
}
