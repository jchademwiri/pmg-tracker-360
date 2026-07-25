import { headers } from 'next/headers';

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
];

export interface BotCheckParams {
  honeypot?: string;
  formMountedAt?: number;
  email?: string;
}

export interface BotCheckResult {
  isBot: boolean;
  reason?: string;
}

/**
 * Inspects a registration attempt for indicators of automated bot / AI agent activity.
 */
export async function verifyBotProtection({
  honeypot,
  formMountedAt,
  email,
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

  // 3. Disposable Email Domain Check
  if (email && typeof email === 'string') {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      return {
        isBot: true,
        reason: 'Disposable or temporary email addresses are not allowed.',
      };
    }
  }

  // 4. User-Agent and Request Header Verification
  try {
    const headerList = await headers();
    const userAgent = (headerList.get('user-agent') || '').toLowerCase();
    const acceptLanguage = headerList.get('accept-language');

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
    // Non-blocking if header lookup fails in unusual contexts
    console.error('Bot protection header inspection error:', error);
  }

  return { isBot: false };
}
