import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToPdf } from "../index";
import { trackerTheme, adminTheme } from "../../themes/index";
import { TransactionalLayout } from "../../layouts/TransactionalLayout";
import { RegisterLayout } from "../../layouts/RegisterLayout";
import { AnalyticalLayout } from "../../layouts/AnalyticalLayout";
import { DataTable } from "../../components/table/DataTable";
import { Badge } from "../../components/primitives/Badge";
import { KeyValueCard } from "../../components/display/KeyValueGrid";

describe("@pmg/pdf Renderer & Layout Archetypes", () => {
  const mockBranding = {
    organizationName: "Power Maintenance Group (Pty) Ltd",
    phone: "+27 11 987 6543",
    email: "procurement@pmg.co.za",
    address: "123 Industrial Way, Sandton, Johannesburg, 2196",
    taxNumber: "4010293847",
    registrationNumber: "2019/123456/07",
  };

  const fixedDate = new Date("2026-09-13T08:00:00Z");

  it("renders a minimal document and outputs valid %PDF- header", async () => {
    const result = await renderToPdf(
      React.createElement("div", null, "Hello PMG Tracker 360 PDF Engine")
    );

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    expect(result.bytes.length).toBeGreaterThan(100);

    // Verify PDF magic bytes '%PDF-'
    const magicHeader = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magicHeader).toBe("%PDF-");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("renders Archetype 1: TransactionalLayout (Purchase Order / Tender Detail)", async () => {
    interface LineItem {
      itemNo: number;
      description: string;
      unit: string;
      qty: number;
      unitPrice: string;
      subtotal: string;
    }

    const lineItems: LineItem[] = [
      {
        itemNo: 1,
        description: "High-Voltage Transformer 132kV Maintenance & Oil Testing",
        unit: "Lot",
        qty: 1,
        unitPrice: "R 45 000.00",
        subtotal: "R 45 000.00",
      },
      {
        itemNo: 2,
        description: "SF6 Gas Refill & Seal Inspection",
        unit: "Cylinder",
        qty: 4,
        unitPrice: "R 7 500.00",
        subtotal: "R 30 000.00",
      },
    ];

    const element = React.createElement(
      TransactionalLayout,
      {
        theme: trackerTheme,
        branding: mockBranding,
        title: "PURCHASE ORDER",
        documentNumber: "PO-2026-0842",
        subtitle: "Substation Refurbishment Phase 2",
        statusBadge: React.createElement(Badge, { variant: "success" }, "APPROVED"),
        generatedAt: fixedDate,
        leftCard: React.createElement(KeyValueCard, {
          theme: trackerTheme,
          title: "Supplier Details",
          columns: 1,
          items: [
            { label: "Vendor Name", value: "ABB Power Grids SA" },
            { label: "Contact", value: "Sipho Dlamini (sipho@abb.co.za)" },
            { label: "Phone", value: "+27 11 555 1234" },
          ],
        }),
        rightCard: React.createElement(KeyValueCard, {
          theme: trackerTheme,
          title: "Delivery & Order Info",
          columns: 1,
          items: [
            { label: "Project", value: "Matimba Power Station Unit 4" },
            { label: "Delivery Date", value: "30 Sep 2026" },
            { label: "Payment Terms", value: "30 Days from Invoice" },
          ],
        }),
        totals: {
          subtotal: 75000,
          vatRatePercent: 15,
          vatAmount: 11250,
          total: 86250,
        },
        notes: "All delivery vehicles must check in with security gate 2 hours prior to arrival.",
        terms: "Standard PMG supply chain terms apply. Payment strictly within agreed terms.",
      },
      React.createElement(DataTable<LineItem>, {
        theme: trackerTheme,
        columns: [
          { id: "itemNo", header: "#", width: "5%", accessorKey: "itemNo" },
          { id: "description", header: "Description", width: "50%", accessorKey: "description" },
          { id: "unit", header: "Unit", width: "10%", accessorKey: "unit" },
          { id: "qty", header: "Qty", width: "10%", align: "right", accessorKey: "qty" },
          { id: "unitPrice", header: "Unit Price", width: "12%", align: "right", accessorKey: "unitPrice" },
          { id: "subtotal", header: "Subtotal", width: "13%", align: "right", accessorKey: "subtotal" },
        ],
        data: lineItems,
      })
    );

    const result = await renderToPdf(element, { orientation: "portrait" });
    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magicHeader = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magicHeader).toBe("%PDF-");
    expect(result.bytes.length).toBeGreaterThan(1000);
  });

  it("renders Archetype 2: RegisterLayout (Tender Register Landscape)", async () => {
    interface RegisterRow {
      tenderNumber: string;
      client: string;
      description: string;
      status: string;
      submissionDate: string;
      value: string;
    }

    const rows: RegisterRow[] = [
      {
        tenderNumber: "TND-2026-001",
        client: "Eskom Holdings SOC Ltd",
        description: "Kendal Power Station Coal Handling Maintenance",
        status: "Submitted",
        submissionDate: "15 Oct 2026",
        value: "R 12 500 000.00",
      },
      {
        tenderNumber: "TND-2026-002",
        client: "City Power JHB",
        description: "Switchgear Replacement Northern Substation",
        status: "Preparation",
        submissionDate: "28 Oct 2026",
        value: "R 4 800 000.00",
      },
    ];

    const element = React.createElement(
      RegisterLayout,
      {
        theme: trackerTheme,
        branding: mockBranding,
        title: "TENDER REGISTER REPORT",
        subtitle: "Active tender portfolio overview",
        generatedAt: fixedDate,
        filterPills: [
          { label: "Status", value: "All Active" },
          { label: "Period", value: "Q3/Q4 2026" },
        ],
        kpiCards: [
          { label: "Total Tenders", value: "42" },
          { label: "Pipeline Value", value: "R 84.5M", variant: "primary" },
          { label: "Win Rate (LTM)", value: "64.2%", variant: "success" },
          { label: "Closing < 14 Days", value: "5", variant: "warning" },
        ],
      },
      React.createElement(DataTable<RegisterRow>, {
        theme: trackerTheme,
        dense: true,
        columns: [
          { id: "tenderNumber", header: "Tender #", width: "15%", accessorKey: "tenderNumber" },
          { id: "client", header: "Client", width: "22%", accessorKey: "client" },
          { id: "description", header: "Description", width: "33%", accessorKey: "description" },
          {
            id: "status",
            header: "Status",
            width: "12%",
            render: (row) =>
              React.createElement(
                Badge,
                { variant: row.status === "Submitted" ? "primary" : "secondary" },
                row.status
              ),
          },
          { id: "submissionDate", header: "Submission", width: "18%", accessorKey: "submissionDate" },
        ],
        data: rows,
      })
    );

    const result = await renderToPdf(element, { orientation: "landscape" });
    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magicHeader = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magicHeader).toBe("%PDF-");
  });

  it("renders Archetype 3: AnalyticalLayout (Win/Loss & Admin Executive)", async () => {
    const element = React.createElement(
      AnalyticalLayout,
      {
        theme: adminTheme,
        branding: mockBranding,
        title: "EXECUTIVE PLATFORM REPORT",
        subtitle: "PMG Tracker 360 System-wide Metrics",
        periodLabel: "Last 30 Days",
        generatedAt: fixedDate,
        statusBadge: React.createElement(Badge, { variant: "success" }, "SYSTEM HEALTHY"),
        kpiCards: [
          { label: "Total Organizations", value: "18", variant: "primary" },
          { label: "Active Users", value: "248", variant: "default" },
          { label: "Tenders Managed", value: "1 420", variant: "success" },
          { label: "Storage Used", value: "48.6 GB", variant: "default" },
        ],
        sections: [
          {
            id: "overview",
            title: "Tenant Utilization Breakdown",
            description: "Distribution of active users and resources by organization tier.",
            children: React.createElement("div", { style: { fontSize: "11px", color: "#64748B" } }, [
              React.createElement("p", { key: 1 }, "Enterprise tier tenants account for 78% of active tenders and 84% of document attachments."),
              React.createElement("p", { key: 2 }, "Average response latency for search and query endpoints is 42ms."),
            ]),
          },
        ],
      }
    );

    const result = await renderToPdf(element, { orientation: "portrait" });
    expect(result.bytes).toBeInstanceOf(Uint8Array);
    const magicHeader = Buffer.from(result.bytes.slice(0, 5)).toString("ascii");
    expect(magicHeader).toBe("%PDF-");
  });
});
