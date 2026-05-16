'use server';
import { db } from '@/db';
import { member, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, inArray, not } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { StorageService } from '@/lib/storage';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
  }
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });
  if (!currentUser) {
    redirect('/login');
  }

  // Generate signed URL for avatar if it exists and looks like a storage key (not an external URL like Google Auth)
  if (currentUser.image && !currentUser.image.startsWith('http')) {
    currentUser.image = await StorageService.getSignedUrl(currentUser.image);
  }

  return {
    ...session,
    currentUser,
  };
};

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    return {
      success: true,
      message: 'User signed in successfully',
    };
  } catch (error) {
    const e = error as Error;
    if (e.message === 'Email not verified') {
      await sendVerificationEmail(email);
      return {
        success: false,
        message: 'Email not verified. A new verification email has been sent.',
      };
    }
    return {
      success: false,
      message: e.message || 'An unknown error occurred',
    };
  }
};

export const signUp = async (name: string, email: string, password: string) => {
  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });
    return {
      success: true,
      message: 'User signed up successfully',
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || 'An unknown error occurred',
    };
  }
};

export const sendVerificationEmail = async (email: string) => {
  try {
    await auth.api.sendVerificationEmail({
      body: {
        email,
      },
    });
    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || 'Failed to send verification email',
    };
  }
};

export const getAllUsers = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });
    const users = await db.query.user.findMany({
      where: not(
        inArray(
          user.id,
          members.map((m) => m.userId)
        )
      ),
    });
    return users;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export const updateUserImage = async (formData: FormData) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // specific validation for images
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExtension = file.name.split('.').pop() || 'jpg';

    // Sanitize user name for folder path
    // Sanitize user name for folder path (fallback to 'user' if name is somehow missing or weird)
    const safeName = session.user.name
      ? session.user.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      : 'user';
    const timestamp = Date.now();
    // Explicitly using forward slashes for S3-style folders
    const uniqueKey = `users/${safeName}-${session.user.id}/profile-${timestamp}.${fileExtension}`;

    // Fetch current user image first (for later cleanup)
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { image: true },
    });

    const storageKey = await StorageService.uploadFile(
      buffer,
      uniqueKey,
      file.type
    );

    // Update user record
    await db
      .update(user)
      .set({ image: storageKey })
      .where(eq(user.id, session.user.id));

    // Cleanup: Delete old image if it exists (perform AFTER successful upload and DB update)
    if (currentUser?.image && !currentUser.image.startsWith('http')) {
      try {
        await StorageService.deleteFile(currentUser.image);
      } catch (e) {
        console.error('Failed to delete old user image:', e);
        // Do not fail the request if cleanup fails
      }
    }

    revalidatePath('/dashboard/settings/profile');

    // Return signed URL for immediate display
    const signedUrl = await StorageService.getSignedUrl(storageKey);

    return { success: true, imageUrl: signedUrl };
  } catch (error) {
    console.error('Error updating user image:', error);
    return { success: false, error: 'Failed to update profile picture' };
  }
};
