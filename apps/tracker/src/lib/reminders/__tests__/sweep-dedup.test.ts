process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";
process.env.SKIP_ENV_VALIDATION = "true";
process.env.DRY_RUN_EMAILS = "false";

jest.mock("@/server/notifications", () => ({
  createNotification: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/lib/reminders/recipients", () => ({
  getReminderRecipients: jest.fn(),
}));

jest.mock("@/lib/reminders/email", () => ({
  sendReminderEmail: jest.fn(),
}));

jest.mock("@/lib/reminders/preferences", () => ({
  getReminderPreferences: jest.fn(),
}));

jest.mock("nanoid", () => {
  let counter = 0;
  return { nanoid: jest.fn(() => `log-${++counter}`) };
});

/**
 * In-memory stand-in for the parts of the Drizzle query builder the sweep
 * uses, backed by a fake reminder_log table that enforces the same unique
 * constraint (entity_type, entity_id, stage, target_date) the real database
 * does. This exercises the claim-before-send dedup logic end-to-end without
 * a live Postgres instance.
 */
interface MockLogRow {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  stage: string;
  targetDate: Date;
  recipientCount: number;
}

const reminderLogTable: MockLogRow[] = [];

function conflictsWith(row: MockLogRow): boolean {
  return reminderLogTable.some(
    (existing) =>
      existing.entityType === row.entityType &&
      existing.entityId === row.entityId &&
      existing.stage === row.stage &&
      existing.targetDate.getTime() === row.targetDate.getTime(),
  );
}

/**
 * A thenable chain: every builder method returns the same object, and
 * awaiting it resolves to the terminal result captured when the chain was
 * created. Collector queries (select) therefore resolve to [] — no
 * candidates — while insert/update/delete terminals execute against the
 * fake table.
 */
function makeChain(
  terminal: () => Promise<unknown> = () => Promise.resolve([]),
) {
  const chain: Record<string, unknown> = {};
  for (const method of [
    "from",
    "where",
    "innerJoin",
    "leftJoin",
    "orderBy",
    "limit",
    "set",
    "values",
    "onConflictDoNothing",
    "returning",
  ]) {
    chain[method] = jest.fn(() => chain);
  }
  chain.then = (
    resolve: (value: unknown) => unknown,
    reject: (reason: unknown) => unknown,
  ) => terminal().then(resolve, reject);
  return chain;
}

// --- insert: captures .values(row), executes the unique-claim on .returning()
const insertChains: { row?: MockLogRow }[] = [];
const insertBuilder = {
  values: jest.fn((row: MockLogRow) => {
    const state: { row?: MockLogRow } = { row };
    insertChains.push(state);
    return makeChain(() => {
      if (state.row === undefined) return Promise.resolve([]);
      if (conflictsWith(state.row)) return Promise.resolve([]);
      reminderLogTable.push(state.row);
      return Promise.resolve([state.row]);
    });
  }),
};

// --- select: resolves to [] for every query shape (no candidates, no log hits)
const selectBuilder = makeChain(() => Promise.resolve([]));

// --- update: captures .set(patch), applies it to all rows on .where()
const updateBuilder = {
  set: jest.fn((patch: Partial<MockLogRow>) =>
    makeChain(() => {
      for (const row of reminderLogTable) {
        Object.assign(row, patch);
      }
      return Promise.resolve();
    }),
  ),
};

// --- delete: clears the fake table on .where()
const deleteBuilder = makeChain(() => {
  reminderLogTable.length = 0;
  return Promise.resolve();
});

jest.mock("@pmg/db", () => ({
  db: {
    insert: jest.fn(() => insertBuilder),
    select: jest.fn(() => selectBuilder),
    update: jest.fn(() => updateBuilder),
    delete: jest.fn(() => deleteBuilder),
  },
}));

jest.mock("@pmg/db/schema", () => ({
  tender: {},
  tenderExtension: {},
  tenderFollowUp: {},
  project: {},
  purchaseOrder: {},
  client: {},
  reminderLog: {},
}));

import {
  claimReminderSlot,
  matchStage,
  processReminderCandidate,
  releaseReminderSlot,
  runReminderSweep,
  type Candidate,
} from "../sweep";
import { sendReminderEmail } from "../email";
import { getReminderPreferences } from "../preferences";
import { getReminderRecipients } from "../recipients";

const mockSend = sendReminderEmail as jest.Mock;
const mockPreferences = getReminderPreferences as jest.Mock;
const mockRecipients = getReminderRecipients as jest.Mock;
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => undefined);

const candidate: Candidate = {
  entityType: "tender_submission",
  entityId: "tender-1",
  organizationId: "org-1",
  stage: "overdue",
  targetDate: new Date("2026-06-23T00:00:00.000Z"),
  // Never invoked by the claim/release paths under test.
  render: () => ({ subject: "Test reminder", react: null as never }),
};

