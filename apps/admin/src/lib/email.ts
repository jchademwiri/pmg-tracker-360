import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

const FROM_EMAIL = process.env.EMAIL_FROM || 'Tender Track 360 <notifications@tendertrack360.co.za>';

export async function sendAccountSuspendedEmail(
  to: string,
  name: string,
  orgName: string,
  reason?: string
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email Mock] Account Suspended Email to ${to} for org "${orgName}"`);
      return { success: true, mocked: true };
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Account Suspended - ${orgName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #18181b;">
          <h2 style="color: #dc2626;">Account Suspension Notice</h2>
          <p>Hello ${name},</p>
          <p>Your organization workspace <strong>${orgName}</strong> has been suspended by an administrator.</p>
          ${reason ? `<p><strong>Reason provided:</strong> ${reason}</p>` : ''}
          <p>Your account will remain suspended indefinitely. If an account stays suspended for more than 3 months without activity, a 30-day deletion countdown will be initiated.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #71717a;">PMG Tracker 360 Security Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send suspension email:', error);
    return { success: false, error };
  }
}

export async function sendPurgeScheduledEmail(
  to: string,
  name: string,
  orgName: string,
  daysRemaining = 30
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email Mock] Purge Scheduled Email to ${to} for org "${orgName}" (${daysRemaining} days)`);
      return { success: true, mocked: true };
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[ACTION REQUIRED] Deletion Scheduled in ${daysRemaining} Days - ${orgName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #18181b;">
          <h2 style="color: #dc2626;">Permanent Deletion Warning (${daysRemaining} Days)</h2>
          <p>Hello ${name},</p>
          <p>Your organization <strong>${orgName}</strong> has been scheduled for permanent database deletion in <strong>${daysRemaining} days</strong>.</p>
          <p>If you believe this deletion schedule was triggered in error or wish to request retention, you may submit a <strong>Deletion Appeal</strong> through your billing portal before the countdown expires.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #71717a;">PMG Tracker 360 Security Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send purge scheduled email:', error);
    return { success: false, error };
  }
}

export async function sendDeletionCancelledEmail(
  to: string,
  name: string,
  orgName: string
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email Mock] Deletion Cancelled Email to ${to} for org "${orgName}"`);
      return { success: true, mocked: true };
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Pending Deletion Cancelled - ${orgName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #18181b;">
          <h2 style="color: #2563eb;">Pending Deletion Cancelled</h2>
          <p>Hello ${name},</p>
          <p>Your appeal was reviewed and the <strong>30-day permanent deletion schedule for ${orgName} has been cancelled</strong>.</p>
          <p><em>Please note: Your workspace remains in a suspended state until explicitly reactivated by an administrator.</em></p>
          <p style="margin-top: 30px; font-size: 12px; color: #71717a;">PMG Tracker 360 Security Team</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send deletion cancelled email:', error);
    return { success: false, error };
  }
}
