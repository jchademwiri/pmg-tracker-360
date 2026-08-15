'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@pmg/db';
import { securityAuditLog, feedback } from '@pmg/db/schema';
import { eq } from 'drizzle-orm';
import { resend, SENDER, REPLY_TO } from '@/lib/email-config';
import { PLATFORM_ORG_ID } from '@/lib/constants';

export type SendFeedbackReplyInput = {
  feedbackId: string;
  toEmail: string;
  recipientName?: string;
  subject: string;
  replyMessage: string;
};

export async function sendFeedbackReplyAction(input: SendFeedbackReplyInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user as any).role !== 'admin') {
    return { success: false, error: 'Unauthorized: Admin access required.' };
  }

  const { feedbackId, toEmail, recipientName, subject, replyMessage } = input;

  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'A valid recipient email address is required.' };
  }

  if (!replyMessage || !replyMessage.trim()) {
    return { success: false, error: 'Reply message cannot be empty.' };
  }

  try {
    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const safeReplyHtml = escapeHtml(replyMessage).replace(/\n/g, '<br>');
    const nameGreeting = recipientName ? `Hi ${escapeHtml(recipientName)},` : 'Hello,';

    const { error: resendError } = await resend.emails.send({
      from: SENDER,
      replyTo: REPLY_TO,
      to: [toEmail],
      subject: subject || 'Response to your feedback — Tender Track 360',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 700;">Tender Track 360</h2>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Customer Feedback & Support</p>
          </div>

          <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-bottom: 16px;">
            ${nameGreeting}
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
            Thank you for taking the time to share your feedback with us. Our platform team has reviewed your submission:
          </p>

          <div style="background-color: #f8fafc; border-left: 4px solid #d4af37; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <p style="font-size: 14px; line-height: 1.6; color: #1e293b; margin: 0;">
              ${safeReplyHtml}
            </p>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 24px;">
            If you have any further questions or details to share, please reply directly to this email.
          </p>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tender Track 360. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (resendError) {
      console.error('Resend error sending feedback reply:', resendError);
      return { success: false, error: `Failed to send email: ${resendError.message}` };
    }

    // Record admin audit log
    try {
      await db.insert(securityAuditLog).values({
        id: crypto.randomUUID(),
        organizationId: PLATFORM_ORG_ID,
        userId: session.user.id,
        action: 'admin.feedback.reply',
        resourceType: 'feedback',
        resourceId: feedbackId,
        severity: 'info',
        createdAt: new Date(),
      });
    } catch (auditErr) {
      console.error('Failed to log feedback reply audit event:', auditErr);
    }

    return { success: true, message: `Reply sent successfully to ${toEmail}!` };
  } catch (err: any) {
    console.error('Error sending feedback reply:', err);
    return { success: false, error: err.message || 'An unexpected error occurred while sending the reply.' };
  }
}
