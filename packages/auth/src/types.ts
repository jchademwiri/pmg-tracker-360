/**
 * Shared auth types for @pmg/auth.
 * Derived from the Better Auth session shape + our schema roles.
 */

export type Role = 'owner' | 'admin' | 'manager' | 'member';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  activeOrganizationId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionResult {
  user: AuthUser;
  session: AuthSession;
}

/**
 * The shape returned by checkUserSession() — used by server components
 * and server actions throughout the tracker app.
 */
export interface SessionCheck {
  hasSession: true;
  hasOrganization: boolean;
  activeOrganizationId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: Role;
    image?: string | null;
  };
}

export interface NoSessionCheck {
  hasSession: false;
  hasOrganization: false;
  activeOrganizationId: null;
  user: null;
}

export type UserSessionCheck = SessionCheck | NoSessionCheck;
