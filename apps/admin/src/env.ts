import { z } from "zod";

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
    .min(1, { message: "RESEND_API_KEY is required to send admin email" }),
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
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");

    // Fail fast only where it matters: real production builds. `next build`
    // always runs with NODE_ENV=production (previews included), so VERCEL_ENV
    // is the only reliable discriminator. Preview/local builds without email
    // credentials must still succeed — they just warn, since a preview can't
    // send mail anyway and a hard throw made every admin preview deployment
    // fail when RESEND_API_KEY was scoped to Production only.
    if (process.env.VERCEL_ENV === "production") {
      throw new Error(`Invalid admin environment variables:\n${issues}`);
    }

    console.warn(
      `[env] Warning: admin email environment is incomplete (preview/local build):\n${issues}\n[env] Email sending will fail at runtime in this deployment.`,
    );
    return raw as ServerEnv;
  }

  return parsed.data;
}

export const env = loadEnv();
