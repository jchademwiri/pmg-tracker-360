import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@pmg/db';
import { user, member, invitation } from '@pmg/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationId, name, email, password } = body;

    if (!invitationId || !email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Missing fields' },
        { status: 400 }
      );
    }

    // 1. Validate the invitation exists and is still pending
    const invite = await db.query.invitation.findFirst({
      where: eq(invitation.id, invitationId),
    });

    if (!invite || invite.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Invitation is no longer valid.' },
        { status: 400 }
      );
    }

    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'Email does not match the invitation.' },
        { status: 400 }
      );
    }

    // 2. Create the user account via Better Auth
    // This fires sendVerificationEmail — we cannot stop it at this point,
    // but we immediately mark emailVerified=true in the DB right after
    // so any subsequent sign-in doesn't get blocked.
    let signUpUserId: string | null = null;
    try {
      const signUpResult: any = await auth.api.signUpEmail({
        body: { name, email, password },
      });
      signUpUserId = signUpResult?.user?.id ?? null;
    } catch (signUpErr: any) {
      // If the account already exists (e.g. race condition), continue
      const msg: string = signUpErr?.body?.message || signUpErr?.message || '';
      if (!msg.toLowerCase().includes('already')) {
        return NextResponse.json(
          { success: false, message: msg || 'Failed to create account.' },
          { status: 400 }
        );
      }
    }

    // 3. Resolve the user ID (may come from sign-up result or DB lookup)
    if (!signUpUserId) {
      const dbUser = await db.query.user.findFirst({
        where: eq(user.email, email.toLowerCase().trim()),
      });
      signUpUserId = dbUser?.id ?? null;
    }

    if (!signUpUserId) {
      return NextResponse.json(
        { success: false, message: 'Could not resolve user after sign-up.' },
        { status: 500 }
      );
    }

    const userId = signUpUserId;

    // 4. Auto-verify the email — the invitation itself is proof of ownership.
    //    Do this BEFORE sign-in so requireEmailVerification doesn't block the session.
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, userId));

    // 5. Sign the user in to get a session cookie
    let sessionHeaders: Headers | undefined;
    try {
      const signInResult: any = await auth.api.signInEmail({
        body: { email, password },
      });
      sessionHeaders = signInResult?.headers;
    } catch (signInErr) {
      console.error('Sign in after sign-up failed:', signInErr);
      // Non-fatal — user can log in manually, but try to continue
    }

    // 6. Add the user to the organisation and mark the invitation as accepted
    try {
      await db.transaction(async (tx) => {
        // Guard against duplicate member rows for this organization only.
        // A user can belong to multiple organizations, so userId alone is not enough.
        const existingMember = await tx.query.member.findFirst({
          where: and(
            eq(member.userId, userId),
            eq(member.organizationId, invite.organizationId)
          ),
        });

        if (!existingMember) {
          await tx.insert(member).values({
            id: crypto.randomUUID(),
            organizationId: invite.organizationId,
            userId,
            role: invite.role ?? 'member',
            createdAt: new Date(),
          });
        }

        await tx
          .update(invitation)
          .set({ status: 'accepted' })
          .where(eq(invitation.id, invitationId));
      });
    } catch (acceptErr) {
      console.error('Failed to complete invitation acceptance in DB:', acceptErr);
      // Non-fatal — account was created, member row may already exist
    }

    // 7. Return success and forward any session cookies
    const res = NextResponse.json({
      success: true,
      redirectUrl: `/dashboard?invitationId=${invitationId}`,
    });

    if (sessionHeaders) {
      try {
        sessionHeaders.forEach((value: string, key: string) => {
          if (key.toLowerCase() === 'set-cookie') {
            res.headers.append('set-cookie', value);
          }
        });
      } catch {
        // Ignore header copy failures
      }
    }

    return res;
  } catch (error: any) {
    console.error('Error in complete-signup route:', error);
    return NextResponse.json(
      { success: false, message: error?.body?.message || 'Internal error' },
      { status: 500 }
    );
  }
}
