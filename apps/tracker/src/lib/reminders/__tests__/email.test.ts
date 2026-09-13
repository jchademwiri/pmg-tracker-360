process.env.DRY_RUN_EMAILS = "false";

jest.mock("resend", () => {
  const send = jest.fn();
  return {
    Resend: jest.fn(() => ({ emails: { send } })),
    __mockSend: send,
  };
});

import { sendReminderEmail } from "../email";

const mockResendSend = jest.requireMock("resend").__mockSend as jest.Mock;

describe("sendReminderEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("passes the supplied idempotency key to Resend", async () => {
    await sendReminderEmail({
      to: "recipient@example.com",
      subject: "Reminder",
      react: null as never,
      idempotencyKey: "reminder/stable-key",
    });

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "recipient@example.com",
        subject: "Reminder",
      }),
      { idempotencyKey: "reminder/stable-key" },
    );
  });

  it("does not include recipient email in thrown error on failure", async () => {
    mockResendSend.mockResolvedValueOnce({
      data: null,
      error: { message: "rate limit exceeded" },
    });

    let thrown: Error | null = null;
    try {
      await sendReminderEmail({
        to: "sensitive-recipient@example.com",
        subject: "Reminder",
        react: null as never,
        idempotencyKey: "reminder/key",
      });
    } catch (err) {
      thrown = err as Error;
    }

    expect(thrown).not.toBeNull();
    expect(thrown?.message).toBe(
      "Failed to send reminder email: rate limit exceeded",
    );
    expect(thrown?.message).not.toContain("sensitive-recipient@example.com");
  });
});
