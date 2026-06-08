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

    // Create the user and request headers/cookies from the auth API
    // Pass overrideDefaultEmailVerification to skip verification for invite-created accounts if supported
    const signUpResult: any = await auth.api.signUpEmail({
      body: { name, email, password },
      // @ts-ignore - some SDKs accept this option as per docs
      overrideDefaultEmailVerification: true,
    });

    // Verification step: Explicitly set emailVerified: true in DB
    // Since invitation acceptance implies verification for this flow
    try {
      await db
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.email, email));
    } catch (verifyError) {
      console.error('Failed to auto-verify email:', verifyError);
      // Continue, as account is created
    }

    // Now call signInEmail to get a verified session
    let signInResult: any = null;
    try {
      signInResult = await auth.api.signInEmail({
        body: { email, password },
      });
    } catch (signInErr) {
      console.error('Sign in failed after signup/verification:', signInErr);
    }

    const sessionHeaders: Headers | undefined = signInResult?.headers || signUpResult?.headers;

    // Accept invitation directly in the DB to bypass flaky header-forwarding issues
    try {
      const invite = await db.query.invitation.findFirst({
        where: eq(invitation.id, invitationId),
      });

      if (invite && invite.status === 'pending') {
        const dbUser = await db.query.user.findFirst({
          where: eq(user.email, email.toLowerCase().trim()),
        });
        const userId = signUpResult?.user?.id || dbUser?.id;

        if (userId) {
          // Add user to the organization
          await db.insert(member).values({
            id: crypto.randomUUID(),
            organizationId: invite.organizationId,
            userId: userId,
            role: invite.role ?? 'member',
            createdAt: new Date(),
          });

          // Mark invitation as accepted
          await db
            .update(invitation)
            .set({ status: 'accepted' })
            .where(eq(invitation.id, invitationId));

          console.log(`Direct DB: accepted invitation ${invitationId} for user ${userId}`);
        } else {
          console.error('Direct DB: Could not find user to accept invitation');
        }
      } else {
        console.warn('Direct DB: Invitation not found or not pending:', invitationId);
      }
    } catch (acceptErr) {
      console.error('Direct DB: Acceptance failed:', acceptErr);
    }

    // Build a JSON response and forward any Set-Cookie headers so the browser receives the session cookie
    const res = NextResponse.json({
      success: true,
      redirectUrl: `/dashboard?invitationId=${invitationId}`,
    });

    if (sessionHeaders) {
      // Copy Set-Cookie headers from sessionHeaders into our response
      try {
        sessionHeaders.forEach((value, key) => {
          if (key.toLowerCase() === 'set-cookie') {
            res.headers.append('set-cookie', value);
          }
        });
      } catch (e) {
        console.warn('Failed to copy auth headers to response', e);
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
