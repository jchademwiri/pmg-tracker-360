import { db } from '@/db';
import { sessionTracking, session } from '@/db/schema';
import { eq, and, desc, gte, isNull } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auditLogger } from './audit-logger';

export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  isMobile?: boolean;
}

export interface LocationInfo {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

export interface SessionInfo {
  id: string;
  sessionId: string;
  organizationId?: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  locationInfo?: LocationInfo;
  isSuspicious: boolean;
  isActive: boolean;
}

export interface SuspiciousActivityIndicators {
  multipleIPs: boolean;
  unusualLocation: boolean;
  rapidRequests: boolean;
  unusualHours: boolean;
  newDevice: boolean;
}

class SessionManager {
  private parseUserAgent(userAgent: string): DeviceInfo {
    const deviceInfo: DeviceInfo = {};

    // Simple user agent parsing (in production, use a proper library like ua-parser-js)
    if (
      userAgent.includes('Mobile') ||
      userAgent.includes('Android') ||
      userAgent.includes('iPhone')
    ) {
      deviceInfo.isMobile = true;
      deviceInfo.device = 'mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      deviceInfo.device = 'tablet';
    } else {
      deviceInfo.device = 'desktop';
    }

    if (userAgent.includes('Chrome')) {
      deviceInfo.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      deviceInfo.browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      deviceInfo.browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      deviceInfo.browser = 'Edge';
    }

    if (userAgent.includes('Windows')) {
      deviceInfo.os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      deviceInfo.os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      deviceInfo.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      deviceInfo.os = 'Android';
    } else if (userAgent.includes('iOS')) {
      deviceInfo.os = 'iOS';
    }

    return deviceInfo;
  }

