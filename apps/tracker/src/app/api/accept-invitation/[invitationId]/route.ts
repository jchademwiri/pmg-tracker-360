import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  // Await the params Promise in Next.js 15
  const { invitationId } = await params;

  try {
    const data = await auth.api.acceptInvitation({
      body: {
        invitationId,
      },
      headers: await headers(),
    });

    return NextResponse.redirect(
      new URL(`/dashboard?invitationId=${invitationId}`, request.url)
    );
  } catch (error) {
    console.error(error);
    // If accept fails (likely because the user is not authenticated),
    // redirect to the public invite accept page so the recipient can sign in or sign up.
    return NextResponse.redirect(
      new URL(`/invite/accept/${invitationId}`, request.url)
    );
  }
}
