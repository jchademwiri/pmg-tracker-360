'use client';

import { ProfileTabs, createProfileTabs } from './profile-tabs';
import { PasswordForm } from './password-form';
import { OrganizationInfo } from './organization-info';
import { SecurityDashboard } from './security-dashboard';
import { SecuritySettings } from './security-settings';
import { Badge } from '@/components/ui/badge';
import type { ChangePasswordData, ActionResult, SessionInfo } from '../actions';

interface OrganizationMembership {
  id: string;
  role: string;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string | null;
    createdAt: Date;
  };
}

interface ProfileTabsWrapperProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  organizationMembership: OrganizationMembership | null;
  userSessions: SessionInfo[];
  resendVerificationEmail: () => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<ActionResult>;
}

export function ProfileTabsWrapper({
  currentUser,
  organizationMembership,
  userSessions,
  resendVerificationEmail,
  changePassword,
}: ProfileTabsWrapperProps) {
  return (
    <ProfileTabs
      tabs={createProfileTabs(
        {
          personal: (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <OrganizationInfo
                  membership={organizationMembership}
                  userUpdatedAt={currentUser.updatedAt}
                />
                <PasswordForm onSubmit={changePassword} />
              </div>
            </div>
          ),
          security: (
            <div className="space-y-6">
              {/* Security Dashboard */}
              <SecurityDashboard
                emailVerified={currentUser.emailVerified}
                sessions={userSessions}
                lastPasswordChange={currentUser.updatedAt}
                twoFactorEnabled={false}
              />

              {/* Security Settings */}
              <SecuritySettings initialSessions={userSessions} />
            </div>
          ),
        },
        {
          securityScore: 75,
          unreadNotifications: 3,
          pendingVerifications: currentUser.emailVerified ? 0 : 1,
        }
      )}
    />
  );
}
