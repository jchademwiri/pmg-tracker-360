/**
 * Resolves the dynamic status of a tender based on its submission deadline.
 * If status is evaluation, awarded, or lost, it remains locked.
 * If date has passed, it is closed; otherwise open.
 */
export function resolveTenderStatus(
  status: string,
  submissionDate: Date | null
): 'open' | 'closed' | 'evaluation' | 'awarded' | 'lost' {
  const currentStatus =
    status === 'draft' || status === 'pending' || status === 'won'
      ? status === 'won'
        ? 'awarded'
        : 'open'
      : status;

  if (!submissionDate) {
    return currentStatus as any;
  }

  // If status is locked in evaluation, awarded, or lost, respect that choice
  if (['evaluation', 'awarded', 'lost'].includes(currentStatus)) {
    return currentStatus as any;
  }

  const now = new Date();
  const submission = new Date(submissionDate);

  // Normalize to midnights for safe date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const closingDay = new Date(
    submission.getFullYear(),
    submission.getMonth(),
    submission.getDate()
  );

  if (today <= closingDay) {
    return 'open';
  } else {
    return 'closed';
  }
}
