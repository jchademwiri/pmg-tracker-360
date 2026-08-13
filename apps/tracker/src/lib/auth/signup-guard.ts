import { verifyBotProtection } from '@/lib/bot-protection';

/**
 * The subset of Better Auth's hook context this guard depends on.
 */
export type SignUpGuardContext = {
  path?: string;
  request?: Request;
  body?: { name?: string; email?: string } | null;
};

/** Better Auth's endpoint path for email/password registration. */
export const SIGN_UP_EMAIL_PATH = '/sign-up/email';

/**
 * Bot-protects the public `POST /api/auth/sign-up/email` endpoint.
 *
 * That endpoint is exposed by the `[...all]` route handler, so without this it
 * can be called directly to create accounts, bypassing the Turnstile, honeypot
 * and disposable-email checks the sign-up form goes through.
 *
 * Only calls that actually arrived over HTTP are checked. Better Auth's router
 * sets `ctx.request` from the incoming `Request`, so a caller cannot forge its
 * absence; internal `auth.api.signUpEmail()` invocations leave it undefined.
 * Those trusted callers (the sign-up server action and the invite completion
 * route) verify first and hold the single-use Turnstile token, which is never
 * visible here — re-checking them would reject every legitimate signup.
 *
 * Returns the rejection reason when the request should be blocked, otherwise
 * `null`. Throwing the framework error is left to the caller in `auth.ts`.
 */
export async function checkDirectSignUp(
  ctx: SignUpGuardContext
): Promise<string | null> {
  if (ctx.path !== SIGN_UP_EMAIL_PATH) return null;
  if (!ctx.request) return null;

  const botCheck = await verifyBotProtection({
    name: ctx.body?.name,
    email: ctx.body?.email,
  });

  if (botCheck.isBot) {
    return botCheck.reason || 'Account creation rejected by security rules.';
  }

  return null;
}
