import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToPdf } from "../../renderer/index.js";
import { TenderRegisterPdf } from "../TenderRegisterPdf.js";
import type { TenderRegisterPdfModel } from "../../types/documents.js";

describe("TenderRegisterPdf Template", () => {
  const mockBranding = {
    organizationName: "Power Maintenance Group (Pty) Ltd",
    phone: "+27 11 987 6543",
    email: "tenders@pmg.co.za",
    address: "123 Industrial Way, Sandton, Johannesburg",
    taxNumber: "4010293847",
  };

  const fixedDate = new Date("2026-09-13T08:00:00Z");

  it("renders portfolio variant in landscape with repeated headers", async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      tenderNumber: `TND-2026-${100 + i}`,
      client: i % 2 === 0 ? "Eskom Holdings SOC Ltd" : "City Power Johannesburg",
      description: `Transformer & Switchgear Refurbishment Contract #${i + 1}`,
      status: i % 3 === 0 ? "awarded" : i % 3 === 1 ? "submitted" : "preparation",
      submissionDate: new Date("2026-10-15"),
      validityDate: new Date("2027-01-15"),
      estimatedValue: 2500000 * (i + 1),
    }));

    const data: TenderRegisterPdfModel = {
      branding: mockBranding,
      variant: "portfolio",
      filterPills: [
        { label: "Status", value: "All" },
        { label: "Date Range", value: "Q3 2026" },
      ],
      kpiCards: [
        { label: "Total Tenders", value: "25", variant: "default" },
        { label: "Submitted", value: "17", variant: "primary" },
        { label: "Not Yet Due", value: "8", variant: "warning" },
        { label: "Clients", value: "2", variant: "default" },
        { label: "Pipeline Value", value: "R 82.5M", variant: "success" },
      ],
      rows,
      generatedAt: fixedDate,
    };

    const element = React.createElement(TenderRegisterPdf, { data });
    const result = await renderToPdf(element, { orientation: "landscape" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
    expect(result.bytes.length).toBeGreaterThan(2000);
  });

  it("renders client variant filtered to a specific client", async () => {
    const rows = [
      {
        tenderNumber: "TND-2026-001",
        client: "Eskom Holdings SOC Ltd",
        description: "Medupi Power Station HV Bushings",
        status: "submitted",
        contactPerson: "Lindiwe Khumalo (lindiwe@eskom.co.za)",
        submissionDate: new Date("2026-09-30"),
        validityDate: new Date("2026-12-30"),
      },
    ];

    const data: TenderRegisterPdfModel = {
      branding: mockBranding,
      variant: "client",
      clientName: "Eskom Holdings SOC Ltd",
      filterPills: [{ label: "Client", value: "Eskom Holdings SOC Ltd" }],
      kpiCards: [
        { label: "Total Tenders", value: "1" },
        { label: "Submitted", value: "1", variant: "primary" },
        { label: "Not Yet Due", value: "0" },
        { label: "Estimated Value", value: "R 14.2M", variant: "success" },
      ],
      rows,
      generatedAt: fixedDate,
    };

    const element = React.createElement(TenderRegisterPdf, { data });
    const result = await renderToPdf(element, { orientation: "landscape" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
  });
});
