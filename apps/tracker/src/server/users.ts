'use server';

import { db } from '@pmg/db';
import { member, user } from '@pmg/db/schema';
import { eq, inArray, not } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

/**
 * Returns the current authenticated user and session.
 * Throws if not authenticated — callers that need a soft check
 * should use checkUserSession() from @/lib/session-check instead.
 */
export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { user: null, session: null, currentUser: null };
  }

  return {
    user: session.user,
    session: session.session,
    currentUser: session.user,
  };
};

/**
 * Email + password sign-in via Better Auth.
 */
export const signIn = async (email: string, password: string) => {
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });

    if (!result) {
      return { success: false, message: 'Invalid email or password' };
    }

    return { success: true, message: 'Signed in successfully' };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Invalid email or password';
    return { success: false, message };
  }
};

/**
 * Email + password sign-up via Better Auth.
 */
export const signUp = async (name: string, email: string, password: string) => {
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });

    if (!result) {
      return { success: false, message: 'Failed to create account' };
    }

    return { success: true, message: 'Account created successfully' };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create account';
    // Surface duplicate email as a friendly message
    if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('unique')) {
      return { success: false, message: 'An account with this email already exists' };
    }
    return { success: false, message };
  }
};

/**
 * Sends a verification email to the given address via Better Auth.
 */
export const sendVerificationEmail = async (email: string) => {
  try {
    await auth.api.sendVerificationEmail({
      body: { email },
      headers: await headers(),
    });
    return { success: true, message: 'Verification email sent — check your inbox' };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to send verification email';
    return { success: false, message };
  }
};

export const getAllUsers = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });
    const users = await db.query.user.findMany({
      where: not(inArray(user.id, members.map((m) => m.userId))),
    });
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export const updateUserImage = async (_formData: FormData) => {
  // TODO Phase 7: wire Cloudflare R2 storage
  return { success: false, error: 'File storage not configured yet' };
};
