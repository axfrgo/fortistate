/**
 * @fortistate/auth
 * 
 * Shared authentication utilities for the Fortistate platform.
 * Provides JWT token management, role-based access control, and
 * authentication middleware for all three applications:
 * - Super Admin (platform-level control)
 * - User Admin (organization-level management)
 * - Visual Studio (user-facing IDE)
 */

export * from './types.js';
export * from './tokens.js';
export * from './roles.js';
export * from './middleware.js';
export * from './validation.js';
