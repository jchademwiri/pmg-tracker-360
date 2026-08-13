import { z } from 'zod';

/**
 * Server environment validation for the admin app.
 *
 * The admin app previously read every email variable straight off
 * `process.env` with no validation, so a missing `RESEND_API_KEY` surfaced as a
 * silently mocked "successful" send rather than an error. Validating here means
 * a misconfigured deployment fails at build time instead of quietly dropping
 * mail.
 *
 * Set `SKIP_ENV_VALIDATION=1` to bypass (useful for lint/typecheck-only CI
 * steps that never send email).
 */
const serverSchema = z.object({
  RESEND_API_KEY: z
    .string()
    .min(1, { message: 'RESEND_API_KEY is required to send admin email' }),
  SENDER_NAME: z.string().optional(),
  SENDER_EMAIL: z.string().optional(),
  REPLY_TO_EMAIL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function loadEnv(): ServerEnv {
  const raw = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SENDER_NAME: process.env.SENDER_NAME,
    SENDER_EMAIL: process.env.SENDER_EMAIL,
    REPLY_TO_EMAIL: process.env.REPLY_TO_EMAIL,
  };

  if (process.env.SKIP_ENV_VALIDATION) {
    return raw as ServerEnv;
  }

  const parsed = serverSchema.safeParse(raw);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid admin environment variables:\n${issues}`);
  }

  return parsed.data;
}

export const env = loadEnv();
