import { db } from '@/db';
import { invitation, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import AcceptInvitationClient from '@/components/invite/AcceptInvitationClient';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

type Props = {
  params: Promise<{
    invitationId: string;
  }>;
};

export default async function InviteAcceptPage({ params }: Props) {
  const { invitationId } = await params;

  const invite = await db.query.invitation.findFirst({
    where: eq(invitation.id, invitationId),
    with: {
      organization: true,
    },
  });

  if (!invite) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Invitation not found</h1>
        <p className="mt-2 text-muted-foreground">
          This invitation may have expired or been cancelled.
        </p>
      </div>
    );
  }

  // Check if a user already exists with this email
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, invite.email),
  });

  // Check if current user is logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Server renders invite details and shows client component for actions */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">You're invited</h1>
          <p className="text-muted-foreground mt-2">
            You were invited to join the organization{' '}
            <strong>{invite.organization.name}</strong> as{' '}
            <strong>{invite.role}</strong>.
          </p>
        </div>
        <AcceptInvitationClient
          invitationId={invitationId}
          inviteEmail={invite.email}
          userExists={!!existingUser}
          currentUserEmail={session?.user?.email}
        />
      </div>
    </div>
  );
}
