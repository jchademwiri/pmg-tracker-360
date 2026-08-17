"use server";

import { db, getPlanLimits } from "@pmg/db";
import {
  document,
  tender,
  project,
  purchaseOrder,
  tenderExtension,
  user,
  member,
} from "@pmg/db/schema";
import { validateSessionAndOrg, getOrganizationOwnerPlan } from "./utils";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { StorageService } from "@/lib/storage";

export interface StorageCategoryStat {
  category:
    | "tenders"
    | "projects"
    | "purchase_orders"
    | "extensions"
    | "general";
  label: string;
  fileCount: number;
  totalBytes: number;
}

export interface StorageFileTypeStat {
  fileType: "pdf" | "word" | "excel" | "image" | "other";
  label: string;
  fileCount: number;
  totalBytes: number;
}

export interface StorageDocumentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: Date;
  uploadedByName: string | null;
  signedUrl?: string;
  entityType: "tender" | "project" | "purchaseOrder" | "extension" | "general";
  entityLabel?: string;
}

export interface StorageAnalyticsData {
  plan: string;
  planLimitBytes: number;
  planLimitMb: number;
  usedBytes: number;
  availableBytes: number;
  usedPercentage: number;
  totalFiles: number;
  avgFileSizeBytes: number;
  categoryStats: StorageCategoryStat[];
  fileTypeStats: StorageFileTypeStat[];
  recentUploads: StorageDocumentItem[];
  largestFiles: StorageDocumentItem[];
}

