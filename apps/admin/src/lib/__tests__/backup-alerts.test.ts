import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();

vi.mock("@/lib/email-config", () => ({
  resend: { emails: { send: (...args: unknown[]) => sendMock(...args) } },
  SENDER: "Tender Track 360 <no-reply@contact.tendertrack360.co.za>",
  REPLY_TO: "info@contact.tendertrack360.co.za",
}));

import { sendBackupFailureEmail } from "../backup-alerts";

describe("sendBackupFailureEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ error: null });
  });

  it("sends from the verified contact subdomain to the alert recipient", async () => {
    await sendBackupFailureEmail({
      to: "ops@example.com",
      message: "Backup failed: connection timeout",
    });

    const payload = sendMock.mock.calls[0][0];
    expect(payload.from).toContain("@contact.tendertrack360.co.za");
    expect(payload.to).toBe("ops@example.com");
    expect(payload.replyTo).toBe("info@contact.tendertrack360.co.za");
  });

  it("includes the failure message in the subject and body", async () => {
    await sendBackupFailureEmail({
      to: "ops@example.com",
      message: "Backup failed: R2 storage unavailable",
    });

    const payload = sendMock.mock.calls[0][0];
    expect(payload.subject).toContain("Database backup failed");
    expect(payload.html).toContain("Backup failed: R2 storage unavailable");
  });

  it("escapes HTML in the failure message", async () => {
    await sendBackupFailureEmail({
      to: "ops@example.com",
      message: 'Failed: <script>alert("xss")</script>',
    });

    const { html } = sendMock.mock.calls[0][0];
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  // A failed alert must never look like a success — the cron route needs to
  // record that the notification itself did not go out.
  it("throws when Resend reports an error", async () => {
    sendMock.mockResolvedValue({
      error: { message: "domain is not verified" },
    });

    await expect(
      sendBackupFailureEmail({
        to: "ops@example.com",
        message: "Backup failed",
      }),
    ).rejects.toThrow("domain is not verified");
  });
});
