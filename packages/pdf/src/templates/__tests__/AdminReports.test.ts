import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToPdf } from "../../renderer/index";
import { AdminReportPdf } from "../AdminReportPdf";
import type { AdminReportPdfModel } from "../../types/documents";

describe("AdminReportPdf Template", () => {
  it("renders a Platform Executive report successfully", async () => {
    const mockModel: AdminReportPdfModel = {
      branding: {
        organizationName: "PMG Tracker 360",
      },
      kind: "platform-executive",
      title: "PMG TRACKER 360",
      subtitle: "Platform Executive Overview & Multi-Tenant Utilization",
      periodLabel: "Q1 2026",
      systemStatus: "Healthy",
      kpiCards: [
        { label: "Total Organizations", value: "42 Active", subtext: "45 registered", variant: "primary" },
        { label: "Platform Users", value: "1,250 Total", subtext: "98% verified", variant: "default" },
        { label: "Tender Pipeline Value", value: "R 145,000,000.00", subtext: "128 total bids", variant: "success" },
        { label: "Platform S3 Storage", value: "2,450 MB", subtext: "512 uploaded files", variant: "default" },
      ],
      sections: [
        {
          id: "operations",
          title: "Comprehensive Platform Operations Schedule",
          table: {
            columns: [
              { id: "metric", header: "Core Metric", width: "35%" },
              { id: "value", header: "Value / Total", width: "25%" },
              { id: "context", header: "Operational Context", width: "40%" },
            ],
            rows: [
              { metric: "Total Registered Organizations", value: "45 orgs", context: "42 active, 3 archived" },
              { metric: "Active Awarded Projects", value: "88 projects", context: "Lifetime contracts" },
            ],
          },
        },
        {
          id: "tenants",
          title: "Tenant Roster & Consumption Schedule",
          table: {
            columns: [
              { id: "name", header: "Organization Name", width: "30%" },
              { id: "status", header: "Status", width: "15%" },
              { id: "created", header: "Created", width: "15%" },
              { id: "members", header: "Members", width: "10%", align: "right" },
              { id: "tenders", header: "Tenders", width: "10%", align: "right" },
              { id: "storage", header: "Storage", width: "20%", align: "right" },
            ],
            rows: [
              { name: "Acme Industrial Services", status: "Active", created: "10 Jan 2026", members: 12, tenders: 34, storage: "450 MB" },
              { name: "Starlight Logistics", status: "Archived", created: "05 Nov 2025", members: 4, tenders: 8, storage: "120 MB" },
            ],
          },
        },
      ],
      confidential: true,
    };

    const result = await renderToPdf(React.createElement(AdminReportPdf, { data: mockModel }));
    const pdfBuffer = Buffer.from(result.bytes);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renders a Storage Audit report with callouts and quotas", async () => {
    const mockStorageModel: AdminReportPdfModel = {
      branding: {
        organizationName: "PMG Tracker 360",
      },
      kind: "storage-audit",
      title: "PMG TRACKER 360",
      subtitle: "Cloudflare R2 Storage Utilization & Multi-Bucket Audit",
      systemStatus: "Optimal",
      kpiCards: [
        { label: "Storage Consumed", value: "1,240 MB", subtext: "1.24 GB consumed", variant: "primary" },
        { label: "Quota Limit", value: "10.00 GB", subtext: "Cloudflare Free Tier", variant: "default" },
        { label: "Utilization Rate", value: "12.4%", subtext: "Healthy capacity", variant: "success" },
      ],
      sections: [
        {
          id: "categories",
          title: "File Category Distribution Schedule",
          callouts: [
            "Total Storage Consumed: 1,240 MB (1.24 GB) across 320 uploaded files",
            "Top Category: Tender Submissions accounting for 72% of all storage footprint",
          ],
          table: {
            columns: [
              { id: "category", header: "Resource Category", width: "40%" },
              { id: "count", header: "File Count", width: "20%", align: "right" },
              { id: "size", header: "Storage (MB)", width: "20%", align: "right" },
              { id: "share", header: "Share (%)", width: "20%", align: "right" },
            ],
            rows: [
              { category: "Tender Submissions", count: "140", size: "892 MB", share: "72.0%" },
              { category: "Purchase Order Attachments", count: "85", size: "220 MB", share: "17.7%" },
            ],
          },
        },
      ],
      confidential: true,
    };

    const result = await renderToPdf(React.createElement(AdminReportPdf, { data: mockStorageModel }));
    const pdfBuffer = Buffer.from(result.bytes);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renders a Security Audit report with critical event alerts", async () => {
    const mockSecurityModel: AdminReportPdfModel = {
      branding: {
        organizationName: "PMG Tracker 360",
      },
      kind: "security-audit",
      title: "PMG TRACKER 360",
      subtitle: "Security & Compliance Forensics Trail",
      systemStatus: "Elevated Warning",
      kpiCards: [
        { label: "Total Audit Events", value: "14,200", subtext: "Recorded logs", variant: "default" },
        { label: "Critical Events", value: "2", subtext: "Action required", variant: "destructive" },
        { label: "Suspicious Sessions", value: "1", subtext: "Flagged anomalous login", variant: "warning" },
      ],
      sections: [
        {
          id: "critical-events",
          title: "Critical Security Events Schedule",
          table: {
            columns: [
              { id: "action", header: "Action", width: "25%" },
              { id: "resource", header: "Resource", width: "25%" },
              { id: "severity", header: "Severity", width: "15%" },
              { id: "ip", header: "IP Address", width: "15%" },
              { id: "dateTime", header: "Date & Time", width: "20%", align: "right" },
            ],
            rows: [
              { action: "auth.failed_brute_force", resource: "user_session", severity: "critical", ip: "197.229.4.12", dateTime: "13 Sep 2026, 08:30" },
              { action: "org.role_escalation", resource: "organization", severity: "warning", ip: "102.165.32.1", dateTime: "12 Sep 2026, 14:15" },
            ],
          },
        },
      ],
      confidential: true,
    };

    const result = await renderToPdf(React.createElement(AdminReportPdf, { data: mockSecurityModel }));
    const pdfBuffer = Buffer.from(result.bytes);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
