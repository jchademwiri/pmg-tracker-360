'use server';

import { createSupportTicket } from '@/server/support';
import { formSchema } from './schema';

type FormState = {
  message: string;
};

export async function submitContactForm(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = formSchema.safeParse(formData);

  if (!parsed.success) {
    return { message: 'Invalid form data' };
  }

  try {
    const result = await createSupportTicket({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.details,
    });

    if (!result.success) {
      return { message: result.error || 'Failed to submit form' };
    }

    return { message: 'Message sent successfully!' };
  } catch (error) {
    return { message: 'Failed to submit form. Please try again.' };
  }
}
