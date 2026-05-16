import { pgTable, text, timestamp, foreignKey, unique, boolean, index, pgEnum } from "drizzle-orm/pg-core"

export const role = pgEnum("role", ['owner', 'admin', 'manager', 'member'])


export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	activeOrganizationId: text("active_organization_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const member = pgTable("member", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	role: role().default('member').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const organization = pgTable("organization", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text(),
	logo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	metadata: text(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	deletedBy: text("deleted_by"),
	deletionReason: text("deletion_reason"),
	permanentDeletionScheduledAt: timestamp("permanent_deletion_scheduled_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.deletedBy],
			foreignColumns: [user.id],
			name: "organization_deleted_by_user_id_fk"
		}),
	unique("organization_slug_unique").on(table.slug),
]);

export const invitation = pgTable("invitation", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	email: text().notNull(),
	role: role(),
	status: text().default('pending').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	inviterId: text("inviter_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: "invitation_inviter_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const project = pgTable("project", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	projectNumber: text("project_number").notNull(),
	description: text(),
	tenderId: text("tender_id"),
	clientId: text("client_id"),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "project_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenderId],
			foreignColumns: [tender.id],
			name: "project_tender_id_tender_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: "project_client_id_client_id_fk"
		}),
]);

export const ownershipTransfer = pgTable("ownership_transfer", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	fromUserId: text("from_user_id").notNull(),
	toUserId: text("to_user_id").notNull(),
	status: text().default('pending').notNull(),
	transferToken: text("transfer_token").notNull(),
	reason: text(),
	transferMessage: text("transfer_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "ownership_transfer_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [user.id],
			name: "ownership_transfer_from_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toUserId],
			foreignColumns: [user.id],
			name: "ownership_transfer_to_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("ownership_transfer_transfer_token_unique").on(table.transferToken),
]);

export const securityAuditLog = pgTable("security_audit_log", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	action: text().notNull(),
	resourceType: text("resource_type").notNull(),
	resourceId: text("resource_id"),
	details: text(),
	severity: text().default('info').notNull(),
	sessionId: text("session_id"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "security_audit_log_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "security_audit_log_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const sessionTracking = pgTable("session_tracking", {
	id: text().primaryKey().notNull(),
	sessionId: text("session_id").notNull(),
	organizationId: text("organization_id"),
	loginTime: timestamp("login_time", { mode: 'string' }).defaultNow().notNull(),
	lastActivity: timestamp("last_activity", { mode: 'string' }).defaultNow().notNull(),
	logoutTime: timestamp("logout_time", { mode: 'string' }),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	deviceInfo: text("device_info"),
	locationInfo: text("location_info"),
	isSuspicious: boolean("is_suspicious").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [session.id],
			name: "session_tracking_session_id_session_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "session_tracking_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const purchaseOrder = pgTable("purchase_order", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	projectId: text("project_id").notNull(),
	supplierName: text("supplier_name").notNull(),
	poNumber: text("po_number").notNull(),
	description: text().notNull(),
	totalAmount: text("total_amount").notNull(),
	status: text().default('draft').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	expectedDeliveryDate: timestamp("expected_delivery_date", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
}, (table) => [
	index("idx_po_delivered_at").using("btree", table.deliveredAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_po_expected_delivery_date").using("btree", table.expectedDeliveryDate.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "purchase_order_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [project.id],
			name: "purchase_order_project_id_project_id_fk"
		}).onDelete("cascade"),
	unique("purchase_order_po_number_key").on(table.poNumber),
]);

export const client = pgTable("client", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	name: text().notNull(),
	notes: text(),
	contactName: text("contact_name"),
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "client_organization_id_organization_id_fk"
		}).onDelete("cascade"),
]);

export const notificationPreferences = pgTable("notification_preferences", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	emailNotifications: boolean("email_notifications").default(true).notNull(),
	pushNotifications: boolean("push_notifications").default(true).notNull(),
	smsNotifications: boolean("sms_notifications").default(false).notNull(),
	tenderReminders: boolean("tender_reminders").default(true).notNull(),
	projectUpdates: boolean("project_updates").default(true).notNull(),
	calendarReminders: boolean("calendar_reminders").default(true).notNull(),
	systemAlerts: boolean("system_alerts").default(true).notNull(),
	marketingEmails: boolean("marketing_emails").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "notification_preferences_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const followUp = pgTable("follow_up", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	tenderId: text("tender_id").notNull(),
	notes: text().notNull(),
	contactPerson: text("contact_person"),
	nextFollowUpDate: timestamp("next_follow_up_date", { mode: 'string' }),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "follow_up_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenderId],
			foreignColumns: [tender.id],
			name: "follow_up_tender_id_tender_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [user.id],
			name: "follow_up_created_by_user_id_fk"
		}).onDelete("cascade"),
]);

export const tender = pgTable("tender", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	tenderNumber: text("tender_number").notNull(),
	description: text(),
	clientId: text("client_id").notNull(),
	submissionDate: timestamp("submission_date", { mode: 'string' }),
	value: text(),
	status: text().default('draft').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_tender_submission_date").using("btree", table.submissionDate.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "tender_organization_id_organization_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [client.id],
			name: "tender_client_id_client_id_fk"
		}).onDelete("cascade"),
	unique("tender_tender_number_unique").on(table.tenderNumber),
]);
