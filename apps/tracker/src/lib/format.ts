/**
 * Formats a date as "24 Feb 2026".
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
  }).format(new Date(date));
}

/**
 * Formats a date + time as "24 Feb 2026, 10:00".
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
  }).format(new Date(date));
}

export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
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
