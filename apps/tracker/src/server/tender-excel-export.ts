'use server';

import ExcelJS from 'exceljs';
import { db } from '@pmg/db';
import { client, organization, tender } from '@pmg/db/schema';
import { and, asc, eq, isNull } from 'drizzle-orm';

import { validateSessionAndOrg } from './utils';
import { getStatusConfig } from '@/components/ui/status-badge';

const NAVY = '17365D';
const BLUE = '2F75B5';
const LIGHT_BLUE = 'D9EAF7';
const PALE_BLUE = 'EAF3F8';
const WHITE = 'FFFFFF';
const GREY = '666666';
const BORDER = 'D9E2F3';
const ZAR = 'R #,##0.00';
const DATE = 'dd mmm yyyy';

type TenderExportRow = {
  tenderNumber: string | null;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  tenderContactName: string | null;
  description: string | null;
  status: string;
  priority: string;
  submissionDate: Date | null;
  briefingDate: Date | null;
  value: string | number | null;
  awardValue: string | number | null;
};

const cleanText = (value: string | null | undefined) => {
  if (!value) return '';
  return value
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/â€™/g, '’')
    .replace(/â€œ/g, '“')
    .replace(/â€\u009d/g, '”')
    .replace(/â€“/g, '–')
    .replace(/â€”/g, '—')
    .replace(/â€¦/g, '…')
    .replace(/Â/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
};

const statusLabel = (status: string) => getStatusConfig(status as never, 'tender').label;

const safeSheetName = (name: string, used: Set<string>) => {
  const cleaned = cleanText(name).replace(/[\\/?*\[\]:]/g, ' ').trim() || 'Client';
  const base = cleaned.slice(0, 31);
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    const suffix = ` (${n++})`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(candidate);
  return candidate;
};

const addTitle = (sheet: ExcelJS.Worksheet, range: string, title: string, subtitle?: string) => {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(':')[0]);
  cell.value = title;
  cell.font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: WHITE } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  const firstRow = Number(range.match(/\d+/)?.[0] ?? 1);
  sheet.getRow(firstRow).height = 30;
  if (subtitle) {
    const endCol = range.split(':')[1].replace(/\d/g, '');
    sheet.mergeCells(`A${firstRow + 1}:${endCol}${firstRow + 1}`);
    const subtitleCell = sheet.getCell(`A${firstRow + 1}`);
    subtitleCell.value = subtitle;
    subtitleCell.font = { name: 'Aptos', size: 10, color: { argb: GREY } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(firstRow + 1).height = 20;
  }
};

const styleHeader = (row: ExcelJS.Row) => {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER } },
      bottom: { style: 'thin', color: { argb: BORDER } },
      left: { style: 'thin', color: { argb: BORDER } },
      right: { style: 'thin', color: { argb: BORDER } },
    };
  });
  row.height = 30;
};

const addKpi = (sheet: ExcelJS.Worksheet, labelCell: string, valueCell: string, label: string, formula: string, numberFormat?: string) => {
  const labelTarget = sheet.getCell(labelCell);
  labelTarget.value = label;
  labelTarget.font = { bold: true, size: 10, color: { argb: WHITE } };
  labelTarget.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
  labelTarget.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const valueTarget = sheet.getCell(valueCell);
  valueTarget.value = { formula };
  valueTarget.font = { bold: true, size: 20, color: { argb: NAVY } };
  valueTarget.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE_BLUE } };
  valueTarget.alignment = { horizontal: 'center', vertical: 'middle' };
  if (numberFormat) valueTarget.numFmt = numberFormat;
};

const dateValue = (date: Date | null) => (date ? date : undefined);

