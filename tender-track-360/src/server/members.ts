'use server';

import { db } from '@/db';
import { member } from '../../docs/schema/auth';
import { auth } from '@/lib/auth';
import { Role } from '@/db/schema';
import { eq } from 'drizzle-orm/sql/expressions/conditions';
import { checkIfAdmin } from '@/server';

export const addMember = async (
  organizationId: string,
  userId: string,
  role: Role
) => {
  try {
    await auth.api.addMember({
      body: {
        userId,
        organizationId,
        role,
      },
    });
    return {
      success: true,
      message: 'Member added successfully',
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || 'An unknown error occurred',
    };
  }
};

export const removeMember = async (memberId: string) => {
  const isAdmin = await checkIfAdmin();
  if (!isAdmin) {
    return {
      success: false,
      message: 'You do not have permission to remove members',
    };
  }

  try {
    await db.delete(member).where(eq(member.id, memberId));
    return {
      success: true,
      message: 'Member removed successfully',
      error: null,
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || 'An unknown error occurred',
      error: e.message || 'An unknown error occurred',
    };
  }
};
