"use client";

import { toast } from "sonner";
import { rememberActiveOrganization } from "@/server/organizations";

export interface OrganizationSwitchOptions {
  organizationId: string;
  organizationName: string;
  redirectUrl?: string;
  showToast?: boolean;
}

/**
 * better-auth returns API errors as JSON bodies with `{ message }` or
 * `{ error }`. Fall back to the raw text so the toast shows something
 * human-readable instead of an unhelpful blob.
 */
function extractErrorMessage(response: Response, rawText: string): string {
  try {
    const parsed = JSON.parse(rawText);
    const message =
      parsed?.message ||
      parsed?.error?.message ||
      parsed?.error ||
      parsed?.details;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  } catch {
    // Not JSON — fall through to raw text
  }
  const trimmed = rawText.trim();
  return trimmed || `Request failed with status ${response.status}`;
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
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const response = await fetch(
      `${baseUrl}/api/auth/organization/set-active`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
        credentials: "include",
      },
    );

    if (!response.ok) {
      const rawText = await response.text();
      const message = extractErrorMessage(response, rawText);
      const errorMessage = `Failed to switch organization: ${message}`;
      console.error("Organization switch failed:", response.status, rawText);
      if (showToast) {
        toast.error(errorMessage);
      }
      return { success: false, error: errorMessage };
    }

    // The session is already switched at this point. Persist the user's
    // preference so the next login lands on this organization. If this
    // fails we still complete the switch — just make sure it's visible
    // in the logs instead of being silently dropped.
    try {
      const remembered = await rememberActiveOrganization(organizationId);
      if (!remembered.success) {
        console.error(
          "Failed to remember active organization preference:",
          remembered.error,
        );
      }
    } catch (rememberError) {
      console.error(
        "Failed to remember active organization preference:",
        rememberError,
      );
    }

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
  } catch (error) {
    console.error("Organization switch error:", error);

    let errorMessage = "Failed to switch organization";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = `Network error: ${String(error)}`;
    }

    if (showToast) {
      toast.error(errorMessage);
    }

    return { success: false, error: errorMessage };
  }
}
