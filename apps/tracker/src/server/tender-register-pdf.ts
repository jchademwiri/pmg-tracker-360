'use server';

import 'server-only';

import { db } from '@pmg/db';
import { client, organization, tender, tenderExtension } from '@pmg/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { jsPDF } from 'jspdf';

import { getStatusConfig } from '@/components/ui/status-badge';
import { validateSessionAndOrg } from './utils';

const NAVY = [23, 54, 93] as const;
const BLUE = [47, 117, 181] as const;
const LIGHT = [234, 243, 248] as const;
const GREY = [102, 102, 102] as const;
const WHITE = [255, 255, 255] as const;
const BORDER = [217, 226, 243] as const;
const MARGIN = 12;
const ROW_HEIGHT = 8;
const DATE = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

type Column = [string, number];

export type TenderPdfRow = {
  tenderNumber: string | null;
  clientId: string | null;
  clientName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  description: string | null;
  status: string;
  priority: string | null;
  submissionDate: Date | null;
  validityDate: Date | null;
  value: string | number | null;
};

function text(value: string | null | undefined) {
  return (value || '').replace(/\u0000/g, '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function date(value: Date | null) {
  return value ? DATE.format(new Date(value)) : '—';
}

function money(value: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function status(value: string) {
  return getStatusConfig(value as never, 'tender').label;
}

function timing(value: Date | null) {
  if (!value) return 'Not Yet Due';
  return new Date(value).getTime() <= Date.now() ? 'Submitted' : 'Not Yet Due';
}

function contact(row: TenderPdfRow) {
  return [row.contactName, row.contactEmail, row.contactPhone].filter(Boolean).map(text).join(' | ') || 'Not provided';
}

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(title, MARGIN, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(subtitle, MARGIN, 20);
}

function footer(doc: jsPDF, orgName: string) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN, height - 9, width - MARGIN, height - 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text(orgName ? `Tender Tracker 360 - ${orgName}` : 'Tender Tracker 360', MARGIN, height - 5);
}

function drawPageNumbers(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${total}`, width - MARGIN, height - 5, { align: 'right' });
  }
}

function kpi(doc: jsPDF, x: number, y: number, width: number, label: string, value: string) {
  doc.setFillColor(...BLUE);
  doc.roundedRect(x, y, width, 9, 1.5, 1.5, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(label, x + 3, y + 6);
  doc.setFillColor(...LIGHT);
  doc.roundedRect(x, y + 9, width, 17, 1.5, 1.5, 'F');
  doc.setTextColor(...NAVY);
  doc.setFontSize(15);
  doc.text(value, x + width / 2, y + 20, { align: 'center' });
}

function drawTable(doc: jsPDF, rows: TenderPdfRow[], startY: number, includeClient: boolean, orgName: string) {
  const width = doc.internal.pageSize.getWidth();
  const columns: Column[] = includeClient
    ? [
        ['Tender Number', 31], ['Client', 42], ['Description', 74], ['Status', 29],
        ['Submission Date', 29], ['Validity Date', 32], ['Timing', 28],
      ]
    : [
        ['Tender Number', 34], ['Description', 82], ['Submission Date', 32],
        ['Contact Details', 66], ['Timing', 30], ['Validity Date', 34],
      ];
  const total = columns.reduce((sum, [, columnWidth]) => sum + columnWidth, 0);
  const scale = (width - MARGIN * 2) / total;
  const scaled: Column[] = columns.map(([label, columnWidth]) => [label, columnWidth * scale]);
  let y = startY;

  const drawHeader = () => {
    let x = MARGIN;
    doc.setFillColor(...BLUE);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    for (const [label, columnWidth] of scaled) {
      doc.rect(x, y, columnWidth, ROW_HEIGHT, 'F');
      doc.text(label, x + 2, y + 5.2, { maxWidth: columnWidth - 4 });
      x += columnWidth;
    }
    y += ROW_HEIGHT;
  };

  const drawRow = (row: TenderPdfRow, index: number) => {
    const values = includeClient
      ? [text(row.tenderNumber).toUpperCase() || '—', text(row.clientName) || '—', text(row.description) || '—', status(row.status), date(row.submissionDate), date(row.validityDate), timing(row.submissionDate)]
      : [text(row.tenderNumber).toUpperCase() || '—', text(row.description) || '—', date(row.submissionDate), contact(row), timing(row.submissionDate), date(row.validityDate)];
    const wrapped = values.map((value, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(6.5);
      return doc.splitTextToSize(value, scaled[i][1] - 4).slice(0, 3);
    });
    const height = Math.max(ROW_HEIGHT, ...wrapped.map((lines) => lines.length * 3.2 + 3));
    if (y + height > doc.internal.pageSize.getHeight() - 13) {
      footer(doc, orgName);
      doc.addPage('a4', 'landscape');
      header(doc, includeClient ? 'TENDER REGISTER' : 'CLIENT TENDER REPORT', includeClient ? `${orgName} · Master tender register` : `${orgName} · ${text(row.clientName) || 'Client'}`);
      y = 34;
      drawHeader();
    }
    if (index % 2 === 1) {
      doc.setFillColor(...LIGHT);
      doc.rect(MARGIN, y, width - MARGIN * 2, height, 'F');
    }
    let x = MARGIN;
    wrapped.forEach((lines, i) => {
      doc.setTextColor(24, 24, 27);
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.setFontSize(6.5);
      doc.text(lines, x + 2, y + 4, { maxWidth: scaled[i][1] - 4 });
      x += scaled[i][1];
    });
    doc.setDrawColor(...BORDER);
    doc.rect(MARGIN, y, width - MARGIN * 2, height);
    y += height;
  };

  drawHeader();
  rows.forEach(drawRow);
  return y;
}

function renderPortfolio(rows: TenderPdfRow[], orgName: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const total = rows.length;
  const submitted = rows.filter((row) => timing(row.submissionDate) === 'Submitted').length;
  const due = total - submitted;
  const clients = new Set(rows.map((row) => row.clientId).filter(Boolean)).size;
  const pipeline = rows.filter((row) => timing(row.submissionDate) === 'Not Yet Due').reduce((sum, row) => sum + (Number(row.value) || 0), 0);

  header(doc, 'TENDER PORTFOLIO SUMMARY', `${orgName} · Tender submission register`);
  const width = doc.internal.pageSize.getWidth();
  const contentWidth = width - MARGIN * 2;
  const gap = 5;
  const kpiWidth = (contentWidth - gap * 4) / 5;
  const kpis: Array<[string, string]> = [
    ['TOTAL TENDERS', String(total)],
    ['SUBMITTED', String(submitted)],
    ['NOT YET DUE', String(due)],
    ['NUMBER OF CLIENTS', String(clients)],
    ['PIPELINE', money(pipeline)],
  ];
  kpis.forEach(([label, value], i) => kpi(doc, MARGIN + i * (kpiWidth + gap), 35, kpiWidth, label, value));

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Data Quality', MARGIN, 72);
  const missingContacts = rows.filter((r) => !contact(r) || contact(r) === 'Not provided').length;
  const missingEstimates = rows.filter((r) => r.value === null || r.value === undefined || r.value === '').length;
  const questionable = rows.filter((r) => Number(r.value) <= 1 && r.value !== null && r.value !== undefined && r.value !== '').length;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(`Missing contacts: ${missingContacts}   |   Missing estimates: ${missingEstimates}   |   Questionable estimates: ${questionable}`, MARGIN, 78);

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Tender Register', MARGIN, 90);
  drawTable(doc, rows, 94, true, orgName);
  footer(doc, orgName);
  drawPageNumbers(doc);
  return Buffer.from(doc.output('arraybuffer'));
}

function renderClient(clientName: string, rows: TenderPdfRow[], orgName: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const submitted = rows.filter((row) => timing(row.submissionDate) === 'Submitted').length;
  const due = rows.length - submitted;
  const estimated = rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0);

  header(doc, 'CLIENT TENDER REPORT', `${orgName} · ${text(clientName)}`);
  const width = doc.internal.pageSize.getWidth();
  const contentWidth = width - MARGIN * 2;
  const gap = 5;
  const kpiWidth = (contentWidth - gap * 3) / 4;
  const kpis: Array<[string, string]> = [
    ['TOTAL TENDERS', String(rows.length)],
    ['SUBMITTED', String(submitted)],
    ['NOT YET DUE', String(due)],
    ['ESTIMATED VALUE', money(estimated)],
  ];
  kpis.forEach(([label, value], i) => kpi(doc, MARGIN + i * (kpiWidth + gap), 35, kpiWidth, label, value));
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Tenders', MARGIN, 72);
  drawTable(doc, rows, 76, false, orgName);
  footer(doc, orgName);
  drawPageNumbers(doc);
  return Buffer.from(doc.output('arraybuffer'));
}

async function getRows(organizationId: string, clientId?: string) {
  const raw = await db
    .select({
      id: tender.id,
      tenderNumber: tender.tenderNumber,
      clientId: client.id,
      clientName: client.name,
      contactName: tender.contactName,
      contactEmail: tender.contactEmail,
      contactPhone: tender.contactPhone,
      description: tender.description,
      status: tender.status,
      priority: tender.priority,
      submissionDate: tender.submissionDate,
      validityDate: tender.validityDate,
      value: tender.value,
    })
    .from(tender)
    .leftJoin(client, eq(tender.clientId, client.id))
    .where(and(eq(tender.organizationId, organizationId), isNull(tender.deletedAt), ...(clientId ? [eq(tender.clientId, clientId)] : [])));

  // Latest extension per tender overrides the validity date.
  const extensions = await db
    .select({
      tenderId: tenderExtension.tenderId,
      newEvaluationDate: tenderExtension.newEvaluationDate,
    })
    .from(tenderExtension)
    .where(
      and(
        eq(tenderExtension.organizationId, organizationId),
        isNull(tenderExtension.deletedAt)
      )
    );
  const extendedDates = new Map<string, Date>();
  for (const ext of extensions) {
    if (!ext.newEvaluationDate) continue;
    const current = extendedDates.get(ext.tenderId);
    if (!current || ext.newEvaluationDate > current) {
      extendedDates.set(ext.tenderId, ext.newEvaluationDate);
    }
  }

  const rows: TenderPdfRow[] = raw.map((row) => ({
    tenderNumber: row.tenderNumber,
    clientId: row.clientId,
    clientName: row.clientName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    description: row.description,
    status: row.status,
    priority: row.priority,
    submissionDate: row.submissionDate,
    validityDate: extendedDates.get(row.id) || row.validityDate,
    value: row.value,
  }));

  return rows.sort((a, b) => {
    const at = a.submissionDate ? new Date(a.submissionDate).getTime() : -Infinity;
    const bt = b.submissionDate ? new Date(b.submissionDate).getTime() : -Infinity;
    return bt - at;
  });
}

export async function getTenderRegisterPdf(organizationId: string, clientId?: string) {
  await validateSessionAndOrg(organizationId);
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });
  const orgName = org?.name || '';
  const rows = await getRows(organizationId, clientId);
  if (clientId && !rows.length) return { success: false as const, error: 'Client not found or has no tenders.' };
  const buffer = clientId ? renderClient(text(rows[0]?.clientName) || 'Client', rows, orgName) : renderPortfolio(rows, orgName);
  const slug = (clientId ? rows[0]?.clientName : 'tender-register')?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tender-register';
  return { success: true as const, buffer, filename: `${slug}-${new Date().toISOString().slice(0, 10)}.pdf` };
}
