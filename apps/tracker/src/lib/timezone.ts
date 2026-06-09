/**
 * South African Standard Time (SAST) = UTC+2
 * All date operations in this app use SAST as the canonical timezone.
 */

export const SAST_TIMEZONE = 'Africa/Johannesburg';
export const SAST_OFFSET_HOURS = 2;
export const SAST_OFFSET_MS = SAST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Get the current date/time adjusted to SAST.
 * Use this instead of `new Date()` for deadline comparisons and "now" references.
 */
export function nowInSAST(): Date {
  return new Date(Date.now());
}

/**
 * Format a Date as a SAST-local YYYY-MM-DD string.
 * Safe for date inputs and database storage.
 */
export function toSASTDateString(
  date: Date | string | null | undefined
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SAST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Format a Date as a SAST-local YYYY-MM-DDTHH:mm string.
 * Safe for datetime-local inputs.
 */
export function toSASTDateTimeString(
  date: Date | string | null | undefined
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: SAST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Parse a YYYY-MM-DD string into a UTC midnight Date.
 * Prevents timezone offset issues when storing date-only values.
 */
export function parseDateToUTC(
  dateStr: string | null | undefined
): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Parse a YYYY-MM-DDTHH:mm string into a UTC Date.
 * The input is assumed to be in SAST (UTC+2).
 */
export function parseDateTimeToUTC(
  dateTimeStr: string | null | undefined
): Date | null {
  if (!dateTimeStr) return null;
  const [datePart, timePart] = dateTimeStr.split('T');
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  if (!year || !month || !day) return null;

  // Create a UTC date from the SAST values, then subtract the offset
  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hours || 0, minutes || 0)
  );
  utcDate.setUTCHours(utcDate.getUTCHours() - SAST_OFFSET_HOURS);
  return utcDate;
}
