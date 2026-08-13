import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn();

vi.mock('@/lib/email-config', () => ({
  resend: { emails: { send: (...args: unknown[]) => sendMock(...args) } },
  SENDER: 'Tender Track 360 <no-reply@contact.tendertrack360.co.za>',
  REPLY_TO: 'info@contact.tendertrack360.co.za',
}));

vi.mock('@/lib/urls', () => ({
  getAdminBaseURL: () => 'https://admin.tendertrack360.co.za',
}));

import { sendAdminInvitationEmail } from '../admin-invite-email';

describe('sendAdminInvitationEmail', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ error: null });
  });

  it('sends from the verified contact subdomain, not the apex', async () => {
    await sendAdminInvitationEmail({ to: 'new@example.com', name: 'New Admin' });

    const payload = sendMock.mock.calls[0][0];
    expect(payload.from).toContain('@contact.tendertrack360.co.za');
    expect(payload.to).toBe('new@example.com');
    expect(payload.replyTo).toBe('info@contact.tendertrack360.co.za');
  });

  it('links to the admin sign-in and never includes a password', async () => {
    await sendAdminInvitationEmail({ to: 'new@example.com', name: 'New Admin' });

    const { html } = sendMock.mock.calls[0][0];
    expect(html).toContain('https://admin.tendertrack360.co.za');
    expect(html).toContain('one-time verification code');
    expect(html.toLowerCase()).not.toContain('passphrase');
  });

  it('names the inviter when known', async () => {
    await sendAdminInvitationEmail({
      to: 'new@example.com',
      name: 'New Admin',
      invitedBy: 'Jacob',
    });

    expect(sendMock.mock.calls[0][0].html).toContain('added by Jacob');
  });

  // The whole point of the fix: a failed send must not look like a success.
  it('throws when Resend reports an error', async () => {
    sendMock.mockResolvedValue({
      error: { message: 'domain is not verified' },
    });

    await expect(
      sendAdminInvitationEmail({ to: 'new@example.com', name: 'New Admin' })
    ).rejects.toThrow('domain is not verified');
  });
});
