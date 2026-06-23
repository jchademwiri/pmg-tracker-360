import {
  calculateStatementAgeing,
  getAgeingBucket,
  hasStatementAgeingBalance,
} from '../ageing';

const asOf = '2026-06-22';

describe('getAgeingBucket', () => {
  it('keeps invoices due today in current', () => {
    expect(getAgeingBucket('2026-06-22', asOf)).toBe('current');
  });

  it('keeps invoices not yet due in current', () => {
    expect(getAgeingBucket('2026-06-23', asOf)).toBe('current');
  });

  it.each([
    ['2026-06-21', 'days1To30'],
    ['2026-05-23', 'days1To30'],
    ['2026-05-22', 'days31To60'],
    ['2026-04-23', 'days31To60'],
    ['2026-04-22', 'days61To90'],
    ['2026-03-24', 'days61To90'],
    ['2026-03-23', 'days90Plus'],
  ] as const)('places due date %s in %s', (dueDate, bucket) => {
    expect(getAgeingBucket(dueDate, asOf)).toBe(bucket);
  });

  it('treats missing or invalid due dates as current', () => {
    expect(getAgeingBucket(null, asOf)).toBe('current');
    expect(getAgeingBucket('not-a-date', asOf)).toBe('current');
  });
});

describe('calculateStatementAgeing', () => {
  it('sums outstanding balances into due-date ageing buckets', () => {
    const summary = calculateStatementAgeing(
      [
        { dueDate: '2026-06-22', balanceDue: 100 },
        { dueDate: '2026-06-21', balanceDue: '200.50' },
        { dueDate: '2026-05-22', balanceDue: 'R 300.25' },
        { dueDate: '2026-04-22', balanceDue: 400 },
        { dueDate: '2026-03-23', balanceDue: '500' },
      ],
      asOf
    );

    expect(summary).toEqual({
      current: 100,
      days1To30: 200.5,
      days31To60: 300.25,
      days61To90: 400,
      days90Plus: 500,
      totalDue: 1500.75,
    });
  });

  it('excludes paid, credited, empty, and invalid balances', () => {
    const summary = calculateStatementAgeing(
      [
        { dueDate: '2026-06-01', balanceDue: 0 },
        { dueDate: '2026-06-01', balanceDue: -100 },
        { dueDate: '2026-06-01', balanceDue: '' },
        { dueDate: '2026-06-01', balanceDue: 'abc' },
        { dueDate: '2026-06-01', balanceDue: 250 },
      ],
      asOf
    );

    expect(summary.days1To30).toBe(250);
    expect(summary.totalDue).toBe(250);
  });

  it('returns an empty summary when there are no outstanding balances', () => {
    const summary = calculateStatementAgeing(
      [{ dueDate: '2026-06-01', balanceDue: 0 }],
      asOf
    );

    expect(hasStatementAgeingBalance(summary)).toBe(false);
    expect(summary.totalDue).toBe(0);
  });
});
