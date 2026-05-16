'use server';

import { formSchema } from './schema';
import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';

type FormState = {
  message: string;
};

export async function submitWaitlistForm(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = formSchema.safeParse(formData);

  if (!parsed.success) {
    return { message: 'Invalid form data' };
  }

  try {
    // Save to database
    try {
      await db.insert(waitlist).values({
        id: nanoid(),
        email: parsed.data.email,
        companyName: parsed.data.companyName,
        source: 'website',
      });
    } catch (e) {
      // If error is unique constraint violation (duplicate email), we can probably ignore it or just update
      console.error('Failed to save to db:', e);
      // We continue to send to router.so even if db fails (or maybe it failed because it already exists)
    }

    const response = await fetch(
      'https://app.router.so/api/endpoints/ac4auqxl',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ROUTER_API_KEY}`,
        },
        body: JSON.stringify(parsed.data),
      }
    );

    if (!response.ok) {
      // If router.so fails, but we saved to DB, we might want to tell the user it was successful?
      // For now, keeping original behavior but with DB save.
      // actually if DB save succeeded but this failed...
      console.error('Router.so submission failed');
    }
  } catch (error) {
    return { message: 'Failed to submit form. Please try again.' };
  }

  redirect('/');
}
