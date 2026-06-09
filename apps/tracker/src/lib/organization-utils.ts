'use client';

import { toast } from 'sonner';
import { rememberActiveOrganization } from '@/server/organizations';

export interface OrganizationSwitchOptions {
  organizationId: string;
  organizationName: string;
  redirectUrl?: string;
  showToast?: boolean;
}

/**
 * Utility function to handle organization switching with proper session refresh
 * This ensures both client and server components get the updated organization context
 */
export async function switchOrganization({
  organizationId,
  organizationName,
  redirectUrl,
  showToast = true,
}: OrganizationSwitchOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000';

    const response = await fetch(
      `${baseUrl}/api/auth/organization/set-active`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
        credentials: 'include',
      }
    );

    if (response.ok) {
      await rememberActiveOrganization(organizationId);

      // Show success toast before reloading so the user sees feedback immediately
      if (showToast) {
        toast.success(`Switched to ${organizationName}`);
      }

      // Full page reload to re-render the layout.
      // router.refresh() does NOT re-render layouts in Next.js App Router,
      // so the sidebar, notifications, and page data would remain stale.
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        window.location.reload();
      }

      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('Organization switch failed:', response.status, errorText);
      const errorMessage = `Failed to switch organization (${response.status}): ${errorText}`;
      if (showToast) {
        toast.error(errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error('Organization switch error:', error);

    let errorMessage = 'Failed to switch organization';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = `Network error: ${String(error)}`;
    }

    if (showToast) {
      toast.error(errorMessage);
    }

    return { success: false, error: errorMessage };
  }
}


