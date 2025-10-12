/**
 * Type definitions for Fortistate authentication system
 */

/**
 * Role hierarchy (highest to lowest privilege)
 */
export type Role = 'platform_admin' | 'org_admin' | 'org_member' | 'vs_user';

/**
 * Application source identifiers
 */
export type AppSource = 'super_admin' | 'user_admin' | 'visual_studio';

/**
 * Token payload structure
 */
export interface TokenPayload {
  /** User/admin ID */
  sub: string;
  
  /** Role in the system */
  role: Role;
  
  /** Organization ID (null for platform admins) */
  org_id?: string | null;
  
  /** Specific permissions array */
  permissions: string[];
  
  /** Token issued at (Unix timestamp) */
  iat: number;
  
  /** Token expires at (Unix timestamp) */
  exp: number;
  
  /** Token issuer (which app issued this) */
  iss: AppSource;
  
  /** Subject metadata (email, name, etc.) */
  metadata?: Record<string, any>;
}

/**
 * Platform Admin Token (Super Admin)
 * - Full platform control
 * - Can impersonate any organization
 * - Access to all system data
 */
export interface PlatformAdminToken extends TokenPayload {
  role: 'platform_admin';
  org_id: null;
  permissions: ['*']; // Wildcard = all permissions
}

/**
 * Organization Admin Token (User Admin)
 * - Organization-scoped control
 * - Manage team members
 * - Control Visual Studio access
 */
export interface OrgAdminToken extends TokenPayload {
  role: 'org_admin';
  org_id: string; // Required
  permissions: [
    'manage_users',
    'view_analytics',
    'manage_billing',
    'grant_vs_access',
    'revoke_vs_access',
    'view_audit_log'
  ];
}

/**
 * Organization Member Token (User Admin)
 * - Limited organization access
 * - Can view team, own profile
 */
export interface OrgMemberToken extends TokenPayload {
  role: 'org_member';
  org_id: string;
  permissions: ['view_team', 'view_own_profile'];
}

/**
 * Visual Studio User Token
 * - Access to Visual Studio IDE
 * - Scoped to specific organization
 * - Role determines IDE permissions (viewer/editor/admin)
 */
export interface VSUserToken extends TokenPayload {
  role: 'vs_user';
  org_id: string; // Required
  permissions: string[]; // e.g., ['view_projects', 'edit_projects', 'execute', 'collaborate']
  metadata?: {
    vs_role: 'viewer' | 'editor' | 'admin';
    issued_by: string; // Org admin who granted access
  };
}

/**
 * Authentication context (decoded and validated token)
 */
export interface AuthContext {
  token: string;
  payload: TokenPayload;
  isValid: boolean;
  expiresIn: number; // milliseconds until expiration
}

/**
 * Token generation options
 */
export interface TokenOptions {
  expiresIn?: string | number; // e.g., '24h', '7d', or milliseconds
  issuer?: AppSource;
  metadata?: Record<string, any>;
}

/**
 * Role hierarchy map (for permission checking)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  platform_admin: 4,
  org_admin: 3,
  org_member: 2,
  vs_user: 1,
};

/**
 * Permission sets by role
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  platform_admin: ['*'],
  org_admin: [
    'manage_users',
    'view_analytics',
    'manage_billing',
    'grant_vs_access',
    'revoke_vs_access',
    'view_audit_log',
    'manage_settings',
  ],
  org_member: ['view_team', 'view_own_profile'],
  vs_user: ['view_projects', 'edit_projects'], // Base permissions, can be extended
};

/**
 * JWT signing secret configuration
 */
export interface JWTConfig {
  /** Secret key for signing tokens */
  secret: string;
  
  /** Algorithm (default: HS256) */
  algorithm?: 'HS256' | 'HS384' | 'HS512';
  
  /** Default token expiration */
  defaultExpiration?: string; // e.g., '24h'
}

/**
 * Validation error types
 */
export type ValidationError =
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'INVALID_ROLE'
  | 'MISSING_ORG_ID'
  | 'TOKEN_REVOKED';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
  context?: AuthContext;
}
