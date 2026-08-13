import { resend, SENDER, REPLY_TO } from '@/lib/email-config';
import { getAdminBaseURL } from '@/lib/urls';

/**
 * Notifies someone that they have been granted system administrator access.
 *
 * The email points at the admin sign-in page rather than carrying a magic-link
 * token of its own. Minting a token here would mean duplicating the OTP and
 * verification-row bookkeeping that Better Auth's `sendMagicLink` hook already
 * owns (see `lib/auth.ts`), so the invitee requests their own code from the
 * login screen instead. No credentials travel by email.
 *
 * Throws when the send fails, so callers can report the failure rather than
 * claiming the invitation went out.
 */
export async function sendAdminInvitationEmail(params: {
  to: string;
  name: string;
  invitedBy?: string | null;
}): Promise<void> {
  const loginUrl = getAdminBaseURL();
  const invitedByLine = params.invitedBy
    ? `<p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">You were added by ${params.invitedBy}.</p>`
    : '';

  const { error } = await resend.emails.send({
    from: SENDER,
    to: params.to,
    replyTo: REPLY_TO,
    subject: "You've been granted Tender Track 360 admin access",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">Tender Track 360</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">System Administrator Access</p>
        </div>

        <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">Hello ${params.name},</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">You have been granted system administrator access to the Tender Track 360 admin console.</p>
        ${invitedByLine}
        <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">On the sign-in page, choose the <strong>passwordless</strong> option and enter this email address — <strong>${params.to}</strong> — and we'll send you a one-time verification code. You do not have a password to set.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${loginUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px;">Go to Admin Sign-In</a>
        </div>

        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 32px 0 0 0; line-height: 1.5;">If you were not expecting this, you can safely ignore this email — no code has been issued.</p>
      </div>
    `,
  });

  if (error) {
    console.error('Failed to send admin invitation email:', error);
    throw new Error(
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Failed to send invitation email.'
    );
  }
}
