"use server";

import "server-only";

import React from "react";
import { db } from "@pmg/db";
import { client, organization, tender, tenderExtension } from "@pmg/db/schema";
import { and, eq, gte, isNull, lte } from "drizzle-orm";

import { validateSessionAndOrg } from "./utils";
import {
  renderToPdf,
  TenderFollowUpPdf,
  RunningFooter,
  trackerTheme,
  formatZar,
  formatDateTimeSa,
  type TenderFollowUpRowModel,
} from "@pmg/pdf";
import { fetchLogoBase64, parseOrganizationMetadata } from "@/lib/pdf/pdf-layout";
import type { DateRangePreset } from "@/lib/date-range-presets";

export interface TenderFollowUpFilterOptions {
  clientId?: string;
  preset?: DateRangePreset;
  startDate?: Date;
  endDate?: Date;
  periodLabel?: string;
}

function cleanText(value: string | null | undefined): string {
  return (value || "")
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export async function getTenderFollowUpPdf(
  organizationId: string,
  filterOptions: TenderFollowUpFilterOptions = {},
) {
  try {
    await validateSessionAndOrg(organizationId);

    const { clientId, startDate, endDate, periodLabel = "All Time" } = filterOptions;

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });
    const orgName = org?.name || "PMG Tracker 360";
    const orgMeta = parseOrganizationMetadata(org?.metadata);
    const logoDataUri = await fetchLogoBase64(org?.logo ?? null);

    // Fetch tenders with joined client and contact info
    const raw = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        clientId: client.id,
        clientName: client.name,
        clientContactName: client.contactName,
        clientContactEmail: client.contactEmail,
        clientContactPhone: client.contactPhone,
        tenderContactName: tender.contactName,
        tenderContactEmail: tender.contactEmail,
        tenderContactPhone: tender.contactPhone,
        description: tender.description,
        status: tender.status,
        priority: tender.priority,
        submissionDate: tender.submissionDate,
        validityDate: tender.validityDate,
        value: tender.value,
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          ...(clientId ? [eq(tender.clientId, clientId)] : []),
          ...(startDate ? [gte(tender.submissionDate, startDate)] : []),
          ...(endDate ? [lte(tender.submissionDate, endDate)] : []),
        ),
      );

    // Fetch latest tender extensions
    const extensions = await db
      .select({
        tenderId: tenderExtension.tenderId,
        newEvaluationDate: tenderExtension.newEvaluationDate,
      })
      .from(tenderExtension)
      .where(
        and(
          eq(tenderExtension.organizationId, organizationId),
          isNull(tenderExtension.deletedAt),
        ),
      );

    const extendedDates = new Map<string, Date>();
    for (const ext of extensions) {
      if (!ext.newEvaluationDate) continue;
      const current = extendedDates.get(ext.tenderId);
      if (!current || ext.newEvaluationDate > current) {
        extendedDates.set(ext.tenderId, ext.newEvaluationDate);
      }
    }

    const now = new Date();
    const rows: TenderFollowUpRowModel[] = raw.map((row) => {
      const validityDate = extendedDates.get(row.id) || row.validityDate;
      let validityDaysRemaining: number | null = null;
      let isExpiringSoon = false;
      let isExpired = false;

      if (validityDate) {
        const diffMs = new Date(validityDate).getTime() - now.getTime();
        validityDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (validityDaysRemaining < 0) {
          isExpired = true;
        } else if (validityDaysRemaining <= 30) {
          isExpiringSoon = true;
        }
      }

      const contactName = cleanText(row.tenderContactName || row.clientContactName);
      const contactEmail = cleanText(row.tenderContactEmail || row.clientContactEmail);
      const contactPhone = cleanText(row.tenderContactPhone || row.clientContactPhone);

      return {
        tenderNumber: row.tenderNumber || "—",
        client: cleanText(row.clientName) || "—",
        description: cleanText(row.description) || "—",
        closingDate: row.submissionDate,
        validityExpiryDate: validityDate,
        validityDaysRemaining,
        isExpiringSoon,
        isExpired,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        status: row.status,
        estimatedValue: row.value,
      };
    });

    // Sort priority: Expiring soonest first, then by closing date
    rows.sort((a, b) => {
      if (a.isExpiringSoon && !b.isExpiringSoon) return -1;
      if (!a.isExpiringSoon && b.isExpiringSoon) return 1;
      if (a.validityExpiryDate && b.validityExpiryDate) {
        return new Date(a.validityExpiryDate).getTime() - new Date(b.validityExpiryDate).getTime();
      }
      return 0;
    });

    const expiringSoonCount = rows.filter((r) => r.isExpiringSoon).length;
    const expiredCount = rows.filter((r) => r.isExpired).length;
    const clientCount = new Set(raw.map((r) => r.clientId).filter(Boolean)).size;
    const totalPipelineValue = rows.reduce(
      (sum, r) => sum + (Number(r.estimatedValue) || 0),
      0,
    );

    const kpiCards = [
      { label: "TOTAL FOLLOW-UPS", value: String(rows.length), variant: "primary" as const },
      {
        label: "EXPIRING SOON (<30D)",
        value: String(expiringSoonCount),
        variant: (expiringSoonCount > 0 ? "warning" : "default") as "warning" | "default",
      },
      {
        label: "EXPIRED / OVERDUE",
        value: String(expiredCount),
        variant: (expiredCount > 0 ? "destructive" : "default") as "destructive" | "default",
      },
      { label: "CLIENTS TO CONTACT", value: String(clientCount), variant: "default" as const },
      {
        label: "PIPELINE VALUE",
        value: formatZar(totalPipelineValue),
        variant: "success" as const,
      },
    ];

    const filterPills = [
      { label: "SCOPE", value: clientId ? cleanText(raw[0]?.clientName) || "CLIENT" : "MANAGEMENT FOLLOW-UP" },
      ...(periodLabel && periodLabel !== "All Time"
        ? [{ label: "PERIOD", value: periodLabel.toUpperCase() }]
        : [{ label: "PERIOD", value: "ALL TIME" }]),
    ];

    const reportTitle = "MANAGEMENT TENDER FOLLOW-UP REPORT";
    const filename = `tender-follow-up-report-${now.toISOString().slice(0, 10)}.pdf`;

    const pdfResult = await renderToPdf(
      React.createElement(TenderFollowUpPdf, {
        data: {
          branding: {
            organizationName: orgName,
            logoDataUri,
            phone: orgMeta.phone,
            address: orgMeta.address,
            website: orgMeta.website,
          },
          filterPills,
          kpiCards,
          rows,
          generatedAt: now,
          confidential: true,
        },
      }),
      {
        orientation: "landscape",
        footer: React.createElement(RunningFooter, {
          theme: trackerTheme,
          branding: { organizationName: orgName },
          documentTitle: reportTitle,
          confidential: true,
          generatedAtText: formatDateTimeSa(now),
        }),
      },
    );

    return {
      success: true as const,
      buffer: Buffer.from(pdfResult.bytes),
      filename,
    };
  } catch (error) {
    console.error("Tender follow-up PDF generation failed:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to generate follow-up PDF report.",
    };
  }
}
