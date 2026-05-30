'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@pmg/db';
import { user } from '@pmg/db/schema';
import { eq, sql } from 'drizzle-orm';



/**
 * Validates and signs in platform administrators.
 */
export async function adminSignIn(email: string, password: string) {
  try {
    // Perform standard email/password authentication
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    });

    if (!response || !response.user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Role Enforcement: Ensure user role is 'admin'
    const role = (response.user as any).role;
    if (role !== 'admin') {
      // Sign out immediately to invalidate the session cookie
      await auth.api.signOut({
        headers: await headers(),
      });
      return {
        success: false,
        error:
          'Access Denied: Only system administrators are authorized to access this platform console.',
      };
    }

    return { success: true, message: 'Authentication successful' };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      error: e.message || 'An error occurred during authentication',
    };
  }
}

/**
 * Server-side Sign Out Action
 */
export async function adminSignOut() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    console.error('Sign out error:', error);
  }
  redirect('/login');
}

/**
 * Creates and registers a new system administrator.
 */
export async function createSystemAdmin(name: string, email: string, password: string) {
  try {
    // 1. Check if user already exists (case-insensitive)
    const existing = await db
      .select()
      .from(user)
      .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

    if (existing.length > 0) {
      const existingUser = existing[0];
      if (existingUser.role === 'admin') {
        return { success: false, error: 'This user is already a system administrator.' };
      }

      // Promote existing user to system administrator
      await db
        .update(user)
        .set({ role: 'admin' })
        .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

      // Revalidate cache
      revalidatePath('/users');

      return {
        success: true,
        message: `Existing user ${existingUser.email} has been successfully promoted to system administrator!`,
      };
    }

    // 2. Register via Better Auth
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: await headers(),
    });

    // 3. Promote to Admin
    await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

    // 4. Revalidate cache
    revalidatePath('/users');

    return { success: true, message: `System administrator ${email} successfully created!` };
  } catch (error) {
    const e = error as Error;
    return { success: false, error: e.message || 'An error occurred during account creation' };
  }
}


