/**
 * Better Auth server instance for @pmg/auth.
 *
 * Wired to @pmg/db via the Drizzle adapter.
 * Exports `auth` — the single source of truth for all server-side auth calls.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { Resend } from 'resend';
import { db } from '@pmg/db/client';
import * as schema from '@pmg/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { ac, owner, admin, manager, member } from './permissions';
import VerifyEmail from './emails/verify-email';
import ResetPasswordEmail from './emails/reset-password-email';
import OrganizationInvitation from './emails/organization-invitation';

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required');
}
if (!process.env.BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = `${process.env.SENDER_NAME ?? 'Tender Track 360'} <${process.env.SENDER_EMAIL ?? 'noreply@tendertrack360.co.za'}>`;
const REPLY_TO = process.env.REPLY_TO_EMAIL ?? 'info@tendertrack360.co.za';

/**
 * Finds the most recently joined organization for a user.
 * Used to auto-set activeOrganizationId on new sessions.
 */
async function getActiveOrganization(
  userId: string
): Promise<{ id: string } | null> {
  const result = await db
    .select({ id: schema.member.organizationId })
    .from(schema.member)
    .where(eq(schema.member.userId, userId))
    .orderBy(schema.member.createdAt)
    .limit(1);

  return result[0] ? { id: result[0].id } : null;
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  advanced: {
    cookiePrefix: 'tracker-360',
    crossSubdomainCookies: {
      enabled: true,
      domain:
        process.env.NODE_ENV === 'production'
          ? 'tendertrack360.co.za'
          : undefined,
    },
  },

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          try {
            const org = await getActiveOrganization(session.userId);
            return {
              data: {
                ...session,
                activeOrganizationId: org?.id ?? null,
              },
            };
          } catch {
            return { data: session };
          }
        },
      },
    },
  },

  user: {
    additionalFields: {
      plan: {
        type: 'string',
        defaultValue: 'free',
        input: false,
      },
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false,
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        replyTo: REPLY_TO,
        subject: 'Reset your Tender Track 360 password',
        react: ResetPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email,
        }),
      });
      if (error) {
        console.error('[auth] Failed to send reset password email:', error);
        throw new Error('Failed to send reset password email');
      }
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        replyTo: REPLY_TO,
        subject: 'Verify your Tender Track 360 email address',
        react: VerifyEmail({
          username: user.name,
          verificationUrl: url,
        }),
      });
      if (error) {
        console.error('[auth] Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
      }
    },
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },

  plugins: [
    organization({
      sendInvitationEmail: async (data) => {
        const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
        const inviteLink = `${base}/invite/accept/${data.id}`;

        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: data.email,
          replyTo: REPLY_TO,
          subject: `You're invited to join ${data.organization.name}`,
          react: OrganizationInvitation({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          }),
        });
        if (error) {
          console.error('[auth] Failed to send invitation email:', error);
        }
      },

      allowUserToCreateOrganization: async (user) => {
        const userPlan = (user as { plan?: string }).plan ?? 'free';
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

        const currentCount = ownedOrgsCount[0]?.count ?? 0;
        return currentCount < limit;
      },

      ac,
      roles: { owner, admin, manager, member },
    }),

    nextCookies(),
  ],

  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL ?? '',
  ].filter(Boolean) as string[],
});

export type Auth = typeof auth;
