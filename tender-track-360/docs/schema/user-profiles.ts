import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';
import { organization, user } from './auth';

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }), // References Better Auth user.id
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }), // References Better Auth organization.id
    role: userRoleEnum('role').notNull().default('viewer'), // Business roles
    department: varchar('department', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    lastLogin: timestamp('last_login', { withTimezone: true }),
    onboardingCompleted: boolean('onboarding_completed')
      .notNull()
      .default(false),
    preferences: jsonb('preferences'), // User preferences as JSON
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedById: text('deleted_by_id').references(() => user.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('idx_user_profiles_organization').on(t.organizationId),
    index('idx_user_profiles_user').on(t.userId),
    index('idx_user_profiles_role').on(t.role),
    index('idx_user_profiles_active').on(t.isActive, t.organizationId),
    index('idx_user_profiles_department').on(t.department, t.organizationId),
  ]
);
