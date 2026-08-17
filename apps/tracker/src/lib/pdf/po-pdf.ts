import "server-only";

import { db } from "@pmg/db";
import { purchaseOrder } from "@pmg/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { jsPDF } from "jspdf";

import { formatCurrency, formatDate } from "@/lib/format";
import {
  PAGE,
  splitText,
  ensurePage,
  fetchLogoBase64,
  parseOrganizationMetadata,
  drawStandardHeader,
  drawStandardFooter,
  drawTable,
  type OrgBranding,
  type TableColumn,
} from "./pdf-layout";

const VAT_RATE = 0.15;

type PdfLineItem = {
  itemNumber: string;
  sapReference: string | null;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type PoPdfData = {
  org: OrgBranding;
  poNumber: string;
  status: string;
  description: string;
  supplierName: string | null;
  deliveryAddress: string | null;
  poDate: Date | null;
  expectedDeliveryDate: Date | null;
  project: { projectNumber: string; description: string | null } | null;
  lineItems: PdfLineItem[];
  totals: { subtotal: number; vat: number; total: number };
};

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function drawMeta(doc: jsPDF, data: PoPdfData) {
  let y = 52;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text("SUPPLIER", PAGE.margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text(data.supplierName || "Not specified", PAGE.margin, y + 7);

  let addressLines: string[] = [];
  if (data.deliveryAddress) {
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    addressLines = splitText(doc, data.deliveryAddress, 90);
    doc.text(addressLines, PAGE.margin, y + 13);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text("PO DATE", PAGE.width - PAGE.margin - 45, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text(formatDate(data.poDate), PAGE.width - PAGE.margin, y, {
    align: "right",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text("EXPECTED DELIVERY", PAGE.width - PAGE.margin - 45, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text(
    formatDate(data.expectedDeliveryDate),
    PAGE.width - PAGE.margin,
    y + 7,
    {
      align: "right",
    },
  );

  if (data.project) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text("PROJECT", PAGE.width - PAGE.margin - 45, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    doc.text(data.project.projectNumber, PAGE.width - PAGE.margin, y + 14, {
      align: "right",
    });
  }

  // Advance past whichever column (address block or PO date/delivery/project
  // block) rendered taller, instead of a fixed offset that overlaps the
  // address when it wraps to 4+ lines.
  const leftColumnHeight = addressLines.length
    ? 13 + addressLines.length * 3.5
    : 7;
  const rightColumnHeight = data.project ? 21 : 14;
  y += Math.max(leftColumnHeight, rightColumnHeight) + 6;

  if (data.description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text("DESCRIPTION", PAGE.margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    const descLines = splitText(
      doc,
      data.description,
      PAGE.width - PAGE.margin * 2,
    );
    doc.text(descLines, PAGE.margin, y + 5);
    y += descLines.length * 4 + 8;
  }

  return y + 6;
}

const LINE_ITEM_COLUMNS: TableColumn[] = [
  { key: "itemNumber", label: "ITEM", widthMm: 28, x: PAGE.margin + 2 },
  { key: "description", label: "DESCRIPTION", widthMm: 82, x: 32, wrap: true },
  { key: "unit", label: "UNIT", widthMm: 12, x: 118, align: "right" },
  { key: "quantity", label: "QTY", widthMm: 12, x: 134, align: "right" },
  {
    key: "unitPrice",
    label: "UNIT PRICE",
    widthMm: 24,
    x: 162,
    align: "right",
  },
  {
    key: "subtotal",
    label: "SUBTOTAL",
    widthMm: 24,
    x: PAGE.width - PAGE.margin - 2,
    align: "right",
    bold: true,
  },
];

function drawTotals(doc: jsPDF, data: PoPdfData, startY: number) {
  let y = ensurePage(doc, startY, 40);
  const rows: Array<readonly [string, number]> = [
    ["VAT Exclusive Total", data.totals.subtotal],
    ["VAT (15%)", data.totals.vat],
    ["Total (VAT Inclusive)", data.totals.total],
  ];

  for (const [label, amount] of rows) {
    const isTotal = label === "Total (VAT Inclusive)";
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(isTotal ? 10 : 8);
    doc.setTextColor(24, 24, 27);
    doc.text(label, 132, y);
    doc.text(formatCurrency(amount), PAGE.width - PAGE.margin, y, {
      align: "right",
    });
    y += 7;
  }

  return y + 4;
}

function renderPdf(data: PoPdfData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  drawStandardHeader(doc, {
    org: data.org,
    titleLabel: "PURCHASE ORDER",
    primaryLine: `#${data.poNumber}`,
    secondaryLine: statusLabel(data.status),
  });
  let y = drawMeta(doc, data);
  y = drawTable(doc, {
    startY: y,
    columns: LINE_ITEM_COLUMNS,
    rows: data.lineItems.map((item) => ({
      itemNumber: item.itemNumber,
      description: item.description,
      unit: item.unit,
      quantity: String(item.quantity),
      unitPrice: formatCurrency(item.unitPrice),
      subtotal: formatCurrency(item.subtotal),
    })),
    emptyMessage: "No line items.",
  });
  y = drawTotals(doc, data, y);
  drawStandardFooter(doc, data.org.name);
  return Buffer.from(doc.output("arraybuffer"));
}

export async function generatePurchaseOrderPdf(
  organizationId: string,
  poId: string,
) {
  const po = await db.query.purchaseOrder.findFirst({
    where: and(
      eq(purchaseOrder.id, poId),
      eq(purchaseOrder.organizationId, organizationId),
      isNull(purchaseOrder.deletedAt),
    ),
    with: {
      project: true,
      lineItems: true,
      organization: true,
    },
  });

  if (!po) return null;

  const subtotal = parseFloat(po.totalAmount) || 0;
  const vat = subtotal * VAT_RATE;

  const orgMeta = parseOrganizationMetadata(po.organization.metadata);
  const logoDataUri = await fetchLogoBase64(po.organization.logo);

  const data: PoPdfData = {
    org: {
      name: po.organization.name,
      logoDataUri,
      phone: orgMeta.phone,
      address: orgMeta.address,
      website: orgMeta.website,
    },
    poNumber: po.poNumber,
    status: po.status,
    description: po.description,
    supplierName: po.supplierName,
    deliveryAddress: po.deliveryAddress,
    poDate: po.poDate,
    expectedDeliveryDate: po.expectedDeliveryDate,
    project: po.project
      ? {
          projectNumber: po.project.projectNumber,
          description: po.project.description,
        }
      : null,
    lineItems: po.lineItems.map((item) => ({
      itemNumber: item.itemNumber,
      sapReference: item.sapReference,
      description: item.description,
      unit: item.unit,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      subtotal: parseFloat(item.subtotal) || 0,
    })),
    totals: { subtotal, vat, total: subtotal + vat },
  };

  return {
    fileName: `PO-${po.poNumber}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, "-"),
    buffer: renderPdf(data),
  };
}
