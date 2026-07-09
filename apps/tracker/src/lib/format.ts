import { SAST_TIMEZONE } from './timezone';

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

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(numericAmount);
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
