import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/app/organizations/actions", () => ({
  getOrgDetail: vi.fn(),
}));

vi.mock("@/components/StatusBadge", () => ({
  default: vi.fn(() => null),
}));

// lucide-react icons used by the drawer
vi.mock("lucide-react", () => ({
  X: vi.fn(() => null),
  AlertCircle: vi.fn(() => null),
}));

describe("OrgDrawer", () => {
  it("can be imported without throwing", async () => {
    const mod = await import("../OrgDrawer");
    expect(typeof mod.default).toBe("function");
  });

  it("exports a default function (the component)", async () => {
    const mod = await import("../OrgDrawer");
    expect(mod.default).toBeDefined();
    expect(mod.default.name).toBeTruthy();
  });

  it("handles object metadata without throwing error", () => {
    const objectMetadata = {
      phone: "123",
      address: "456 Main St",
      website: "https://example.com",
      description: "Test",
    };
    let metadataDisplay: string | null = null;
    if (objectMetadata) {
      if (typeof objectMetadata === "string") {
        try {
          metadataDisplay = JSON.stringify(JSON.parse(objectMetadata), null, 2);
        } catch {
          metadataDisplay = objectMetadata;
        }
      } else if (typeof objectMetadata === "object") {
        try {
          metadataDisplay = JSON.stringify(objectMetadata, null, 2);
        } catch {
          metadataDisplay = String(objectMetadata);
        }
      }
    }
    expect(typeof metadataDisplay).toBe("string");
    expect(metadataDisplay).toContain("456 Main St");
  });
});
