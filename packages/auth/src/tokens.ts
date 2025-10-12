/**
 * JWT token generation and verification utilities
 */

import jwt from 'jsonwebtoken';
import type {
  TokenPayload,
  TokenOptions,
  AuthContext,
  JWTConfig,
  AppSource,
  Role,
  ROLE_PERMISSIONS,
} from './types';

/**
 * Default JWT configuration
 */
const DEFAULT_CONFIG: Required<JWTConfig> = {
  secret: process.env.FORTISTATE_JWT_SECRET || 'fortistate-dev-secret-change-in-production',
  algorithm: 'HS256',
  defaultExpiration: '24h',
};

let currentConfig: Required<JWTConfig> = { ...DEFAULT_CONFIG };

/**
 * Configure JWT settings (call once at app startup)
 */
export function configureJWT(config: Partial<JWTConfig>): void {
  currentConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };
}

/**
 * Get current JWT configuration
 */
export function getJWTConfig(): Readonly<Required<JWTConfig>> {
  return currentConfig;
}

/**
 * Parse expiration string to seconds
 */
function parseExpiration(exp: string | number): number {
  if (typeof exp === 'number') return exp;

  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiration format: ${exp}`);

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return num * multipliers[unit];
}

/**
 * Generate a JWT token
 */
export function generateToken(
  userId: string,
  role: Role,
  orgId: string | null,
  permissions: string[],
  options: TokenOptions = {}
): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || currentConfig.defaultExpiration;
  const expirationSeconds = typeof expiresIn === 'string' 
    ? parseExpiration(expiresIn) 
    : expiresIn;

  const payload: TokenPayload = {
    sub: userId,
    role,
    org_id: orgId,
    permissions,
    iat: now,
    exp: now + expirationSeconds,
    iss: options.issuer || 'user_admin',
    metadata: options.metadata,
  };

  return jwt.sign(payload, currentConfig.secret, {
    algorithm: currentConfig.algorithm,
  });
}

/**
 * Generate platform admin token (Super Admin)
 */
export function generatePlatformAdminToken(
  adminId: string,
  options: TokenOptions = {}
): string {
  return generateToken(
    adminId,
    'platform_admin',
    null,
    ['*'],
    {
      ...options,
      issuer: 'super_admin',
    }
  );
}

/**
 * Generate organization admin token (User Admin)
 */
export function generateOrgAdminToken(
  userId: string,
  orgId: string,
  options: TokenOptions = {}
): string {
  const permissions = [
    'manage_users',
    'view_analytics',
    'manage_billing',
    'grant_vs_access',
    'revoke_vs_access',
    'view_audit_log',
    'manage_settings',
  ];

  return generateToken(userId, 'org_admin', orgId, permissions, {
    ...options,
    issuer: 'user_admin',
  });
}

/**
 * Generate organization member token (User Admin)
 */
export function generateOrgMemberToken(
  userId: string,
  orgId: string,
  options: TokenOptions = {}
): string {
  return generateToken(
    userId,
    'org_member',
    orgId,
    ['view_team', 'view_own_profile'],
    {
      ...options,
      issuer: 'user_admin',
    }
  );
}

/**
 * Generate Visual Studio user token
 */
export function generateVSUserToken(
  userId: string,
  orgId: string,
  vsRole: 'viewer' | 'editor' | 'admin',
  issuedBy: string,
  options: TokenOptions = {}
): string {
  const basePermissions = ['view_projects'];
  
  const rolePermissions: Record<typeof vsRole, string[]> = {
    viewer: [...basePermissions],
    editor: [...basePermissions, 'edit_projects', 'execute'],
    admin: [...basePermissions, 'edit_projects', 'execute', 'collaborate', 'manage_projects'],
  };

  return generateToken(
    userId,
    'vs_user',
    orgId,
    rolePermissions[vsRole],
    {
      ...options,
      issuer: 'user_admin',
      metadata: {
        vs_role: vsRole,
        issued_by: issuedBy,
      },
    }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthContext | null {
  try {
    const payload = jwt.verify(token, currentConfig.secret, {
      algorithms: [currentConfig.algorithm],
    }) as TokenPayload;

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = (payload.exp - now) * 1000; // Convert to milliseconds

    return {
      token,
      payload,
      isValid: true,
      expiresIn,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (use cautiously)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>" or just "<token>"
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * Refresh token (generate new token with same payload but new expiration)
 */
export function refreshToken(oldToken: string, options: TokenOptions = {}): string | null {
  const context = verifyToken(oldToken);
  if (!context) return null;

  const { payload } = context;
  return generateToken(
    payload.sub,
    payload.role,
    payload.org_id || null,
    payload.permissions,
    options
  );
}
