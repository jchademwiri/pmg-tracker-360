export function getDeadlineUrgencyClass(daysUntil: number | null): string {
  if (daysUntil === null) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  if (daysUntil <= 1) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }

  if (daysUntil <= 3) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  }

  if (daysUntil <= 7) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  }

  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
}

export function getDeadlineUrgencyLabel(daysUntil: number | null): string {
  if (daysUntil === null) return 'No deadline';
  if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return '1 day left';
  return `${daysUntil} days left`;
}

export function isUrgentDeadline(daysUntil: number | null): boolean {
  return daysUntil !== null && daysUntil >= 0 && daysUntil <= 3;
}
