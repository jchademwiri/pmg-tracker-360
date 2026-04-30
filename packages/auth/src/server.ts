/**
 * Better Auth server instance for @pmg/auth.
 *
 * Wired to @pmg/db via the Drizzle adapter.
 * Exports `auth` — the single source of truth for all server-side auth calls.
 *
 * Usage:
 *   import { auth } from '@pmg/auth/server';
 *   const session = await auth.api.getSession({ headers: await headers() });
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@pmg/db/client';
import * as schema from '@pmg/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { ac, owner, admin, manager, member } from './permissions';

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required');
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL environment variable is required');
}

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

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      // TODO Phase 7: wire Resend here
      console.log(`[auth] password reset link for ${user.email}: ${url}`);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // TODO Phase 7: wire Resend here
      console.log(`[auth] verify email link for ${user.email}: ${url}`);
    },
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },

  plugins: [
    organization({
      sendInvitationEmail: async (data) => {
        // TODO Phase 7: wire Resend here
        const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
        const inviteLink = `${base}/invite/accept/${data.id}`;
        console.log(
          `[auth] invitation for ${data.email} to join ${data.organization.name}: ${inviteLink}`
        );
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
