import ExcelJS from 'exceljs';
import {
  getPlatformOverviewStats,
  getStorageBreakdown,
  getAllTenantsUtilization,
  getSecurityComplianceMetrics,
} from './reports-queries';

const SLATE_DARK = 'FF0F172A';
const GOLD_ACCENT = 'FFD4AF37';
const ROW_EVEN = 'FFF8FAFC';
const ROW_ODD = 'FFFFFFFF';
const BORDER_COLOR = 'FFE2E8F0';

const headerFont: Partial<ExcelJS.Font> = {
  name: 'Segoe UI',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

const headerFill = (color = SLATE_DARK): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: color },
});

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: BORDER_COLOR } },
  left: { style: 'thin', color: { argb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
  right: { style: 'thin', color: { argb: BORDER_COLOR } },
};

export async function generatePlatformMasterExcel(): Promise<Buffer> {
  const [overview, storageData, allTenants, security] = await Promise.all([
    getPlatformOverviewStats(),
    getStorageBreakdown(),
    getAllTenantsUtilization(),
    getSecurityComplianceMetrics(),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PMG Tracker 360 - Platform Administration';
  workbook.lastModifiedBy = 'Platform Superadmin';
  workbook.created = new Date();
  workbook.modified = new Date();

  /* =========================================================================
     SHEET 1: Executive Summary
  ========================================================================= */
  const summarySheet = workbook.addWorksheet('Executive Summary', {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { key: 'metric', width: 38 },
    { key: 'value', width: 26 },
    { key: 'notes', width: 45 },
  ];

  // Title Banner
  summarySheet.mergeCells('A1:C1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'PMG TRACKER 360 — SYSTEM OWNER PLATFORM REPORT';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = headerFill(SLATE_DARK);
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 36;

  summarySheet.mergeCells('A2:C2');
  const subtitleCell = summarySheet.getCell('A2');
  subtitleCell.value = `Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  subtitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF64748B' } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(2).height = 20;

  summarySheet.addRow([]);

  const addSectionHeader = (sheet: ExcelJS.Worksheet, title: string) => {
    const r = sheet.addRow([title, '', '']);
    sheet.mergeCells(`A${r.number}:C${r.number}`);
    const c = sheet.getCell(`A${r.number}`);
    c.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = headerFill('FF1E293B');
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    r.height = 24;
  };

  const addMetricRow = (sheet: ExcelJS.Worksheet, label: string, val: string | number, notes = '') => {
    const r = sheet.addRow([label, val, notes]);
    r.font = { name: 'Segoe UI', size: 10 };
    r.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true };
    r.getCell(2).alignment = { horizontal: typeof val === 'number' ? 'right' : 'left' };
    r.height = 20;
    r.eachCell((cell) => { cell.border = thinBorder; });
    return r;
  };

  addSectionHeader(summarySheet, '1. TENANT & USER METRICS');
  addMetricRow(summarySheet, 'Total Registered Organizations', overview.totalTenants, 'All lifetime accounts');
  addMetricRow(summarySheet, 'Active Organizations', overview.activeTenants, 'Currently operational');
  addMetricRow(summarySheet, 'Soft-Deleted / Inactive Organizations', overview.softDeletedTenants, 'Pending purge / appealed');
  addMetricRow(summarySheet, 'Total Platform Users', overview.totalUsers, 'Across all roles');
  addMetricRow(summarySheet, 'Verified Users', overview.verifiedUsers, `${overview.verificationRate}% verification rate`);
  addMetricRow(summarySheet, 'Waitlist Submissions', overview.waitlistCount, 'Prospective leads');

  summarySheet.addRow([]);
  addSectionHeader(summarySheet, '2. INFRASTRUCTURE & STORAGE METRICS');
  addMetricRow(summarySheet, 'Total Stored Files', overview.totalDocuments, 'All uploaded documents');
  addMetricRow(summarySheet, 'Total Storage Consumed (MB)', overview.totalStorageMB, `${overview.totalStorageGB} GB total`);
  addMetricRow(summarySheet, 'Top Storage Category', storageData.categories[0]?.category ?? 'N/A', `${storageData.categories[0]?.sizeMB ?? 0} MB (${storageData.categories[0]?.percentage ?? 0}%)`);

  summarySheet.addRow([]);
  addSectionHeader(summarySheet, '3. COMMERCIAL PIPELINE (PLATFORM TOTALS)');
  const rPipeline = addMetricRow(summarySheet, 'Total Tender Pipeline Value', overview.totalTenderPipelineValue, 'Cumulative bid sum across all tenants');
  rPipeline.getCell(2).numFmt = '"R "#,##0.00;[Red]-"R "#,##0.00';

  const rAwarded = addMetricRow(summarySheet, 'Total Awarded Tender Value', overview.totalTenderAwardedValue, 'Won contracts value');
  rAwarded.getCell(2).numFmt = '"R "#,##0.00;[Red]-"R "#,##0.00';

  addMetricRow(summarySheet, 'Total Tenders Managed', overview.totalTenders, 'All bid statuses');
  addMetricRow(summarySheet, 'Active Awarded Projects', overview.activeProjects, `${overview.totalProjects} total projects`);

  const rPo = addMetricRow(summarySheet, 'Total Purchase Orders Value', overview.totalPOAmount, `${overview.totalPOs} total POs logged`);
  rPo.getCell(2).numFmt = '"R "#,##0.00;[Red]-"R "#,##0.00';

  summarySheet.addRow([]);
  addSectionHeader(summarySheet, '4. SECURITY & SUPPORT TICKETS');
  addMetricRow(summarySheet, 'Open Support Tickets', overview.openSupportTickets, 'Awaiting resolution');
  addMetricRow(summarySheet, 'User Feedback Received', overview.totalFeedbackCount, 'Bug reports & features');
  addMetricRow(summarySheet, 'Critical Security Events', security.criticalEvents, 'Audit trail alerts');
  addMetricRow(summarySheet, 'Suspicious Sessions Detected', security.suspiciousSessions, 'Anomalous IP/Device logins');

  /* =========================================================================
     SHEET 2: Tenant Roster & Usage
  ========================================================================= */
  const tenantSheet = workbook.addWorksheet('Tenant Roster', {
    views: [{ showGridLines: true }],
  });

  tenantSheet.columns = [
    { header: 'Organization Name', key: 'name', width: 32 },
    { header: 'Slug / Domain', key: 'slug', width: 22 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Created Date', key: 'createdAt', width: 16 },
    { header: 'Members', key: 'memberCount', width: 12 },
    { header: 'Tenders', key: 'tenderCount', width: 12 },
    { header: 'Projects', key: 'projectCount', width: 12 },
    { header: 'Docs', key: 'documentCount', width: 12 },
    { header: 'Storage (MB)', key: 'storageMB', width: 16 },
  ];

  const tHeaderRow = tenantSheet.getRow(1);
  tHeaderRow.height = 28;
  tHeaderRow.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill(SLATE_DARK);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  allTenants.forEach((t, idx) => {
    const isDeleted = !!t.deletedAt;
    const r = tenantSheet.addRow({
      name: t.name,
      slug: t.slug ?? '—',
      status: isDeleted ? 'Deleted/Archived' : 'Active',
      createdAt: new Date(t.createdAt).toLocaleDateString('en-GB'),
      memberCount: t.memberCount,
      tenderCount: t.tenderCount,
      projectCount: t.projectCount,
      documentCount: t.documentCount,
      storageMB: t.storageMB,
    });

    r.height = 20;
    r.font = { name: 'Segoe UI', size: 10 };
    r.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: idx % 2 === 0 ? ROW_ODD : ROW_EVEN },
    };

    r.getCell('name').font = { name: 'Segoe UI', size: 10, bold: true };
    r.getCell('status').alignment = { horizontal: 'center' };
    r.getCell('createdAt').alignment = { horizontal: 'center' };
    r.getCell('memberCount').alignment = { horizontal: 'right' };
    r.getCell('tenderCount').alignment = { horizontal: 'right' };
    r.getCell('projectCount').alignment = { horizontal: 'right' };
    r.getCell('documentCount').alignment = { horizontal: 'right' };
    r.getCell('storageMB').alignment = { horizontal: 'right' };
    r.getCell('storageMB').numFmt = '#,##0.00';

    if (isDeleted) {
      r.getCell('status').font = { color: { argb: 'FFE11D48' }, bold: true };
    } else {
      r.getCell('status').font = { color: { argb: 'FF059669' }, bold: true };
    }

    r.eachCell((cell) => { cell.border = thinBorder; });
  });

  /* =========================================================================
     SHEET 3: Storage Breakdown
  ========================================================================= */
  const storageSheet = workbook.addWorksheet('Storage Breakdown', {
    views: [{ showGridLines: true }],
  });

  storageSheet.columns = [
    { header: 'Resource Category', key: 'category', width: 34 },
    { header: 'File Count', key: 'count', width: 16 },
    { header: 'Storage (MB)', key: 'sizeMB', width: 18 },
    { header: 'Share of Total', key: 'percentage', width: 18 },
  ];

  const sHeaderRow = storageSheet.getRow(1);
  sHeaderRow.height = 28;
  sHeaderRow.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill(SLATE_DARK);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  storageData.categories.forEach((cat, idx) => {
    const r = storageSheet.addRow({
      category: cat.category,
      count: cat.count,
      sizeMB: cat.sizeMB,
      percentage: `${cat.percentage}%`,
    });
    r.height = 20;
    r.font = { name: 'Segoe UI', size: 10 };
    r.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: idx % 2 === 0 ? ROW_ODD : ROW_EVEN },
    };
    r.getCell('category').font = { name: 'Segoe UI', size: 10, bold: true };
    r.getCell('count').alignment = { horizontal: 'right' };
    r.getCell('sizeMB').alignment = { horizontal: 'right' };
    r.getCell('sizeMB').numFmt = '#,##0.00';
    r.getCell('percentage').alignment = { horizontal: 'center' };
    r.eachCell((cell) => { cell.border = thinBorder; });
  });

  /* =========================================================================
     SHEET 4: Security & Audit Summary
  ========================================================================= */
  const secSheet = workbook.addWorksheet('Security Audit Logs', {
    views: [{ showGridLines: true }],
  });

  secSheet.columns = [
    { header: 'Event ID', key: 'id', width: 18 },
    { header: 'Action', key: 'action', width: 32 },
    { header: 'Resource', key: 'resourceType', width: 22 },
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Date & Time', key: 'createdAt', width: 22 },
    { header: 'IP Address', key: 'ipAddress', width: 20 },
  ];

  const secHeaderRow = secSheet.getRow(1);
  secHeaderRow.height = 28;
  secHeaderRow.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill(SLATE_DARK);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  security.recentCriticalLogs.forEach((log, idx) => {
    const r = secSheet.addRow({
      id: log.id.slice(0, 8),
      action: log.action,
      resourceType: log.resourceType,
      severity: log.severity.toUpperCase(),
      createdAt: new Date(log.createdAt).toLocaleString('en-GB'),
      ipAddress: log.ipAddress ?? '—',
    });
    r.height = 20;
    r.font = { name: 'Segoe UI', size: 10 };
    r.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: idx % 2 === 0 ? ROW_ODD : ROW_EVEN },
    };
    r.getCell('severity').alignment = { horizontal: 'center' };
    r.getCell('severity').font = { color: { argb: 'FFE11D48' }, bold: true };
    r.eachCell((cell) => { cell.border = thinBorder; });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Dedicated Storage & S3 Resource Audit Excel Workbook
 */
export async function generateStorageAuditExcel(): Promise<Buffer> {
  const [overview, storageData, allTenants] = await Promise.all([
    getPlatformOverviewStats(),
    getStorageBreakdown(),
    getAllTenantsUtilization(),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PMG Tracker 360 - Storage Audit';
  workbook.created = new Date();

  // Sheet 1: Capacity & Account Quota Summary
  const capSheet = workbook.addWorksheet('Capacity & Quota Summary');
  capSheet.columns = [
    { header: 'Metric', key: 'metric', width: 36 },
    { header: 'Value', key: 'value', width: 24 },
    { header: 'Details / Context', key: 'details', width: 44 },
  ];
  capSheet.getRow(1).height = 26;
  capSheet.getRow(1).eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill(SLATE_DARK);
  });

  const addCapRow = (m: string, v: string | number, d: string) => {
    const r = capSheet.addRow({ metric: m, value: v, details: d });
    r.font = { name: 'Segoe UI', size: 10 };
    r.getCell('metric').font = { name: 'Segoe UI', size: 10, bold: true };
    r.getCell('value').alignment = { horizontal: typeof v === 'number' ? 'right' : 'left' };
    r.eachCell((cell) => { cell.border = thinBorder; });
  };

  addCapRow('Cloudflare Plan Tier Limit', `${overview.totalStorageCapacityGB}.00 GB`, 'Cloudflare R2 Monthly Free Tier');
  addCapRow('Total Combined Storage Used', `${overview.totalStorageMB.toLocaleString()} MB`, `${overview.totalStorageGB} GB across all detected buckets`);
  addCapRow('Available Free Storage Remaining', `${overview.availableStorageGB} GB`, `${overview.availableStorageMB.toLocaleString()} MB remaining before pay-as-you-go`);
  addCapRow('Capacity Utilization Rate', `${overview.storageUtilizationPct}%`, overview.storageWarningStatus.toUpperCase());
  addCapRow('Total Document Attachments', overview.totalDocuments, 'Files tracked in PMG Tracker 360 database');
  addCapRow('Live Cloudflare API Connection', storageData.storageOverview.connectedLiveApi ? 'Connected (Multi-Bucket Sync)' : 'Local DB Monitored', 'Set CLOUDFLARE_API_TOKEN for live multi-app discovery');

  // Sheet 2: Storage Categories
  const catSheet = workbook.addWorksheet('Storage Categories');
  catSheet.columns = [
    { header: 'Category', key: 'category', width: 32 },
    { header: 'File Count', key: 'count', width: 16 },
    { header: 'Storage (MB)', key: 'sizeMB', width: 18 },
    { header: 'Share (%)', key: 'percentage', width: 14 },
  ];
  catSheet.getRow(1).height = 26;
  catSheet.getRow(1).eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill(SLATE_DARK);
  });

  storageData.categories.forEach((cat) => {
    const r = catSheet.addRow({
      category: cat.category,
      count: cat.count,
      sizeMB: cat.sizeMB,
      percentage: `${cat.percentage}%`,
    });
    r.getCell('sizeMB').numFmt = '#,##0.00';
    r.eachCell((cell) => { cell.border = thinBorder; });
  });

  // Sheet 2: Tenant Storage Quota
  const tenantSheet = workbook.addWorksheet('Tenant Storage Footprint');
  tenantSheet.columns = [
    { header: 'Organization', key: 'name', width: 30 },
    { header: 'Documents Uploaded', key: 'documentCount', width: 20 },
    { header: 'Storage Used (MB)', key: 'storageMB', width: 20 },
    { header: 'Tenders', key: 'tenderCount', width: 14 },
    { header: 'Projects', key: 'projectCount', width: 14 },
  ];
  tenantSheet.getRow(1).height = 26;
  tenantSheet.getRow(1).eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill(SLATE_DARK);
  });

  allTenants.forEach((t) => {
    const r = tenantSheet.addRow({
      name: t.name,
      documentCount: t.documentCount,
      storageMB: t.storageMB,
      tenderCount: t.tenderCount,
      projectCount: t.projectCount,
    });
    r.getCell('storageMB').numFmt = '#,##0.00';
    r.eachCell((cell) => { cell.border = thinBorder; });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Dedicated Security & Compliance Audit Log Excel Workbook
 */
export async function generateSecurityAuditExcel(): Promise<Buffer> {
  const security = await getSecurityComplianceMetrics();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PMG Tracker 360 - Security Audit';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Security Compliance Log');
  sheet.columns = [
    { header: 'Event ID', key: 'id', width: 20 },
    { header: 'Action', key: 'action', width: 32 },
    { header: 'Resource Type', key: 'resourceType', width: 20 },
    { header: 'Severity', key: 'severity', width: 14 },
    { header: 'Date & Time', key: 'createdAt', width: 24 },
    { header: 'IP Address', key: 'ipAddress', width: 20 },
  ];
  sheet.getRow(1).height = 26;
  sheet.getRow(1).eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill(SLATE_DARK);
  });

  security.recentCriticalLogs.forEach((log) => {
    const r = sheet.addRow({
      id: log.id,
      action: log.action,
      resourceType: log.resourceType,
      severity: log.severity.toUpperCase(),
      createdAt: new Date(log.createdAt).toLocaleString('en-GB'),
      ipAddress: log.ipAddress ?? '—',
    });
    r.getCell('severity').font = { color: { argb: 'FFE11D48' }, bold: true };
    r.eachCell((cell) => { cell.border = thinBorder; });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
