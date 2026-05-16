import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const tenderCategories = pgTable(
  'tender_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id'), // References Better Auth organization.id, null for system defaults
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    isSystemDefault: boolean('is_system_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('idx_categories_organization').on(t.organizationId),
    index('idx_categories_system').on(t.isSystemDefault),
    index('idx_categories_name').on(t.name),
    index('idx_categories_org_active').on(t.organizationId, t.isActive),
    index('idx_categories_system_active').on(t.isSystemDefault, t.isActive),
  ]
);
