"use server";

import { db, getPlanLimits } from "@pmg/db";
import {
  document,
  tender,
  tenderExtension,
  user,
  project,
  purchaseOrder,
  organization,
} from "@pmg/db/schema";
import { validateSessionAndOrg, getOrganizationOwnerPlan } from "./utils";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { StorageService } from "@/lib/storage";
import { recomputeEvaluationDateForTender, logTenderActivity } from "./tenders";

export interface DocumentUploadTarget {
  tenderId?: string;
  projectId?: string;
  purchaseOrderId?: string;
  extensionId?: string;
  category?:
    | "tender"
    | "briefing"
    | "extension"
    | "appointment_letter"
    | "contract"
    | "sla"
    | "general";
  extensionDate?: string | Date;
}

/**
 * Upload a document and store it in R2 under `<org-slug>/...`, then save the metadata in the database.
 */
export async function uploadDocument(
  organizationId: string,
  formData: FormData,
  target: DocumentUploadTarget,
) {
  try {
    const { userId } = await validateSessionAndOrg(organizationId);

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File size exceeds 10MB limit per file" };
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error:
          "File type not supported. Please upload PDF, Word, Excel, images, or text files.",
      };
    }

    // Storage Quota Enforcement
    const plan = await getOrganizationOwnerPlan(organizationId);
    const limits = await getPlanLimits(plan);
    const maxStorageMb = limits.maxStorageMb;
    const maxStorageBytes = limits.maxStorageBytes;

    const storageResult = await db
      .select({ totalSize: sql<number>`coalesce(sum(${document.size}), 0)` })
      .from(document)
      .where(eq(document.organizationId, organizationId));

    const currentBytes = Number(storageResult[0]?.totalSize || 0);
    if (currentBytes + file.size > maxStorageBytes) {
      return {
        success: false,
        error: `Storage limit reached (${maxStorageMb} MB for ${plan.toUpperCase()} plan). Please upgrade your subscription to upload more documents.`,
      };
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Resolve Organization Slug for top-level bucket folder
    const orgRecord = await db
      .select({ slug: organization.slug, name: organization.name })
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);

    const orgSlug = (orgRecord[0]?.slug || orgRecord[0]?.name || organizationId)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/^-+|-+$/g, "");

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";

    let finalFileName = file.name;
    let storageKey = `${orgSlug}/documents/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    // Naming logic based on entity target and category
    let createdExtensionId: string | undefined;

    if (
      target.extensionId ||
      (target.tenderId && target.category === "extension")
    ) {
      let tenderNum = "TENDER";
      let extensionDateStr = "";

      if (target.extensionId) {
        const ext = await db
          .select({
            tenderNumber: tender.tenderNumber,
            newEvaluationDate: tenderExtension.newEvaluationDate,
            extensionDate: tenderExtension.extensionDate,
          })
          .from(tenderExtension)
          .innerJoin(tender, eq(tenderExtension.tenderId, tender.id))
          .where(eq(tenderExtension.id, target.extensionId))
          .limit(1);

        if (ext.length > 0) {
          tenderNum = ext[0].tenderNumber
            .replace(/[^a-zA-Z0-9_-]/g, "-")
            .toUpperCase();
          const d = target.extensionDate
            ? new Date(target.extensionDate)
            : ext[0].newEvaluationDate
              ? new Date(ext[0].newEvaluationDate)
              : ext[0].extensionDate
                ? new Date(ext[0].extensionDate)
                : new Date();
          extensionDateStr = d.toISOString().slice(0, 10);
        }
      } else if (target.tenderId) {
        if (!target.extensionDate) {
          return {
            success: false,
            error:
              "New validity extension date is required when uploading an extension letter.",
          };
        }

        const parsedDate = new Date(target.extensionDate);
        if (isNaN(parsedDate.getTime())) {
          return {
            success: false,
            error: "Invalid validity extension date provided.",
          };
        }

        const t = await db
          .select({ tenderNumber: tender.tenderNumber })
          .from(tender)
          .where(
            and(
              eq(tender.id, target.tenderId),
              eq(tender.organizationId, organizationId),
            ),
          )
          .limit(1);

        if (t.length === 0) {
          return { success: false, error: "Tender not found." };
        }

        tenderNum = t[0].tenderNumber
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .toUpperCase();
        extensionDateStr = parsedDate.toISOString().slice(0, 10);
        createdExtensionId = crypto.randomUUID();
      }

      const existingExtDocs = await db
        .select({ count: sql<number>`count(*)` })
        .from(document)
        .where(
          and(
            eq(document.organizationId, organizationId),
            target.extensionId
              ? eq(document.extensionId, target.extensionId)
              : target.tenderId
                ? eq(document.tenderId, target.tenderId)
                : undefined,
          ),
        );

      const extSeq = Number(existingExtDocs[0]?.count || 0) + 1;
      const seqSuffix = extSeq > 1 ? `-${extSeq}` : "";
      finalFileName = `Extension-${tenderNum}-${extensionDateStr}${seqSuffix}.${fileExt}`;
      storageKey = `${orgSlug}/tenders/${tenderNum}/extensions/${finalFileName}`;
    } else if (target.tenderId) {
      const t = await db
        .select({ tenderNumber: tender.tenderNumber })
        .from(tender)
        .where(eq(tender.id, target.tenderId))
        .limit(1);
      const tenderNum = (t[0]?.tenderNumber || "TENDER")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .toUpperCase();

      const docPrefix = target.category === "briefing" ? "Briefing" : "Tender";

      const existingTenderDocs = await db
        .select({ count: sql<number>`count(*)` })
        .from(document)
        .where(
          and(
            eq(document.organizationId, organizationId),
            eq(document.tenderId, target.tenderId),
            sql`${document.extensionId} IS NULL`,
          ),
        );
      const docSeq = Number(existingTenderDocs[0]?.count || 0) + 1;

      finalFileName = `${docPrefix}-${tenderNum}-${docSeq}.${fileExt}`;
    } else if (target.projectId) {
      const p = await db
        .select({
          projectNumber: project.projectNumber,
          description: project.description,
        })
        .from(project)
        .where(eq(project.id, target.projectId))
        .limit(1);
      const projectIdent = (p[0]?.projectNumber || p[0]?.description || "PRJ")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .toUpperCase();

      const category = target.category || "general";

      if (category === "appointment_letter") {
        const existing = await db
          .select({ count: sql<number>`count(*)` })
          .from(document)
          .where(
            and(
              eq(document.organizationId, organizationId),
              eq(document.projectId, target.projectId),
              sql`${document.name} ILIKE 'Appointment-Letter-%'`,
            ),
          );
        const seq = Number(existing[0]?.count || 0) + 1;
        finalFileName = `Appointment-Letter-${projectIdent}-${seq}.${fileExt}`;
        storageKey = `${orgSlug}/projects/${projectIdent}/appointment-letters/${finalFileName}`;
      } else if (category === "contract" || category === "sla") {
        const prefix = category === "sla" ? "SLA" : "Contract";
        const existing = await db
          .select({ count: sql<number>`count(*)` })
          .from(document)
          .where(
            and(
              eq(document.organizationId, organizationId),
              eq(document.projectId, target.projectId),
              sql`(${document.name} ILIKE 'Contract-%' OR ${document.name} ILIKE 'SLA-%')`,
            ),
          );
        const seq = Number(existing[0]?.count || 0) + 1;
        finalFileName = `${prefix}-${projectIdent}-${seq}.${fileExt}`;
        storageKey = `${orgSlug}/projects/${projectIdent}/contracts/${finalFileName}`;
      } else if (category === "extension") {
        const d = target.extensionDate
          ? new Date(target.extensionDate)
          : new Date();
        const dateStr = d.toISOString().slice(0, 10);
        const existing = await db
          .select({ count: sql<number>`count(*)` })
          .from(document)
          .where(
            and(
              eq(document.organizationId, organizationId),
              eq(document.projectId, target.projectId),
              sql`${document.name} ILIKE 'Extension-%'`,
            ),
          );
        const seq = Number(existing[0]?.count || 0) + 1;
        const seqSuffix = seq > 1 ? `-${seq}` : "";
        finalFileName = `Extension-${projectIdent}-${dateStr}${seqSuffix}.${fileExt}`;
        storageKey = `${orgSlug}/projects/${projectIdent}/extensions/${finalFileName}`;
      } else {
        const existing = await db
          .select({ count: sql<number>`count(*)` })
          .from(document)
          .where(
            and(
              eq(document.organizationId, organizationId),
              eq(document.projectId, target.projectId),
              sql`${document.name} ILIKE 'Project-%'`,
            ),
          );
        const seq = Number(existing[0]?.count || 0) + 1;
        finalFileName = `Project-${projectIdent}-${seq}.${fileExt}`;
        storageKey = `${orgSlug}/projects/${projectIdent}/general/${finalFileName}`;
      }
    } else if (target.purchaseOrderId) {
      const po = await db
        .select({ poNumber: purchaseOrder.poNumber })
        .from(purchaseOrder)
        .where(eq(purchaseOrder.id, target.purchaseOrderId))
        .limit(1);
      const poNum = (po[0]?.poNumber || "PO")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .toUpperCase();

      const existing = await db
        .select({ count: sql<number>`count(*)` })
        .from(document)
        .where(
          and(
            eq(document.organizationId, organizationId),
            eq(document.purchaseOrderId, target.purchaseOrderId),
          ),
        );
      const seq = Number(existing[0]?.count || 0) + 1;
      finalFileName = `POD-${poNum}-${seq}.${fileExt}`;
      storageKey = `${orgSlug}/purchase-orders/${poNum}/${finalFileName}`;
    }

    // Upload to R2
    const uploadedKey = await StorageService.uploadFile(
      fileBuffer,
      storageKey,
      file.type,
    );

    // Generate signed URL immediately for client preview and instant download
    const signedUrl = await StorageService.getSignedUrl(uploadedKey);

    const now = new Date();

    // If uploading an extension letter directly from Documents tab without a pre-existing extensionId
    if (createdExtensionId && target.tenderId && target.extensionDate) {
      const parsedEvalDate = new Date(target.extensionDate);
      const [u] = await db
        .select({ email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      await db.insert(tenderExtension).values({
        id: createdExtensionId,
        organizationId,
        tenderId: target.tenderId,
        extensionDate: now,
        newEvaluationDate: parsedEvalDate,
        contactEmail: u?.email || "notifications@tendertrack360.co.za",
        contactName: u?.name || null,
        notes: `Uploaded via Documents tab (${finalFileName})`,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      // Recompute the tender's live evaluation date from this latest extension!
      await recomputeEvaluationDateForTender(target.tenderId);

      await logTenderActivity(
        organizationId,
        target.tenderId,
        "extension_added",
        `Extension letter uploaded. New validity evaluation date set to: ${parsedEvalDate.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}`,
        userId,
      );
    }

    // Save document record in database
    const docId = crypto.randomUUID();
    const effectiveExtensionId =
      target.extensionId || createdExtensionId || null;

    await db.insert(document).values({
      id: docId,
      organizationId,
      name: finalFileName,
      url: uploadedKey,
      size: file.size,
      type: file.type,
      tenderId: target.tenderId || null,
      projectId: target.projectId || null,
      purchaseOrderId: target.purchaseOrderId || null,
      extensionId: effectiveExtensionId,
      uploadedBy: userId,
      createdAt: now,
    });

    // Revalidate relevant paths
    if (target.tenderId) {
      revalidatePath(`/tenders/${target.tenderId}`);
      revalidatePath("/tenders");
      revalidatePath("/tenders/overview");
      revalidatePath("/dashboard");
    }
    if (target.projectId) {
      revalidatePath(`/projects/${target.projectId}`);
      revalidatePath("/projects");
      revalidatePath("/dashboard");
    }
    if (target.purchaseOrderId) {
      revalidatePath(`/projects/purchase-orders/${target.purchaseOrderId}`);
      revalidatePath("/projects/purchase-orders");
    }
    revalidatePath("/storage");

    return {
      success: true,
      document: {
        id: docId,
        name: finalFileName,
        size: file.size,
        type: file.type,
        url: uploadedKey,
        signedUrl,
        createdAt: now,
      },
    };
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error: error.message || "Failed to upload document",
    };
  }
}

/**
 * Get all documents for a specific entity (tender, project, etc.)
 */
export async function getDocuments(
  organizationId: string,
  entityType: "tender" | "project" | "purchaseOrder",
  entityId: string,
) {
  try {
    await validateSessionAndOrg(organizationId);

    let whereCondition;
    switch (entityType) {
      case "tender":
        whereCondition = and(
          eq(document.organizationId, organizationId),
          eq(document.tenderId, entityId),
        );
        break;
      case "project":
        whereCondition = and(
          eq(document.organizationId, organizationId),
          eq(document.projectId, entityId),
        );
        break;
      case "purchaseOrder":
        whereCondition = and(
          eq(document.organizationId, organizationId),
          eq(document.purchaseOrderId, entityId),
        );
        break;
    }

    const docs = await db.query.document.findMany({
      where: whereCondition,
      orderBy: [desc(document.createdAt)],
      with: {
        uploader: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Generate signed URLs for each document
    const docsWithUrls = await Promise.all(
      docs.map(async (doc) => {
        const signedUrl = await StorageService.getSignedUrl(doc.url);
        return {
          ...doc,
          signedUrl,
        };
      }),
    );

    return { success: true, documents: docsWithUrls };
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch documents",
      documents: [],
    };
  }
}

/**
 * Delete a document (from storage and database)
 */
export async function deleteDocument(
  organizationId: string,
  documentId: string,
) {
  try {
    const { userId } = await validateSessionAndOrg(organizationId);

    // Fetch the document
    const doc = await db.query.document.findFirst({
      where: and(
        eq(document.id, documentId),
        eq(document.organizationId, organizationId),
      ),
    });

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    // Delete from storage
    await StorageService.deleteFile(doc.url);

    // Delete from database
    await db.delete(document).where(eq(document.id, documentId));

    // Revalidate paths
    if (doc.tenderId) {
      revalidatePath(`/tenders/${doc.tenderId}`);
    }
    if (doc.projectId) {
      revalidatePath(`/projects/${doc.projectId}`);
    }
    if (doc.purchaseOrderId) {
      revalidatePath(`/projects/purchase-orders/${doc.purchaseOrderId}`);
    }
    revalidatePath("/storage");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error.message || "Failed to delete document",
    };
  }
}
