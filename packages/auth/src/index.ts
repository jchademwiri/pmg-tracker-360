/**
 * @pmg/auth — shared auth package for Tracker 360 monorepo.
 *
 * Subpath imports (preferred — tree-shakeable):
 *   import { auth }             from '@pmg/auth/server';
 *   import { authClient }       from '@pmg/auth/client';
 *   import { SESSION_COOKIE_NAME } from '@pmg/auth/proxy';
 *   import { requireSession }   from '@pmg/auth/rbac';
 *   import type { Role }        from '@pmg/auth/types';
 *
 * Barrel import (convenience — pulls everything):
 *   import { auth, requireSession } from '@pmg/auth';
 */

// Server-side auth instance
export { auth } from './server';
export type { Auth } from './server';

// RBAC helpers (server-only)
export {
  checkUserSession,
  requireSession,
  requireOrganization,
  requireRole,
  hasRole,
  meetsMinimumRole,
} from './rbac';

// Proxy constants (safe to import in proxy.ts)
export {
  SESSION_COOKIE_NAME,
  PROTECTED_PREFIXES,
  AUTH_ONLY_PREFIXES,
  PUBLIC_PREFIXES,
} from './proxy';

// Permissions / access control (needed by client plugin config)
export { ac, owner, admin, manager, member, statement } from './permissions';

// Shared types
export type {
  Role,
  AuthUser,
  AuthSession,
  SessionResult,
  SessionCheck,
  NoSessionCheck,
  UserSessionCheck,
} from './types';
