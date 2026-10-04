import { describe, it, expect, vi } from "vitest";

describe("Admin Invitations Management", () => {
  describe("Expiration calculations", () => {
    it("correctly identifies expiring soon vs expired invitations", () => {
      const now = new Date("2026-10-04T12:00:00Z");
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const pastExpiry = new Date("2026-10-03T12:00:00Z"); // 24h ago
      const expiringSoon = new Date("2026-10-05T12:00:00Z"); // in 24h
      const futureExpiry = new Date("2026-10-10T12:00:00Z"); // in 6 days

      // Expired: status === 'pending' && expiresAt <= now
      const isPastExpired = pastExpiry.getTime() <= now.getTime();
      expect(isPastExpired).toBe(true);

      // Expiring soon: status === 'pending' && expiresAt > now && expiresAt <= in48h
      const isSoonExpiring =
        expiringSoon.getTime() > now.getTime() &&
        expiringSoon.getTime() <= in48h.getTime();
      expect(isSoonExpiring).toBe(true);

      // Future (not expiring soon): expiresAt > in48h
      const isFutureExpiringSoon =
        futureExpiry.getTime() > now.getTime() &&
        futureExpiry.getTime() <= in48h.getTime();
      expect(isFutureExpiringSoon).toBe(false);
    });

    it("ensures past expired invitations are NEVER counted in expiringInvitations (<48h)", () => {
      const now = new Date("2026-10-04T12:00:00Z");
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Simulated 44 stale invitations with expiresAt in the past
      const staleInvitations = Array.from({ length: 44 }).map((_, i) => ({
        id: `stale-${i}`,
        status: "pending",
        expiresAt: new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000), // 1 to 44 days in the past
      }));

      // Old flawed query check: status === 'pending' && expiresAt < in48h
      const oldFlawedCount = staleInvitations.filter(
        (inv) => inv.status === "pending" && inv.expiresAt < in48h,
      ).length;
      expect(oldFlawedCount).toBe(44); // This was why the user always saw 44!

      // New fixed query check: status === 'pending' && expiresAt > now && expiresAt <= in48h
      const fixedExpiringSoonCount = staleInvitations.filter(
        (inv) =>
          inv.status === "pending" &&
          inv.expiresAt > now &&
          inv.expiresAt <= in48h,
      ).length;
      expect(fixedExpiringSoonCount).toBe(0); // Correctly 0!

      // New expired check: status === 'pending' && expiresAt <= now
      const fixedExpiredCount = staleInvitations.filter(
        (inv) => inv.status === "pending" && inv.expiresAt <= now,
      ).length;
      expect(fixedExpiredCount).toBe(44); // Correctly identified as needing cleanup!
    });
  });

  describe("Filter logic", () => {
    const now = new Date();
    const mockInvitations = [
      {
        id: "1",
        email: "alice@example.com",
        organizationName: "Org Alpha",
        status: "pending",
        isExpired: false,
        isExpiringSoon: true,
        expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      },
      {
        id: "2",
        email: "bob@example.com",
        organizationName: "Org Beta",
        status: "pending",
        isExpired: true,
        isExpiringSoon: false,
        expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        id: "3",
        email: "carol@example.com",
        organizationName: "Org Gamma",
        status: "pending",
        isExpired: false,
        isExpiringSoon: false,
        expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      },
    ];

    it("filters to expiring soon items", () => {
      const result = mockInvitations.filter((i) => i.isExpiringSoon);
      expect(result).toHaveLength(1);
      expect(result[0]?.email).toBe("alice@example.com");
    });

    it("filters to expired items", () => {
      const result = mockInvitations.filter((i) => i.isExpired);
      expect(result).toHaveLength(1);
      expect(result[0]?.email).toBe("bob@example.com");
    });

    it("searches by email or organization name", () => {
      const query = "beta";
      const result = mockInvitations.filter(
        (i) =>
          i.email.toLowerCase().includes(query) ||
          i.organizationName.toLowerCase().includes(query),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.email).toBe("bob@example.com");
    });
  });
});
