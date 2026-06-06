'use client';

import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { rememberActiveOrganization } from '@/server/organizations';

export interface OrganizationSwitchOptions {
  organizationId: string;
  organizationName: string;
  router: AppRouterInstance;
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
  router,
  redirectUrl,
  showToast = true,
}: OrganizationSwitchOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Switch the active organization using direct API call

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
        body: JSON.stringify({
          organizationId,
        }),
        credentials: 'include',
      }
    );

    if (response.ok) {
      const result = await response.json();

      await rememberActiveOrganization(organizationId);

      // Step 2: Force session refresh to ensure server components get updated data
      try {
        await authClient.getSession({
          fetchOptions: {
            cache: 'no-store',
          },
        });
      } catch (sessionError) {
        console.warn(
          'Session refresh failed, continuing with router refresh:',
          sessionError
        );
      }

      // Step 3: Navigate to new URL if provided
      if (redirectUrl) {
        router.push(redirectUrl);
      }

      // Step 4: Refresh the page to update all server components
      router.refresh();

      // Step 5: Show success message
      if (showToast) {
        toast.success(`Switched to ${organizationName}`);
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
      // Handle fetch errors or other API errors
      errorMessage = `Network error: ${String(error)}`;
    }

    if (showToast) {
      toast.error(errorMessage);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Alternative organization switching with full page reload as fallback
 * Use this if the session refresh approach doesn't work reliably
 */
export async function switchOrganizationWithReload({
  organizationId,
  organizationName,
  redirectUrl,
  showToast = true,
}: Omit<OrganizationSwitchOptions, 'router'>): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Step 1: Switch the active organization

    // Try multiple approaches for organization switching
    let result;

    // Method 1: Try the standard organization setActive method
    try {
      result = await authClient.organization.setActive({
        organizationId,
      });
    } catch (method1Error) {
      console.warn('Method 1 failed:', method1Error);

      // Method 2: Try using direct API call to the auth endpoint
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/organization/set-active`,
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
          result = { success: true };
        } else {
          throw new Error(`API call failed with status: ${response.status}`);
        }
      } catch (method2Error) {
        console.warn('Method 2 failed:', method2Error);

        // Method 3: Try using session update approach
        try {
          // Update the session with the new organization
          await authClient.getSession({
            fetchOptions: {
              cache: 'no-store',
            },
          });
          result = { success: true };
        } catch (method3Error) {
          console.error('All methods failed:', method3Error);
          throw method3Error;
        }
      }
    }

    if (result?.error) {
      const errorMessage = `Failed to switch organization: ${result.error.message || result.error}`;
      console.error('Organization switch error:', result.error);
      if (showToast) {
        toast.error(errorMessage);
      }
      return { success: false, error: errorMessage };
    }

    // Step 2: Show success message before reload
    if (showToast) {
      toast.success(`Switched to ${organizationName}`);
    }

    // Step 3: Full page reload to ensure all data is fresh
    // Removed artificial delay; navigate/reload immediately for responsiveness
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }

    return { success: true };
  } catch (error) {
    console.error('Organization switch error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to switch organization';

    if (showToast) {
      toast.error(errorMessage);
    }

    return { success: false, error: errorMessage };
  }
}