  private async getLocationInfo(
    _ipAddress: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<LocationInfo | null> {
    // In production, integrate with a geolocation service like MaxMind or ipapi
    // For now, return null to avoid external dependencies
    return null;
  }

  private async getRequestInfo() {
    try {
      const headersList = await headers();
      const ipAddress =
        headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      return { ipAddress, userAgent };
    } catch (error) {
      console.warn('Failed to get request info:', error);
      return { ipAddress: 'unknown', userAgent: 'unknown' };
    }
  }

  async trackSession(
    sessionId: string,
    organizationId?: string
  ): Promise<void> {
    try {
      const requestInfo = await this.getRequestInfo();
      const deviceInfo = this.parseUserAgent(requestInfo.userAgent);
      const locationInfo = await this.getLocationInfo(requestInfo.ipAddress);

      // Check if session tracking already exists
      const existingTracking = await db.query.sessionTracking.findFirst({
        where: eq(sessionTracking.sessionId, sessionId),
      });

      if (existingTracking) {
        // Update last activity
        await db
          .update(sessionTracking)
          .set({
            lastActivity: new Date(),
            organizationId,
          })
          .where(eq(sessionTracking.sessionId, sessionId));
      } else {
        // Create new session tracking
        await db.insert(sessionTracking).values({
          id: crypto.randomUUID(),
          sessionId,
          organizationId,
          loginTime: new Date(),
          lastActivity: new Date(),
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
          deviceInfo: JSON.stringify(deviceInfo),
          locationInfo: locationInfo ? JSON.stringify(locationInfo) : null,
          isSuspicious: false,
        });
      }
    } catch (error) {
      console.error('Failed to track session:', error);
    }
  }

  async updateSessionActivity(
    sessionId: string,
    organizationId?: string
  ): Promise<void> {
    try {
      await db
        .update(sessionTracking)
        .set({
          lastActivity: new Date(),
          organizationId,
        })
        .where(eq(sessionTracking.sessionId, sessionId));
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    try {
      await db
        .update(sessionTracking)
        .set({
          logoutTime: new Date(),
        })
        .where(eq(sessionTracking.sessionId, sessionId));
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  }

  async getOrganizationSessions(
    organizationId: string
  ): Promise<SessionInfo[]> {
    try {
      const sessions = await db.query.sessionTracking.findMany({
        where: and(
          eq(sessionTracking.organizationId, organizationId),
          isNull(sessionTracking.logoutTime) // Only active sessions
        ),
        orderBy: [desc(sessionTracking.lastActivity)],
      });

      return sessions.map((session) => ({
        id: session.id,
        sessionId: session.sessionId,
        organizationId: session.organizationId || undefined,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        deviceInfo: session.deviceInfo
          ? JSON.parse(session.deviceInfo)
          : undefined,
        locationInfo: session.locationInfo
          ? JSON.parse(session.locationInfo)
          : undefined,
        isSuspicious: session.isSuspicious,
        isActive: !session.logoutTime,
      }));
    } catch (error) {
      console.error('Failed to get organization sessions:', error);
      return [];
    }
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      // Join with session table to get user sessions
      const sessions = await db
        .select({
          tracking: sessionTracking,
          session: session,
        })
        .from(sessionTracking)
        .innerJoin(session, eq(sessionTracking.sessionId, session.id))
        .where(
          and(
            eq(session.userId, userId),
            isNull(sessionTracking.logoutTime) // Only active sessions
          )
        )
        .orderBy(desc(sessionTracking.lastActivity));

      return sessions.map(({ tracking }) => ({
        id: tracking.id,
        sessionId: tracking.sessionId,
        organizationId: tracking.organizationId || undefined,
        loginTime: tracking.loginTime,
        lastActivity: tracking.lastActivity,
        ipAddress: tracking.ipAddress || undefined,
        userAgent: tracking.userAgent || undefined,
        deviceInfo: tracking.deviceInfo
          ? JSON.parse(tracking.deviceInfo)
          : undefined,
        locationInfo: tracking.locationInfo
          ? JSON.parse(tracking.locationInfo)
          : undefined,
        isSuspicious: tracking.isSuspicious,
        isActive: !tracking.logoutTime,
      }));
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  async detectSuspiciousActivity(
    sessionId: string,
    userId: string,
    organizationId?: string
  ): Promise<SuspiciousActivityIndicators> {
    const indicators: SuspiciousActivityIndicators = {
      multipleIPs: false,
      unusualLocation: false,
      rapidRequests: false,
      unusualHours: false,
      newDevice: false,
    };

    try {
      // Get recent sessions for this user (last 24 hours)
      const recentSessions = await db
        .select({
          tracking: sessionTracking,
          session: session,
        })
        .from(sessionTracking)
        .innerJoin(session, eq(sessionTracking.sessionId, session.id))
        .where(
          and(
            eq(session.userId, userId),
            gte(
              sessionTracking.loginTime,
              new Date(Date.now() - 24 * 60 * 60 * 1000)
            )
          )
        );

      // Check for multiple IPs
      const uniqueIPs = new Set(
        recentSessions.map((s) => s.tracking.ipAddress).filter(Boolean)
      );
      indicators.multipleIPs = uniqueIPs.size > 3;

      // Check for unusual hours (outside 6 AM - 11 PM)
      const currentHour = new Date().getHours();
      indicators.unusualHours = currentHour < 6 || currentHour > 23;

      // Check for new device
      const currentSession = recentSessions.find(
        (s) => s.tracking.sessionId === sessionId
      );
      if (currentSession) {
        const deviceFingerprint = currentSession.tracking.userAgent;
        const knownDevices = recentSessions
          .filter((s) => s.tracking.sessionId !== sessionId)
          .map((s) => s.tracking.userAgent);

        indicators.newDevice = !knownDevices.includes(deviceFingerprint);
      }

      // If any indicators are true, mark as suspicious and log
      const isSuspicious = Object.values(indicators).some(Boolean);

      if (isSuspicious) {
        await db
          .update(sessionTracking)
          .set({ isSuspicious: true })
          .where(eq(sessionTracking.sessionId, sessionId));

        if (organizationId) {
          await auditLogger.logSuspiciousActivity(organizationId, userId, {
            sessionId,
            indicators,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
    }

    return indicators;
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      // Mark sessions as logged out if they haven't been active for more than 24 hours
      const expiredThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await db
        .update(sessionTracking)
        .set({ logoutTime: new Date() })
        .where(
          and(
            isNull(sessionTracking.logoutTime),
            gte(sessionTracking.lastActivity, expiredThreshold)
          )
        );
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  async forceLogoutSession(
    sessionId: string,
    adminUserId: string,
    organizationId?: string
  ): Promise<void> {
    try {
      await this.terminateSession(sessionId);

      if (organizationId) {
        await auditLogger.log({
          organizationId,
          userId: adminUserId,
          action: 'session_terminated',
          resourceType: 'session',
          resourceId: sessionId,
          details: {
            reason: 'admin_forced_logout',
            timestamp: new Date().toISOString(),
          },
          severity: 'warning',
        });
      }
    } catch (error) {
      console.error('Failed to force logout session:', error);
    }
  }
}

export const sessionManager = new SessionManager();
