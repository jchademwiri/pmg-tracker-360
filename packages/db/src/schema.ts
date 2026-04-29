import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';

/* =========================
   AUTH & ORG TABLES
========================= */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
  plan: text('plan').default('free').notNull(),
  role: text('role').default('user').notNull(),
});

export type User = typeof user.$inferSelect;

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

/* =========================
   ORGANISATIONS
========================= */

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull(),
  metadata: text('metadata'),
  // Soft deletion fields
  deletedAt: timestamp('deleted_at'),
  deletedBy: text('deleted_by').references(() => user.id),
  deletionReason: text('deletion_reason'),
  permanentDeletionScheduledAt: timestamp('permanent_deletion_scheduled_at'),
});

export const role = pgEnum('role', ['owner', 'admin', 'manager', 'member']);
export type Role = (typeof role.enumValues)[number];

export const member = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: role('role').default('member').notNull(),
    createdAt: timestamp('created_at').notNull(),
  },
  (table) => ({
    orgUserUnique: unique('member_organization_id_user_id_unique').on(
      table.organizationId,
      table.userId
    ),
  })
);

export type Member = typeof member.$inferSelect & {
  user: typeof user.$inferSelect;
};

// Backwards-compatible type aliases for tests and older imports
export type Organization = typeof organization.$inferSelect;
export type MemberWithUser = Member;

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: role('role'),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

/* =========================
   NOTIFICATION PREFERENCES
========================= */
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    emailNotifications: boolean('email_notifications').default(true).notNull(),
    pushNotifications: boolean('push_notifications').default(true).notNull(),
    smsNotifications: boolean('sms_notifications').default(false).notNull(),
    tenderReminders: boolean('tender_reminders').default(true).notNull(),
    projectUpdates: boolean('project_updates').default(true).notNull(),
    calendarReminders: boolean('calendar_reminders').default(true).notNull(),
    systemAlerts: boolean('system_alerts').default(true).notNull(),
    marketingEmails: boolean('marketing_emails').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdUnique: unique('notification_preferences_user_id_unique').on(
      table.userId
    ),
  })
);

