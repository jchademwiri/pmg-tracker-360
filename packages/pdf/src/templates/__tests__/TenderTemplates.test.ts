import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToPdf } from "../../renderer/index";
import { TenderDetailPdf } from "../TenderDetailPdf";
import { TenderWinLossPdf } from "../TenderWinLossPdf";
import type { TenderDetailPdfModel, TenderWinLossPdfModel } from "../../types/documents";

describe("Tender Detail and Win/Loss Templates", () => {
  const mockBranding = {
    organizationName: "Power Maintenance Group (Pty) Ltd",
    phone: "+27 11 987 6543",
    email: "tenders@pmg.co.za",
    address: "123 Industrial Way, Sandton, Johannesburg",
    taxNumber: "4010293847",
  };

  const fixedDate = new Date("2026-09-13T08:00:00Z");

  it("renders a submitted tender detail PDF", async () => {
    const data: TenderDetailPdfModel = {
      branding: mockBranding,
      tenderNumber: "TND-2026-0045",
      status: "submitted",
      priority: "high",
      clientName: "Eskom Holdings SOC Ltd",
      clientContact: {
        name: "Lindiwe Khumalo",
        email: "lindiwe.khumalo@eskom.co.za",
        phone: "+27 11 800 2000",
      },
      description: "Provision of Transformer Oil Regeneration and Dissolved Gas Analysis for Kendal & Matla Power Stations over 36 months.",
      submissionDate: new Date("2026-10-15"),
      briefingDate: new Date("2026-09-22"),
      briefingLocation: "Kendal Power Station Main Boardroom",
      validityExpiryDate: new Date("2027-01-15"),
      estimatedValue: 18500000,
      generatedAt: fixedDate,
    };

    const element = React.createElement(TenderDetailPdf, { data });
    const result = await renderToPdf(element, { orientation: "portrait" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
  });

  it("renders a lost tender detail PDF with loss details", async () => {
    const data: TenderDetailPdfModel = {
      branding: mockBranding,
      tenderNumber: "TND-2026-0012",
      status: "lost",
      clientName: "Transnet Freight Rail",
      description: "Supply of 11kV Substation Switchgear",
      submissionDate: new Date("2026-04-10"),
      estimatedValue: 6400000,
      lossReason: "Pricing uncompetitive on primary switchgear line items",
      lossDetails: "Competitor bid was 8% lower on imported vacuum circuit breakers. Delivery timeline was equal.",
      generatedAt: fixedDate,
    };

    const element = React.createElement(TenderDetailPdf, { data });
    const result = await renderToPdf(element, { orientation: "portrait" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
  });

  it("renders a tender win/loss summary report", async () => {
    const data: TenderWinLossPdfModel = {
      branding: mockBranding,
      periodLabel: "Q1 - Q3 2026",
      totalSubmissions: 28,
      awardedCount: 18,
      lostCount: 10,
      winRate: 64.3,
      awardedValueTotal: 42500000,
      lostValueTotal: 18200000,
      awardedTenders: [
        {
          tenderNumber: "TND-2026-0001",
          client: "Eskom SOC",
          description: "Substation Transformer Overhaul",
          awardValue: 24000000,
        },
        {
          tenderNumber: "TND-2026-0003",
          client: "City Power",
          description: "Switchgear Retrofit",
          awardValue: 18500000,
        },
      ],
      lostTenders: [
        {
          tenderNumber: "TND-2026-0002",
          client: "Transnet",
          description: "Cable Tray Installation",
          estimatedValue: 4200000,
          lossReason: "Pricing",
        },
      ],
      lossReasonsSummary: [
        { reason: "Pricing higher than winning bidder", count: 6, value: 11000000, percentage: 60 },
        { reason: "Lead time on specialized components", count: 4, value: 7200000, percentage: 40 },
      ],
      generatedAt: fixedDate,
    };

    const element = React.createElement(TenderWinLossPdf, { data });
    const result = await renderToPdf(element, { orientation: "portrait" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
  });
});
