'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function checkUserSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { hasSession: false, hasOrganization: false };
    }

    // Check if user has an active organization
    const hasOrganization = !!session.session.activeOrganizationId;

    return {
      hasSession: true,
      hasOrganization,
      activeOrganizationId: session.session.activeOrganizationId,
    };
  } catch (error) {
    console.error('Session check error:', error);
    return { hasSession: false, hasOrganization: false };
  }
}
