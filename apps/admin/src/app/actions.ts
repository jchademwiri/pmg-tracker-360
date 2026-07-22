'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@pmg/db';
import { user, verification } from '@pmg/db/schema';
import { eq, sql } from 'drizzle-orm';

const ADMIN_PRODUCTION_URL = 'https://admin.tendertrack360.co.za';

function getOrigin(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(
      value.startsWith('http://') || value.startsWith('https://')
        ? value
        : `https://${value}`
    );

    return url.origin;
  } catch {
    return null;
  }
}

function getAdminOrigin(value?: string) {
  const origin = getOrigin(value);
  if (!origin) return null;

  return new URL(origin).hostname.startsWith('admin.') ? origin : null;
}

function getAdminBaseURL() {
  // 1. User-configured env vars (highest priority)
  const configured =
    getOrigin(process.env.NEXT_PUBLIC_ADMIN_URL) ||
    getOrigin(process.env.ADMIN_PUBLIC_URL);
  if (configured) return configured;

  // 2. Production — use the hardcoded production URL directly.
  //    Avoid Vercel auto-injected vars (VERCEL_URL etc.) in production
  //    because they can clash with the custom domain and cause the
  //    session cookie to be set for the wrong origin.
  if (process.env.NODE_ENV === 'production') {
    return ADMIN_PRODUCTION_URL;
  }

  // 3. Non-production — preview deployments / local dev
  return (
    getAdminOrigin(process.env.NEXT_PUBLIC_URL) ||
    getAdminOrigin(process.env.BETTER_AUTH_URL) ||
    getAdminOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    getAdminOrigin(process.env.VERCEL_URL) ||
    'http://localhost:3001'
  );
}

/**
 * Sends a magic link and 6-digit OTP code to registered administrators.
 */
export async function adminSendMagicLink(email: string) {
  try {
    const formattedEmail = email.trim().toLowerCase();
    
    // Validate role: only allow registered admins to request this
    const foundUser = await db.query.user.findFirst({
      where: eq(sql`lower(${user.email})`, formattedEmail),
    });

    if (!foundUser || foundUser.role !== 'admin') {
      return {
        success: false,
        error: 'Access Denied: Only registered system administrators are authorized.',
      };
    }

    // Trigger magic-link creation which fires the sendMagicLink callback (generating the OTP & sending the email)
    await auth.api.signInMagicLink({
      body: {
        email: foundUser.email,
        callbackURL: getAdminBaseURL(),
      },
      headers: await headers(),
    });

    return {
      success: true,
      message: 'A secure sign-in link and 6-digit verification passcode have been sent to your email.',
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error in adminSendMagicLink:', e);
    return {
      success: false,
      error: e.message || 'Failed to generate and send sign-in link.',
    };
  }
}

/**
 * Verifies the 6-digit passcode and retrieves the corresponding magic link verification token.
 */
export async function verifyAdminOTP(email: string, otp: string) {
  try {
    const formattedEmail = email.trim().toLowerCase();
    const formattedOtp = otp.trim();
    const identifierKey = `otp-map:${formattedEmail}:${formattedOtp}`;

    const record = await db.query.verification.findFirst({
      where: eq(verification.identifier, identifierKey),
    });

    if (!record) {
      return { success: false, error: 'Invalid or expired verification code.' };
    }

    if (new Date() > record.expiresAt) {
      // Cleanup expired record
      await db.delete(verification).where(eq(verification.id, record.id));
      return { success: false, error: 'Verification code has expired.' };
    }

    // Delete record to prevent replay attacks
    await db.delete(verification).where(eq(verification.id, record.id));

    return {
      success: true,
      token: record.value, // Return real magic link token
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error in verifyAdminOTP:', e);
    return { success: false, error: e.message || 'Verification failed.' };
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
    // Check if the current user is authorized (must be admin)
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return { success: false, error: 'Access Denied: Unauthorized.' };
    }

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

