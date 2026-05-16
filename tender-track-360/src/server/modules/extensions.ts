'use server';

import { db } from '@/db';
import {
  tenderExtension,
  tender,
  document,
  type TenderExtension,
} from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { uploadDocument } from '@/server/documents';
import { z } from 'zod';

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

    revalidatePath(`/dashboard/tenders/${validatedData.tenderId}`);
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
      where: eq(tenderExtension.tenderId, tenderId),
      orderBy: [desc(tenderExtension.extensionDate)],
      with: {
        createdByUser: {
          columns: { name: true, image: true },
        },
      },
    });

    // We might want to fetch documents for each extension?
    // Or we can just fetch documents separately.
    // Let's attach documents if possible, but schema relations allow it.
    // Actually `document` has `extensionId`.

    // Let's stick to extensions for now, UI can fetch docs or we can use `with`.
    // Drizzle `with` support for documents?
    // In schema, I added `extensions` to `tenderRelations`? No, document has `extension`.
    // I need reverse relation in `tenderExtensionRelations` to `documents`?
    // construct it manually or add it to schema.

    // Let's add `documents` relation to `tenderExtension` in schema if needed, OR just query documents.
    // efficient way: query documents where extensionId IN ...

    return { success: true, data: extensions };
  } catch (error) {
    console.error('Error fetching extensions:', error);
    return { success: false, error: 'Failed to fetch extensions' };
  }
}
