import type { reminderStage, reminderType } from "@pmg/db/schema";

export type ReminderTypeValue = (typeof reminderType.enumValues)[number];
export type ReminderStageValue = (typeof reminderStage.enumValues)[number];

/**
 * Day offsets for each reminder stage, relative to the target date.
 * Positive = days before the target date, negative = days after (overdue).
 * Shared across all reminder types — see plan for why this isn't per-org configurable.
 */
export const REMINDER_STAGE_OFFSETS: Record<ReminderStageValue, number> = {
  upcoming_7d: 7,
  upcoming_1d: 1,
  due_today: 0,
  overdue: -1,
};

export const REMINDER_STAGES: ReminderStageValue[] = [
  "upcoming_7d",
  "upcoming_1d",
  "due_today",
  "overdue",
];

/** Which notificationPreferences boolean gates a given reminder type. */
export const REMINDER_PREFERENCE_GATE: Record<
  ReminderTypeValue,
  "tenderReminders" | "projectUpdates" | "calendarReminders"
> = {
  tender_submission: "tenderReminders",
  tender_evaluation: "tenderReminders",
  tender_briefing: "tenderReminders",
  tender_follow_up: "tenderReminders",
  project_contract_end: "projectUpdates",
  project_close_out: "projectUpdates",
  po_expected_delivery: "calendarReminders",
};

/** Human-readable label used in email subjects/copy for each stage. */
export function stageLabel(stage: ReminderStageValue): string {
  switch (stage) {
    case "upcoming_7d":
      return "Due in 7 days";
    case "upcoming_1d":
      return "Due tomorrow";
    case "due_today":
      return "Due today";
    case "overdue":
      return "Overdue";
  }
}
