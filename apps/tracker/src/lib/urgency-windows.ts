/**
 * Centralized urgency window definitions for tender deadlines.
 *
 * These constants eliminate the three disagreeing magic-number definitions
 * that existed across dashboard-urgency.ts, tenders.ts, and tender-workload.ts.
 *
 * Rationale:
 * - CLOSING_THIS_WEEK (7d): Signals immediate-action urgency in dashboard banners.
 * - CLOSING_SOON (14d): Management preview in the Action Queue — catch things
 *   before they become urgent.
 * - UPCOMING (30d): Planning horizon for Upcoming Deadlines widgets and stats.
 */

export const URGENCY_WINDOWS = {
  /** Dashboard urgency banner: "closing this week" */
  CLOSING_THIS_WEEK_DAYS: 7,
  /** Action Queue "Closing Soon" tab */
  CLOSING_SOON_DAYS: 14,
  /** Upcoming Deadlines widget & stats card */
  UPCOMING_DEADLINES_DAYS: 30,
  /** Recent activity window (tenders updated within this period) */
  RECENT_ACTIVITY_DAYS: 7,
} as const;

/** Helper: compute a Date offset by `days` from now */
export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** Helper: compute a Date offset by `-days` from now (past) */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
