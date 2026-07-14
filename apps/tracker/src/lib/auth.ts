import { betterAuth } from 'better-auth';
import { env } from '@/env';
import { organization, magicLink } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@pmg/db';
import { schema } from '@pmg/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { ac, admin, manager, member, owner } from '@/lib/auth/permissions';
import { Resend } from 'resend';
import ResetPasswordEmail from '@/emails/reset-password-email';
import VerifyEmail from '@/emails/verify-email';
import { getActiveOrganization } from '@/server';
import OrganizationInvitation from '@/emails/organization-invitation';

const resend = new Resend(process.env.RESEND_API_KEY);

const senderName = process.env.SENDER_NAME || 'Tender Track 360';
const senderEmail = process.env.SENDER_EMAIL || 'no-reply@contact.tendertrack360.co.za';
const SENDER = `${senderName} <${senderEmail}>`;
const REPLY_TO = process.env.REPLY_TO_EMAIL || 'info@contact.tendertrack360.co.za';
const TRACKER_PRODUCTION_URL = 'https://tendertrack360.co.za';
const LOCAL_AUTH_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function getNonLocalOrigin(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(
      value.startsWith('http://') || value.startsWith('https://')
        ? value
        : `https://${value}`
    );

    if (LOCAL_AUTH_HOSTNAMES.has(url.hostname)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function getPublicEmailOrigin() {
  return (
    getNonLocalOrigin(env.NEXT_PUBLIC_URL) ||
    getNonLocalOrigin(env.BETTER_AUTH_URL) ||
    getNonLocalOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    getNonLocalOrigin(process.env.VERCEL_URL) ||
    (process.env.NODE_ENV === 'production' ? TRACKER_PRODUCTION_URL : null)
  );
}

function getPublicAuthEmailUrl(url: string) {
  const publicOrigin = getPublicEmailOrigin();
  if (!publicOrigin) return url;

  try {
    const authUrl = new URL(url);
    if (!LOCAL_AUTH_HOSTNAMES.has(authUrl.hostname)) {
      return url;
    }

    return new URL(
      `${authUrl.pathname}${authUrl.search}${authUrl.hash}`,
      publicOrigin
    ).toString();
  } catch {
    return url;
  }
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [
    'http://localhost:3000',
    'https://tender-track-360.vercel.app',
    'https://admin.tendertrack360.co.za',
    ...(env.NEXT_PUBLIC_URL ? [new URL(env.NEXT_PUBLIC_URL).origin] : []),
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
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            const organization = await getActiveOrganization(session.userId);

            return {
              data: {
                ...session,
                activeOrganizationId: organization?.id ?? null,
              },
            };
          } catch (error) {
            console.error('Error in session create hook:', error);
            return { data: session };
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false, // Security: Users cannot set this via API
      },
    },
  },
  callbacks: {
  },
  database: drizzleAdapter(db, {
    provider: 'pg', // or "mysql", "sqlite"
    schema,
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: SENDER,
        to: user.email,
        subject: 'Verify your email address',
        replyTo: REPLY_TO,
        react: VerifyEmail({
          username: user.name,
          verificationUrl: getPublicAuthEmailUrl(url),
        }),
      });
    },
    sendOnSignUp: true,
    expiresIn: 3600, // 1 hour
    autoSignInAfterVerification: true,
  },

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        const { data, error } = await resend.emails.send({
          from: SENDER,
          to: user.email,
          subject: 'Reset your password',
          replyTo: REPLY_TO,
          react: ResetPasswordEmail({
            username: user.name,
            resetUrl: getPublicAuthEmailUrl(url),
            userEmail: user.email,
          }),
        });
        if (error) {
          console.error('Error sending reset password email:', error);
          throw error;
        }
      } catch (error) {
        console.error('Failed to send reset password email:', error);
        throw error;
      }
    },
    requireEmailVerification: true,
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        try {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const magicLinkUrl = getPublicAuthEmailUrl(url);

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
    organization({
      async sendInvitationEmail(data) {
        const base = env.NEXT_PUBLIC_URL || 'http://localhost:3000';
        const inviteLink = `${base}/invite/accept/${data.id}`;
        await resend.emails.send({
          from: SENDER,
          to: data.email,
          subject: `You're invited to join ${data.organization.name}`,
          replyTo: REPLY_TO,
          react: OrganizationInvitation({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          }),
        });
      },
      allowUserToCreateOrganization: async (user) => {
        // Enforce subscription limits
        // Free/Starter: 1 Organization
        // Pro: 2 Organizations

        // We need to cast user to any to access custom 'plan' field if types aren't inferred yet
        const userPlan = (user as any).plan || 'free';
        const limit = userPlan === 'pro' ? 2 : 1;

        const ownedOrgsCount = await db
          .select({ count: count() })
          .from(schema.member)
          .where(
            and(
              eq(schema.member.userId, user.id),
              eq(schema.member.role, 'owner')
            )
          );

        const currentCount = ownedOrgsCount[0]?.count || 0;

        if (currentCount >= limit) {
          return false;
        }

        return true;
      },
      // organizationLimit: 2, // Removed in favor of dynamic check above

      // Hook to update session when organization is switched
      hooks: {
        organization: {
          setActive: {
            after: async ({
              user,
              organizationId,
            }: {
              user: { id: string };
              organizationId: string;
            }) => {
              // This ensures the session gets updated with the new active organization
            },
          },
        },
      },

      ac,
      roles: {
        owner,
        admin,
        manager,
        member,
      },
    }),
    nextCookies(),
  ],
});
