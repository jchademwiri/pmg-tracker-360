import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@pmg/db';
import { invitation } from '@pmg/db/schema';
import { eq } from 'drizzle-orm';
import { rememberActiveOrganization } from '@/server/organizations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;

  try {
    // 1. Check for active session first
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      // If not logged in, redirect directly to the public invitation acceptance page
      return NextResponse.redirect(
        new URL(`/invite/accept/${invitationId}`, request.url)
      );
    }

    // 2. Fetch invitation to get organizationId
    const invite = await db.query.invitation.findFirst({
      where: eq(invitation.id, invitationId),
    });

    const targetOrgId = invite?.organizationId;

    // 3. Call acceptInvitation
    await auth.api.acceptInvitation({
      body: {
        invitationId,
      },
      headers: await headers(),
    });

    // 4. If accepted successfully, call rememberActiveOrganization
    if (targetOrgId) {
      await rememberActiveOrganization(targetOrgId);
    }

    return NextResponse.redirect(
      new URL(`/dashboard?invitationId=${invitationId}`, request.url)
    );
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    // If accept fails, redirect to the public invite accept page so the recipient can sign in or sign up
    return NextResponse.redirect(
      new URL(`/invite/accept/${invitationId}`, request.url)
    );
  }
}
