import { toSASTDateString, toSASTDateTimeString, parseDateToUTC, parseDateTimeToUTC } from './timezone';

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

  // Compare timestamps directly - submission dates are stored as UTC midnight
  // which aligns with SAST date comparisons
  if (now <= submission) {
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