export async function getTendersExportExcel(organizationId: string, clientId?: string) {
  try {
    await validateSessionAndOrg(organizationId);
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });
    const orgName = org?.name || '';
    const rawRows = await db
      .select({
        tenderNumber: tender.tenderNumber,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.contactEmail,
        clientPhone: client.contactPhone,
        tenderContactName: tender.contactName,
        description: tender.description,
        status: tender.status,
        priority: tender.priority,
        submissionDate: tender.submissionDate,
        briefingDate: tender.briefingDate,
        value: tender.value,
        awardValue: tender.awardValue,
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(and(eq(tender.organizationId, organizationId), isNull(tender.deletedAt), ...(clientId ? [eq(tender.clientId, clientId)] : [])))
      .orderBy(asc(tender.submissionDate), asc(tender.tenderNumber));

    const rows = rawRows as TenderExportRow[];
    rows.sort((a, b) => {
      const aTime = a.submissionDate ? new Date(a.submissionDate).getTime() : -Infinity;
      const bTime = b.submissionDate ? new Date(b.submissionDate).getTime() : -Infinity;
      return bTime - aTime;
    });
    if (clientId && rows.length === 0) return { success: false as const, error: 'Client not found or has no tenders.' };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tender Tracker 360';
    workbook.created = new Date();
    workbook.modified = new Date();

    const clients = [...new Map(rows.filter((r) => r.clientId && r.clientName).map((r) => [r.clientId!, r.clientName!])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
    if (clientId) {
      buildClientReport(workbook, rows[0].clientName || 'Client', rows, orgName);
    } else {
      const usedSheetNames = new Set<string>(['Contents', 'Summary', 'Tender Register']);
      const clientSheetNames = new Map<string, string>();
      clients.forEach(([id, name]) => clientSheetNames.set(id, safeSheetName(name, usedSheetNames)));
      buildContents(workbook, clients, clientSheetNames, orgName);
      buildSummary(workbook, rows, orgName);
      buildTenderRegister(workbook, rows, orgName);
      for (const [id, name] of clients) buildClientSheet(workbook, name, rows.filter((r) => r.clientId === id), clientSheetNames.get(id)!, orgName);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const date = new Date().toISOString().slice(0, 10);
    const slug = (clientId ? rows[0]?.clientName : 'tender-register')?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tender-register';
    return { success: true as const, buffer, filename: `${slug}-${date}.xlsx` };
  } catch (error: unknown) {
    console.error('Error exporting tenders Excel:', error);
    return { success: false as const, error: 'Failed to generate Excel report.' };
  }
}

function buildTenderRegister(workbook: ExcelJS.Workbook, rows: TenderExportRow[], orgName: string) {
  const sheet = workbook.addWorksheet('Tender Register');
  addTitle(sheet, 'A1:L1', 'TENDER REGISTER', `${orgName} · Master tender register — submission timing and data-quality checks update when the workbook is opened.`);
  const headers = ['Tender Number', 'Client', 'Description', 'Status', 'Priority', 'Submission Date', 'Briefing Date', 'Estimated Value', 'Award Value', 'Contact Details', 'Submission Timing', 'Data Quality'];
  const headerRow = 4;
  sheet.getRow(headerRow).values = headers;
  styleHeader(sheet.getRow(headerRow));

  const tableRows = rows.map((row) => {
    const contact = [row.tenderContactName, row.clientEmail, row.clientPhone].filter(Boolean).map(cleanText).join(' ');
    return [cleanText(row.tenderNumber).toUpperCase(), cleanText(row.clientName), cleanText(row.description), statusLabel(row.status), row.priority, dateValue(row.submissionDate), dateValue(row.briefingDate), row.value == null ? null : Number(row.value), row.awardValue == null ? null : Number(row.awardValue), contact, { formula: 'IF([@[Submission Date]]="","Not Yet Due",IF([@[Submission Date]]<=TODAY(),"Submitted","Not Yet Due"))' }, { formula: 'IF([@[Contact Details]]="","Missing contact; ","")&IF([@[Estimated Value]]="","Missing estimate; ","")&IF(AND(ISNUMBER([@[Estimated Value]]),[@[Estimated Value]]<=1),"Questionable estimate","")' }];
  });
  sheet.addTable({ name: 'TenderRegister', ref: `A${headerRow}:L${Math.max(headerRow + rows.length, headerRow + 1)}`, headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: headers.map((name) => ({ name })), rows: tableRows });
  // Re-apply the blue header background so every header cell matches the Tender Number cell
  styleHeader(sheet.getRow(headerRow));

  [22, 30, 58, 18, 13, 18, 18, 18, 18, 42, 18, 34].forEach((width, i) => (sheet.getColumn(i + 1).width = width));
  for (let r = headerRow + 1; r <= headerRow + rows.length; r++) {
    sheet.getCell(`C${r}`).alignment = { vertical: 'top', wrapText: true };
    sheet.getCell(`J${r}`).alignment = { vertical: 'top', wrapText: true };
    sheet.getCell(`F${r}`).numFmt = DATE;
    sheet.getCell(`G${r}`).numFmt = DATE;
    sheet.getCell(`H${r}`).numFmt = ZAR;
    sheet.getCell(`I${r}`).numFmt = ZAR;
    sheet.getCell(`F${r}`).alignment = { horizontal: 'center', vertical: 'top' };
    sheet.getCell(`G${r}`).alignment = { horizontal: 'center', vertical: 'top' };
    sheet.getRow(r).height = 42;
  }
  sheet.views = [{ showGridLines: false }];
}

function buildContents(workbook: ExcelJS.Workbook, clients: [string, string][], clientSheetNames: Map<string, string>, orgName: string) {
  const sheet = workbook.addWorksheet('Contents');
  addTitle(sheet, 'A1:E1', 'TENDER SUBMISSION SUMMARY', `${orgName} · Workbook navigation and live client-level tender totals.`);
  [24, 34, 16, 16, 16].forEach((width, i) => (sheet.getColumn(i + 1).width = width));
  addKpi(sheet, 'A4', 'A5', 'Total Registered', 'COUNTA(TenderRegister[Tender Number])');
  addKpi(sheet, 'B4', 'B5', 'Total Submitted', 'COUNTIF(TenderRegister[Submission Timing],"Submitted")');
  addKpi(sheet, 'C4', 'C5', 'Not Yet Due', 'COUNTIF(TenderRegister[Submission Timing],"Not Yet Due")');
  addKpi(sheet, 'D4', 'D5', 'Number of Clients', `COUNTA(B13:B${12 + clients.length})`);
  sheet.getRow(4).height = 28;
  sheet.getRow(5).height = 38;

  sheet.getCell('A8').value = 'Workbook Navigation';
  sheet.getCell('A8').font = { bold: true, size: 13, color: { argb: NAVY } };
  sheet.getRow(9).values = ['Summary', { text: 'Open Summary', hyperlink: "#'Summary'!A1" }];
  sheet.getRow(10).values = ['Tender Register', { text: 'Open Tender Register', hyperlink: "#'Tender Register'!A1" }];
  sheet.getRow(12).values = ['Client Sheet', 'Client', 'Total Tenders', 'Submitted', 'Not Yet Due'];
  styleHeader(sheet.getRow(12));
  clients.forEach(([id, name], index) => {
    const r = 13 + index;
    const safeName = clientSheetNames.get(id)!;
    sheet.getRow(r).values = [{ text: safeName, hyperlink: `#'${safeName.replace(/'/g, "''")}'!A1` }, cleanText(name), { formula: `COUNTIF(TenderRegister[Client],B${r})` }, { formula: `COUNTIFS(TenderRegister[Client],B${r},TenderRegister[Submission Timing],"Submitted")` }, { formula: `COUNTIFS(TenderRegister[Client],B${r},TenderRegister[Submission Timing],"Not Yet Due")` }];
  });
  const totalRow = 13 + clients.length;
  sheet.getRow(totalRow).values = ['GRAND TOTAL', '', { formula: `SUM(C13:C${totalRow - 1})` }, { formula: `SUM(D13:D${totalRow - 1})` }, { formula: `SUM(E13:E${totalRow - 1})` }];
  sheet.getRow(totalRow).font = { bold: true, color: { argb: NAVY } };
  sheet.getRow(totalRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } };
  sheet.addTable({ name: 'ClientSummary', ref: `A12:E${totalRow - 1}`, headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: ['Client Sheet', 'Client', 'Total Tenders', 'Submitted', 'Not Yet Due'].map((name) => ({ name })), rows: clients.map(([id, name]) => [clientSheetNames.get(id), name, null, null, null]) });
  sheet.mergeCells(`A${totalRow + 2}:E${totalRow + 2}`);
  sheet.getCell(`A${totalRow + 2}`).value = { formula: `="This workbook contains "&A5&" registered tenders across "&D5&" clients, with "&B5&" submitted and "&C5&" not yet due."` };
  sheet.getCell(`A${totalRow + 2}`).alignment = { wrapText: true };
  sheet.getCell(`A${totalRow + 2}`).font = { italic: true, color: { argb: GREY } };
  for (let r = totalRow + 3; r <= totalRow + 30; r++) sheet.getRow(r).hidden = true;
  sheet.getColumn(6).hidden = true;
  sheet.views = [{ showGridLines: false }];
}

function buildSummary(workbook: ExcelJS.Workbook, rows: TenderExportRow[], orgName: string) {
  const sheet = workbook.addWorksheet('Summary');
  addTitle(sheet, 'A1:F1', 'TENDER PORTFOLIO SUMMARY', `${orgName} · Live portfolio KPIs, status mix, estimated pipeline, and data-quality indicators.`);
  [24, 20, 20, 22, 18, 18].forEach((width, i) => (sheet.getColumn(i + 1).width = width));
  addKpi(sheet, 'A4', 'A5', 'Total Tenders', 'COUNTA(TenderRegister[Tender Number])');
  addKpi(sheet, 'B4', 'B5', 'Total Submitted', 'COUNTIF(TenderRegister[Submission Timing],"Submitted")');
  addKpi(sheet, 'C4', 'C5', 'Not Yet Due', 'COUNTIF(TenderRegister[Submission Timing],"Not Yet Due")');
  addKpi(sheet, 'D4', 'D5', 'Estimated Pipeline', 'SUMIFS(TenderRegister[Estimated Value],TenderRegister[Submission Timing],"Not Yet Due")', ZAR);
  sheet.getRow(4).height = 28;
  sheet.getRow(5).height = 42;

  sheet.getCell('A8').value = 'Status Breakdown';
  sheet.getCell('A8').font = { bold: true, size: 13, color: { argb: NAVY } };
  sheet.getRow(9).values = ['Status', 'Tender Count', 'Estimated Value'];
  styleHeader(sheet.getRow(9));
  const statuses = [...new Set(rows.map((r) => statusLabel(r.status)))].sort();
  statuses.forEach((status, i) => {
    const r = 10 + i;
    sheet.getRow(r).values = [status, { formula: `COUNTIF(TenderRegister[Status],A${r})` }, { formula: `SUMIF(TenderRegister[Status],A${r},TenderRegister[Estimated Value])` }];
    sheet.getCell(`C${r}`).numFmt = ZAR;
  });
  sheet.addTable({ name: 'StatusBreakdown', ref: `A9:C${9 + statuses.length}`, headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: ['Status', 'Tender Count', 'Estimated Value'].map((name) => ({ name })), rows: statuses.map((status) => [status, null, null]) });

  sheet.getCell('E8').value = 'Data Quality';
  sheet.getCell('E8').font = { bold: true, size: 13, color: { argb: NAVY } };
  sheet.getCell('E9').value = 'Missing contacts';
  sheet.getCell('F9').value = { formula: 'COUNTIF(TenderRegister[Data Quality],"*Missing contact*")' };
  sheet.getCell('E10').value = 'Missing estimates';
  sheet.getCell('F10').value = { formula: 'COUNTIF(TenderRegister[Data Quality],"*Missing estimate*")' };
  sheet.getCell('E11').value = 'Questionable estimates';
  sheet.getCell('F11').value = { formula: 'COUNTIF(TenderRegister[Data Quality],"*Questionable estimate*")' };

  const findingsRow = Math.max(15, 12 + statuses.length);
  sheet.getCell(`A${findingsRow}`).value = 'Key Findings';
  sheet.getCell(`A${findingsRow}`).font = { bold: true, size: 13, color: { argb: NAVY } };
  [
    `="The portfolio contains "&A5&" tenders, of which "&B5&" are submitted and "&C5&" are not yet due."`,
    `="The current estimated pipeline is "&TEXT(D5,"R #,##0.00")&" based on tenders not yet due."`,
    `="Data quality checks identify "&F9&" missing contacts, "&F10&" missing estimates, and "&F11&" questionable estimates."`,
  ].forEach((formula, index) => {
    const r = findingsRow + 1 + index;
    sheet.mergeCells(`A${r}:F${r}`);
    sheet.getCell(`A${r}`).value = { formula };
    sheet.getCell(`A${r}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getRow(r).height = 30;
  });
  for (let r = findingsRow + 4; r <= findingsRow + 30; r++) sheet.getRow(r).hidden = true;
  sheet.getColumn(7).hidden = true;
  sheet.views = [{ showGridLines: false }];
}

function buildClientSheet(workbook: ExcelJS.Workbook, clientName: string, rows: TenderExportRow[], sheetName: string, orgName: string) {
  const sheet = workbook.addWorksheet(sheetName);
  addTitle(sheet, 'A1:D1', 'CLIENT TENDER REPORT', orgName);
  sheet.getCell('A2').value = cleanText(clientName);
  sheet.getCell('A2').font = { bold: true, color: { argb: NAVY } };
  sheet.getCell('A3').value = 'Total Tenders';
  sheet.getCell('B3').value = { formula: `COUNTIF(TenderRegister[Client],A2)` };
  sheet.getCell('A3').font = { bold: true, color: { argb: WHITE } };
  sheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
  sheet.getCell('B3').font = { bold: true, size: 14, color: { argb: NAVY } };
  sheet.getCell('B3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE_BLUE } };
  sheet.getRow(5).values = ['Tender Number', 'Description', 'Closing / Submission Date', 'Contact Details'];
  styleHeader(sheet.getRow(5));
  sheet.getCell('A6').value = { formula: `FILTER(TenderRegister[[Tender Number]:[Contact Details]],TenderRegister[Client]=$A$2,"")` };
  [24, 72, 24, 48].forEach((width, i) => (sheet.getColumn(i + 1).width = width));
  sheet.getColumn(5).hidden = true;
  for (let r = 6; r <= Math.max(30, 5 + rows.length); r++) {
    sheet.getCell(`B${r}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`D${r}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`C${r}`).numFmt = DATE;
    sheet.getCell(`C${r}`).alignment = { horizontal: 'center', vertical: 'top' };
    if (r > 5 + rows.length) sheet.getRow(r).hidden = true;
  }
  sheet.views = [{ showGridLines: false }];
}

function buildClientReport(workbook: ExcelJS.Workbook, clientName: string, rows: TenderExportRow[], orgName: string) {
  const sheet = workbook.addWorksheet('Client Report');
  addTitle(sheet, 'A1:F1', 'CLIENT TENDER REPORT', `${orgName} · ${cleanText(clientName)}`);
  [24, 68, 24, 44, 18, 18].forEach((width, i) => (sheet.getColumn(i + 1).width = width));
  addKpi(sheet, 'A4', 'A5', 'Total Tenders', 'COUNTA(A9:A1000)');
  addKpi(sheet, 'B4', 'B5', 'Submitted', 'COUNTIF(E9:E1000,"Submitted")');
  addKpi(sheet, 'C4', 'C5', 'Not Yet Due', 'COUNTIF(E9:E1000,"Not Yet Due")');
  addKpi(sheet, 'D4', 'D5', 'Estimated Value', 'SUM(F9:F1000)', ZAR);
  sheet.getRow(8).values = ['Tender Number', 'Description', 'Closing / Submission Date', 'Contact Details', 'Submission Timing', 'Estimated Value'];
  styleHeader(sheet.getRow(8));
  const tableRows = rows.map((row, index) => {
    const r = 9 + index;
    const contact = [row.tenderContactName, row.clientEmail, row.clientPhone].filter(Boolean).map(cleanText).join(' | ') || 'Not provided';
    return [cleanText(row.tenderNumber).toUpperCase(), cleanText(row.description), dateValue(row.submissionDate), contact, { formula: `IF(C${r}="","Not Yet Due",IF(C${r}<=TODAY(),"Submitted","Not Yet Due"))` }, row.value == null ? null : Number(row.value)];
  });
  sheet.addTable({ name: 'ClientTenderReport', ref: `A8:F${Math.max(8 + rows.length, 9)}`, headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: ['Tender Number', 'Description', 'Closing / Submission Date', 'Contact Details', 'Submission Timing', 'Estimated Value'].map((name) => ({ name })), rows: tableRows });
  // Re-apply the blue header background so every header cell matches the Tender Number cell
  styleHeader(sheet.getRow(8));
  for (let r = 9; r <= 8 + rows.length; r++) {
    sheet.getCell(`B${r}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`D${r}`).alignment = { wrapText: true, vertical: 'top' };
    sheet.getCell(`C${r}`).numFmt = DATE;
    sheet.getCell(`C${r}`).alignment = { horizontal: 'center', vertical: 'top' };
    sheet.getCell(`F${r}`).numFmt = ZAR;
    sheet.getRow(r).height = 42;
  }
  sheet.views = [{ showGridLines: false }];
}