export async function getStorageAnalytics(organizationId: string): Promise<{
  success: boolean;
  data?: StorageAnalyticsData;
  error?: string;
}> {
  try {
    await validateSessionAndOrg(organizationId);

    // 1. Plan limits
    const plan = await getOrganizationOwnerPlan(organizationId);
    const limits = await getPlanLimits(plan);
    const planLimitMb = limits.maxStorageMb;
    const planLimitBytes = limits.maxStorageBytes;

    // 2. Aggregate overall stats
    const [overallResult] = await db
      .select({
        totalBytes: sql<number>`coalesce(sum(${document.size}), 0)`,
        totalFiles: count(document.id),
      })
      .from(document)
      .where(eq(document.organizationId, organizationId));

    const usedBytes = Number(overallResult?.totalBytes || 0);
    const totalFiles = Number(overallResult?.totalFiles || 0);
    const availableBytes = Math.max(0, planLimitBytes - usedBytes);
    const usedPercentage = Math.min(100, (usedBytes / planLimitBytes) * 100);
    const avgFileSizeBytes =
      totalFiles > 0 ? Math.round(usedBytes / totalFiles) : 0;

    // 3. Category Breakdown
    const allDocsWithEntities = await db
      .select({
        id: document.id,
        name: document.name,
        size: document.size,
        type: document.type,
        createdAt: document.createdAt,
        tenderId: document.tenderId,
        projectId: document.projectId,
        purchaseOrderId: document.purchaseOrderId,
        extensionId: document.extensionId,
        tenderNumber: tender.tenderNumber,
        projectNumber: project.projectNumber,
        poNumber: purchaseOrder.poNumber,
        uploaderName: user.name,
      })
      .from(document)
      .leftJoin(tender, eq(document.tenderId, tender.id))
      .leftJoin(project, eq(document.projectId, project.id))
      .leftJoin(purchaseOrder, eq(document.purchaseOrderId, purchaseOrder.id))
      .leftJoin(user, eq(document.uploadedBy, user.id))
      .where(eq(document.organizationId, organizationId));

    const categories: Record<
      StorageCategoryStat["category"],
      { count: number; bytes: number }
    > = {
      tenders: { count: 0, bytes: 0 },
      projects: { count: 0, bytes: 0 },
      purchase_orders: { count: 0, bytes: 0 },
      extensions: { count: 0, bytes: 0 },
      general: { count: 0, bytes: 0 },
    };

    const fileTypes: Record<
      StorageFileTypeStat["fileType"],
      { count: number; bytes: number }
    > = {
      pdf: { count: 0, bytes: 0 },
      excel: { count: 0, bytes: 0 },
      word: { count: 0, bytes: 0 },
      image: { count: 0, bytes: 0 },
      other: { count: 0, bytes: 0 },
    };

    const processedDocs: StorageDocumentItem[] = allDocsWithEntities.map(
      (doc) => {
        let entityType: StorageDocumentItem["entityType"] = "general";
        let entityLabel: string | undefined = undefined;

        if (doc.extensionId) {
          entityType = "extension";
          entityLabel = doc.tenderNumber
            ? `Ext on ${doc.tenderNumber}`
            : "Extension";
          categories.extensions.count += 1;
          categories.extensions.bytes += Number(doc.size);
        } else if (doc.tenderId) {
          entityType = "tender";
          entityLabel = doc.tenderNumber || "Tender";
          categories.tenders.count += 1;
          categories.tenders.bytes += Number(doc.size);
        } else if (doc.projectId) {
          entityType = "project";
          entityLabel = doc.projectNumber || "Project";
          categories.projects.count += 1;
          categories.projects.bytes += Number(doc.size);
        } else if (doc.purchaseOrderId) {
          entityType = "purchaseOrder";
          entityLabel = doc.poNumber || "PO";
          categories.purchase_orders.count += 1;
          categories.purchase_orders.bytes += Number(doc.size);
        } else {
          entityType = "general";
          entityLabel = "General Doc";
          categories.general.count += 1;
          categories.general.bytes += Number(doc.size);
        }

        // File type categorization
        const mime = doc.type.toLowerCase();
        if (mime.includes("pdf")) {
          fileTypes.pdf.count += 1;
          fileTypes.pdf.bytes += Number(doc.size);
        } else if (
          mime.includes("excel") ||
          mime.includes("spreadsheet") ||
          mime.includes("csv")
        ) {
          fileTypes.excel.count += 1;
          fileTypes.excel.bytes += Number(doc.size);
        } else if (mime.includes("word") || mime.includes("wordprocessingml")) {
          fileTypes.word.count += 1;
          fileTypes.word.bytes += Number(doc.size);
        } else if (mime.includes("image/")) {
          fileTypes.image.count += 1;
          fileTypes.image.bytes += Number(doc.size);
        } else {
          fileTypes.other.count += 1;
          fileTypes.other.bytes += Number(doc.size);
        }

        return {
          id: doc.id,
          name: doc.name,
          size: Number(doc.size),
          type: doc.type,
          createdAt: doc.createdAt,
          uploadedByName: doc.uploaderName || null,
          entityType,
          entityLabel,
        };
      },
    );

    const categoryStats: StorageCategoryStat[] = [
      {
        category: "tenders",
        label: "Tenders",
        fileCount: categories.tenders.count,
        totalBytes: categories.tenders.bytes,
      },
      {
        category: "projects",
        label: "Projects",
        fileCount: categories.projects.count,
        totalBytes: categories.projects.bytes,
      },
      {
        category: "purchase_orders",
        label: "Purchase Orders",
        fileCount: categories.purchase_orders.count,
        totalBytes: categories.purchase_orders.bytes,
      },
      {
        category: "extensions",
        label: "Tender Extensions",
        fileCount: categories.extensions.count,
        totalBytes: categories.extensions.bytes,
      },
      {
        category: "general",
        label: "General / Unlinked",
        fileCount: categories.general.count,
        totalBytes: categories.general.bytes,
      },
    ];

    const fileTypeStats: StorageFileTypeStat[] = [
      {
        fileType: "pdf",
        label: "PDF Documents",
        fileCount: fileTypes.pdf.count,
        totalBytes: fileTypes.pdf.bytes,
      },
      {
        fileType: "excel",
        label: "Excel Spreadsheets",
        fileCount: fileTypes.excel.count,
        totalBytes: fileTypes.excel.bytes,
      },
      {
        fileType: "word",
        label: "Word Documents",
        fileCount: fileTypes.word.count,
        totalBytes: fileTypes.word.bytes,
      },
      {
        fileType: "image",
        label: "Images & Photos",
        fileCount: fileTypes.image.count,
        totalBytes: fileTypes.image.bytes,
      },
      {
        fileType: "other",
        label: "Other Files",
        fileCount: fileTypes.other.count,
        totalBytes: fileTypes.other.bytes,
      },
    ];

    // Top 10 recent
    const recentUploads = [...processedDocs]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    // Top 10 largest
    const largestFiles = [...processedDocs]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return {
      success: true,
      data: {
        plan,
        planLimitBytes,
        planLimitMb,
        usedBytes,
        availableBytes,
        usedPercentage: Math.round(usedPercentage * 10) / 10,
        totalFiles,
        avgFileSizeBytes,
        categoryStats,
        fileTypeStats,
        recentUploads,
        largestFiles,
      },
    };
  } catch (error: any) {
    console.error("Failed to retrieve storage analytics:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve storage analytics",
    };
  }
}

