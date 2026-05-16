import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  numeric,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenderStatusEnum } from './enums';
import { clients } from './clients';
import { tenderCategories } from './categories';

export const tenders = pgTable(
  'tenders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id').notNull(), // References Better Auth organization.id
    referenceNumber: varchar('reference_number', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    clientId: uuid('client_id')
      .references(() => clients.id)
      .notNull(),
    categoryId: uuid('category_id').references(() => tenderCategories.id),
    status: tenderStatusEnum('status').notNull().default('in_progress'),
    closingDate: timestamp('closing_date', { withTimezone: true }),
    evaluationDate: date('evaluation_date'), // Auto-calculated: closingDate + 90 days
    awardDate: date('award_date'), // Only set when awarded
    estimatedValue: numeric('estimated_value', { precision: 15, scale: 2 }),
    actualValue: numeric('actual_value', { precision: 15, scale: 2 }),
    isSuccessful: boolean('is_successful'),
    department: varchar('department', { length: 100 }),
    notes: text('notes'),
    tags: text('tags').array(), // PostgreSQL array for tags
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedById: text('deleted_by_id'), // References Better Auth user.id
    createdById: text('created_by_id').notNull(), // References Better Auth user.id
    updatedById: text('updated_by_id').notNull(), // References Better Auth user.id
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Composite unique constraint for reference number within organization
    uniqueIndex('idx_tenders_org_reference').on(
      t.organizationId,
      t.referenceNumber
    ),
    index('idx_tenders_status_closing').on(t.status, t.closingDate),
    index('idx_tenders_client').on(t.clientId),
    index('idx_tenders_category').on(t.categoryId),
    index('idx_tenders_created_by').on(t.createdById),
    index('idx_tenders_organization').on(t.organizationId),
  ]
);
