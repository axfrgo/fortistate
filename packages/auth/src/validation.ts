/**
 * Token validation utilities
 */

import type { ValidationResult, ValidationError, TokenPayload, Role } from './types';
import { verifyToken, isTokenExpired } from './tokens';
import { hasRoleLevel, hasPermission, hasOrgAccess } from './roles';

/**
 * Revoked tokens store (in-memory, replace with Redis in production)
 */
const revokedTokens = new Set<string>();

/**
 * Add token to revocation list
 */
export function revokeToken(token: string): void {
  revokedTokens.add(token);
}

/**
 * Check if token is revoked
 */
export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

/**
 * Clear revoked tokens (cleanup)
 */
export function clearRevokedTokens(): void {
  revokedTokens.clear();
}

/**
 * Validate token with comprehensive checks
 */
export function validateToken(
  token: string | null | undefined,
  options: {
    requiredRole?: Role;
    requiredPermission?: string;
    orgId?: string;
  } = {}
): ValidationResult {
  // Check if token exists
  if (!token) {
    return {
      valid: false,
      error: 'INVALID_TOKEN',
    };
  }

  // Check if token is revoked
  if (isTokenRevoked(token)) {
    return {
      valid: false,
      error: 'TOKEN_REVOKED',
    };
  }

  // Check if token is expired (quick check before verification)
  if (isTokenExpired(token)) {
    return {
      valid: false,
      error: 'EXPIRED_TOKEN',
    };
  }

  // Verify token signature and decode
  const context = verifyToken(token);
  if (!context) {
    return {
      valid: false,
      error: 'INVALID_TOKEN',
    };
  }

  const { payload } = context;

  // Check required role
  if (options.requiredRole && !hasRoleLevel(payload.role, options.requiredRole)) {
    return {
      valid: false,
      error: 'INVALID_ROLE',
      context,
    };
  }

  // Check required permission
  if (options.requiredPermission && !hasPermission(payload.permissions, options.requiredPermission)) {
    return {
      valid: false,
      error: 'INSUFFICIENT_PERMISSIONS',
      context,
    };
  }

  // Check org access
  if (options.orgId && !hasOrgAccess(payload, options.orgId)) {
    return {
      valid: false,
      error: 'MISSING_ORG_ID',
      context,
    };
  }

  return {
    valid: true,
    context,
  };
}

/**
 * Quick validation (just checks signature and expiration)
 */
export function quickValidate(token: string | null | undefined): boolean {
  if (!token) return false;
  if (isTokenRevoked(token)) return false;
  if (isTokenExpired(token)) return false;
  
  const context = verifyToken(token);
  return context !== null;
}

/**
 * Validate platform admin token
 */
export function validatePlatformAdmin(token: string | null | undefined): ValidationResult {
  return validateToken(token, { requiredRole: 'platform_admin' });
}

/**
 * Validate org admin token for specific org
 */
export function validateOrgAdmin(
  token: string | null | undefined,
  orgId: string
): ValidationResult {
  return validateToken(token, {
    requiredRole: 'org_admin',
    orgId,
  });
}

/**
 * Validate VS user token
 */
export function validateVSUser(
  token: string | null | undefined,
  orgId?: string
): ValidationResult {
  return validateToken(token, {
    requiredRole: 'vs_user',
    orgId,
  });
}

/**
 * Get validation error message
 */
export function getValidationErrorMessage(error: ValidationError): string {
  const messages: Record<ValidationError, string> = {
    INVALID_TOKEN: 'Invalid or malformed token',
    EXPIRED_TOKEN: 'Token has expired',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this action',
    INVALID_ROLE: 'Invalid role for this action',
    MISSING_ORG_ID: 'No access to this organization',
    TOKEN_REVOKED: 'Token has been revoked',
  };

  return messages[error] || 'Authentication failed';
}
