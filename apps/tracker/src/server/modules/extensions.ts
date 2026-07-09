'use server';

import { db } from '@pmg/db';
import {
  tenderExtension,
  tender,
  document,
  type TenderExtension,
} from '@pmg/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { uploadDocument } from '@/server/documents';
import { StorageService } from '@/lib/storage';
import { z } from 'zod';
import { logTenderActivity } from '../tenders';

const createExtensionSchema = z.object({
  tenderId: z.string(),
  extensionDate: z.string().transform((str) => new Date(str)),
  newEvaluationDate: z.string().transform((str) => new Date(str)),
  contactName: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateExtensionInput = z.input<typeof createExtensionSchema>;

export async function createTenderExtension(
  organizationId: string,
  input: CreateExtensionInput,
  formData: FormData
) {
  try {
    // 1. Auth Check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      !session.session.activeOrganizationId ||
      session.session.activeOrganizationId !== organizationId
    ) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;
    const validatedData = createExtensionSchema.parse(input);

    // 2. Create Extension Record
    const extensionId = nanoid();
    const [newExtension] = await db
      .insert(tenderExtension)
      .values({
        id: extensionId,
        organizationId,
        tenderId: validatedData.tenderId,
        extensionDate: validatedData.extensionDate,
        newEvaluationDate: validatedData.newEvaluationDate,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
        notes: validatedData.notes,
        createdBy: userId,
      })
      .returning();

    // 3. Update Tender Evaluation Date
    await db
      .update(tender)
      .set({
        evaluationDate: validatedData.newEvaluationDate,
        updatedAt: new Date(),
      })
      .where(eq(tender.id, validatedData.tenderId));

    // 4. Handle File Upload
    const file = formData.get('file');
    if (file && file instanceof File && file.size > 0) {
      // Prefix filename with "Extension - " as requested
      const extensionPrefix = 'Extension - ';
      const newFileName = `${extensionPrefix}${file.name}`;
      const newFile = new File([file], newFileName, { type: file.type });

      const newFormData = new FormData();
      newFormData.append('file', newFile);

      const uploadResult = await uploadDocument(organizationId, newFormData, {
        tenderId: validatedData.tenderId,
        extensionId: extensionId,
      });

      if (!uploadResult.success) {
        // Log warning but don't fail the whole transaction?
        // Or fail? Let's return partial success or error.
        console.error(
          'Failed to upload extension document:',
          uploadResult.error
        );
        return {
          success: true, // Extension created, but file failed.
          warning: 'Extension created but file upload failed.',
          extension: newExtension,
        };
      }
    }

    await logTenderActivity(
      organizationId,
      validatedData.tenderId,
      'extension_added',
      `Extension added for date ${new Date(validatedData.extensionDate).toLocaleDateString()}. New evaluation date: ${new Date(validatedData.newEvaluationDate).toLocaleDateString()}`,
      userId
    );

    revalidatePath(`/tenders/${validatedData.tenderId}`);
    return { success: true, extension: newExtension };
  } catch (error) {
    console.error('Error creating tender extension:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      };
    }
    return { success: false, error: 'Failed to create extension' };
  }
}

export async function getTenderExtensions(
  organizationId: string,
  tenderId: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      !session.session.activeOrganizationId ||
      session.session.activeOrganizationId !== organizationId
    ) {
      return { success: false, error: 'Unauthorized' };
    }

    const extensions = await db.query.tenderExtension.findMany({
      where: and(
        eq(tenderExtension.tenderId, tenderId),
        isNull(tenderExtension.deletedAt)
      ),
      orderBy: [desc(tenderExtension.extensionDate)],
      with: {
        createdByUser: {
          columns: { name: true, image: true },
        },
        documents: {
          columns: { id: true, name: true, url: true, size: true, type: true, createdAt: true },
        },
      },
    });

    // Generate signed URLs for each extension's documents
    const extensionsWithDocs = await Promise.all(
      extensions.map(async (ext) => {
        const docsWithUrls = await Promise.all(
          ext.documents.map(async (doc) => ({
            ...doc,
            signedUrl: await StorageService.getSignedUrl(doc.url),
          }))
        );
        return { ...ext, documents: docsWithUrls };
      })
    );

    return { success: true, data: extensionsWithDocs };
  } catch (error) {
    console.error('Error fetching extensions:', error);
    return { success: false, error: 'Failed to fetch extensions' };
  }
}

