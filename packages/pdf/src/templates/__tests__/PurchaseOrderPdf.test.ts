import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToPdf } from "../../renderer/index";
import { PurchaseOrderPdf } from "../PurchaseOrderPdf";
import type { PurchaseOrderPdfModel } from "../../types/documents";

describe("PurchaseOrderPdf Template", () => {
  const mockBaseData: PurchaseOrderPdfModel = {
    branding: {
      organizationName: "Power Maintenance Group (Pty) Ltd",
      phone: "+27 11 987 6543",
      email: "accounts@pmg.co.za",
      address: "123 Industrial Way, Sandton, Johannesburg",
      taxNumber: "4010293847",
    },
    poNumber: "PO-2026-0089",
    status: "approved",
    description: "Transformer cooling fan replacements and oil sampling",
    supplierName: "Siemens Energy South Africa",
    deliveryAddress: "Kusile Power Station, Emalahleni, Mpumalanga",
    poDate: new Date("2026-09-01"),
    expectedDeliveryDate: new Date("2026-09-20"),
    project: {
      projectNumber: "PRJ-2026-004",
      description: "Kusile Unit 1 Auxiliaries",
    },
    lineItems: [
      {
        itemNumber: "1",
        sapReference: "SAP-99812",
        description: "Cooling Fan Assembly 400V 50Hz",
        unit: "Each",
        quantity: 2,
        unitPrice: 15000,
        subtotal: 30000,
      },
      {
        itemNumber: "2",
        sapReference: null,
        description: "Transformer Mineral Oil (Grade II) 200L Drum",
        unit: "Drum",
        quantity: 5,
        unitPrice: 4200,
        subtotal: 21000,
      },
    ],
    totals: {
      subtotal: 51000,
      vat: 7650,
      total: 58650,
    },
    generatedAt: new Date("2026-09-13T08:00:00Z"),
  };

  it("renders a typical purchase order successfully", async () => {
    const element = React.createElement(PurchaseOrderPdf, {
      data: mockBaseData,
    });
    const result = await renderToPdf(element, { orientation: "portrait" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    expect(result.bytes.length).toBeGreaterThan(1000);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
  });

  it("renders an empty-state purchase order with zero line items", async () => {
    const emptyPo: PurchaseOrderPdfModel = {
      ...mockBaseData,
      lineItems: [],
      totals: { subtotal: 0, vat: 0, total: 0 },
    };

    const element = React.createElement(PurchaseOrderPdf, { data: emptyPo });
    const result = await renderToPdf(element, { orientation: "portrait" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
  });

  it("renders a multi-page purchase order with 30 line items cleanly", async () => {
    const multiLineItems = Array.from({ length: 30 }, (_, i) => ({
      itemNumber: String(i + 1),
      sapReference: `SAP-${1000 + i}`,
      description: `Industrial Spare Component Line Item #${i + 1} with extended specifications and delivery verification`,
      unit: "Unit",
      quantity: i + 1,
      unitPrice: 1250,
      subtotal: (i + 1) * 1250,
    }));

    const subtotal = multiLineItems.reduce(
      (acc, item) => acc + item.subtotal,
      0,
    );
    const vat = subtotal * 0.15;

    const largePo: PurchaseOrderPdfModel = {
      ...mockBaseData,
      lineItems: multiLineItems,
      totals: { subtotal, vat, total: subtotal + vat },
    };

    const element = React.createElement(PurchaseOrderPdf, { data: largePo });
    const result = await renderToPdf(element, { orientation: "portrait" });

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    expect(result.bytes.length).toBeGreaterThan(2500);
    const magic = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magic).toBe("%PDF-");
  });
});
