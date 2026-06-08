import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateOrganizationForm } from '@/components/shared/forms/create-organization-form';
import { getCurrentUser } from '@/server';
import { db } from '@pmg/db';
import { invitation, member } from '@pmg/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const { currentUser } = await getCurrentUser();

  // Check for pending invitations
  const pendingInvite = await db.query.invitation.findFirst({
    where: and(
      eq(sql`lower(${invitation.email})`, currentUser.email.toLowerCase()),
      eq(invitation.status, 'pending')
    ),
  });

  if (pendingInvite) {
    redirect(`/invite/accept/${pendingInvite.id}`);
  }

  // Fetch organizations user belongs to
  const userMemberships = await db
    .select()
    .from(member)
    .where(eq(member.userId, currentUser.id));

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">
              Welcome to Tender Track 360! 🎉
            </CardTitle>
            <p className="text-muted-foreground">
              Let&#x27;s set up your organization and get you started
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <CreateOrganizationForm currentOrganizationCount={userMemberships.length} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
