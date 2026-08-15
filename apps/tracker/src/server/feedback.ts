'use server';

import { db } from '@pmg/db';
import { feedback, user } from '@pmg/db/schema';
import { eq } from 'drizzle-orm';
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

    // Send email notification to system admins
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Fetch all system admin emails
        const adminUsers = await db
          .select({ email: user.email })
          .from(user)
          .where(eq(user.role, 'admin'));

        const adminEmails = adminUsers
          .map((a) => a.email)
          .filter(Boolean) as string[];

        const recipients =
          adminEmails.length > 0
            ? adminEmails
            : [process.env.RECEIVER_SUPPORT_EMAIL || 'info@contact.tendertrack360.co.za'];

        const escapeHtml = (unsafe: string) =>
          unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const safeMessage = escapeHtml(validated.message).replace(/\n/g, '<br>');
        const safeName = validated.name ? escapeHtml(validated.name) : 'Anonymous User';
        const safeEmail = validated.email ? escapeHtml(validated.email) : 'No email provided';
        const safeUrl = validated.url ? escapeHtml(validated.url) : 'N/A';
        const senderEmail = process.env.SENDER_EMAIL || 'no-reply@contact.tendertrack360.co.za';
        const adminUrl = process.env.ADMIN_APP_URL || 'https://admin.tendertrack360.co.za/feedback';

        const { error: emailError } = await resend.emails.send({
          from: `Tender Track 360 <${senderEmail}>`,
          to: recipients,
          subject: `[New Feedback] ${validated.type.toUpperCase()}: ${safeName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
                <span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                  ${validated.type.toUpperCase()}
                </span>
                <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 20px;">New Platform Feedback Received</h2>
                <p style="color: #64748b; margin: 0; font-size: 13px;">Submitted via User Feedback Widget</p>
              </div>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
                <p style="margin: 0 0 6px 0;"><strong>Submitter:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
                <p style="margin: 0;"><strong>Source URL:</strong> ${safeUrl}</p>
              </div>

              <p style="font-size: 13px; font-weight: 600; color: #475569; margin: 0 0 6px 0; text-transform: uppercase;">Feedback Message:</p>
              <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #d4af37; padding: 16px; margin-bottom: 24px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #1e293b;">
                ${safeMessage}
              </div>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${adminUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                  Open Feedback in Admin Console &rarr;
                </a>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tender Track 360 Admin System</p>
              </div>
            </div>
          `,
        });

        if (emailError) {
          console.error('Failed to send feedback email notification:', emailError);
        }
      }
    } catch (emailError) {
      console.error('Failed to send feedback email notification:', emailError);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return { success: false, error: 'Failed to submit feedback' };
  }
}
