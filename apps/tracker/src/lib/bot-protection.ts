import { headers } from 'next/headers';
import { env } from '@/env';

/**
 * List of common disposable/temporary email provider domains
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'dispostable.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'getairmail.com',
  'throwawaymail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'angelinnthesand.com',
  'maildrop.cc',
  'inboxkitten.com',
  'disposablemail.com',
  'receive-smss.com',
  'tempmailo.com',
]);

/**
 * Known automated bot / scraper / headless browser User-Agent substrings
 */
const BOT_USER_AGENTS = [
  'python-requests',
  'python-urllib',
  'aiohttp',
  'httpx',
  'curl',
  'wget',
  'puppeteer',
  'playwright',
  'selenium',
  'headlesschrome',
  'phantomjs',
  'scrapy',
  'gptbot',
  'claudebot',
  'bytespider',
  'ccbot',
  'diffbot',
  'facebookexternalhit',
  'axios',
  'postmanruntime',
  'insomnia',
];

export interface BotCheckParams {
  name?: string;
  email?: string;
  honeypot?: string;
  formMountedAt?: number;
  turnstileToken?: string;
}

export interface BotCheckResult {
  isBot: boolean;
  reason?: string;
}

/**
 * Helper to detect suspicious auto-generated / gibberish names (e.g. gjXXbSUjXRQzMhoVQw)
 */
export function isGibberishName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 10) return false;

  // Single word with no spaces or punctuation
  if (!trimmed.includes(' ') && !trimmed.includes('-') && !trimmed.includes('_')) {
    const vowels = (trimmed.match(/[aeiouAEIOU]/g) || []).length;
    const vowelRatio = vowels / trimmed.length;

    // Extremely low vowel ratio for a long single-word string
    if (vowels <= 1 || vowelRatio < 0.1) {
      return true;
    }

    // High upper/lower case transition frequency (random case mixing like gjXXbSUjXRQzMhoVQw)
    let caseTransitions = 0;
    for (let i = 1; i < trimmed.length; i++) {
      const prevIsUpper = trimmed[i - 1] >= 'A' && trimmed[i - 1] <= 'Z';
      const currIsUpper = trimmed[i] >= 'A' && trimmed[i] <= 'Z';
      const prevIsLower = trimmed[i - 1] >= 'a' && trimmed[i - 1] <= 'z';
      const currIsLower = trimmed[i] >= 'a' && trimmed[i] <= 'z';

      if ((prevIsUpper && currIsLower) || (prevIsLower && currIsUpper)) {
        caseTransitions++;
      }
    }

    if (caseTransitions / trimmed.length >= 0.4) {
      return true;
    }
  }

  return false;
}

/**
 * Verifies a Cloudflare Turnstile CAPTCHA response token against Cloudflare's siteverify API.
 */
export async function verifyTurnstileToken(
  token: string,
  secretKey: string,
  remoteIp?: string | null
): Promise<boolean> {
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = (await res.json()) as { success: boolean };
    return !!data.success;
  } catch (error) {
    console.error('Cloudflare Turnstile token verification error:', error);
    return false;
  }
}

/**
 * Inspects a registration attempt for indicators of automated bot / AI agent activity.
 */
export async function verifyBotProtection({
  name,
  email,
  honeypot,
  formMountedAt,
  turnstileToken,
}: BotCheckParams): Promise<BotCheckResult> {
  // 1. Honeypot Field Check (Honeypot field must be empty for human users)
  if (honeypot && honeypot.trim().length > 0) {
    return {
      isBot: true,
      reason: 'Automated submission detected (honeypot triggered).',
    };
  }

  // 2. Form Submission Velocity Check (Human submissions take > 1.5 seconds)
  if (formMountedAt && typeof formMountedAt === 'number') {
    const elapsedMs = Date.now() - formMountedAt;
    if (elapsedMs < 1500) {
      return {
        isBot: true,
        reason: 'Automated submission detected (form filled too quickly).',
      };
    }
  }

  // 3. Gibberish Name Check
  if (name && isGibberishName(name)) {
    return {
      isBot: true,
      reason: 'Invalid or automated account name detected.',
    };
  }

  // 4. Disposable Email Domain Check
  if (email && typeof email === 'string') {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      return {
        isBot: true,
        reason: 'Disposable or temporary email addresses are not allowed.',
      };
    }
  }

  // 5. Cloudflare Turnstile & Header Verification
  try {
    const headerList = await headers();
    const userAgent = (headerList.get('user-agent') || '').toLowerCase();
    const acceptLanguage = headerList.get('accept-language');
    const clientIp = headerList.get('x-forwarded-for') || headerList.get('cf-connecting-ip');

    const turnstileSecret = env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;
    const token = turnstileToken || headerList.get('x-turnstile-token') || headerList.get('cf-turnstile-response');

    if (turnstileSecret) {
      if (token) {
        const isValid = await verifyTurnstileToken(token, turnstileSecret, clientIp);
        if (!isValid) {
          return {
            isBot: true,
            reason: 'Turnstile CAPTCHA verification failed.',
          };
        }
      } else if (process.env.NODE_ENV === 'production') {
        return {
          isBot: true,
          reason: 'Security verification required (Turnstile token missing).',
        };
      }
    }

    // Check for known scraper/bot User-Agents
    for (const botKeyword of BOT_USER_AGENTS) {
      if (userAgent.includes(botKeyword)) {
        return {
          isBot: true,
          reason: 'Automated browser client detected.',
        };
      }
    }

    // Direct API bot calls using generic tools often omit Accept-Language header
    if (!acceptLanguage && !userAgent.includes('mozilla')) {
      return {
        isBot: true,
        reason: 'Missing browser language header.',
      };
    }
  } catch (error) {
    // Non-blocking if header lookup fails outside HTTP request context (e.g. unit tests)
  }

  return { isBot: false };
}

/**
 * In-memory sliding window rate limiter
 */
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

// Periodic garbage collection to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.expiresAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Checks if an IP or identifier has exceeded the allowed number of requests in a given window.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 10 * 60 * 1000
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  if (!existing || existing.expiresAt < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return { allowed: true };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((existing.expiresAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true };
}

/**
 * Extracts the client IP from request headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = headerList.get('x-real-ip') || headerList.get('cf-connecting-ip');
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // Fallback if called outside request context
  }
  return '127.0.0.1';
}