const updateExtensionSchema = z.object({
  extensionId: z.string(),
  extensionDate: z.string().transform((str) => new Date(str)),
  newEvaluationDate: z.string().transform((str) => new Date(str)),
  contactName: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateExtensionInput = z.input<typeof updateExtensionSchema>;

export async function updateTenderExtension(
  organizationId: string,
  input: UpdateExtensionInput,
  formData?: FormData
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      !session.session.activeOrganizationId ||
      session.session.activeOrganizationId !== organizationId
    ) {
      return { success: false, error: 'Unauthorized' };
    }

    const validatedData = updateExtensionSchema.parse(input);

    // Fetch existing extension
    const existing = await db.query.tenderExtension.findFirst({
      where: and(
        eq(tenderExtension.id, validatedData.extensionId),
        eq(tenderExtension.organizationId, organizationId),
        isNull(tenderExtension.deletedAt)
      ),
    });

    if (!existing) {
      return { success: false, error: 'Extension not found' };
    }

    // Update the extension record
    await db
      .update(tenderExtension)
      .set({
        extensionDate: validatedData.extensionDate,
        newEvaluationDate: validatedData.newEvaluationDate,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
        notes: validatedData.notes,
        updatedAt: new Date(),
      })
      .where(eq(tenderExtension.id, validatedData.extensionId));

    // Recompute the tender's evaluation date from the latest remaining extension
    const latestExtension = await db
      .select({ newEvaluationDate: tenderExtension.newEvaluationDate })
      .from(tenderExtension)
      .where(and(
        eq(tenderExtension.tenderId, existing.tenderId),
        isNull(tenderExtension.deletedAt)
      ))
      .orderBy(desc(tenderExtension.newEvaluationDate))
      .limit(1);

    if (latestExtension.length > 0) {
      await db
        .update(tender)
        .set({
          evaluationDate: latestExtension[0].newEvaluationDate,
          updatedAt: new Date(),
        })
        .where(eq(tender.id, existing.tenderId));
    } else {
      await db
        .update(tender)
        .set({
          evaluationDate: null,
          updatedAt: new Date(),
        })
        .where(eq(tender.id, existing.tenderId));
    }

    // Handle file upload (replace old file if new one provided)
    if (formData) {
      const file = formData.get('file');
      if (file && file instanceof File && file.size > 0) {
        // Delete existing documents for this extension
        const existingDocs = await db
          .select()
          .from(document)
          .where(eq(document.extensionId, validatedData.extensionId));

        for (const doc of existingDocs) {
          try {
            await StorageService.deleteFile(doc.url);
          } catch (e) {
            console.error('Error deleting old extension document:', e);
          }
        }
        await db.delete(document).where(eq(document.extensionId, validatedData.extensionId));

        // Upload new file
        const extensionPrefix = 'Extension - ';
        const newFileName = `${extensionPrefix}${file.name}`;
        const newFile = new File([file], newFileName, { type: file.type });

        const newFormData = new FormData();
        newFormData.append('file', newFile);

        const uploadResult = await uploadDocument(organizationId, newFormData, {
          tenderId: existing.tenderId,
          extensionId: validatedData.extensionId,
        });

        if (!uploadResult.success) {
          console.error('Failed to upload new extension document:', uploadResult.error);
        }
      }
    }

    revalidatePath(`/tenders/${existing.tenderId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating tender extension:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.errors };
    }
    return { success: false, error: 'Failed to update extension' };
  }
}

export async function deleteTenderExtension(
  organizationId: string,
  extensionId: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session ||
      !session.session.activeOrganizationId ||
      session.session.activeOrganizationId !== organizationId
    ) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch the extension to get tenderId for revalidation
    const ext = await db.query.tenderExtension.findFirst({
      where: and(
        eq(tenderExtension.id, extensionId),
        eq(tenderExtension.organizationId, organizationId),
        isNull(tenderExtension.deletedAt)
      ),
    });

    if (!ext) {
      return { success: false, error: 'Extension not found' };
    }

    // Soft delete the extension
    await db
      .update(tenderExtension)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tenderExtension.id, extensionId));

    // Also delete associated documents physically
    const extensionDocs = await db
      .select()
      .from(document)
      .where(eq(document.extensionId, extensionId));

    for (const doc of extensionDocs) {
      try {
        await StorageService.deleteFile(doc.url);
      } catch (e) {
        console.error('Error deleting extension document from storage:', e);
      }
    }

    await db.delete(document).where(eq(document.extensionId, extensionId));

    // Recompute the tender's evaluation date from the latest remaining extension
    const latestExtension = await db
      .select({ newEvaluationDate: tenderExtension.newEvaluationDate })
      .from(tenderExtension)
      .where(and(
        eq(tenderExtension.tenderId, ext.tenderId),
        isNull(tenderExtension.deletedAt)
      ))
      .orderBy(desc(tenderExtension.newEvaluationDate))
      .limit(1);

    if (latestExtension.length > 0) {
      await db
        .update(tender)
        .set({
          evaluationDate: latestExtension[0].newEvaluationDate,
          updatedAt: new Date(),
        })
        .where(eq(tender.id, ext.tenderId));
    } else {
      // No extensions left — clear the evaluation date so the original validity date shows
      await db
        .update(tender)
        .set({
          evaluationDate: null,
          updatedAt: new Date(),
        })
        .where(eq(tender.id, ext.tenderId));
    }

    revalidatePath(`/tenders/${ext.tenderId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting tender extension:', error);
    return { success: false, error: 'Failed to delete extension' };
  }
}
