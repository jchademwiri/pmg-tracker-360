export const AGEING_BUCKETS = [
  'current',
  'days1To30',
  'days31To60',
  'days61To90',
  'days90Plus',
] as const;

export type AgeingBucketKey = (typeof AGEING_BUCKETS)[number];

export type StatementAgeingInput = {
  dueDate: Date | string | null | undefined;
  balanceDue: number | string | null | undefined;
};

export type StatementAgeingSummary = Record<AgeingBucketKey, number> & {
  totalDue: number;
};

export const EMPTY_STATEMENT_AGEING_SUMMARY: StatementAgeingSummary = {
  current: 0,
  days1To30: 0,
  days31To60: 0,
  days61To90: 0,
  days90Plus: 0,
  totalDue: 0,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toNumericAmount(amount: StatementAgeingInput['balanceDue']) {
  if (amount === null || amount === undefined || amount === '') {
    return 0;
  }

  const numericAmount =
    typeof amount === 'string'
      ? Number.parseFloat(amount.replace(/[Rr\s,]/g, ''))
      : amount;

  return Number.isFinite(numericAmount) ? numericAmount : 0;
}

function toUtcDateOnly(value: Date | string | null | undefined) {
  if (!value) return null;

  if (typeof value === 'string') {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;

      return Date.UTC(Number(year), Number(month) - 1, Number(day));
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getAgeingBucket(
  dueDate: StatementAgeingInput['dueDate'],
  asOf: Date | string = new Date()
): AgeingBucketKey {
  const dueDateOnly = toUtcDateOnly(dueDate);
  const asOfDateOnly = toUtcDateOnly(asOf);

  if (!dueDateOnly || !asOfDateOnly) {
    return 'current';
  }

  const daysOverdue = Math.floor((asOfDateOnly - dueDateOnly) / DAY_IN_MS);

  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return 'days1To30';
  if (daysOverdue <= 60) return 'days31To60';
  if (daysOverdue <= 90) return 'days61To90';

  return 'days90Plus';
}

export function calculateStatementAgeing(
  rows: StatementAgeingInput[],
  asOf: Date | string = new Date()
): StatementAgeingSummary {
  const summary: StatementAgeingSummary = {
    ...EMPTY_STATEMENT_AGEING_SUMMARY,
  };

  for (const row of rows) {
    const balanceDue = toNumericAmount(row.balanceDue);

    if (balanceDue <= 0) {
      continue;
    }

    const bucket = getAgeingBucket(row.dueDate, asOf);
    summary[bucket] += balanceDue;
    summary.totalDue += balanceDue;
  }

  return summary;
}

export function hasStatementAgeingBalance(summary: StatementAgeingSummary) {
  return AGEING_BUCKETS.some((bucket) => summary[bucket] > 0);
}
