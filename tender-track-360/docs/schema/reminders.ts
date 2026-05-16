import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core';

export const reminderRules = pgTable(
  'reminder_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    daysBefore: integer('days_before').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    messageTemplate: text('message_template').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('idx_reminder_rules_active').on(t.isActive),
    index('idx_reminder_rules_days_before').on(t.daysBefore),
  ]
);