beforeEach(() => {
  reminderLogTable.length = 0;
  jest.clearAllMocks();
  mockSend.mockResolvedValue(undefined);
  mockRecipients.mockResolvedValue([]);
  mockPreferences.mockResolvedValue({
    tenderReminders: true,
    projectUpdates: true,
    calendarReminders: true,
    emailNotifications: true,
  });
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe("reminder sweep dedup (claim-before-send)", () => {
  it("matches overdue only on the configured one-day-late boundary", () => {
    const now = new Date("2026-06-24T10:00:00.000Z");

    expect(matchStage(new Date("2026-06-23T10:00:00.000Z"), now)).toBe(
      "overdue",
    );
    expect(matchStage(new Date("2026-06-22T10:00:00.000Z"), now)).toBeNull();
    expect(matchStage(new Date("2025-06-23T10:00:00.000Z"), now)).toBeNull();
  });

  it("claims an unclaimed slot and reports the row inserted", async () => {
    const claimed = await claimReminderSlot(candidate);
    expect(claimed).toBe(true);
    expect(reminderLogTable).toHaveLength(1);
    expect(reminderLogTable[0].entityId).toBe("tender-1");
  });

  it("refuses to claim a slot already claimed by a previous sweep — the duplicate-overdue-email regression", async () => {
    // Day 1: sweep A claims (and would send).
    expect(await claimReminderSlot(candidate)).toBe(true);

    // A concurrent or manually retried sweep on the same reminder day must
    // fail to claim the same slot instead of re-sending it.
    const claimedAgain = await claimReminderSlot({
      ...candidate,
      targetDate: new Date("2026-06-23T00:00:00.000Z"),
    });
    expect(claimedAgain).toBe(false);
    expect(reminderLogTable).toHaveLength(1);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("treats a different targetDate as a separate reminder slot", async () => {
    expect(await claimReminderSlot(candidate)).toBe(true);

    const claimedForNewDate = await claimReminderSlot({
      ...candidate,
      targetDate: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(claimedForNewDate).toBe(true);
    expect(reminderLogTable).toHaveLength(2);
  });

  it("releases a failed claim so the next sweep can retry the send", async () => {
    await claimReminderSlot(candidate);
    expect(reminderLogTable).toHaveLength(1);

    await releaseReminderSlot(candidate);
    expect(reminderLogTable).toHaveLength(0);

    // Retry succeeds after release.
    expect(await claimReminderSlot(candidate)).toBe(true);
  });

  it("sends once with a stable recipient idempotency key and records delivery", async () => {
    mockRecipients.mockResolvedValue([
      { userId: "u1", name: "Alice", email: "alice@example.com" },
    ]);
    const deliveryCandidate = {
      ...candidate,
      organizationId: "org-delivery",
    };

    await expect(processReminderCandidate(deliveryCandidate)).resolves.toEqual({
      status: "sent",
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith({
      to: "alice@example.com",
      subject: "Test reminder",
      react: null,
      idempotencyKey: expect.stringMatching(/^reminder\/[a-f0-9]{64}$/),
    });
    expect(reminderLogTable[0].recipientCount).toBe(1);

    await expect(processReminderCandidate(deliveryCandidate)).resolves.toEqual({
      status: "skipped",
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("retains the claim after an ambiguous provider failure so it cannot resend", async () => {
    mockRecipients.mockResolvedValue([
      { userId: "u-timeout", name: "Timeout", email: "timeout@example.com" },
    ]);
    mockSend.mockRejectedValueOnce(new Error("provider timeout"));
    const timeoutCandidate = {
      ...candidate,
      organizationId: "org-timeout",
    };

    await expect(processReminderCandidate(timeoutCandidate)).resolves.toEqual({
      status: "failed",
      error: "provider timeout",
    });
    expect(reminderLogTable).toHaveLength(1);
    expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(
      "timeout@example.com",
    );

    mockSend.mockResolvedValue(undefined);
    await expect(processReminderCandidate(timeoutCandidate)).resolves.toEqual({
      status: "skipped",
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("releases the claim when failure happens before any delivery side effect", async () => {
    mockRecipients.mockResolvedValue([
      { userId: "u-prefs", name: "Prefs", email: "prefs@example.com" },
    ]);
    mockPreferences.mockRejectedValueOnce(new Error("preferences unavailable"));
    const preferencesCandidate = {
      ...candidate,
      organizationId: "org-preferences",
    };

    await expect(
      processReminderCandidate(preferencesCandidate),
    ).resolves.toEqual({
      status: "failed",
      error: "preferences unavailable",
    });
    expect(reminderLogTable).toHaveLength(0);
  });

  it("runReminderSweep no-ops safely when no candidates match", async () => {
    const result = await runReminderSweep();

    expect(result.success).toBe(true);
    expect(result.sent).toBe(0);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
