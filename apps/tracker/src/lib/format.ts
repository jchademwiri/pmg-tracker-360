import { SAST_TIMEZONE } from './timezone';

const KNOWN_UPPERCASE_ACRONYMS = new Set([
  'SOC',
  'LTD',
  'PTY',
  'NPC',
  'JV',
  'CC',
  'CO',
  'RF',
  'SOE',
  'DWS',
  'PRASA',
  'SANRAL',
  'SARS',
  'SABC',
  'PMG',
  'CSIR',
  'SITA',
  'SAPO',
  'SAPS',
]);

const LOWERCASE_ARTICLES = new Set([
  'of',
  'and',
  'the',
  'in',
  'on',
  'at',
  'to',
  'for',
  'by',
  'with',
  'a',
  'an',
]);

/**
 * Formats a client/organization name with proper title casing while preserving
 * standard South African business acronyms (SOC, LTD, PTY, JV, etc.).
 * e.g. "ESKOM HOLDINGS SOC LTD" -> "Eskom Holdings SOC LTD"
 * e.g. "CITY OF TSHWANE" -> "City of Tshwane"
 */
export function formatClientName(value: string | null | undefined): string {
  if (!value) return '';
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (KNOWN_UPPERCASE_ACRONYMS.has(cleanWord)) {
        return word.toUpperCase();
      }
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_ARTICLES.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Capitalizes the first letter of every word ("Title Case").
 * "CITY OF TSHWANE" -> "City Of Tshwane", "City of Ekurhuleni" -> "City Of Ekurhuleni".
 */
export function toTitleCase(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


/**
 * Formats a date as "24 Feb 2026" in SAST timezone.
 * Pass a fallback string as the second argument (default '-').
 */
export function formatDate(
  date: Date | string | null | undefined,
  fallback = '-'
): string {
  if (!date) return fallback;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: SAST_TIMEZONE,
  }).format(new Date(date));
}

/**
 * Formats a date + time as "24 Feb 2026, 10:00" in SAST timezone.
 * Pass a fallback string as the second argument (default '-').
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  fallback = '-'
): string {
  if (!date) return fallback;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SAST_TIMEZONE,
  }).format(new Date(date));
}

/**
 * Formats a monetary value as South African Rand (ZAR).
 * Accepts number, numeric string, null, or undefined.
 *
 * Deliberately does NOT use Intl.NumberFormat's 'en-ZA' currency style: its
 * digit-group separator (comma vs. narrow no-break space) depends on the
 * runtime's ICU/CLDR data, which differs between Node (SSR) and the
 * browser (CSR) — causing a React hydration mismatch on every rendered
 * currency value. 'en-US' grouping is a plain comma everywhere, so we
 * format the digits with it and prepend "R" ourselves for a
 * deterministic result regardless of runtime.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  if (amount === null || amount === undefined || amount === '') return 'R 0';

  const numericAmount =
    typeof amount === 'string'
      ? parseFloat(amount.replace(/[Rr\s,]/g, ''))
      : amount;

  if (isNaN(numericAmount)) return 'R 0';

  const minimumFractionDigits = options.minimumFractionDigits ?? 0;
  const maximumFractionDigits = options.maximumFractionDigits ?? minimumFractionDigits;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Math.abs(numericAmount));

  const sign = numericAmount < 0 ? '-' : '';
  return `${sign}R ${formatted}`;
}

export function formatNumber(
  amount: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    ...options,
  }).format(amount);
}

export function formatPercentage(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options,
  }).format(value / 100);
}

/**
 * Formats a byte count into a human-readable file size string.
 * e.g. 1024 → "1 KB", 1048576 → "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
