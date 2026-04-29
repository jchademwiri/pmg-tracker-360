// Simplified env — all auth/email/storage vars are optional until Phase 4
// This prevents build failures when those services aren't configured yet

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? 'stub-secret',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000',
  // Phase 4+
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  REPLY_TO_EMAIL: process.env.REPLY_TO_EMAIL ?? '',
  // Phase 5+ (file storage)
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ?? '',
};
