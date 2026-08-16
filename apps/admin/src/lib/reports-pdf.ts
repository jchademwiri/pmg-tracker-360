import { jsPDF } from 'jspdf';
import {
  getPlatformOverviewStats,
  getStorageBreakdown,
  getAllTenantsUtilization,
  getSecurityComplianceMetrics,
} from './reports-queries';

export async function generatePlatformExecutivePdf(): Promise<Buffer> {
  const [overview, storageData, allTenants, security] = await Promise.all([
    getPlatformOverviewStats(),
    getStorageBreakdown(),
    getAllTenantsUtilization(),
    getSecurityComplianceMetrics(),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const addHeader = (tabTitle: string, subTitle: string) => {
    // Slate-900 header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 26, 'F');

    // Gold accent separator line
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 26, pageWidth, 1.5, 'F');

    // Title branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PMG TRACKER 360', margin, 11);

    // Tab Badge & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(212, 175, 55);
    doc.text(tabTitle.toUpperCase(), margin, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`— ${subTitle}`, margin + doc.getTextWidth(tabTitle.toUpperCase()) + 2, 17);

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Generated: ${dateStr}`, pageWidth - margin, 17, { align: 'right' });
  };

  const fmtCurrency = (v: number) =>
    `R ${v.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /* =========================================================================
     PAGE 1: [TAB 1] Executive Summary & Platform Financial Totals
  ========================================================================= */
  addHeader('Tab 1: Executive Summary', 'Key Metrics & Financial Pipeline');
  let y = 34;

  // 1. Vital KPI Cards (2x2 Grid)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Vital Statistics & Tenant Totals', margin, y);
  y += 5;

  const cardWidth = (pageWidth - margin * 2 - 6) / 2;
  const cardHeight = 20;

  const drawCard = (x: number, yPos: number, label: string, val: string, sub: string) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 4, yPos + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(val, x + 4, yPos + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(sub, x + 4, yPos + 16.5);
  };

  drawCard(
    margin,
    y,
    'Total Organizations',
    `${overview.activeTenants} Active`,
    `${overview.totalTenants} total registered (${overview.softDeletedTenants} archived)`
  );
  drawCard(
    margin + cardWidth + 6,
    y,
    'Platform Users',
    `${overview.totalUsers} Total`,
    `${overview.verifiedUsers} verified (${overview.verificationRate}% conversion rate)`
  );

  y += cardHeight + 4;

  drawCard(
    margin,
    y,
    'Tender Pipeline Value',
    fmtCurrency(overview.totalTenderPipelineValue),
    `${overview.totalTenders} total bids across all organizations`
  );
  drawCard(
    margin + cardWidth + 6,
    y,
    'Platform S3 Storage',
    `${overview.totalStorageMB.toLocaleString()} MB`,
    `${overview.totalDocuments.toLocaleString()} uploaded files (${overview.totalStorageGB} GB)`
  );

  y += cardHeight + 8;

  // 2. Comprehensive Platform Operational Schedule Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Comprehensive Platform Operations Schedule', margin, y);
  y += 5;

  const drawTableRow = (label: string, val: string, notes = '', isHeader = false) => {
    const rowH = 6.5;
    if (isHeader) {
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('Core Metric', margin + 3, y + 4.5);
      doc.text('Value / Total', margin + 75, y + 4.5);
      doc.text('Operational Context', margin + 120, y + 4.5);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(label, margin + 3, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(val, margin + 75, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(notes, margin + 120, y + 4.5);
    }
    y += rowH;
  };

  drawTableRow('Core Metric', 'Value / Total', 'Operational Context', true);
  drawTableRow('Total Registered Organizations', `${overview.totalTenants} organizations`, `${overview.activeTenants} active, ${overview.softDeletedTenants} archived/soft-deleted`);
  drawTableRow('Total Platform Users', `${overview.totalUsers} accounts`, `${overview.verifiedUsers} verified (${overview.verificationRate}% verification rate)`);
  drawTableRow('Total Awarded Tender Sum', fmtCurrency(overview.totalTenderAwardedValue), 'Cumulative contract value awarded from won tenders');
  drawTableRow('Active Awarded Projects', `${overview.activeProjects} active projects`, `${overview.totalProjects} lifetime projects logged in system`);
  drawTableRow('Purchase Orders Committed', `${overview.totalPOs} POs (${fmtCurrency(overview.totalPOAmount)})`, 'Total financial commitment across suppliers');
  drawTableRow('Open Support Tickets', `${overview.openSupportTickets} tickets open`, 'Support inquiries awaiting resolution');
  drawTableRow('User Feedback Submissions', `${overview.totalFeedbackCount} submissions`, 'User-submitted bug reports & feature requests');
  drawTableRow('Waitlist Prospective Leads', `${overview.waitlistCount} prospective companies`, 'Leads registered on waitlist');

  /* =========================================================================
     PAGE 2+: [TAB 2] Tenant Roster & System Utilization (FRESH NEW PAGE)
  ========================================================================= */
  doc.addPage();
  addHeader('Tab 2: Tenant Roster', 'Complete Organization Directory');
  y = 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Full Tenant Portfolio Schedule', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Total: ${allTenants.length} registered organizations`, pageWidth - margin, y, { align: 'right' });
  y += 5;

  const drawTenantTableHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Organization Name', margin + 3, y + 4.5);
    doc.text('Status', margin + 62, y + 4.5);
    doc.text('Created', margin + 85, y + 4.5);
    doc.text('Members', margin + 110, y + 4.5, { align: 'right' });
    doc.text('Tenders', margin + 130, y + 4.5, { align: 'right' });
    doc.text('Projects', margin + 150, y + 4.5, { align: 'right' });
    doc.text('Storage (MB)', pageWidth - margin - 3, y + 4.5, { align: 'right' });
    y += 6.5;
  };

  drawTenantTableHeader();

  allTenants.forEach((tenant, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      addHeader('Tab 2: Tenant Roster', 'Organization Directory (Continued)');
      y = 34;
      drawTenantTableHeader();
    }

    const isDeleted = !!tenant.deletedAt;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const nameStr = tenant.name.length > 28 ? tenant.name.slice(0, 26) + '…' : tenant.name;
    doc.text(nameStr, margin + 3, y + 4.2);

    doc.setFontSize(7);
    if (isDeleted) {
      doc.setTextColor(225, 29, 72);
      doc.text('Archived', margin + 62, y + 4.2);
    } else {
      doc.setTextColor(5, 150, 105);
      doc.text('Active', margin + 62, y + 4.2);
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(new Date(tenant.createdAt).toLocaleDateString('en-GB'), margin + 85, y + 4.2);
    doc.text(tenant.memberCount.toString(), margin + 110, y + 4.2, { align: 'right' });
    doc.text(tenant.tenderCount.toString(), margin + 130, y + 4.2, { align: 'right' });
    doc.text(tenant.projectCount.toString(), margin + 150, y + 4.2, { align: 'right' });
    doc.text(`${tenant.storageMB.toLocaleString()} MB`, pageWidth - margin - 3, y + 4.2, { align: 'right' });

    y += 6;
  });

  /* =========================================================================
     PAGE N: [TAB 3] Storage Breakdown & S3 Infrastructure (FRESH NEW PAGE)
  ========================================================================= */
  doc.addPage();
  addHeader('Tab 3: Storage Breakdown', 'AWS S3 Infrastructure & Quotas');
  y = 34;

  // 1. Storage Capacity Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Infrastructure Capacity Totals', margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`• Total Storage Consumed: ${overview.totalStorageMB.toLocaleString()} MB (${overview.totalStorageGB} GB) across ${overview.totalDocuments.toLocaleString()} uploaded files`, margin + 4, y + 6);
  doc.text(`• Top Category: ${storageData.categories[0]?.category ?? 'N/A'} accounting for ${storageData.categories[0]?.percentage ?? 0}% of all storage`, margin + 4, y + 11.5);
  y += 22;

  // 2. Resource Category Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. File Category Distribution Schedule', margin, y);
  y += 5;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Resource Category', margin + 3, y + 4.5);
  doc.text('File Count', margin + 80, y + 4.5, { align: 'right' });
  doc.text('Storage (MB)', margin + 125, y + 4.5, { align: 'right' });
  doc.text('Share (%)', pageWidth - margin - 3, y + 4.5, { align: 'right' });
  y += 6.5;

  storageData.categories.forEach((cat, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(cat.category, margin + 3, y + 4.2);
    doc.text(cat.count.toLocaleString(), margin + 80, y + 4.2, { align: 'right' });
    doc.text(`${cat.sizeMB.toLocaleString()} MB`, margin + 125, y + 4.2, { align: 'right' });
    doc.text(`${cat.percentage}%`, pageWidth - margin - 3, y + 4.2, { align: 'right' });

    y += 6;
  });

  y += 8;

  // 3. Top Tenants Storage Footprint Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Top Organizations Ranked by Storage Footprint', margin, y);
  y += 5;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Organization Name', margin + 3, y + 4.5);
  doc.text('Tenders', margin + 80, y + 4.5, { align: 'right' });
  doc.text('Projects', margin + 105, y + 4.5, { align: 'right' });
  doc.text('Docs', margin + 130, y + 4.5, { align: 'right' });
  doc.text('Storage (MB)', pageWidth - margin - 3, y + 4.5, { align: 'right' });
  y += 6.5;

  storageData.topTenants.forEach((tenant, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const nameStr = tenant.name.length > 32 ? tenant.name.slice(0, 30) + '…' : tenant.name;
    doc.text(nameStr, margin + 3, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(tenant.tenderCount.toLocaleString(), margin + 80, y + 4.2, { align: 'right' });
    doc.text(tenant.projectCount.toLocaleString(), margin + 105, y + 4.2, { align: 'right' });
    doc.text(tenant.documentCount.toLocaleString(), margin + 130, y + 4.2, { align: 'right' });
    doc.text(`${tenant.storageMB.toLocaleString()} MB`, pageWidth - margin - 3, y + 4.2, { align: 'right' });

    y += 6;
  });

  /* =========================================================================
     PAGE FINAL: [TAB 4] Security Audit Logs & Compliance (FRESH NEW PAGE)
  ========================================================================= */
  doc.addPage();
  addHeader('Tab 4: Security Audit Logs', 'Compliance & Threat Forensics');
  y = 34;

  // 1. Security Overview Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Platform Security Health & Session Anomaly Status', margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`• Total Security Audit Events Recorded: ${security.totalLogs.toLocaleString()}`, margin + 4, y + 5.5);
  doc.text(`• Severity Breakdown: ${security.criticalEvents} Critical | ${security.warningEvents} Warning | ${security.infoEvents} Info`, margin + 4, y + 11);
  doc.text(`• Active Sessions Monitored: ${security.totalSessions.toLocaleString()} (${security.suspiciousSessions} flagged as suspicious logins)`, margin + 4, y + 16.5);
  y += 26;

  // 2. Critical Security Audit Events Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Critical Security Audit Events Log', margin, y);
  y += 5;

  const drawSecHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Action', margin + 3, y + 4.5);
    doc.text('Resource', margin + 65, y + 4.5);
    doc.text('Severity', margin + 100, y + 4.5);
    doc.text('IP Address', margin + 125, y + 4.5);
    doc.text('Date & Time', pageWidth - margin - 3, y + 4.5, { align: 'right' });
    y += 6.5;
  };

  drawSecHeader();

  if (security.recentCriticalLogs.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No critical security alerts currently recorded.', margin + 3, y + 5.5);
    y += 8;
  } else {
    security.recentCriticalLogs.forEach((log, idx) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        addHeader('Tab 4: Security Audit Logs', 'Critical Audit Events (Continued)');
        y = 34;
        drawSecHeader();
      }

      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6, pageWidth - margin, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(log.action, margin + 3, y + 4.2);
      doc.text(log.resourceType, margin + 65, y + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(log.severity.toUpperCase(), margin + 100, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(log.ipAddress ?? '—', margin + 125, y + 4.2);
      doc.text(new Date(log.createdAt).toLocaleString('en-GB'), pageWidth - margin - 3, y + 4.2, { align: 'right' });

      y += 6;
    });
  }

  /* =========================================================================
     Add Footers to ALL Pages
  ========================================================================= */
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.text('Confidential — For Platform System Owners Only', margin, pageHeight - 5.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Dedicated Storage Utilization PDF (Each Tab on a fresh page)
 */
export async function generateStorageAuditPdf(): Promise<Buffer> {
  const [overview, storageData, allTenants] = await Promise.all([
    getPlatformOverviewStats(),
    getStorageBreakdown(),
    getAllTenantsUtilization(),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const addHeader = (tabTitle: string, subTitle: string) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setFillColor(16, 185, 129); // Emerald accent
    doc.rect(0, 26, pageWidth, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PMG TRACKER 360', margin, 11);

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${dateStr}`, pageWidth - margin, 11, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    const tabText = tabTitle.toUpperCase();
    doc.text(tabText, margin, 18);
    const tabWidth = doc.getTextWidth(tabText);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`|  ${subTitle}`, margin + tabWidth + 3, 18);
  };

  // PAGE 1: [TAB 1] Storage Categories Breakdown
  addHeader('Tab 1: Storage Categories', 'Resource Distribution');
  let y = 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Cloudflare R2 Storage Overview & Multi-Bucket Capacity', margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Storage Consumed: ${overview.totalStorageMB?.toLocaleString() ?? 0} MB (${overview.totalStorageGB ?? 0} GB) across ${(overview.totalDocuments ?? 0).toLocaleString()} uploaded files`, margin + 4, y + 6);
  doc.text(`Provisioned Plan Capacity: ${overview.totalStorageCapacityGB ?? 10}.00 GB Cloudflare Free Tier | Available Remaining: ${overview.availableStorageGB ?? 10} GB (${overview.availableStorageMB?.toLocaleString() ?? 0} MB)`, margin + 4, y + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Capacity Utilization: ${overview.storageUtilizationPct ?? 0}% (${(overview.storageWarningStatus ?? 'normal').toUpperCase()}) | Detected Buckets: ${storageData.storageOverview?.buckets?.length ?? 0}`, margin + 4, y + 16.5);
  y += 26;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. File Category Distribution Schedule', margin, y);
  y += 5;

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Category', margin + 3, y + 4.5);
  doc.text('Count', margin + 80, y + 4.5, { align: 'right' });
  doc.text('Storage (MB)', margin + 120, y + 4.5, { align: 'right' });
  doc.text('Share (%)', pageWidth - margin - 3, y + 4.5, { align: 'right' });
  y += 6.5;

  storageData.categories.forEach((cat, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(cat.category, margin + 3, y + 4.2);
    doc.text(cat.count.toLocaleString(), margin + 80, y + 4.2, { align: 'right' });
    doc.text(`${cat.sizeMB.toLocaleString()} MB`, margin + 120, y + 4.2, { align: 'right' });
    doc.text(`${cat.percentage}%`, pageWidth - margin - 3, y + 4.2, { align: 'right' });
    y += 6;
  });

  // PAGE 2+: [TAB 2] Tenant Storage Quotas (FRESH NEW PAGE)
  doc.addPage();
  addHeader('Tab 2: Tenant Storage Quotas', 'Complete Tenant Consumption');
  y = 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Organization Storage Footprint Schedule', margin, y);
  y += 5;

  const drawStorageOrgHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Organization Name', margin + 3, y + 4.5);
    doc.text('Files Uploaded', margin + 100, y + 4.5, { align: 'right' });
    doc.text('Storage (MB)', pageWidth - margin - 3, y + 4.5, { align: 'right' });
    y += 6.5;
  };

  drawStorageOrgHeader();

  allTenants.forEach((tenant, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      addHeader('Tab 2: Tenant Storage Quotas', 'Consumption Schedule (Continued)');
      y = 34;
      drawStorageOrgHeader();
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(tenant.name, margin + 3, y + 4.2);
    doc.text(tenant.documentCount.toLocaleString(), margin + 100, y + 4.2, { align: 'right' });
    doc.text(`${tenant.storageMB.toLocaleString()} MB`, pageWidth - margin - 3, y + 4.2, { align: 'right' });
    y += 6;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.text('Confidential — For Platform System Owners Only', margin, pageHeight - 5.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Dedicated Security & Compliance Audit PDF (Each Tab on a fresh page)
 */
export async function generateSecurityAuditPdf(): Promise<Buffer> {
  const security = await getSecurityComplianceMetrics();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const addHeader = (tabTitle: string, subTitle: string) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setFillColor(239, 68, 68); // Red accent
    doc.rect(0, 26, pageWidth, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('PMG TRACKER 360', margin, 11);

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${dateStr}`, pageWidth - margin, 11, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(239, 68, 68);
    const tabText = tabTitle.toUpperCase();
    doc.text(tabText, margin, 18);
    const tabWidth = doc.getTextWidth(tabText);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`|  ${subTitle}`, margin + tabWidth + 3, 18);
  };

  // PAGE 1: [TAB 1] Security Overview & Severity Breakdown
  addHeader('Tab 1: Security Summary', 'Incident & Threat Health');
  let y = 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Security Event & Session Anomaly Health', margin, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`• Total Audit Trail Entries: ${security.totalLogs.toLocaleString()}`, margin + 4, y + 5.5);
  doc.text(`• Severity Breakdown: ${security.criticalEvents} Critical | ${security.warningEvents} Warning | ${security.infoEvents} Info`, margin + 4, y + 11);
  doc.text(`• Suspicious Active Sessions: ${security.suspiciousSessions} flagged of ${security.totalSessions} sessions`, margin + 4, y + 16.5);

  // PAGE 2+: [TAB 2] Critical Audit Logs Schedule (FRESH NEW PAGE)
  doc.addPage();
  addHeader('Tab 2: Critical Audit Logs', 'Immutable Security Event Trail');
  y = 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Critical Security Events Schedule', margin, y);
  y += 5;

  const drawSecHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Action', margin + 3, y + 4.5);
    doc.text('Resource', margin + 65, y + 4.5);
    doc.text('Severity', margin + 100, y + 4.5);
    doc.text('IP Address', margin + 125, y + 4.5);
    doc.text('Date & Time', pageWidth - margin - 3, y + 4.5, { align: 'right' });
    y += 6.5;
  };

  drawSecHeader();

  if (security.recentCriticalLogs.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No critical security alerts currently recorded.', margin + 3, y + 5.5);
    y += 8;
  } else {
    security.recentCriticalLogs.forEach((log, idx) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        addHeader('Tab 2: Critical Audit Logs', 'Event Schedule (Continued)');
        y = 34;
        drawSecHeader();
      }

      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6, pageWidth - margin, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(log.action, margin + 3, y + 4.2);
      doc.text(log.resourceType, margin + 65, y + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text(log.severity.toUpperCase(), margin + 100, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(log.ipAddress ?? '—', margin + 125, y + 4.2);
      doc.text(new Date(log.createdAt).toLocaleString('en-GB'), pageWidth - margin - 3, y + 4.2, { align: 'right' });

      y += 6;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.text('Confidential — For Platform System Owners Only', margin, pageHeight - 5.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
