"use server";

import { db } from "@pmg/db";
import { clientContact, type ClientContact } from "@pmg/db/schema";
import { eq, and, isNull, ilike, or, desc } from "drizzle-orm";
import { getServerSession } from "@/lib/auth";
import { nanoid } from "nanoid";

/**
 * Fetch contacts for a specific client, ordered by most recently used.
 * Supports optional search query for autocomplete filtering.
 */
export async function getClientContacts(
  organizationId: string,
  clientId: string,
  query?: string,
): Promise<ClientContact[]> {
  try {
    const session = await getServerSession();
    if (
      !session ||
      !session.session.activeOrganizationId ||
      session.session.activeOrganizationId !== organizationId
    ) {
      return [];
    }

    let whereCondition = and(
      eq(clientContact.organizationId, organizationId),
      eq(clientContact.clientId, clientId),
      isNull(clientContact.deletedAt),
    );

    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      whereCondition = and(
        whereCondition,
        or(
          ilike(clientContact.name, searchTerm),
          ilike(clientContact.email, searchTerm),
        ),
      );
    }

    const contacts = await db
      .select()
      .from(clientContact)
      .where(whereCondition)
      .orderBy(desc(clientContact.lastUsedAt))
      .limit(20);

    return contacts;
  } catch (error) {
    console.error("Failed to fetch client contacts:", error);
    return [];
  }
}

/**
 * Record or update a client contact.
 * If a contact with matching name or email exists, update it and touch lastUsedAt.
 * If new, insert a new record.
 *
 * Can be called within a transaction (pass tx) or standalone (pass db).
 */
export async function recordClientContact(
  organizationId: string,
  clientId: string,
  contact: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  },
  txOrDb?: any,
): Promise<void> {
  const dbOrTx = txOrDb || db;

  // Skip if no meaningful contact data
  if (!contact.name?.trim() && !contact.email?.trim()) {
    return;
  }

  try {
    // Look for existing contact by name or email for this client
    let existingContact: ClientContact | undefined;

    if (contact.name?.trim()) {
      const byName = await dbOrTx
        .select()
        .from(clientContact)
        .where(
          and(
            eq(clientContact.organizationId, organizationId),
            eq(clientContact.clientId, clientId),
            ilike(clientContact.name, contact.name.trim()),
            isNull(clientContact.deletedAt),
          ),
        )
        .limit(1);

      if (byName.length > 0) {
        existingContact = byName[0];
      }
    }

    if (!existingContact && contact.email?.trim()) {
      const byEmail = await dbOrTx
        .select()
        .from(clientContact)
        .where(
          and(
            eq(clientContact.organizationId, organizationId),
            eq(clientContact.clientId, clientId),
            ilike(clientContact.email, contact.email.trim()),
            isNull(clientContact.deletedAt),
          ),
        )
        .limit(1);

      if (byEmail.length > 0) {
        existingContact = byEmail[0];
      }
    }

    const now = new Date();

    if (existingContact) {
      // Update existing contact — fill in any newly provided fields
      await dbOrTx
        .update(clientContact)
        .set({
          name: contact.name?.trim() || existingContact.name,
          email: contact.email?.trim() || existingContact.email,
          phone: contact.phone?.trim() || existingContact.phone,
          role: contact.role?.trim() || existingContact.role,
          lastUsedAt: now,
          updatedAt: now,
        })
        .where(eq(clientContact.id, existingContact.id));
    } else {
      // Insert new contact
      await dbOrTx.insert(clientContact).values({
        id: nanoid(),
        organizationId,
        clientId,
        name: contact.name?.trim() || "",
        email: contact.email?.trim() || null,
        phone: contact.phone?.trim() || null,
        role: contact.role?.trim() || null,
        lastUsedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error("Failed to record client contact:", error);
    // Don't throw — this is a background convenience feature
  }
}
