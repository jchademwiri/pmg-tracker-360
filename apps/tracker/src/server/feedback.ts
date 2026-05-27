'use server';

import { db } from '@pmg/db';
import { feedback } from '@pmg/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

const feedbackSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message is too long'),
  type: z.enum(['bug', 'feature', 'other']),
  url: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export async function submitFeedback(input: FeedbackInput) {
  try {
    const validated = feedbackSchema.parse(input);
    const feedbackId = nanoid(); // Changed to nanoid
    await db.insert(feedback).values({
      id: feedbackId, // Changed to nanoid
      message: validated.message,
      type: validated.type,
      url: validated.url || null, // Normalized url to null
      userId: validated.userId || null,
      name: validated.name || null,
      email: validated.email || null,
    });

    // Send email notification to admin
    try {
      if (process.env.RESEND_API_KEY) {
        // Check only for RESEND_API_KEY as other envs have fallbacks
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const escapeHtml = (unsafe: string) => {
          return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        };

        const safeMessage = escapeHtml(validated.message).replace(
          /\n/g,
          '<br>'
        );
        const safeName = validated.name
          ? escapeHtml(validated.name)
          : 'Anonymous';
        const safeEmail = validated.email
          ? escapeHtml(validated.email)
          : 'No email provided';
        const safeUrl = validated.url ? escapeHtml(validated.url) : 'N/A';

        const { error: emailError } = await resend.emails.send({
          from: 'Tender Track 360 <onboarding@resend.dev>',
          to: [
            process.env.RECEIVER_SUPPORT_EMAIL || 'info@tendertrack360.co.za',
          ],
          subject: `New Feedback: ${validated.type}`,
          html: `
            <h2>New Feedback Received</h2>
            <p><strong>Type:</strong> ${validated.type}</p>
            <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
            <p><strong>URL:</strong> ${safeUrl}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
              ${safeMessage}
            </blockquote>
          `,
        });

        if (emailError) {
          console.error(
            'Failed to send feedback email notification:',
            emailError
          );
        }
      } else {
        console.warn(
          'Email configuration missing (RESEND_API_KEY not set), skipping email notification'
        );
      }
    } catch (emailError) {
      console.error('Failed to send feedback email notification:', emailError);
      // Don't block the response if email fails
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return { success: false, error: 'Failed to submit feedback' };
  }
}
