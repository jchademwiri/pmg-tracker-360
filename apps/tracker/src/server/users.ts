'use server';
import { db } from '@pmg/db';
import { member, user } from '@pmg/db/schema';
import { eq, inArray, not } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { StorageService } from '@/lib/storage';

// ============================================================
// AUTH STUB — Phase 4 will replace with real Better Auth
// ============================================================
const STUB_USER_ID = 'stub-user-id';
const STUB_ORG_ID = 'stub-org-id';

export const getCurrentUser = async () => {
  return {
    user: {
      id: STUB_USER_ID,
      name: 'Dev User',
      email: 'dev@tendertrack360.co.za',
      role: 'owner',
      image: null as string | null,
      emailVerified: true,
    },
    session: {
      id: 'stub-session-id',
      userId: STUB_USER_ID,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      activeOrganizationId: STUB_ORG_ID,
    },
    currentUser: {
      id: STUB_USER_ID,
      name: 'Dev User',
      email: 'dev@tendertrack360.co.za',
      role: 'owner',
      image: null as string | null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: 'free',
    },
  };
};

// Stub sign-in — Phase 4 will use real auth
export const signIn = async (_email: string, _password: string) => {
  return { success: true, message: 'Stub: sign-in not active yet' };
};

export const signUp = async (_name: string, _email: string, _password: string) => {
  return { success: true, message: 'Stub: sign-up not active yet' };
};

export const sendVerificationEmail = async (_email: string) => {
  return { success: true, message: 'Stub: email not active yet' };
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
  // Stub — storage not configured yet
  return { success: false, error: 'File storage not configured yet' };
};
