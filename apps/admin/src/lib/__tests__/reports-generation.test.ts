import { describe, it, expect, vi } from "vitest";

vi.mock("@pmg/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../reports-queries", () => ({
  getPlatformOverviewStats: vi.fn().mockResolvedValue({
    totalTenants: 12,
    activeTenants: 10,
    softDeletedTenants: 2,
    totalUsers: 45,
    verifiedUsers: 40,
    verificationRate: 89,
    totalStorageBytes: 104857600,
    totalStorageMB: 100,
    totalStorageGB: 0.1,
    totalStorageCapacityGB: 10,
    availableStorageGB: 9.9,
    availableStorageMB: 10140,
    storageUtilizationPct: 1,
    storageWarningStatus: "normal",
    storageOverview: {
      totalUsedBytes: 104857600,
      totalUsedMB: 100,
      totalUsedGB: 0.1,
      totalCapacityGB: 10,
      totalCapacityMB: 10240,
      availableStorageGB: 9.9,
      availableStorageMB: 10140,
      utilizationPct: 1,
      warningStatus: "normal",
      buckets: [],
      connectedLiveApi: false,
      lastCheckedAt: new Date(),
    },
    totalDocuments: 150,
    totalTenderPipelineValue: 50000000,
    totalTenderAwardedValue: 18000000,
    totalTenders: 35,
    totalProjects: 14,
    activeProjects: 8,
    totalPOs: 22,
    totalPOAmount: 7500000,
    openSupportTickets: 3,
    totalFeedbackCount: 15,
    waitlistCount: 60,
    planCounts: { free: 8, pro: 4 },
  }),
  getStorageBreakdown: vi.fn().mockResolvedValue({
    storageOverview: {
      totalUsedBytes: 104857600,
      totalUsedMB: 100,
      totalUsedGB: 0.1,
      totalCapacityGB: 10,
      totalCapacityMB: 10240,
      availableStorageGB: 9.9,
      availableStorageMB: 10140,
      utilizationPct: 1,
      warningStatus: "normal",
      buckets: [],
      connectedLiveApi: false,
      lastCheckedAt: new Date(),
    },
    categories: [
      {
        category: "Tender Documents",
        count: 80,
        sizeBytes: 60000000,
        sizeMB: 57.22,
        percentage: 60,
      },
      {
        category: "Project Contracts & Files",
        count: 40,
        sizeBytes: 30000000,
        sizeMB: 28.61,
        percentage: 30,
      },
    ],
    topTenants: [
      {
        id: "org_1",
        name: "Acme Mega Corp",
        slug: "acme",
        createdAt: new Date("2026-01-01"),
        deletedAt: null,
        documentCount: 50,
        storageBytes: 40000000,
        storageMB: 38.15,
        tenderCount: 15,
        projectCount: 4,
        memberCount: 8,
      },
    ],
  }),
  getAllTenantsUtilization: vi.fn().mockResolvedValue([
    {
      id: "org_1",
      name: "Acme Mega Corp",
      slug: "acme",
      createdAt: new Date("2026-01-01"),
      deletedAt: null,
      documentCount: 50,
      storageBytes: 40000000,
      storageMB: 38.15,
      tenderCount: 15,
      projectCount: 4,
      memberCount: 8,
    },
  ]),
  getSecurityComplianceMetrics: vi.fn().mockResolvedValue({
    totalLogs: 120,
    criticalEvents: 2,
    warningEvents: 10,
    infoEvents: 108,
    totalSessions: 80,
    suspiciousSessions: 1,
    recentCriticalLogs: [
      {
        id: "log_1234567890",
        action: "admin.suspicious_ip",
        resourceType: "auth",
        severity: "critical",
        createdAt: new Date("2026-02-14"),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      },
    ],
  }),
}));

import {
  generatePlatformMasterExcel,
  generateStorageAuditExcel,
  generateSecurityAuditExcel,
} from "../reports-excel";
import {
  generatePlatformExecutivePdf,
  generateStorageAuditPdf,
  generateSecurityAuditPdf,
} from "../reports-pdf";

describe("System Owner Reports Generators", () => {
  it("generates a valid binary Platform Master Excel workbook", async () => {
    const buffer = await generatePlatformMasterExcel();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("generates a valid binary Storage Audit Excel workbook", async () => {
    const buffer = await generateStorageAuditExcel();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("generates a valid binary Security Audit Excel workbook", async () => {
    const buffer = await generateSecurityAuditExcel();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("generates a valid binary Executive PDF buffer", async () => {
    const buffer = await generatePlatformExecutivePdf();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("generates a valid binary Storage Audit PDF buffer", async () => {
    const buffer = await generateStorageAuditPdf();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("generates a valid binary Security Audit PDF buffer", async () => {
    const buffer = await generateSecurityAuditPdf();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
