import { verifyBotProtection } from "../bot-protection";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({
    get: (key: string) => {
      if (key === "user-agent") {
        return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      }
      if (key === "accept-language") {
        return "en-US,en;q=0.9";
      }
      return null;
    },
  }),
}));

describe("verifyBotProtection", () => {
  it("allows valid human registration attempts", async () => {
    const result = await verifyBotProtection({
      honeypot: "",
      formMountedAt: Date.now() - 5000, // 5 seconds ago
      email: "user@example.com",
    });

    expect(result.isBot).toBe(false);
  });

  it("detects honeypot field submission (bot trap)", async () => {
    const result = await verifyBotProtection({
      honeypot: "http://spam-link.com",
      formMountedAt: Date.now() - 5000,
      email: "bot@example.com",
    });

    expect(result.isBot).toBe(true);
    expect(result.reason).toContain("honeypot");
  });

  it("detects automated instant velocity submissions (< 1.5s)", async () => {
    const result = await verifyBotProtection({
      honeypot: "",
      formMountedAt: Date.now() - 200, // submitted in 200ms
      email: "bot@example.com",
    });

    expect(result.isBot).toBe(true);
    expect(result.reason).toContain("too quickly");
  });

  it("blocks disposable / temporary email domains", async () => {
    const result = await verifyBotProtection({
      honeypot: "",
      formMountedAt: Date.now() - 5000,
      email: "testbot@mailinator.com",
    });

    expect(result.isBot).toBe(true);
    expect(result.reason).toContain("Disposable");
  });

  it("detects automated headless browser / scraper user-agents", async () => {
    const { headers } = require("next/headers");
    headers.mockResolvedValueOnce({
      get: (key: string) => {
        if (key === "user-agent") return "Python-requests/2.31.0";
        if (key === "accept-language") return "en-US";
        return null;
      },
    });

    const result = await verifyBotProtection({
      honeypot: "",
      formMountedAt: Date.now() - 5000,
      email: "user@example.com",
    });

    expect(result.isBot).toBe(true);
    expect(result.reason).toContain("Automated browser client");
  });

  it("detects randomized gibberish account names (e.g. gjXXbSUjXRQzMhoVQw)", async () => {
    const result = await verifyBotProtection({
      name: "gjXXbSUjXRQzMhoVQw",
      email: "reservations@angelinnthesand.com",
      honeypot: "",
      formMountedAt: Date.now() - 5000,
    });

    expect(result.isBot).toBe(true);
    expect(result.reason).toContain("Invalid or automated account name");
  });

  it("allows valid human names like Jacob Chademwiri", async () => {
    const result = await verifyBotProtection({
      name: "Jacob Chademwiri",
      email: "hello@example.com",
      honeypot: "",
      formMountedAt: Date.now() - 5000,
    });

    expect(result.isBot).toBe(false);
  });
});
