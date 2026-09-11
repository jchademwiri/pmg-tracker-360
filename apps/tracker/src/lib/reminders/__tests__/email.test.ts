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
});
