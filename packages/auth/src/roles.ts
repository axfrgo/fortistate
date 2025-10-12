/**
 * Role-based access control utilities
 */

import type { Role, TokenPayload, ROLE_HIERARCHY } from './types';

/**
 * Role hierarchy values (higher number = more privilege)
 */
const roleHierarchy: Record<Role, number> = {
  platform_admin: 4,
  org_admin: 3,
  org_member: 2,
  vs_user: 1,
};

/**
 * Check if a role has sufficient privilege level
 * @param userRole The role to check
 * @param requiredRole The minimum required role
 * @returns true if userRole >= requiredRole in hierarchy
 */
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user has a specific permission
 * @param permissions User's permission array
 * @param required Required permission
 * @returns true if user has permission or wildcard (*)
 */
export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes('*') || permissions.includes(required);
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(permissions: string[], required: string[]): boolean {
  if (permissions.includes('*')) return true;
  return required.every(perm => permissions.includes(perm));
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(permissions: string[], required: string[]): boolean {
  if (permissions.includes('*')) return true;
  return required.some(perm => permissions.includes(perm));
}

/**
 * Check if token belongs to platform admin
 */
export function isPlatformAdmin(payload: TokenPayload): boolean {
  return payload.role === 'platform_admin';
}

/**
 * Check if token belongs to org admin
 */
export function isOrgAdmin(payload: TokenPayload): boolean {
  return payload.role === 'org_admin';
}

/**
 * Check if token belongs to org member
 */
export function isOrgMember(payload: TokenPayload): boolean {
  return payload.role === 'org_member';
}

/**
 * Check if token belongs to VS user
 */
export function isVSUser(payload: TokenPayload): boolean {
  return payload.role === 'vs_user';
}

/**
 * Check if token has access to specific organization
 * - Platform admins have access to all orgs
 * - Others must have matching org_id
 */
export function hasOrgAccess(payload: TokenPayload, orgId: string): boolean {
  if (isPlatformAdmin(payload)) return true;
  return payload.org_id === orgId;
}

/**
 * Check if user can perform action on resource
 */
export interface AccessCheckOptions {
  requiredRole?: Role;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAnyPermission?: string[];
  orgId?: string;
}

export function canAccess(
  payload: TokenPayload,
  options: AccessCheckOptions
): { allowed: boolean; reason?: string } {
  // Check role level
  if (options.requiredRole && !hasRoleLevel(payload.role, options.requiredRole)) {
    return {
      allowed: false,
      reason: `Insufficient role: requires ${options.requiredRole}, has ${payload.role}`,
    };
  }

  // Check single permission
  if (options.requiredPermission && !hasPermission(payload.permissions, options.requiredPermission)) {
    return {
      allowed: false,
      reason: `Missing permission: ${options.requiredPermission}`,
    };
  }

  // Check all permissions
  if (options.requiredPermissions && !hasAllPermissions(payload.permissions, options.requiredPermissions)) {
    return {
      allowed: false,
      reason: `Missing one or more permissions: ${options.requiredPermissions.join(', ')}`,
    };
  }

  // Check any permission
  if (options.requireAnyPermission && !hasAnyPermission(payload.permissions, options.requireAnyPermission)) {
    return {
      allowed: false,
      reason: `Missing all of: ${options.requireAnyPermission.join(', ')}`,
    };
  }

  // Check org access
  if (options.orgId && !hasOrgAccess(payload, options.orgId)) {
    return {
      allowed: false,
      reason: `No access to organization: ${options.orgId}`,
    };
  }

  return { allowed: true };
}

/**
 * Get user's effective permissions for an organization
 */
export function getEffectivePermissions(payload: TokenPayload, orgId?: string): string[] {
  // Platform admins have all permissions
  if (isPlatformAdmin(payload)) {
    return ['*'];
  }

  // Check org access if orgId provided
  if (orgId && !hasOrgAccess(payload, orgId)) {
    return [];
  }

  return payload.permissions;
}

/**
 * Check if user can impersonate (only platform admins)
 */
export function canImpersonate(payload: TokenPayload): boolean {
  return isPlatformAdmin(payload);
}
