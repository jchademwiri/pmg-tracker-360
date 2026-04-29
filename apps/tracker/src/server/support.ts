'use server';

import { db } from '@pmg/db';
import { supportTickets } from '@pmg/db';
import { z } from 'zod';

const supportTicketSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message is too long'),
  userId: z.string().optional(),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;

export async function createSupportTicket(input: SupportTicketInput) {
  try {
    const validated = supportTicketSchema.parse(input);

    await db.insert(supportTickets).values({
      id: crypto.randomUUID(),
      name: validated.name,
      email: validated.email,
      message: validated.message,
      userId: validated.userId || null,
      status: 'open',
    });

    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const safeMessage = escapeHtml(validated.message).replace(/\n/g, '<br>');
    const safeName = escapeHtml(validated.name);
    const safeEmail = escapeHtml(validated.email);
    const safeUserId = validated.userId ? escapeHtml(validated.userId) : 'N/A';

    // Send email notification to admin
    try {
      if (
        process.env.RESEND_API_KEY &&
        process.env.SENDER_SUPPORT_EMAIL &&
        process.env.REPLY_TO_EMAIL &&
        process.env.RECEIVER_SUPPORT_EMAIL
      ) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const supportFromEmail = process.env.SENDER_SUPPORT_EMAIL;
        // supportToEmail dead code removed

        const { error: emailError } = await resend.emails.send({
          from: `Tender Track 360 Support <${supportFromEmail}>`,
          to: [process.env.RECEIVER_SUPPORT_EMAIL], // Guaranteed string by outer check
          subject: `New Support Ticket from ${safeName}`,
          html: `
            <h2>New Support Request</h2>
            <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
            <p><strong>User ID:</strong> ${safeUserId}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
              ${safeMessage}
            </blockquote>
          `,
        });

        if (emailError) {
          console.error('Failed to send support email:', emailError);
          // Optional: throw new Error('Failed to send email');
        }
      } else {
        console.warn(
          'Email configuration missing (RESEND_API_KEY, SENDER_SUPPORT_EMAIL, or RECEIVER_SUPPORT_EMAIL not set), skipping email notification'
        );
      }

      // Send confirmation email to user
      try {
        if (process.env.RESEND_API_KEY && process.env.SENDER_SUPPORT_EMAIL) {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          const supportFromEmail = process.env.SENDER_SUPPORT_EMAIL;

          // Send confirmation to user
          await resend.emails.send({
            from: `Tender Track 360 Support <${supportFromEmail}>`,
            to: [validated.email],
            subject: `Support request received`,
            html: `
              <h2>We received your request</h2>
              <p>Hi ${safeName},</p>
              <p>Thanks for reaching out. We've received your message and will get back to you as soon as possible.</p>
              <p><strong>Your message:</strong></p>
              <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
                ${safeMessage}
              </blockquote>
            `,
          });
        }
      } catch (userEmailError) {
        console.error(
          'Failed to send user confirmation email:',
          userEmailError
        );
        // Don't block response
      }
    } catch (emailError) {
      console.error('Failed to send support ticket email:', emailError);
      // Don't block the response if email fails
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    return { success: false, error: 'Failed to submit support request' };
  }
}