/**
 * 1-Click Subscription Plan Update Action (Upgrade or Downgrade)
 * Validates role and storage limits before committing plan changes.
 */
export async function updateOrganizationPlan(
  organizationId: string,
  targetPlan: "free" | "starter" | "pro",
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { userId, role } = await validateSessionAndOrg(organizationId);

    if (role !== "owner" && role !== "admin") {
      return {
        success: false,
        error:
          "Only organization owners and administrators can change subscription plans.",
      };
    }

    // Resolve owner
    const [ownerMembership] = await db
      .select({ ownerUserId: user.id, currentPlan: user.plan })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.role, "owner"),
        ),
      )
      .limit(1);

    if (!ownerMembership) {
      return { success: false, error: "Organization owner not found." };
    }

    const currentPlan = ownerMembership.currentPlan || "free";
    if (currentPlan === targetPlan) {
      return {
        success: true,
        message: `Your organization is already on the ${targetPlan.toUpperCase()} plan.`,
      };
    }

    // If downgrading, check if current usage fits into target plan
    const targetLimits = await getPlanLimits(targetPlan);
    const targetPlanLimitMb = targetLimits.maxStorageMb;
    const targetPlanLimitBytes = targetLimits.maxStorageBytes;

    const [storageUsage] = await db
      .select({ totalSize: sql<number>`coalesce(sum(${document.size}), 0)` })
      .from(document)
      .where(eq(document.organizationId, organizationId));

    const currentUsedBytes = Number(storageUsage?.totalSize || 0);

    if (currentUsedBytes > targetPlanLimitBytes) {
      const usedFormatted = (currentUsedBytes / (1024 * 1024)).toFixed(1);
      return {
        success: false,
        error: `Cannot downgrade to ${targetPlan.toUpperCase()} plan: Your organization is currently using ${usedFormatted} MB, which exceeds the ${targetPlanLimitMb} MB limit for this tier. Please delete stored files before downgrading.`,
      };
    }

    // Update owner's plan in DB
    await db
      .update(user)
      .set({ plan: targetPlan })
      .where(eq(user.id, ownerMembership.ownerUserId));

    // Also update current user's plan if different
    if (userId !== ownerMembership.ownerUserId) {
      await db
        .update(user)
        .set({ plan: targetPlan })
        .where(eq(user.id, userId));
    }

    return {
      success: true,
      message: `Subscription plan successfully updated to ${targetPlan.toUpperCase()} (${targetPlanLimitMb >= 1000 ? `${targetPlanLimitMb / 1000} GB` : `${targetPlanLimitMb} MB`} storage).`,
    };
  } catch (error: any) {
    console.error("Failed to update organization plan:", error);
    return {
      success: false,
      error: error.message || "Failed to update organization plan.",
    };
  }
}
