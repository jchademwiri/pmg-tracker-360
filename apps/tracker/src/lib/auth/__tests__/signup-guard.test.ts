import { checkDirectSignUp, SIGN_UP_EMAIL_PATH } from '../signup-guard';
import { verifyBotProtection } from '@/lib/bot-protection';

jest.mock('@/lib/bot-protection', () => ({
  verifyBotProtection: jest.fn(),
}));

const mockVerify = verifyBotProtection as jest.MockedFunction<
  typeof verifyBotProtection
>;

const httpRequest = () =>
  new Request('https://tendertrack360.co.za/api/auth/sign-up/email', {
    method: 'POST',
  });

const signUpBody = { name: 'Jacob Chademwiri', email: 'user@example.com' };

describe('checkDirectSignUp', () => {
  beforeEach(() => {
    mockVerify.mockReset();
    mockVerify.mockResolvedValue({ isBot: false });
  });

  it('rejects a direct HTTP sign-up flagged as a bot', async () => {
    mockVerify.mockResolvedValue({
      isBot: true,
      reason: 'Security verification required (Turnstile token missing).',
    });

    const rejection = await checkDirectSignUp({
      path: SIGN_UP_EMAIL_PATH,
      request: httpRequest(),
      body: signUpBody,
    });

    expect(rejection).toContain('Turnstile token missing');
  });

  it('allows a direct HTTP sign-up that passes the bot checks', async () => {
    const rejection = await checkDirectSignUp({
      path: SIGN_UP_EMAIL_PATH,
      request: httpRequest(),
      body: signUpBody,
    });

    expect(rejection).toBeNull();
    expect(mockVerify).toHaveBeenCalledWith({
      name: signUpBody.name,
      email: signUpBody.email,
    });
  });

  // Regression test for the outage this fix replaced: internal
  // `auth.api.signUpEmail()` calls have no `ctx.request` and never carry the
  // Turnstile token, so checking them here rejected every real signup.
  it('skips internal auth.api calls that have no request', async () => {
    const rejection = await checkDirectSignUp({
      path: SIGN_UP_EMAIL_PATH,
      body: signUpBody,
    });

    expect(rejection).toBeNull();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('ignores endpoints other than sign-up', async () => {
    const rejection = await checkDirectSignUp({
      path: '/sign-in/email',
      request: httpRequest(),
      body: signUpBody,
    });

    expect(rejection).toBeNull();
    expect(mockVerify).not.toHaveBeenCalled();
  });
});
