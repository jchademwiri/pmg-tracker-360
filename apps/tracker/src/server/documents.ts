'use server';

import { db } from '@pmg/db';
import { document, tender, tenderExtension } from '@pmg/db/schema';
import { validateSessionAndOrg } from './utils';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { StorageService } from '@/lib/storage';


interface DocumentUploadTarget {
  tenderId?: string;
  projectId?: string;
  purchaseOrderId?: string;
  extensionId?: string;
}

/**
 * Upload a document and store it in R2, then save the metadata in the database.
 */
export async function uploadDocument(
  organizationId: string,
  formData: FormData,
  target: DocumentUploadTarget
) {
  try {
    const { userId } = await validateSessionAndOrg(organizationId);

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 10MB limit' };
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
    ];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'File type not supported. Please upload PDF, Word, Excel, images, or text files.' };
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Resolve tender number for storage key prefix (for tender and extension documents)
    let storagePrefix = '';
    if (target.tenderId) {
      const t = await db
        .select({ tenderNumber: tender.tenderNumber })
        .from(tender)
        .where(eq(tender.id, target.tenderId))
        .limit(1);
      if (t.length > 0) {
        storagePrefix = t[0].tenderNumber.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      }
    } else if (target.extensionId) {
      const ext = await db
        .select({ tenderNumber: tender.tenderNumber })
        .from(tenderExtension)
        .innerJoin(tender, eq(tenderExtension.tenderId, tender.id))
        .where(eq(tenderExtension.id, target.extensionId))
        .limit(1);
      if (ext.length > 0) {
        storagePrefix = ext[0].tenderNumber.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
      }
    }

    // Generate a unique storage key with tender number prefix where applicable
    const entityPrefix = target.tenderId ? 'tenders' : target.extensionId ? 'extensions' : target.projectId ? 'projects' : target.purchaseOrderId ? 'purchase-orders' : 'documents';
    const entityId = target.tenderId || target.projectId || target.purchaseOrderId || target.extensionId || 'unknown';
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefixPath = storagePrefix ? `${storagePrefix}/` : '';
    const storageKey = `${organizationId}/${entityPrefix}/${prefixPath}${entityId}/${timestamp}-${safeName}`;

    // Upload to R2
    const uploadedKey = await StorageService.uploadFile(fileBuffer, storageKey, file.type);

    // Save document record in database
    const docId = crypto.randomUUID();
    await db.insert(document).values({
      id: docId,
      organizationId,
      name: file.name,
      url: uploadedKey,
      size: file.size,
      type: file.type,
      tenderId: target.tenderId || null,
      projectId: target.projectId || null,
      purchaseOrderId: target.purchaseOrderId || null,
      extensionId: target.extensionId || null,
      uploadedBy: userId,
    });

    // Revalidate relevant paths
    if (target.tenderId) {
      revalidatePath(`/tenders/${target.tenderId}`);
    }
    if (target.projectId) {
      revalidatePath(`/projects/${target.projectId}`);
    }

    return {
      success: true,
      document: {
        id: docId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: uploadedKey,
      },
    };
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return { success: false, error: error.message || 'Failed to upload document' };
  }
}

/**
 * Get all documents for a specific entity (tender, project, etc.)
 */
export async function getDocuments(
  organizationId: string,
  entityType: 'tender' | 'project' | 'purchaseOrder',
  entityId: string
) {
  try {
    await validateSessionAndOrg(organizationId);

    let whereCondition;
    switch (entityType) {
      case 'tender':
        whereCondition = and(
          eq(document.organizationId, organizationId),
          eq(document.tenderId, entityId)
        );
        break;
      case 'project':
        whereCondition = and(
          eq(document.organizationId, organizationId),
          eq(document.projectId, entityId)
        );
        break;
      case 'purchaseOrder':
        whereCondition = and(
          eq(document.organizationId, organizationId),
          eq(document.purchaseOrderId, entityId)
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
      })
    );

    return { success: true, documents: docsWithUrls };
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return { success: false, error: error.message || 'Failed to fetch documents', documents: [] };
  }
}

/**
 * Delete a document (from storage and database)
 */
export async function deleteDocument(organizationId: string, documentId: string) {
  try {
    const { userId } = await validateSessionAndOrg(organizationId);

    // Fetch the document
    const doc = await db.query.document.findFirst({
      where: and(
        eq(document.id, documentId),
        eq(document.organizationId, organizationId)
      ),
    });

    if (!doc) {
      return { success: false, error: 'Document not found' };
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

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message || 'Failed to delete document' };
  }
}
