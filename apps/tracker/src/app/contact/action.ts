'use server';

import { createSupportTicket } from '@/server/support';
import { formSchema } from './schema';

type FormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitContactForm(
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

  try {
    const result = await createSupportTicket({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.details,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to submit form',
      };
    }

    return {
      success: true,
      message: 'Message sent successfully! We will get back to you shortly.',
    };
  } catch (error) {
    console.error('Contact form error:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again or email us directly.',
    };
  }
}
