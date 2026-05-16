import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenderStatusEnum, userRoleEnum } from './enums';

export const allowedStatusTransitions = pgTable(
  'allowed_status_transitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromStatus: tenderStatusEnum('from_status').notNull(),
    toStatus: tenderStatusEnum('to_status').notNull(),
    requiredRole: userRoleEnum('required_role'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('idx_status_transitions').on(t.fromStatus, t.toStatus)]
);
