import { checkUserSession } from '@/lib/session-check';
import { redirect } from 'next/navigation';
import { getUserOrganizationMembership } from '@/server/organizations';
import { Card, CardHeader, CardTitle } from '@pmg/ui/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@pmg/ui/components/ui/avatar';
import { Badge } from '@pmg/ui/components/ui/badge';
import { ProfileTabsWrapper } from './components/profile-tabs-wrapper';
import { ProfileSidebar } from './components/profile-sidebar';
import {
  updateProfile,
  resendVerificationEmail,
  changePassword,
  getUserSessions,
  SessionInfo,
} from './actions';

import { CalendarDays, Mail } from 'lucide-react';
import { SkipNavigation } from '@/components/skip-navigation';
import { db } from '@pmg/db';
import { user } from '@pmg/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering since we use headers() in server functions
export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  const session = await checkUserSession();
  if (!session.hasSession) redirect('/login');

  // Fetch full user details from DB for profile page (includes createdAt, updatedAt)
  const fullUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!fullUser) {
    redirect('/login');
  }

  const currentUser = {
    id: fullUser.id,
    name: fullUser.name,
    email: fullUser.email,
    emailVerified: fullUser.emailVerified,
    image: fullUser.image,
    createdAt: fullUser.createdAt,
    updatedAt: fullUser.updatedAt,
  };

  // Get user's organization membership details if they have an active organization
  const organizationMembership = session.activeOrganizationId
    ? (await getUserOrganizationMembership(
        currentUser.id,
        session.activeOrganizationId
      )) || null
    : null;

  // Get user sessions for security settings
  const sessionsResult = await getUserSessions();
  const userSessions = sessionsResult.success
    ? (sessionsResult.data as SessionInfo[])
    : [];

  // Server action wrapper that handles the ActionResult
  async function handleResendVerification(): Promise<void> {
    'use server';
    const result = await resendVerificationEmail();
    if (!result.success) {
      throw new Error(result.message);
    }
  }

  const skipSections = [
    { id: 'profile-sidebar', label: 'User Identity' },
    { id: 'profile-main', label: 'Settings & Preferences' },
  ];

  return (
    <>
      <SkipNavigation sections={skipSections} />
      <main className="container mx-auto py-6 sm:py-8 px-4 max-w-7xl">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Profile Settings
          </h1>
          <p className="text-muted-foreground text-base mt-2">
            Manage your personal information, security, and preferences.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar - ID Card */}
          <aside className="lg:col-span-4" id="profile-sidebar">
            <ProfileSidebar
              currentUser={currentUser}
              organizationMembership={organizationMembership}
              updateProfile={updateProfile}
            />
          </aside>

          {/* Right Content - Tabbed Interface */}
          <div className="lg:col-span-8" id="profile-main">
            <ProfileTabsWrapper
              currentUser={currentUser}
              organizationMembership={organizationMembership}
              userSessions={userSessions}
              resendVerificationEmail={handleResendVerification}
              changePassword={changePassword}
            />
          </div>
        </div>
      </main>
    </>
  );
}
