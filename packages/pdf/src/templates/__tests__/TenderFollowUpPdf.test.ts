import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToPdf } from "../../renderer/index";
import { TenderFollowUpPdf } from "../TenderFollowUpPdf";
import type { TenderFollowUpPdfModel } from "../../types/documents";

describe("TenderFollowUpPdf Template", () => {
  const mockBranding = {
    organizationName: "Sithembe Transportation and Projects",
    phone: "+27 11 987 6543",
    email: "tenders@sithembe.co.za",
    address: "123 Industrial Way, Sandton, Johannesburg",
  };

  const fixedDate = new Date("2026-09-13T17:00:00Z");

  it("renders management follow-up summary report in landscape with all required fields", async () => {
    const rows = [
      {
        tenderNumber: "A-CS-11-2026",
        client: "City of Ekurhuleni",
        description: "Supply and delivery of personal protective equipment (PPE)",
        closingDate: new Date("2026-08-19"),
        validityExpiryDate: new Date("2026-11-19"),
        validityDaysRemaining: 67,
        isExpiringSoon: false,
        isExpired: false,
        contactName: "Bongani Sithole",
        contactEmail: "bongani.s@ekurhuleni.gov.za",
        contactPhone: "011 999 1234",
        status: "evaluation",
        estimatedValue: 4500000,
      },
      {
        tenderNumber: "SCMU5-25-26-0002SB",
        client: "Eastern Cape DPWI",
        description: "Grass cutting and bush clearing services",
        closingDate: new Date("2026-08-11"),
        validityExpiryDate: new Date("2026-09-25"),
        validityDaysRemaining: 12,
        isExpiringSoon: true,
        isExpired: false,
        contactName: "Noluthando Mokoena",
        contactEmail: "noluthando@dpwi.ec.gov.za",
        contactPhone: "040 602 4000",
        status: "submitted",
        estimatedValue: 1800000,
      },
      {
        tenderNumber: "TND-EXP-001",
        client: "Transnet SOC Ltd",
        description: "Skid steer loader rental",
        closingDate: new Date("2026-03-01"),
        validityExpiryDate: new Date("2026-06-01"),
        validityDaysRemaining: -104,
        isExpiringSoon: false,
        isExpired: true,
        contactName: "Sipho Dlamini",
        contactEmail: "sipho@transnet.net",
        contactPhone: "011 544 2000",
        status: "submitted",
        estimatedValue: 950000,
      },
    ];

    const data: TenderFollowUpPdfModel = {
      branding: mockBranding,
      filterPills: [
        { label: "SCOPE", value: "ACTIVE PIPELINE" },
        { label: "PERIOD", value: "ALL TIME" },
      ],
      kpiCards: [
        { label: "TOTAL FOLLOW-UPS", value: "3", variant: "primary" },
        { label: "EXPIRING SOON", value: "1", variant: "warning" },
        { label: "EXPIRED", value: "1", variant: "destructive" },
        { label: "TOTAL CLIENTS", value: "3", variant: "default" },
        { label: "PIPELINE VALUE", value: "R 7.25M", variant: "success" },
      ],
      rows,
      generatedAt: fixedDate,
    };

    const element = React.createElement(TenderFollowUpPdf, { data });
    const result = await renderToPdf(element, { orientation: "landscape" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
    expect(result.bytes.length).toBeGreaterThan(2000);
  });
});
