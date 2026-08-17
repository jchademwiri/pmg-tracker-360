import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SetPasswordForm from "./SetPasswordForm";

export default async function SetPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  // Nothing to do here if they already have a real password — send them on.
  if (!(session.user as any).mustSetPassword) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <SetPasswordForm email={session.user.email} />
    </div>
  );
}
