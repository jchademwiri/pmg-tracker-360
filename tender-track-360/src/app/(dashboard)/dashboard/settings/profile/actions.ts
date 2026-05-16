'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { session } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

// Server-side validation schema
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

// Password change validation schema
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^a-zA-Z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    signOutOtherSessions: z.boolean().default(false),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// Session information interface
export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  ipAddress: string | null;
  lastActive: Date;
  current: boolean;
  expiresAt: Date;
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<ActionResult> {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: 'You must be logged in to update your profile',
      };
    }

    // Validate input data
    const validationResult = updateProfileSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Invalid input data',
        data: validationResult.error.flatten().fieldErrors,
      };
    }

    const validatedData = validationResult.data;

    // Update user profile using Better Auth
    const updateResult = await auth.api.updateUser({
      headers: await headers(),
      body: {
        name: validatedData.name,
      },
    });

    if (!updateResult) {
      return {
        success: false,
        message: 'Failed to update profile. Please try again.',
      };
    }

    // Revalidate the profile page to show updated data
    revalidatePath('/dashboard/settings/profile');
    revalidatePath('/profile'); // Also revalidate the main profile page

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        name: validatedData.name,
      },
    };
  } catch (error) {
    console.error('Profile update error:', error);

    // Handle specific Better Auth errors
    if (error instanceof Error) {
      if (error.message.includes('unauthorized')) {
        return {
          success: false,
          message: 'You are not authorized to perform this action',
        };
      }

      if (error.message.includes('validation')) {
        return {
          success: false,
          message: 'Invalid data provided',
        };
      }
    }

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Rate limiting store for email verification resends
const resendAttempts = new Map<
  string,
  { count: number; lastAttempt: number }
>();
const RESEND_RATE_LIMIT = 3; // Max 3 attempts
const RESEND_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

// Rate limiting store for password changes
const passwordChangeAttempts = new Map<
  string,
  { count: number; lastAttempt: number }
>();
const PASSWORD_CHANGE_RATE_LIMIT = 5; // Max 5 attempts
const PASSWORD_CHANGE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

export async function resendVerificationEmail(): Promise<ActionResult> {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: 'You must be logged in to resend verification email',
      };
    }

    const userId = session.user.id;
    const now = Date.now();

    // Check rate limiting
    const userAttempts = resendAttempts.get(userId);
    if (userAttempts) {
      // Reset counter if window has passed
      if (now - userAttempts.lastAttempt > RESEND_WINDOW) {
        resendAttempts.set(userId, { count: 1, lastAttempt: now });
      } else if (userAttempts.count >= RESEND_RATE_LIMIT) {
        const remainingTime = Math.ceil(
          (RESEND_WINDOW - (now - userAttempts.lastAttempt)) / 60000
        );
        return {
          success: false,
          message: `Too many attempts. Please wait ${remainingTime} minutes before trying again.`,
        };
      } else {
        // Increment attempt count
        resendAttempts.set(userId, {
          count: userAttempts.count + 1,
          lastAttempt: now,
        });
      }
    } else {
      // First attempt for this user
      resendAttempts.set(userId, { count: 1, lastAttempt: now });
    }

    // Check if email is already verified
    if (session.user.emailVerified) {
      return {
        success: false,
        message: 'Your email is already verified',
      };
    }

    // Send verification email using Better Auth
    const result = await auth.api.sendVerificationEmail({
      headers: await headers(),
      body: {
        email: session.user.email,
        callbackURL: `${process.env.BETTER_AUTH_URL}/api/auth/verify-email`,
      },
    });

    if (!result) {
      return {
        success: false,
        message: 'Failed to send verification email. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    };
  } catch (error) {
    console.error('Email verification resend error:', error);

    // Handle specific Better Auth errors
    if (error instanceof Error) {
      if (error.message.includes('unauthorized')) {
        return {
          success: false,
          message: 'You are not authorized to perform this action',
        };
      }

      if (error.message.includes('already verified')) {
        return {
          success: false,
          message: 'Your email is already verified',
        };
      }

      if (error.message.includes('rate limit')) {
        return {
          success: false,
          message: 'Too many requests. Please wait before trying again.',
        };
      }
    }

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

export async function changePassword(
  data: ChangePasswordData
): Promise<ActionResult> {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return {
        success: false,
        message: 'You must be logged in to change your password',
      };
    }

    const userId = session.user.id;
    const now = Date.now();

    // Check rate limiting
    const userAttempts = passwordChangeAttempts.get(userId);
    if (userAttempts) {
      // Reset counter if window has passed
      if (now - userAttempts.lastAttempt > PASSWORD_CHANGE_WINDOW) {
        passwordChangeAttempts.set(userId, { count: 1, lastAttempt: now });
      } else if (userAttempts.count >= PASSWORD_CHANGE_RATE_LIMIT) {
        const remainingTime = Math.ceil(
          (PASSWORD_CHANGE_WINDOW - (now - userAttempts.lastAttempt)) / 60000
        );
        return {
          success: false,
          message: `Too many password change attempts. Please wait ${remainingTime} minutes before trying again.`,
        };
      } else {
        // Increment attempt count
        passwordChangeAttempts.set(userId, {
          count: userAttempts.count + 1,
          lastAttempt: now,
        });
      }
    } else {
      // First attempt for this user
      passwordChangeAttempts.set(userId, { count: 1, lastAttempt: now });
    }

    // Validate input data
    const validationResult = changePasswordSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Invalid input data',
        data: validationResult.error.flatten().fieldErrors,
      };
    }

    const validatedData = validationResult.data;

    // Change password using Better Auth
    const changeResult = await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: validatedData.currentPassword,
        newPassword: validatedData.newPassword,
        revokeOtherSessions: validatedData.signOutOtherSessions,
      },
    });

    if (!changeResult) {
      return {
        success: false,
        message:
          'Failed to change password. Please check your current password and try again.',
      };
    }

    // Reset rate limiting on successful change
    passwordChangeAttempts.delete(userId);

    // Revalidate the profile page
    revalidatePath('/dashboard/settings/profile');
    revalidatePath('/profile'); // Also revalidate the main profile page

    return {
      success: true,
      message: validatedData.signOutOtherSessions
        ? 'Password changed successfully. Other sessions have been signed out.'
        : 'Password changed successfully.',
    };
  } catch (error) {
    console.error('Password change error:', error);

    // Handle specific Better Auth errors
    if (error instanceof Error) {
      if (
        error.message.includes('unauthorized') ||
        error.message.includes('invalid password')
      ) {
        return {
          success: false,
          message: 'Current password is incorrect. Please try again.',
        };
      }

      if (error.message.includes('validation')) {
        return {
          success: false,
          message: 'Invalid password format. Please check the requirements.',
        };
      }

      if (error.message.includes('rate limit')) {
        return {
          success: false,
          message: 'Too many attempts. Please wait before trying again.',
        };
      }
    }

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

// Helper function to parse user agent for device information
function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown Device';

  // Simple user agent parsing - in production, consider using a library like ua-parser-js
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    if (userAgent.includes('Chrome')) return 'Mobile Chrome';
    if (userAgent.includes('Safari')) return 'Mobile Safari';
    if (userAgent.includes('Firefox')) return 'Mobile Firefox';
    return 'Mobile Browser';
  }

  if (userAgent.includes('Chrome')) return 'Chrome Browser';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
    return 'Safari Browser';
  if (userAgent.includes('Firefox')) return 'Firefox Browser';
  if (userAgent.includes('Edge')) return 'Edge Browser';

  return 'Desktop Browser';
}

