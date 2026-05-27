import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1, {
      message: 'BETTER_AUTH_SECRET is required',
    }),
    BETTER_AUTH_URL: z.string().url(),
    RESEND_API_KEY: z
      .string()
      .min(1, { message: 'RESEND_API_KEY is required' }),
    // Cloudflare R2
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),

    GOOGLE_CLIENT_ID: z.string().min(1, {
      message: 'GOOGLE_CLIENT_ID is required',
    }),
    GOOGLE_CLIENT_SECRET: z.string().min(1, {
      message: 'GOOGLE_CLIENT_SECRET is required',
    }),
    REPLY_TO_EMAIL: z.string().email().optional(),
  },
  client: {
    NEXT_PUBLIC_URL: z.string().min(1, {
      message: 'NEXT_PUBLIC_URL is required',
    }),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,

    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

    RESEND_API_KEY: process.env.RESEND_API_KEY,
    REPLY_TO_EMAIL: process.env.REPLY_TO_EMAIL,

    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  },
});
