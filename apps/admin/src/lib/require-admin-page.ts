import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Standard page-level guard for the admin console: redirects to /login if
 * there's no signed-in system administrator, or to /set-password if this
 * admin still has the placeholder password inviteSystemAdmin generated for
 * them and hasn't chosen their own yet. Returns the session otherwise.
 *
 * Not used by pages that need bootstrap-specific behavior (e.g. redirecting
 * to /setup when zero admins exist yet) or by /set-password itself.
 */
export async function requireAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  if ((session.user as any).mustSetPassword) {
    redirect("/set-password");
  }

  return session;
}
