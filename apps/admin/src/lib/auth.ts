import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@pmg/db';
import { schema } from '@pmg/db/schema';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
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
    session: {
      after: async (session: any, user: any) => {
        return {
          ...session,
          user: {
            ...session.user,
            role: (user as any).role || 'user',
          },
        };
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});
