'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@pmg/db';
import { user, verification, account } from '@pmg/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { getAdminBaseURL } from '@/lib/urls';
import { sendAdminInvitationEmail } from '@/lib/admin-invite-email';
import { hashPassword } from 'better-auth/crypto';

const MIN_PASSWORD_LENGTH = 8;

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

export type AdminActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Requires an active system administrator, except during initial setup when no
 * administrator exists yet.
 */
async function requireAdminSession() {
  const adminCountResult = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.role, 'admin'));

  const adminCount = adminCountResult[0]?.count ?? 0;

  if (adminCount === 0) {
    return { ok: true as const, session: null };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user || (session.user as any).role !== 'admin') {
    return { ok: false as const, error: 'Access Denied: Unauthorized.' };
  }

  return { ok: true as const, session };
}

/**
 * Self-registration for the very first system administrator, from /setup.
 *
 * This is distinct from `inviteSystemAdmin`: the person is creating their own
 * account and choosing their own password, so no invitation is sent.
 */
export async function createSystemAdmin(
  name: string,
  email: string,
  password: string
): Promise<AdminActionResult> {
  try {
    const guard = await requireAdminSession();
    if (!guard.ok) {
      return { success: false, error: guard.error };
    }

    const existing = await db
      .select()
      .from(user)
      .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

    if (existing.length > 0) {
      const existingUser = existing[0];
      if (existingUser.role === 'admin') {
        return { success: false, error: 'This user is already a system administrator.' };
      }

      await db
        .update(user)
        .set({ role: 'admin' })
        .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

      revalidatePath('/users');
      revalidatePath('/system-admins');

      return {
        success: true,
        message: `Existing user ${existingUser.email} has been successfully promoted to system administrator!`,
      };
    }

    await auth.api.signUpEmail({
      body: { email, password, name },
      headers: await headers(),
    });

    await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

    revalidatePath('/users');
    revalidatePath('/system-admins');

    return { success: true, message: `System administrator ${email} successfully created!` };
  } catch (error) {
    const e = error as Error;
    console.error('Error in createSystemAdmin:', e);
    return { success: false, error: e.message || 'An error occurred during account creation' };
  }
}

/**
 * Invites someone to become a system administrator and emails them.
 *
 * `signUpEmail` requires a password, so a random one is generated and
 * discarded — nobody ever knows it. The invitee signs in through the
 * passwordless flow (magic link / OTP) for their first login, at which point
 * `mustSetPassword` forces them to choose a real password of their own
 * before they can use the console.
 */
export async function inviteSystemAdmin(
  name: string,
  email: string
): Promise<AdminActionResult> {
  try {
    const guard = await requireAdminSession();
    if (!guard.ok) {
      return { success: false, error: guard.error };
    }
    const invitedBy = guard.session?.user?.name ?? null;

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

      revalidatePath('/users');
      revalidatePath('/system-admins');

      // The promote branch previously notified nobody at all.
      return notifyInvitee({
        email: existingUser.email,
        name: existingUser.name,
        invitedBy,
        successMessage: `${existingUser.email} has been promoted to system administrator and notified by email.`,
        createdMessage: `${existingUser.email} has been promoted to system administrator`,
      });
    }

    // 2. Register via Better Auth. The password is random and never shared —
    // the invitee signs in with a magic link.
    await auth.api.signUpEmail({
      body: {
        email,
        password: crypto.randomUUID(),
        name,
      },
      headers: await headers(),
    });

    // 3. Promote to Admin and flag that they still owe us a real password
    await db
      .update(user)
      .set({ role: 'admin', mustSetPassword: true })
      .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

    // 4. Revalidate cache
    revalidatePath('/users');
    revalidatePath('/system-admins');

    return notifyInvitee({
      email,
      name,
      invitedBy,
      successMessage: `System administrator ${email} created and invitation sent.`,
      createdMessage: `System administrator ${email} was created`,
    });
  } catch (error) {
    const e = error as Error;
    console.error('Error in inviteSystemAdmin:', e);
    return { success: false, error: e.message || 'An error occurred during account creation' };
  }
}

/**
 * Sends the invitation and reports the outcome without overstating it.
 *
 * The account change has already been committed by the time this runs, so a
 * failed send must not read as a plain failure — nor as a plain success, which
 * is what previously let a silently-unsent invitation look like it worked.
 */
async function notifyInvitee(params: {
  email: string;
  name: string;
  invitedBy: string | null;
  successMessage: string;
  createdMessage: string;
}): Promise<AdminActionResult> {
  try {
    await sendAdminInvitationEmail({
      to: params.email,
      name: params.name,
      invitedBy: params.invitedBy,
    });
    return { success: true, message: params.successMessage };
  } catch (error) {
    const e = error as Error;
    console.error('Admin invitation email failed:', e);
    return {
      success: false,
      error: `${params.createdMessage}, but the invitation email could not be sent: ${
        e.message || 'unknown error'
      }. Use "Resend invite" once email delivery is working.`,
    };
  }
}

/**
 * Re-sends the invitation email to an existing system administrator, for when
 * the original never arrived.
 */
export async function resendAdminInvitation(
  email: string
): Promise<AdminActionResult> {
  try {
    const guard = await requireAdminSession();
    if (!guard.ok) {
      return { success: false, error: guard.error };
    }

    const formattedEmail = email.trim().toLowerCase();

    const target = await db.query.user.findFirst({
      where: eq(sql`lower(${user.email})`, formattedEmail),
    });

    if (!target || target.role !== 'admin') {
      return {
        success: false,
        error: 'No system administrator found with that email address.',
      };
    }

    await sendAdminInvitationEmail({
      to: target.email,
      name: target.name,
      invitedBy: guard.session?.user?.name ?? null,
    });

    return { success: true, message: `Invitation re-sent to ${target.email}.` };
  } catch (error) {
    const e = error as Error;
    console.error('Error in resendAdminInvitation:', e);
    return { success: false, error: e.message || 'Failed to resend the invitation.' };
  }
}

/**
 * Lets a signed-in admin set their own password, replacing the random,
 * never-shared one `inviteSystemAdmin` created on their behalf. The invitee
 * doesn't know that placeholder, so this updates the credential account
 * directly rather than going through Better Auth's `changePassword` (which
 * needs the current password) or `setPassword` (which refuses to run when a
 * credential account already exists).
 */
export async function setOwnPassword(newPassword: string): Promise<AdminActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (session.user as any).role !== 'admin') {
      return { success: false, error: 'Access Denied: Unauthorized.' };
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    }

    const credentialAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, session.user.id), eq(account.providerId, 'credential')),
    });

    if (!credentialAccount) {
      return { success: false, error: 'No credential account found for this user.' };
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(account)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(account.id, credentialAccount.id));

    await db
      .update(user)
      .set({ mustSetPassword: false })
      .where(eq(user.id, session.user.id));

    return { success: true, message: 'Password set. You can now sign in with it.' };
  } catch (error) {
    const e = error as Error;
    console.error('Error in setOwnPassword:', e);
    return { success: false, error: e.message || 'Failed to set password.' };
  }
}

