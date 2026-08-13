import 'server-only';

import { db } from '@pmg/db';
import { tender, client, organization } from '@pmg/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { jsPDF } from 'jspdf';

import { formatCurrency, formatDate } from '@/lib/format';
import { getStatusConfig } from '@/components/ui/status-badge';
import {
  PAGE,
  splitText,
  ensurePage,
  fetchLogoBase64,
  parseOrganizationMetadata,
  drawStandardHeader,
  drawStandardFooter,
} from './pdf-layout';

function statusLabel(status: string, priority: string | null) {
  const label = getStatusConfig(status, 'tender').label;
  return priority ? `${label} · ${priority.charAt(0).toUpperCase()}${priority.slice(1)} priority` : label;
}

function drawMeta(
  doc: jsPDF,
  data: {
    clientName: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    submissionDate: Date | null;
    evaluationDate: Date | null;
    validityDate: Date | null;
    value: string | null;
    awardValue: string | null;
    briefingDate: Date | null;
    briefingLocation: string | null;
    isBriefingMandatory: boolean;
  }
) {
  let y = 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('CLIENT', PAGE.margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.text(data.clientName || 'Not specified', PAGE.margin, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('CONTACT', PAGE.margin, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(82, 82, 91);
  const contactLines = [data.contactName, data.contactEmail, data.contactPhone].filter(Boolean) as string[];
  const contactText = contactLines.length ? contactLines.join(' · ') : 'Not specified';
  const contactSplit = splitText(doc, contactText, 90);
  doc.text(contactSplit, PAGE.margin, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('SUBMISSION DATE', PAGE.width - PAGE.margin - 45, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text(formatDate(data.submissionDate), PAGE.width - PAGE.margin, y, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('VALIDITY DATE', PAGE.width - PAGE.margin - 45, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text(formatDate(data.validityDate), PAGE.width - PAGE.margin, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('ESTIMATED VALUE', PAGE.width - PAGE.margin - 45, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text(formatCurrency(data.value), PAGE.width - PAGE.margin, y + 14, { align: 'right' });

  if (data.awardValue) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('AWARD VALUE', PAGE.width - PAGE.margin - 45, y + 21);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    doc.text(formatCurrency(data.awardValue), PAGE.width - PAGE.margin, y + 21, { align: 'right' });
  }

  // Advance past whichever column (contact block, now that it can wrap, or
  // the date/value column) rendered taller, instead of a fixed offset that
  // could overlap the Briefing section below it.
  const leftColumnHeight = 20 + contactSplit.length * 3.5;
  const rightColumnHeight = data.awardValue ? 24 : 17;
  y += Math.max(leftColumnHeight, rightColumnHeight) + 4;

  if (data.briefingDate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('BRIEFING', PAGE.margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    const briefingLine = [
      formatDate(data.briefingDate),
      data.briefingLocation,
      data.isBriefingMandatory ? 'Mandatory' : null,
    ]
      .filter(Boolean)
      .join(' · ');
    doc.text(briefingLine, PAGE.margin, y + 5);
    y += 12;
  }

  return y + 6;
}

function renderPdf(data: {
  org: { name: string; logoDataUri: string | null; phone?: string; address?: string; website?: string };
  tenderNumber: string;
  status: string;
  priority: string | null;
  description: string | null;
  clientName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  submissionDate: Date | null;
  evaluationDate: Date | null;
  validityDate: Date | null;
  value: string | null;
  awardValue: string | null;
  briefingDate: Date | null;
  briefingLocation: string | null;
  isBriefingMandatory: boolean;
  lossReason: string | null;
  lossDetails: string | null;
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawStandardHeader(doc, {
    org: data.org,
    titleLabel: 'TENDER',
    primaryLine: `#${data.tenderNumber}`,
    secondaryLine: statusLabel(data.status, data.priority),
  });

  let y = drawMeta(doc, data);

  if (data.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const descLines = splitText(doc, data.description, PAGE.width - PAGE.margin * 2);
    y = ensurePage(doc, y, descLines.length * 4 + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('DESCRIPTION', PAGE.margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    doc.text(descLines, PAGE.margin, y + 5);
    y += descLines.length * 4 + 10;
  }

  if (data.status === 'lost' && (data.lossReason || data.lossDetails)) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const detailLines = data.lossDetails
      ? splitText(doc, data.lossDetails, PAGE.width - PAGE.margin * 2)
      : [];
    const neededHeight = 10 + (data.lossDetails ? detailLines.length * 4 + 8 : 0);
    y = ensurePage(doc, y, neededHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('LOSS REASON', PAGE.margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 27);
    doc.text(data.lossReason?.trim() || 'Not specified', PAGE.margin, y + 5);
    y += 10;

    if (data.lossDetails) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
      doc.text('LOSS DETAILS', PAGE.margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(82, 82, 91);
      doc.text(detailLines, PAGE.margin, y + 5);
      y += detailLines.length * 4 + 8;
    }
  }

  drawStandardFooter(doc);
  return Buffer.from(doc.output('arraybuffer'));
}

export async function generateTenderPdf(organizationId: string, tenderId: string) {
  const rows = await db
    .select({
      tenderNumber: tender.tenderNumber,
      description: tender.description,
      status: tender.status,
      priority: tender.priority,
      submissionDate: tender.submissionDate,
      evaluationDate: tender.evaluationDate,
      validityDate: tender.validityDate,
      value: tender.value,
      awardValue: tender.awardValue,
      contactName: tender.contactName,
      contactEmail: tender.contactEmail,
      contactPhone: tender.contactPhone,
      briefingDate: tender.briefingDate,
      briefingLocation: tender.briefingLocation,
      isBriefingMandatory: tender.isBriefingMandatory,
      lossReason: tender.lossReason,
      lossDetails: tender.lossDetails,
      clientName: client.name,
    })
    .from(tender)
    .leftJoin(client, eq(tender.clientId, client.id))
    .where(
      and(
        eq(tender.id, tenderId),
        eq(tender.organizationId, organizationId),
        isNull(tender.deletedAt)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const org = await db.query.organization.findFirst({ where: eq(organization.id, organizationId) });
  if (!org) return null;

  const orgMeta = parseOrganizationMetadata(org.metadata);
  const logoDataUri = await fetchLogoBase64(org.logo);

  return {
    fileName: `Tender-${row.tenderNumber}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '-'),
    buffer: renderPdf({
      org: { name: org.name, logoDataUri, phone: orgMeta.phone, address: orgMeta.address, website: orgMeta.website },
      ...row,
    }),
  };
}
