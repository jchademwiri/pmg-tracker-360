import { describe, it, expect, vi, beforeEach } from "vitest";

// r2-health.ts imports "server-only", a build-time guard that throws outside
// a React Server Components bundler context. Stub it for unit tests.
vi.mock("server-only", () => ({}));

// The module under test resolves storage through backup.ts's env-driven
// client; we replace getBackupStorage entirely so tests drive both the
// not-configured path and every HeadBucket failure class without touching
// real environment variables or the network.
const sendMock = vi.fn();
const storageMock = vi.fn();

vi.mock("@/lib/backup", () => ({
  getBackupStorage: (...args: unknown[]) => storageMock(...args),
}));

import { checkR2Connection } from "../r2-health";

describe("checkR2Connection", () => {
  beforeEach(() => {
    sendMock.mockReset();
    storageMock.mockReset();
    sendMock.mockResolvedValue({});
  });

  it("returns ok with latency on a successful HeadBucket", async () => {
    storageMock.mockReturnValue({ s3: { send: sendMock }, bucket: "test-bucket" });

    const result = await checkR2Connection();

    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeTypeOf("number");
    expect(result.message).toContain("test-bucket");
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("returns not_configured when no storage is resolvable", async () => {
    storageMock.mockReturnValue(null);

    const result = await checkR2Connection();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured");
    expect(result.message).toContain("R2_ACCOUNT_ID");
  });

  it("classifies 401 metadata as unauthorized with remediation hint", async () => {
    storageMock.mockReturnValue({ s3: { send: sendMock }, bucket: "test-bucket" });
    sendMock.mockRejectedValue({
      name: "Unauthorized",
      $metadata: { httpStatusCode: 401 },
      message: "Unauthorized",
    });

    const result = await checkR2Connection();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("unauthorized");
    expect(result.message).toContain("R2_ACCESS_KEY_ID");
  });

  it("classifies 403 metadata as forbidden", async () => {
    storageMock.mockReturnValue({ s3: { send: sendMock }, bucket: "test-bucket" });
    sendMock.mockRejectedValue({
      name: "Forbidden",
      $metadata: { httpStatusCode: 403 },
      message: "Forbidden",
    });

    const result = await checkR2Connection();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("forbidden");
  });

  it("classifies 404 as bucket not found with working credentials", async () => {
    storageMock.mockReturnValue({ s3: { send: sendMock }, bucket: "test-bucket" });
    sendMock.mockRejectedValue({
      name: "NotFound",
      $metadata: { httpStatusCode: 404 },
      message: "Not Found",
    });

    const result = await checkR2Connection();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_found");
    expect(result.message).toContain("R2_BUCKET_NAME");
  });

  it("classifies CredentialsProviderError as unauthorized", async () => {
    storageMock.mockReturnValue({ s3: { send: sendMock }, bucket: "test-bucket" });
    sendMock.mockRejectedValue({
      name: "CredentialsProviderError",
      message: "Could not load credentials from any providers",
    });

    const result = await checkR2Connection();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("unauthorized");
  });

  it("classifies network failures as network_error", async () => {
    storageMock.mockReturnValue({ s3: { send: sendMock }, bucket: "test-bucket" });
    sendMock.mockRejectedValue({
      name: "NetworkingError",
      message: "fetch failed: ENOTFOUND",
    });

    const result = await checkR2Connection();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("network_error");
  });

  it("falls back to unknown for unclassified errors", async () => {
    storageMock.mockReturnValue({ s3: { send: sendMock }, bucket: "test-bucket" });
    sendMock.mockRejectedValue(new Error("something unexpected"));

    const result = await checkR2Connection();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("unknown");
    expect(result.message).toContain("something unexpected");
  });
});