export const notification = pgTable('notification', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info').notNull(), // info, success, warning, error
  read: boolean('read').default(false).notNull(),
  link: text('link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* =========================
   OWNERSHIP TRANSFER
========================= */
export const ownershipTransfer = pgTable('ownership_transfer', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  fromUserId: text('from_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  toUserId: text('to_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').default('pending').notNull(), // pending, accepted, cancelled, expired
  transferToken: text('transfer_token').unique().notNull(),
  reason: text('reason'),
  transferMessage: text('transfer_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  cancelledAt: timestamp('cancelled_at'),
});

/* =========================
   SECURITY AUDIT LOG
========================= */
export const securityAuditLog = pgTable('security_audit_log', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  details: text('details'), // JSON string
  severity: text('severity').default('info').notNull(), // info, warning, critical
  sessionId: text('session_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* =========================
   SESSION TRACKING
========================= */
export const sessionTracking = pgTable('session_tracking', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => session.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organization.id, {
    onDelete: 'cascade',
  }),
  loginTime: timestamp('login_time').defaultNow().notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  logoutTime: timestamp('logout_time'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceInfo: text('device_info'), // JSON string
  locationInfo: text('location_info'), // JSON string
  isSuspicious: boolean('is_suspicious').default(false).notNull(),
});

/* =========================
   WAITLIST
========================= */
export const waitlist = pgTable('waitlist', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  companyName: text('company_name'),
  source: text('source').default('website'), // website, webhook, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/* =========================
   FEEDBACK
========================= */
export const feedback = pgTable('feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  message: text('message').notNull(),
  type: text('type').notNull(), // bug, feature, other
  url: text('url'),
  name: text('name'),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supportTickets = pgTable('support_tickets', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  status: text('status').default('open').notNull(), // open, closed, in_progress
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* =========================
   TENDER MANAGEMENT TABLES
========================= */

// Client table with embedded contact fields
export const client = pgTable('client', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  notes: text('notes'),
  // Embedded contact fields
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft deletion
});

// Tender table with unique tender numbers
export const tender = pgTable('tender', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  tenderNumber: text('tender_number').notNull().unique(), // User-input unique identifier
  description: text('description'),
  clientId: text('client_id')
    .notNull()
    .references(() => client.id, { onDelete: 'cascade' }),
  submissionDate: timestamp('submission_date'),
  value: text('value'), // String for currency formatting
  status: text('status').default('draft').notNull(), // draft, submitted, won, lost, pending
  evaluationDate: timestamp('evaluation_date'), // Current validated period deadline
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft deletion
});

// Project table with tender inheritance support
export const project = pgTable('project', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  projectNumber: text('project_number').notNull(), // Inherited from tender or custom
  description: text('description'), // Inherited from tender or custom
  tenderId: text('tender_id').references(() => tender.id), // Optional link to originating tender
  clientId: text('client_id').references(() => client.id), // Inherited from tender or custom
  status: text('status').default('active').notNull(), // active, completed, cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft deletion
});

// Purchase Order table with project relationships
export const purchaseOrder = pgTable('purchase_order', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  projectId: text('project_id')
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' }),
  poNumber: text('po_number').notNull().unique(), // Unique PO number
  supplierName: text('supplier_name'), // Optional supplier name
  description: text('description').notNull(),
  totalAmount: text('total_amount').notNull(), // String for currency
  status: text('status').default('draft').notNull(), // draft, sent, delivered
  // Calendar-related dates
  poDate: timestamp('po_date'), // Purchase order date
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  deliveredAt: timestamp('delivered_at'),
  deliveryAddress: text('delivery_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft deletion
});

// Tender Extension table (replacing Follow-up)
export const tenderExtension = pgTable('tender_extension', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  tenderId: text('tender_id')
    .notNull()
    .references(() => tender.id, { onDelete: 'cascade' }),
  extensionDate: timestamp('extension_date').notNull(), // Date of the extension letter
  newEvaluationDate: timestamp('new_evaluation_date').notNull(), // New validated deadline
  contactName: text('contact_name'),
  contactEmail: text('contact_email').notNull(), // Mandatory
  contactPhone: text('contact_phone'), // Optional
  notes: text('notes'),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft deletion
});

// Document table for file attachments
export const document = pgTable('document', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  size: text('size').notNull(), // String to store bytes size
  type: text('type').notNull(), // MIME type
  tenderId: text('tender_id').references(() => tender.id, {
    onDelete: 'cascade',
  }),
  projectId: text('project_id').references(() => project.id, {
    onDelete: 'cascade',
  }),
  purchaseOrderId: text('purchase_order_id').references(
    () => purchaseOrder.id,
    {
      onDelete: 'cascade',
    }
  ),
  extensionId: text('extension_id').references(() => tenderExtension.id, {
    onDelete: 'cascade',
  }),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/* =========================
   RELATIONS
   ⚠️ Moved here AFTER all tables are defined
========================= */
export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  projects: many(project),
  tenders: many(tender),
  clients: many(client),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export type NotificationPreferences =
  typeof notificationPreferences.$inferSelect;
export type Notification = typeof notification.$inferSelect;

export type OwnershipTransfer = typeof ownershipTransfer.$inferSelect;
export type SecurityAuditLog = typeof securityAuditLog.$inferSelect;
export type SessionTracking = typeof sessionTracking.$inferSelect;

// Tender Management Types
export type Client = typeof client.$inferSelect;
export type Tender = typeof tender.$inferSelect;
export type Project = typeof project.$inferSelect;
export type PurchaseOrder = typeof purchaseOrder.$inferSelect;
export type TenderExtension = typeof tenderExtension.$inferSelect;
export type Document = typeof document.$inferSelect;

// Notification Preferences Relations
export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationPreferences.userId],
      references: [user.id],
    }),
  })
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [notification.organizationId],
    references: [organization.id],
  }),
}));

