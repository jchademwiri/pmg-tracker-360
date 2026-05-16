import { db } from '@/db';
import { securityAuditLog } from '@/db/schema';
import { headers } from 'next/headers';

export type AuditAction =
  | 'organization_created'
  | 'organization_updated'
  | 'organization_soft_deleted'
  | 'organization_permanently_deleted'
  | 'organization_restored'
  | 'ownership_transfer_initiated'
  | 'ownership_transfer_accepted'
  | 'ownership_transfer_cancelled'
  | 'member_role_updated'
  | 'member_removed'
  | 'bulk_member_operation'
  | 'security_settings_updated'
  | 'suspicious_activity_detected'
  | 'login_attempt'
  | 'session_created'
  | 'session_terminated'
  | 'data_exported'
  | 'data_imported';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLogEntry {
  organizationId: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  severity?: AuditSeverity;
  sessionId?: string;
}

export interface AuditLogFilters {
  organizationId?: string;
  userId?: string;
  actions?: AuditAction[];
  resourceTypes?: string[];
  severity?: AuditSeverity[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  limit?: number;
  offset?: number;
}

class AuditLogger {
  private async getRequestInfo() {
    try {
      const headersList = await headers();
      return {
        ipAddress:
          headersList.get('x-forwarded-for') ||
          headersList.get('x-real-ip') ||
          'unknown',
        userAgent: headersList.get('user-agent') || 'unknown',
      };
    } catch (error) {
      console.warn('Failed to get request info for audit log:', error);
      return {
        ipAddress: 'unknown',
        userAgent: 'unknown',
      };
    }
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const requestInfo = await this.getRequestInfo();

      await db.insert(securityAuditLog).values({
        id: crypto.randomUUID(),
        organizationId: entry.organizationId,
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details ? JSON.stringify(entry.details) : null,
        severity: entry.severity || 'info',
        sessionId: entry.sessionId,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  async logOrganizationCreated(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'organization_created',
      resourceType: 'organization',
      resourceId: organizationId,
      details,
      severity: 'info',
    });
  }

  async logOrganizationUpdated(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'organization_updated',
      resourceType: 'organization',
      resourceId: organizationId,
      details,
      severity: 'info',
    });
  }

  async logOrganizationSoftDeleted(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'organization_soft_deleted',
      resourceType: 'organization',
      resourceId: organizationId,
      details,
      severity: 'warning',
    });
  }

  async logOrganizationPermanentlyDeleted(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'organization_permanently_deleted',
      resourceType: 'organization',
      resourceId: organizationId,
      details,
      severity: 'critical',
    });
  }

  async logOrganizationRestored(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'organization_restored',
      resourceType: 'organization',
      resourceId: organizationId,
      details,
      severity: 'info',
    });
  }

  async logOwnershipTransferInitiated(
    organizationId: string,
    userId: string,
    transferId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'ownership_transfer_initiated',
      resourceType: 'ownership_transfer',
      resourceId: transferId,
      details,
      severity: 'warning',
    });
  }

  async logOwnershipTransferAccepted(
    organizationId: string,
    userId: string,
    transferId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'ownership_transfer_accepted',
      resourceType: 'ownership_transfer',
      resourceId: transferId,
      details,
      severity: 'warning',
    });
  }

  async logMemberRoleUpdated(
    organizationId: string,
    userId: string,
    memberId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'member_role_updated',
      resourceType: 'member',
      resourceId: memberId,
      details,
      severity: 'info',
    });
  }

  async logMemberRemoved(
    organizationId: string,
    userId: string,
    memberId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'member_removed',
      resourceType: 'member',
      resourceId: memberId,
      details,
      severity: 'info',
    });
  }

  async logBulkMemberOperation(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'bulk_member_operation',
      resourceType: 'member',
      details,
      severity: 'info',
    });
  }

  async logSecuritySettingsUpdated(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'security_settings_updated',
      resourceType: 'security_settings',
      resourceId: organizationId,
      details,
      severity: 'warning',
    });
  }

  async logSuspiciousActivity(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'suspicious_activity_detected',
      resourceType: 'security',
      details,
      severity: 'critical',
    });
  }

  async logDataExported(
    organizationId: string,
    userId: string,
    details?: Record<string, unknown>
  ) {
    await this.log({
      organizationId,
      userId,
      action: 'data_exported',
      resourceType: 'organization',
      resourceId: organizationId,
      details,
      severity: 'info',
    });
  }

  async getAuditLog(filters: AuditLogFilters) {
    try {
      const query = db.select().from(securityAuditLog);

      // Apply filters (simplified for now - in production would use proper query building)
      const results = await query
        .limit(filters.limit || 100)
        .offset(filters.offset || 0);

      return results.map((entry) => ({
        ...entry,
        details: entry.details ? JSON.parse(entry.details) : null,
      }));
    } catch (error) {
      console.error('Failed to retrieve audit log:', error);
      return [];
    }
  }
}

export const auditLogger = new AuditLogger();
