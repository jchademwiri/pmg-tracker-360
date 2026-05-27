'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const checkIfAdmin = async () => {
  try {
    const { success, error } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          project: ['create', 'delete', 'update'],
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error || 'Failed to check permissions',
      };
    }

    return success;
  } catch (error) {
    return {
      success: false,
      error: error || 'Failed to check permissions',
    };
  }
};
