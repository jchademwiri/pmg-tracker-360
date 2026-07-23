import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@pmg/db';
import { schema } from '@pmg/db/schema';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins';
import { Resend } from 'resend';
import { getAdminBaseURL } from '@/lib/urls';

const resend = new Resend(process.env.RESEND_API_KEY);

const senderName = process.env.SENDER_NAME || 'Tender Track 360';
const senderEmail = process.env.SENDER_EMAIL || 'no-reply@contact.tendertrack360.co.za';
const SENDER = `${senderName} <${senderEmail}>`;
const REPLY_TO = process.env.REPLY_TO_EMAIL || 'info@contact.tendertrack360.co.za';
const LOCAL_AUTH_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function getAdminMagicLinkUrl(token: string) {
  const adminBaseURL = getAdminBaseURL();
  const magicLinkUrl = new URL('/api/auth/magic-link/verify', adminBaseURL);
  magicLinkUrl.searchParams.set('token', token);
  magicLinkUrl.searchParams.set('callbackURL', adminBaseURL);
  return magicLinkUrl.toString();
}

export const auth = betterAuth({
  baseURL: getAdminBaseURL(),
  trustedOrigins: [
    getAdminBaseURL(),
    'http://localhost:3001',
    'https://admin.tendertrack360.co.za',
  ],
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 10,    // limit to 10 authentication requests per window per client IP
  },
  advanced: {
    cookiePrefix: 'tender-track-360',
    crossSubdomainCookies: {
      enabled: true,
      domain:
        process.env.NODE_ENV === 'production'
          ? 'tendertrack360.co.za'
          : undefined,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false,
      },
    },
  },
  callbacks: {
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token }) => {
        try {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const magicLinkUrl = getAdminMagicLinkUrl(token);

          await db.insert(schema.verification).values({
            id: crypto.randomUUID(),
            identifier: `otp-map:${email.toLowerCase()}:${otp}`,
            value: token,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
          });

          const { error } = await resend.emails.send({
            from: SENDER,
            to: email,
            subject: 'Your Sign-in Code and Magic Link',
            replyTo: REPLY_TO,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">Tender Track 360</h2>
                  <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Platform Sign-In Verification</p>
                </div>

                <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">Click the button below to sign in instantly on this device, or use the 6-digit verification code below if you are logging in on another device.</p>

                <div style="text-align: center; margin: 24px 0;">
                  <a href="${magicLinkUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px;">Sign In Instantly</a>
                </div>

                <div style="position: relative; margin: 32px 0; text-align: center;">
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0;" />
                  <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #ffffff; padding: 0 12px; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Or Use Passcode</span>
                </div>

                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; border: 1px dashed #cbd5e1;">
                  <p style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Verification Code</p>
                  <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #0f172a; padding-left: 0.25em;">${otp}</div>
                  <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0 0;">Expires in 10 minutes</p>
                </div>

                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 32px 0 0 0; line-height: 1.5;">If you did not request this verification email, you can safely ignore it.</p>
              </div>
            `,
          });
          if (error) {
            console.error('Error sending magic link email:', error);
            throw error;
          }
        } catch (err) {
          console.error('Failed to process magic link email:', err);
          throw err;
        }
      },
    }),
    nextCookies(),
  ]
});
