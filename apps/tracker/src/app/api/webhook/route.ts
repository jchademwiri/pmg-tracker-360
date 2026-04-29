import { NextRequest, NextResponse } from 'next/server';
import { db } from '@pmg/db';
import { waitlist } from '@pmg/db';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    const email = requestBody.email || requestBody.data?.email;
    const companyName =
      requestBody.companyName || requestBody.data?.companyName;

    if (email) {
      try {
        await db.insert(waitlist).values({
          id: nanoid(),
          email: email,
          companyName: companyName,
          source: 'webhook',
        });
      } catch (e) {
        console.error('Failed to save webhook lead to db:', e);
      }
    }

    return new NextResponse('Webhook received', { status: 200 });
  } catch (e) {
    console.error('Error processing webhook:', e);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}
