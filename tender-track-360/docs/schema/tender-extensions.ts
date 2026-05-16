import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';

import { tenders } from './tenders';
import { documents } from './documents';

// =============================
// ENUMS
// =============================
export const extensionStatusEnum = pgEnum('extension_status', [
  'received', // Extension received from client
  'in_progress', // Being processed by tender specialist
  'completed', // Completed and ready to send back
  'sent_to_client', // Sent back to client
  'acknowledged', // Client acknowledged receipt
  'expired', // Extension period has expired
]);

export const extensionTypeEnum = pgEnum('extension_type', [
  'evaluation', // Extension for evaluation period
  'award', // Extension for award period
  'both', // Extension for both evaluation and award
]);

// =============================
// MAIN TABLE: tenderExtensions
// =============================
export const tenderExtensions = pgTable(
  'tender_extensions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Core relationships
    tenderId: uuid('tender_id')
      .references(() => tenders.id)
      .notNull(),
    extensionDocumentId: uuid('extension_document_id').references(
      () => documents.id
    ),

    // Extension details
    extensionNumber: varchar('extension_number', { length: 50 }).notNull(),
    extensionType: extensionTypeEnum('extension_type').notNull(),
    status: extensionStatusEnum('status').notNull().default('received'),

    // Date tracking
    originalDeadline: timestamp('original_deadline', {
      withTimezone: true,
    }).notNull(),
    currentDeadline: timestamp('current_deadline', {
      withTimezone: true,
    }).notNull(),
    requestedNewDeadline: timestamp('requested_new_deadline', {
      withTimezone: true,
    }).notNull(),
    actualNewDeadline: timestamp('actual_new_deadline', { withTimezone: true }),

    // Extension period calculation
    extensionDays: integer('extension_days').notNull(),
    cumulativeDays: integer('cumulative_days').notNull(),

    // Business details
    reason: text('reason').notNull(),
    clientReference: varchar('client_reference', { length: 100 }),
    urgencyLevel: varchar('urgency_level', { length: 20 }).default('normal'),

    // Internal processing
    internalNotes: text('internal_notes'),
    processingNotes: text('processing_notes'),
    clientResponse: text('client_response'),

    // Workflow tracking
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // User tracking
    receivedById: text('received_by_id').notNull(),
    processedById: text('processed_by_id'),
    sentById: text('sent_by_id'),

    // Soft delete
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedById: text('deleted_by_id'),

    // Audit
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('idx_extensions_tender_status').on(t.tenderId, t.status),
    index('idx_extensions_deadline').on(t.currentDeadline, t.status),
    index('idx_extensions_processed_by').on(t.processedById),
    index('idx_extensions_received_date').on(t.receivedAt),
  ]
);

// =============================
// TABLE: extensionHistory
// =============================
export const extensionHistory = pgTable(
  'extension_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    extensionId: uuid('extension_id')
      .references(() => tenderExtensions.id)
      .notNull(),
    previousStatus: extensionStatusEnum('previous_status'),
    newStatus: extensionStatusEnum('new_status').notNull(),
    changedById: text('changed_by_id').notNull(),
    changeReason: text('change_reason'),
    changedAt: timestamp('changed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('idx_extension_history_time').on(t.extensionId, t.changedAt)]
);

// =============================
// TABLE: extensionReminders
// =============================
export const extensionReminders = pgTable(
  'extension_reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    extensionId: uuid('extension_id')
      .references(() => tenderExtensions.id)
      .notNull(),
    reminderType: varchar('reminder_type', { length: 50 }).notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('idx_extension_reminders_scheduled').on(t.scheduledFor, t.isActive),
  ]
);
