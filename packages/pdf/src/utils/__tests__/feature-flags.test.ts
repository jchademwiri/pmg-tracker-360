import { describe, expect, it } from "bun:test";
import { isPdfcnEnabled, parsePdfcnAllowlist } from "../feature-flags";

describe("PDFCN Feature Flags", () => {
  it("returns empty set when env is undefined or empty", () => {
    expect(parsePdfcnAllowlist(undefined).size).toBe(0);
    expect(parsePdfcnAllowlist("").size).toBe(0);
    expect(parsePdfcnAllowlist("   ").size).toBe(0);
    expect(isPdfcnEnabled("purchase-order", "")).toBe(false);
  });

  it("parses valid comma-separated document kinds", () => {
    const list = parsePdfcnAllowlist("purchase-order, tender-detail");
    expect(list.size).toBe(2);
    expect(list.has("purchase-order")).toBe(true);
    expect(list.has("tender-detail")).toBe(true);
    expect(list.has("tender-win-loss")).toBe(false);
  });

  it("ignores case and whitespace", () => {
    const list = parsePdfcnAllowlist("  PURCHASE-ORDER , Tender-Register  ");
    expect(list.has("purchase-order")).toBe(true);
    expect(list.has("tender-register")).toBe(true);
  });

  it("ignores unknown values gracefully", () => {
    const list = parsePdfcnAllowlist("purchase-order, invalid-document, foobar");
    expect(list.size).toBe(1);
    expect(list.has("purchase-order")).toBe(true);
  });

  it("enables all when 'all' is passed", () => {
    const list = parsePdfcnAllowlist("all");
    expect(list.size).toBe(8);
    expect(list.has("purchase-order")).toBe(true);
    expect(list.has("tender-follow-up")).toBe(true);
    expect(list.has("security-audit")).toBe(true);
  });
});
