'use server';

import { formSchema } from './schema';
import { db } from '@pmg/db';
import { waitlist } from '@pmg/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

type FormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitWaitlistForm(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = formSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Please check the form for errors.',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Check if email already on waitlist
  try {
    const existingEntry = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.email, parsed.data.email))
      .limit(1);

    if (existingEntry.length > 0) {
      return {
        success: true,
        message: 'You are already on our waitlist! We will keep you posted.',
      };
    }

    await db.insert(waitlist).values({
      id: nanoid(),
      email: parsed.data.email,
      companyName: parsed.data.companyName,
      source: 'website',
    });

    // Notify router.so (non-blocking, don't fail on error)
    try {
      await fetch(
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
    } catch {
      console.error('Router.so submission failed');
    }

    return {
      success: true,
      message: 'You have been added to the waitlist! We will notify you when early access opens.',
    };
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again or contact support.',
    };
  }
}
