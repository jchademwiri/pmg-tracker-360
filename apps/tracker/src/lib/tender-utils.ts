/**
 * Resolves the dynamic status of a tender based on its submission deadline.
 * If status is evaluation, awarded, or lost, it remains locked.
 * If date has passed, it is closed; otherwise open.
 */
export function resolveTenderStatus(
  status: string,
  submissionDate: Date | null
): 'open' | 'closed' | 'evaluation' | 'awarded' | 'lost' | 'cancelled' {
  const currentStatus =
    status === 'draft' || status === 'pending' || status === 'won'
      ? status === 'won'
        ? 'awarded'
        : 'open'
      : status;

  if (!submissionDate) {
    return currentStatus as any;
  }

  // If status is locked in evaluation, awarded, lost, or cancelled, respect that choice
  if (['evaluation', 'awarded', 'lost', 'cancelled'].includes(currentStatus)) {
    return currentStatus as any;
  }

  const now = new Date();
  const submission = new Date(submissionDate);

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
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Parses a YYYY-MM-DD string into a UTC midnight Date object to prevent browser timezone offsets.
 */
export function fromLocalDateString(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export function toLocalDateTimeString(
  date: Date | string | null | undefined
): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function fromLocalDateTimeString(
  dateTimeStr: string | null | undefined
): Date | null {
  if (!dateTimeStr) return null;
  const date = new Date(dateTimeStr);
  return isNaN(date.getTime()) ? null : date;
}
