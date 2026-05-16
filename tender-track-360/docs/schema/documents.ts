import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { documentCategoryEnum } from './enums';
import { tenders } from './tenders';

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenderId: uuid('tender_id')
      .references(() => tenders.id)
      .notNull(),
    parentDocumentId: uuid('parent_document_id'),
    category: documentCategoryEnum('category').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    storageUrl: varchar('storage_url', { length: 255 }).notNull(),
    checksumHash: varchar('checksum_hash', { length: 64 }),
    version: integer('version').notNull().default(1),
    isLatestVersion: boolean('is_latest_version').notNull().default(true),
    isArchived: boolean('is_archived').notNull().default(false),
    archiveReason: varchar('archive_reason', { length: 255 }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedById: text('deleted_by_id'), // References Better Auth user.id
    uploadedById: text('uploaded_by_id').notNull(), // References Better Auth user.id
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('idx_documents_tender_category').on(t.tenderId, t.category),
    index('idx_documents_version').on(t.parentDocumentId, t.version),
    index('idx_documents_uploaded_by').on(t.uploadedById),
  ]
);
