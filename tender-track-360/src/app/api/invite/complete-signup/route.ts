import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    // signUpResult may include headers with Set-Cookie values
    const signUpHeaders: Headers | undefined = signUpResult?.headers;

    // Attempt to accept the invitation using the headers returned from signup (so the request is authenticated)
    try {
      const acceptInvitationOptions: any = {
        body: { invitationId },
      };

      if (signUpHeaders) {
        acceptInvitationOptions.headers = signUpHeaders;
      }

      await auth.api.acceptInvitation(acceptInvitationOptions);
    } catch (acceptErr) {
      console.error('Accept invitation failed after signup:', acceptErr);
      // proceed — user was created; we can still return success and let user re-try accept in UI
    }

    // Build a JSON response and forward any Set-Cookie headers so the browser receives the session cookie
    const res = NextResponse.json({
      success: true,
      redirectUrl: `/dashboard?invitationId=${invitationId}`,
    });

    if (signUpHeaders) {
      // Copy Set-Cookie headers from signUpHeaders into our response
      try {
        signUpHeaders.forEach((value, key) => {
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
