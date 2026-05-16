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
import { user } from './auth';

export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }), // References Better Auth user.id
    emailNotifications: boolean('email_notifications').notNull().default(true),
    pushNotifications: boolean('push_notifications').notNull().default(true),
    reminderDays: integer('reminder_days').notNull().default(7),
    timezone: varchar('timezone', { length: 50 }).default('UTC'),
    language: varchar('language', { length: 10 }).default('en'),
    dateFormat: varchar('date_format', { length: 20 }).default('MM/dd/yyyy'),
    timeFormat: varchar('time_format', { length: 10 }).default('12h'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('idx_user_preferences_user').on(t.userId)]
);
