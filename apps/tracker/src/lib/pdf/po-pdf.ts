import 'server-only';

import { db } from '@pmg/db';
import { purchaseOrder } from '@pmg/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { jsPDF } from 'jspdf';

import { formatCurrency, formatDate } from '@/lib/format';

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
  org: { name: string; logoUrl: string | null };
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

const PAGE = { width: 210, height: 297, margin: 14, bottom: 280 };

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function split(doc: jsPDF, text: string | undefined | null, width: number) {
  return doc.splitTextToSize(text || '', width) as string[];
}

function ensurePage(doc: jsPDF, y: number, needed = 16) {
  if (y + needed <= PAGE.bottom) return y;
  doc.addPage();
  return PAGE.margin;
}

async function fetchLogoBase64(logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    // Logo fetch is best-effort; fall back to text header if it fails.
    return null;
  }
}

function drawHeader(doc: jsPDF, data: PoPdfData, logoDataUri: string | null) {
  doc.setFillColor(79, 70, 229); // indigo-600, matches app accent
  doc.rect(0, 0, PAGE.width, 3, 'F');

  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, PAGE.margin, 10, 20, 20, undefined, 'FAST');
    } catch {
      // Corrupt/unsupported image format — fall back to text below.
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 24, 27);
  doc.text(data.org.name, logoDataUri ? PAGE.margin + 26 : PAGE.margin, 18);

  doc.setFontSize(20);
  doc.setTextColor(161, 161, 170);
  doc.text('PURCHASE ORDER', PAGE.width - PAGE.margin, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(63, 63, 70);
  doc.text(`#${data.poNumber}`, PAGE.width - PAGE.margin, 25, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(82, 82, 91);
  doc.text(statusLabel(data.status), PAGE.width - PAGE.margin, 31, { align: 'right' });

  doc.setDrawColor(229, 231, 235);
  doc.line(PAGE.margin, 40, PAGE.width - PAGE.margin, 40);
}

function drawMeta(doc: jsPDF, data: PoPdfData) {
  let y = 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('SUPPLIER', PAGE.margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text(data.supplierName || 'Not specified', PAGE.margin, y + 7);

  if (data.deliveryAddress) {
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    const addressLines = split(doc, data.deliveryAddress, 90);
    doc.text(addressLines, PAGE.margin, y + 13);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('PO DATE', PAGE.width - PAGE.margin - 45, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text(formatDate(data.poDate), PAGE.width - PAGE.margin, y, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('EXPECTED DELIVERY', PAGE.width - PAGE.margin - 45, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text(formatDate(data.expectedDeliveryDate), PAGE.width - PAGE.margin, y + 7, {
    align: 'right',
  });

  if (data.project) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('PROJECT', PAGE.width - PAGE.margin - 45, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    doc.text(data.project.projectNumber, PAGE.width - PAGE.margin, y + 14, { align: 'right' });
  }

  y += 24;

  if (data.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('DESCRIPTION', PAGE.margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    const descLines = split(doc, data.description, PAGE.width - PAGE.margin * 2);
    doc.text(descLines, PAGE.margin, y + 5);
    y += descLines.length * 4 + 8;
  }

  return y + 6;
}

function drawLineItems(doc: jsPDF, data: PoPdfData, startY: number) {
  let y = startY;

  doc.setFillColor(249, 250, 251);
  doc.rect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('ITEM', PAGE.margin + 2, y + 6);
  doc.text('DESCRIPTION', 32, y + 6);
  doc.text('UNIT', 118, y + 6, { align: 'right' });
  doc.text('QTY', 134, y + 6, { align: 'right' });
  doc.text('UNIT PRICE', 162, y + 6, { align: 'right' });
  doc.text('SUBTOTAL', PAGE.width - PAGE.margin - 2, y + 6, { align: 'right' });
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (const item of data.lineItems) {
    const lines = split(doc, item.description, 82);
    const rowHeight = Math.max(10, lines.length * 4 + 4);
    y = ensurePage(doc, y, rowHeight);
    doc.setTextColor(24, 24, 27);
    doc.text(item.itemNumber, PAGE.margin + 2, y + 4);
    doc.text(lines, 32, y + 4);
    doc.text(item.unit, 118, y + 4, { align: 'right' });
    doc.text(String(item.quantity), 134, y + 4, { align: 'right' });
    doc.text(formatCurrency(item.unitPrice), 162, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.subtotal), PAGE.width - PAGE.margin - 2, y + 4, {
      align: 'right',
    });
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(244, 244, 245);
    doc.line(PAGE.margin, y + rowHeight, PAGE.width - PAGE.margin, y + rowHeight);
    y += rowHeight;
  }

  return y + 6;
}

function drawTotals(doc: jsPDF, data: PoPdfData, startY: number) {
  let y = ensurePage(doc, startY, 40);
  const rows: Array<readonly [string, number]> = [
    ['VAT Exclusive Total', data.totals.subtotal],
    ['VAT (15%)', data.totals.vat],
    ['Total (VAT Inclusive)', data.totals.total],
  ];

  for (const [label, amount] of rows) {
    const isTotal = label === 'Total (VAT Inclusive)';
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 10 : 8);
    doc.setTextColor(24, 24, 27);
    doc.text(label, 132, y);
    doc.text(formatCurrency(amount), PAGE.width - PAGE.margin, y, { align: 'right' });
    y += 7;
  }

  return y + 4;
}

function drawFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(PAGE.margin, 282, PAGE.width - PAGE.margin, 282);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text('Generated by PMG Tracker 360', PAGE.margin, 288);
    doc.text(`Page ${i} of ${pageCount}`, PAGE.width - PAGE.margin, 288, { align: 'right' });
  }
}

function renderPdf(data: PoPdfData, logoDataUri: string | null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawHeader(doc, data, logoDataUri);
  let y = drawMeta(doc, data);
  y = drawLineItems(doc, data, y);
  y = drawTotals(doc, data, y);
  drawFooter(doc);
  return Buffer.from(doc.output('arraybuffer'));
}

export async function generatePurchaseOrderPdf(organizationId: string, poId: string) {
  const po = await db.query.purchaseOrder.findFirst({
    where: and(
      eq(purchaseOrder.id, poId),
      eq(purchaseOrder.organizationId, organizationId),
      isNull(purchaseOrder.deletedAt)
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

  const data: PoPdfData = {
    org: { name: po.organization.name, logoUrl: po.organization.logo },
    poNumber: po.poNumber,
    status: po.status,
    description: po.description,
    supplierName: po.supplierName,
    deliveryAddress: po.deliveryAddress,
    poDate: po.poDate,
    expectedDeliveryDate: po.expectedDeliveryDate,
    project: po.project
      ? { projectNumber: po.project.projectNumber, description: po.project.description }
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

  const logoDataUri = await fetchLogoBase64(data.org.logoUrl);

  return {
    fileName: `PO-${po.poNumber}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '-'),
    buffer: renderPdf(data, logoDataUri),
  };
}