// Helper function to get location from IP (placeholder - in production, use a geolocation service)
function getLocationFromIP(ipAddress: string | null): string {
  if (!ipAddress) return 'Unknown Location';

  // Placeholder - in production, integrate with a geolocation service
  if (
    ipAddress === '127.0.0.1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.')
  ) {
    return 'Local Network';
  }

  return 'Unknown Location';
}

export async function getUserSessions(): Promise<ActionResult> {
  try {
    // Get current session
    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!currentSession) {
      return {
        success: false,
        message: 'You must be logged in to view sessions',
      };
    }

    // Get all sessions for the current user
    const userSessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, currentSession.user.id));

    // Transform sessions into the format needed by the component
    const sessionInfos: SessionInfo[] = userSessions.map((sess) => ({
      id: sess.id,
      device: parseUserAgent(sess.userAgent),
      location: getLocationFromIP(sess.ipAddress),
      ipAddress: sess.ipAddress,
      lastActive: sess.updatedAt,
      current: sess.id === currentSession.session.id,
      expiresAt: sess.expiresAt,
    }));

    // Sort sessions with current session first, then by last active
    sessionInfos.sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return b.lastActive.getTime() - a.lastActive.getTime();
    });

    return {
      success: true,
      message: 'Sessions retrieved successfully',
      data: sessionInfos,
    };
  } catch (error) {
    console.error('Get user sessions error:', error);
    return {
      success: false,
      message: 'Failed to retrieve sessions. Please try again.',
    };
  }
}

export async function revokeSession(sessionId: string): Promise<ActionResult> {
  try {
    // Get current session
    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!currentSession) {
      return {
        success: false,
        message: 'You must be logged in to revoke sessions',
      };
    }

    // Prevent revoking current session
    if (sessionId === currentSession.session.id) {
      return {
        success: false,
        message: 'Cannot revoke your current session',
      };
    }

    // Delete the session from the database
    await db
      .delete(session)
      .where(
        and(
          eq(session.id, sessionId),
          eq(session.userId, currentSession.user.id)
        )
      );

    return {
      success: true,
      message: 'Session revoked successfully',
    };
  } catch (error) {
    console.error('Revoke session error:', error);
    return {
      success: false,
      message: 'Failed to revoke session. Please try again.',
    };
  }
}

export async function revokeAllOtherSessions(): Promise<ActionResult> {
  try {
    // Get current session
    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!currentSession) {
      return {
        success: false,
        message: 'You must be logged in to revoke sessions',
      };
    }

    // Delete all other sessions for the current user
    await db
      .delete(session)
      .where(
        and(
          eq(session.userId, currentSession.user.id),
          ne(session.id, currentSession.session.id)
        )
      );

    return {
      success: true,
      message: 'All other sessions have been signed out successfully',
    };
  } catch (error) {
    console.error('Revoke all other sessions error:', error);
    return {
      success: false,
      message: 'Failed to sign out other sessions. Please try again.',
    };
  }
}
