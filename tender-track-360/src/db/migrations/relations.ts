import { relations } from "drizzle-orm/relations";
import { user, session, organization, member, account, invitation, project, tender, client, ownershipTransfer, securityAuditLog, sessionTracking, purchaseOrder, notificationPreferences, followUp } from "./schema";

export const sessionRelations = relations(session, ({one, many}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
	sessionTrackings: many(sessionTracking),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	members: many(member),
	accounts: many(account),
	organizations: many(organization),
	invitations: many(invitation),
	ownershipTransfers_fromUserId: many(ownershipTransfer, {
		relationName: "ownershipTransfer_fromUserId_user_id"
	}),
	ownershipTransfers_toUserId: many(ownershipTransfer, {
		relationName: "ownershipTransfer_toUserId_user_id"
	}),
	securityAuditLogs: many(securityAuditLog),
	notificationPreferences: many(notificationPreferences),
	followUps: many(followUp),
}));

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));

export const organizationRelations = relations(organization, ({one, many}) => ({
	members: many(member),
	user: one(user, {
		fields: [organization.deletedBy],
		references: [user.id]
	}),
	invitations: many(invitation),
	projects: many(project),
	ownershipTransfers: many(ownershipTransfer),
	securityAuditLogs: many(securityAuditLog),
	sessionTrackings: many(sessionTracking),
	purchaseOrders: many(purchaseOrder),
	clients: many(client),
	followUps: many(followUp),
	tenders: many(tender),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
}));

export const projectRelations = relations(project, ({one, many}) => ({
	organization: one(organization, {
		fields: [project.organizationId],
		references: [organization.id]
	}),
	tender: one(tender, {
		fields: [project.tenderId],
		references: [tender.id]
	}),
	client: one(client, {
		fields: [project.clientId],
		references: [client.id]
	}),
	purchaseOrders: many(purchaseOrder),
}));

export const tenderRelations = relations(tender, ({one, many}) => ({
	projects: many(project),
	followUps: many(followUp),
	organization: one(organization, {
		fields: [tender.organizationId],
		references: [organization.id]
	}),
	client: one(client, {
		fields: [tender.clientId],
		references: [client.id]
	}),
}));

export const clientRelations = relations(client, ({one, many}) => ({
	projects: many(project),
	organization: one(organization, {
		fields: [client.organizationId],
		references: [organization.id]
	}),
	tenders: many(tender),
}));

export const ownershipTransferRelations = relations(ownershipTransfer, ({one}) => ({
	organization: one(organization, {
		fields: [ownershipTransfer.organizationId],
		references: [organization.id]
	}),
	user_fromUserId: one(user, {
		fields: [ownershipTransfer.fromUserId],
		references: [user.id],
		relationName: "ownershipTransfer_fromUserId_user_id"
	}),
	user_toUserId: one(user, {
		fields: [ownershipTransfer.toUserId],
		references: [user.id],
		relationName: "ownershipTransfer_toUserId_user_id"
	}),
}));

export const securityAuditLogRelations = relations(securityAuditLog, ({one}) => ({
	organization: one(organization, {
		fields: [securityAuditLog.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [securityAuditLog.userId],
		references: [user.id]
	}),
}));

export const sessionTrackingRelations = relations(sessionTracking, ({one}) => ({
	session: one(session, {
		fields: [sessionTracking.sessionId],
		references: [session.id]
	}),
	organization: one(organization, {
		fields: [sessionTracking.organizationId],
		references: [organization.id]
	}),
}));

export const purchaseOrderRelations = relations(purchaseOrder, ({one}) => ({
	organization: one(organization, {
		fields: [purchaseOrder.organizationId],
		references: [organization.id]
	}),
	project: one(project, {
		fields: [purchaseOrder.projectId],
		references: [project.id]
	}),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({one}) => ({
	user: one(user, {
		fields: [notificationPreferences.userId],
		references: [user.id]
	}),
}));

export const followUpRelations = relations(followUp, ({one}) => ({
	organization: one(organization, {
		fields: [followUp.organizationId],
		references: [organization.id]
	}),
	tender: one(tender, {
		fields: [followUp.tenderId],
		references: [tender.id]
	}),
	user: one(user, {
		fields: [followUp.createdBy],
		references: [user.id]
	}),
}));