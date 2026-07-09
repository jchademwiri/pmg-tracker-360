import { toSASTDateString, toSASTDateTimeString, parseDateToUTC, parseDateTimeToUTC } from './timezone';

/**
 * Sanitizes a tender number by:
 * - Trimming whitespace
 * - Converting to lowercase (stored lowercase, displayed uppercase)
 * - Replacing forward slashes (/) with hyphens (-)
 * - Replacing backslashes (\) with hyphens (-)
 * - Replacing spaces ( ) with hyphens (-)
 * - Replacing other URL-unsafe characters with hyphens
 * - Collapsing multiple consecutive hyphens into one
 * - Trimming leading/trailing hyphens
 *
 * Storage:  "DRT 03/01/2026" → "drt-03-01-2026"
 * Display:  toUpperCase() on render → "DRT-03-01-2026"
 */
export function sanitizeTenderNumber(tenderNumber: string): string {
  return tenderNumber
    .trim()
    .toLowerCase()
    .replace(/[\\/]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isDateOnlyUtcMidnight(date: Date) {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

function getSastEndOfDateOnlyDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      21,
      59,
      59,
      999
    )
  );
}

/**
 * Resolves the dynamic status of a tender based on its submission deadline.
 * If status is evaluation, awarded, or lost, it remains locked.
 * If date has passed, it is closed; otherwise open.
 */
export function resolveTenderStatus(
  status: string,
  submissionDate: Date | null
): 'open' | 'closed' | 'evaluation' | 'awarded' | 'lost' | 'cancelled' {
  // Map legacy statuses to canonical values
  let currentStatus = status;
  if (status === 'pending') {
    currentStatus = 'open';
  }

  if (!submissionDate) {
    return currentStatus as any;
  }

  // If status is locked in evaluation, awarded, lost, or cancelled, respect that choice
  if (['evaluation', 'awarded', 'lost', 'cancelled'].includes(currentStatus)) {
    return currentStatus as any;
  }

  const now = new Date();
  const submission = new Date(submissionDate);
  const deadline = isDateOnlyUtcMidnight(submission)
    ? getSastEndOfDateOnlyDay(submission)
    : submission;

  if (now <= deadline) {
    return 'open';
  } else {
    return 'closed';
  }
}

/**
 * Formats a Date object to a YYYY-MM-DD string timezone-safely using South African Standard Time (SAST).
 */

export function toLocalDateString(date: Date | string | null | undefined): string {
  return toSASTDateString(date);
}

/**
 * Parses a YYYY-MM-DD string into a UTC midnight Date object to prevent browser timezone offsets.
 */
export function fromLocalDateString(dateStr: string | null | undefined): Date | null {
  return parseDateToUTC(dateStr);
}

export function toLocalDateTimeString(
  date: Date | string | null | undefined
): string {
  return toSASTDateTimeString(date);
}

export function fromLocalDateTimeString(
  dateTimeStr: string | null | undefined
): Date | null {
  return parseDateTimeToUTC(dateTimeStr);
}
