import 'server-only';

import { jsPDF } from 'jspdf';

import { formatCurrency, formatDate } from '@/lib/format';
import { getTenderWinLossReport } from '@/server/tender-reports';
import {
  PAGE,
  ensurePage,
  fetchLogoBase64,
  parseOrganizationMetadata,
  drawStandardHeader,
  drawStandardFooter,
  drawTable,
  type TableColumn,
} from './pdf-layout';
import type { TenderWinLossReportData } from '@/server/tender-reports';

function drawSummary(doc: jsPDF, data: TenderWinLossReportData) {
  const y = 52;

  const cards: Array<[string, string]> = [
    ['Win Rate', `${data.summary.winRate}%`],
    ['Awarded', String(data.summary.wonCount)],
    ['Lost', String(data.summary.lostCount)],
    ['Total Won Value', formatCurrency(data.summary.totalWonValue)],
    ['Total Lost Value', formatCurrency(data.summary.totalLostValue)],
  ];

  const colWidth = (PAGE.width - PAGE.margin * 2) / cards.length;
  cards.forEach(([label, value], index) => {
    const x = PAGE.margin + index * colWidth;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27);
    doc.text(value, x, y + 8);
  });

  return y + 18;
}

const AWARDED_COLUMNS: TableColumn[] = [
  { key: 'tenderNumber', label: 'TENDER NUMBER', widthMm: 40, x: PAGE.margin + 2 },
  { key: 'clientName', label: 'CLIENT', widthMm: 60, x: 60, wrap: true },
  { key: 'submissionDate', label: 'SUBMISSION DATE', widthMm: 30, x: 145 },
  {
    key: 'awardValue',
    label: 'AWARD VALUE',
    widthMm: 24,
    x: PAGE.width - PAGE.margin - 2,
    align: 'right',
    bold: true,
  },
];

const LOST_COLUMNS: TableColumn[] = [
  { key: 'tenderNumber', label: 'TENDER NUMBER', widthMm: 32, x: PAGE.margin + 2 },
  { key: 'clientName', label: 'CLIENT', widthMm: 45, x: 52, wrap: true },
  { key: 'value', label: 'VALUE', widthMm: 24, x: 145, align: 'right' },
  { key: 'lossReason', label: 'LOSS REASON', widthMm: 40, x: PAGE.width - PAGE.margin - 2, align: 'right', wrap: true },
];

const LOSS_REASON_COLUMNS: TableColumn[] = [
  { key: 'reason', label: 'REASON', widthMm: 120, x: PAGE.margin + 2, wrap: true },
  { key: 'count', label: 'COUNT', widthMm: 24, x: PAGE.width - PAGE.margin - 2, align: 'right', bold: true },
];

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  y = ensurePage(doc, y, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text(title, PAGE.margin, y);
  return y + 7;
}

function renderPdf(data: TenderWinLossReportData, logoDataUri: string | null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const orgMeta = parseOrganizationMetadata(data.org.metadata as any);

  drawStandardHeader(doc, {
    org: {
      name: data.org.name,
      logoDataUri,
      phone: orgMeta.phone,
      address: orgMeta.address,
      website: orgMeta.website,
    },
    titleLabel: 'TENDER WIN/LOSS SUMMARY',
    primaryLine: `As at ${formatDate(new Date())}`,
  });

  let y = drawSummary(doc, data);

  y = drawSectionTitle(doc, 'Awarded Tenders', y);
  y = drawTable(doc, {
    startY: y,
    columns: AWARDED_COLUMNS,
    rows: data.awarded.map((row) => ({
      tenderNumber: row.tenderNumber,
      clientName: row.clientName || '—',
      submissionDate: formatDate(row.submissionDate),
      awardValue: formatCurrency(row.awardValue),
    })),
    emptyMessage: 'No tenders awarded yet.',
  });

  y = drawSectionTitle(doc, 'Lost Tenders', y + 4);
  y = drawTable(doc, {
    startY: y,
    columns: LOST_COLUMNS,
    rows: data.lost.map((row) => ({
      tenderNumber: row.tenderNumber,
      clientName: row.clientName || '—',
      value: formatCurrency(row.value),
      lossReason: row.lossReason?.trim() || '—',
    })),
    emptyMessage: 'No lost tenders recorded.',
  });

  y = drawSectionTitle(doc, 'Loss Reasons (as recorded)', y + 4);
  drawTable(doc, {
    startY: y,
    columns: LOSS_REASON_COLUMNS,
    rows: data.lossReasons.map((row) => ({
      reason: row.reason,
      count: String(row.count),
    })),
    emptyMessage: 'No loss reasons recorded.',
  });

  drawStandardFooter(doc);
  return Buffer.from(doc.output('arraybuffer'));
}

export async function generateTenderWinLossPdf(organizationId: string) {
  const result = await getTenderWinLossReport(organizationId);
  if (!result.success) return null;

  const logoDataUri = await fetchLogoBase64(result.data.org.logo);

  return {
    fileName: `Tender-Win-Loss-Summary-${new Date().toISOString().split('T')[0]}.pdf`,
    buffer: renderPdf(result.data, logoDataUri),
  };
}