// Ownership Transfer Relations
export const ownershipTransferRelations = relations(
  ownershipTransfer,
  ({ one }) => ({
    organization: one(organization, {
      fields: [ownershipTransfer.organizationId],
      references: [organization.id],
    }),
    fromUser: one(user, {
      fields: [ownershipTransfer.fromUserId],
      references: [user.id],
    }),
    toUser: one(user, {
      fields: [ownershipTransfer.toUserId],
      references: [user.id],
    }),
  })
);

// Security Audit Log Relations
export const securityAuditLogRelations = relations(
  securityAuditLog,
  ({ one }) => ({
    organization: one(organization, {
      fields: [securityAuditLog.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [securityAuditLog.userId],
      references: [user.id],
    }),
  })
);

// Session Tracking Relations
export const sessionTrackingRelations = relations(
  sessionTracking,
  ({ one }) => ({
    session: one(session, {
      fields: [sessionTracking.sessionId],
      references: [session.id],
    }),
    organization: one(organization, {
      fields: [sessionTracking.organizationId],
      references: [organization.id],
    }),
  })
);

// Tender Management Relations
export const clientRelations = relations(client, ({ one, many }) => ({
  organization: one(organization, {
    fields: [client.organizationId],
    references: [organization.id],
  }),
  tenders: many(tender),
  projects: many(project),
}));

export const tenderRelations = relations(tender, ({ one, many }) => ({
  organization: one(organization, {
    fields: [tender.organizationId],
    references: [organization.id],
  }),
  client: one(client, {
    fields: [tender.clientId],
    references: [client.id],
  }),
  projects: many(project),
  extensions: many(tenderExtension),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  organization: one(organization, {
    fields: [project.organizationId],
    references: [organization.id],
  }),
  tender: one(tender, {
    fields: [project.tenderId],
    references: [tender.id],
  }),
  client: one(client, {
    fields: [project.clientId],
    references: [client.id],
  }),
  purchaseOrders: many(purchaseOrder),
}));

export const purchaseOrderRelations = relations(purchaseOrder, ({ one }) => ({
  organization: one(organization, {
    fields: [purchaseOrder.organizationId],
    references: [organization.id],
  }),
  project: one(project, {
    fields: [purchaseOrder.projectId],
    references: [project.id],
  }),
}));

export const tenderExtensionRelations = relations(
  tenderExtension,
  ({ one }) => ({
    organization: one(organization, {
      fields: [tenderExtension.organizationId],
      references: [organization.id],
    }),
    tender: one(tender, {
      fields: [tenderExtension.tenderId],
      references: [tender.id],
    }),
    createdByUser: one(user, {
      fields: [tenderExtension.createdBy],
      references: [user.id],
    }),
  })
);

export const documentRelations = relations(document, ({ one }) => ({
  organization: one(organization, {
    fields: [document.organizationId],
    references: [organization.id],
  }),
  tender: one(tender, {
    fields: [document.tenderId],
    references: [tender.id],
  }),
  project: one(project, {
    fields: [document.projectId],
    references: [project.id],
  }),
  purchaseOrder: one(purchaseOrder, {
    fields: [document.purchaseOrderId],
    references: [purchaseOrder.id],
  }),
  extension: one(tenderExtension, {
    fields: [document.extensionId],
    references: [tenderExtension.id],
  }),
  uploader: one(user, {
    fields: [document.uploadedBy],
    references: [user.id],
  }),
}));

/* =========================
   EXPORT SCHEMA
========================= */
export const schema = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  notificationPreferences,
  notification,
  ownershipTransfer,
  securityAuditLog,
  sessionTracking,
  // Tender Management Tables
  client,
  tender,
  project,
  purchaseOrder,
  tenderExtension,
  document,
  // Relations
  organizationRelations,
  memberRelations,
  invitationRelations,
  notificationPreferencesRelations,
  notificationRelations,
  ownershipTransferRelations,
  securityAuditLogRelations,
  sessionTrackingRelations,
  // Tender Management Relations
  clientRelations,
  tenderRelations,
  projectRelations,
  purchaseOrderRelations,
  tenderExtensionRelations,
  documentRelations,
  // Other
  waitlist,
  feedback,
  supportTickets,
};

export type Feedback = typeof feedback.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;