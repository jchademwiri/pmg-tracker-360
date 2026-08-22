process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

import {
  REMINDER_STAGE_OFFSETS,
  REMINDER_STAGES,
  REMINDER_PREFERENCE_GATE,
  stageLabel,
  type ReminderStageValue,
  type ReminderTypeValue,
} from "../config";
import { getReminderPreferences } from "../preferences";

// Mock @pmg/db
jest.mock("@pmg/db", () => {
  const mockFrom = jest.fn();
  const mockSelect = jest.fn(() => ({ from: mockFrom }));
  return {
    db: {
      select: mockSelect,
    },
  };
});

describe("Reminders Config & Helpers", () => {
  describe("stageLabel", () => {
    it("returns correct human-readable labels for each stage", () => {
      expect(stageLabel("upcoming_7d")).toBe("Due in 7 days");
      expect(stageLabel("upcoming_1d")).toBe("Due tomorrow");
      expect(stageLabel("due_today")).toBe("Due today");
      expect(stageLabel("overdue")).toBe("Overdue");
    });
  });

  describe("REMINDER_STAGE_OFFSETS", () => {
    it("defines correct relative day offsets", () => {
      expect(REMINDER_STAGE_OFFSETS.upcoming_7d).toBe(7);
      expect(REMINDER_STAGE_OFFSETS.upcoming_1d).toBe(1);
      expect(REMINDER_STAGE_OFFSETS.due_today).toBe(0);
      expect(REMINDER_STAGE_OFFSETS.overdue).toBe(-1);
    });
  });

  describe("REMINDER_PREFERENCE_GATE", () => {
    it("maps all reminder types to valid notification preference keys", () => {
      const expectedGates: Record<ReminderTypeValue, string> = {
        tender_submission: "tenderReminders",
        tender_evaluation: "tenderReminders",
        tender_briefing: "tenderReminders",
        tender_follow_up: "tenderReminders",
        project_contract_end: "projectUpdates",
        project_close_out: "projectUpdates",
        po_expected_delivery: "calendarReminders",
      };

      for (const [type, gate] of Object.entries(expectedGates)) {
        expect(REMINDER_PREFERENCE_GATE[type as ReminderTypeValue]).toBe(gate);
      }
    });
  });

  describe("getReminderPreferences", () => {
    const { db } = require("@pmg/db");

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("returns user preferences from DB when available", async () => {
      const mockRow = {
        emailNotifications: true,
        tenderReminders: false,
        projectUpdates: true,
        calendarReminders: false,
      };

      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([mockRow]),
          }),
        }),
      });

      const prefs = await getReminderPreferences("user-123");
      expect(prefs).toEqual(mockRow);
    });

    it("returns default preferences when no user row exists", async () => {
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockReturnValueOnce({
            limit: jest.fn().mockResolvedValueOnce([]),
          }),
        }),
      });

      const prefs = await getReminderPreferences("user-unknown");
      expect(prefs).toEqual({
        emailNotifications: true,
        tenderReminders: true,
        projectUpdates: true,
        calendarReminders: true,
      });
    });
  });
});
