'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  Users,
  Mail,
  Settings,
  Shield,
  Crown,
  UserCheck,
  UserCog,
  User,
} from 'lucide-react';
import type { Role } from '@pmg/db/schema';
import { GeneralTab } from './general-tab';
import { MembersTab } from './members-tab';
import { InvitationsTab } from './invitations-tab';
import { SettingsTab } from './settings-tab';
import { SecurityTab } from './security-tab';

interface OrganizationManagementTabsProps {
  organization: {
    id: string;
    name: string;
    slug?: string | null;
    logo?: string | null;
    metadata?: string | null;
    createdAt: Date;
    memberCount: number;
    userRole: Role;
  };
  userRole: Role;
  currentUser: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

// Helper function to get role badge color and icon
function getRoleDisplay(role: Role) {
  switch (role) {
    case 'owner':
      return {
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: Crown,
        label: 'Owner',
      };
    case 'admin':
      return {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: UserCheck,
        label: 'Admin',
      };
    case 'manager':
      return {
        color:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: UserCog,
        label: 'Manager',
      };
    case 'member':
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        icon: User,
        label: 'Member',
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        icon: User,
        label: 'Member',
      };
  }
}

// Helper function to get organization initials
function getOrganizationInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to determine which tabs are accessible based on role
function getAccessibleTabs(role: Role) {
  const baseTabs = ['general', 'members', 'invitations'];

  switch (role) {
    case 'owner':
      return [...baseTabs, 'settings', 'security'];
    case 'admin':
      return [...baseTabs, 'settings', 'security'];
    case 'manager':
      return baseTabs;
    default:
      return ['general']; // Members should be redirected, but just in case
  }
}

export function OrganizationManagementTabs({
  organization,
  userRole,
  currentUser,
}: OrganizationManagementTabsProps) {
  const [activeTab, setActiveTab] = useState('general');
  const roleDisplay = getRoleDisplay(userRole);
  const RoleIcon = roleDisplay.icon;
  const accessibleTabs = getAccessibleTabs(userRole);

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={organization.logo || ''}
              alt={`${organization.name} logo`}
            />
            <AvatarFallback className="bg-primary/10 text-lg">
              {getOrganizationInitials(organization.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{organization.name}</h2>
              <Badge className={roleDisplay.color}>
                <RoleIcon className="h-3 w-3 mr-1" />
                {roleDisplay.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{organization.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>
                  Created{' '}
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(organization.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-12">
          {accessibleTabs.includes('general') && (
            <TabsTrigger
              value="general"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
          )}

          {accessibleTabs.includes('members') && (
            <TabsTrigger
              value="members"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
          )}

          {accessibleTabs.includes('invitations') && (
            <TabsTrigger
              value="invitations"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Invitations</span>
            </TabsTrigger>
          )}

          {accessibleTabs.includes('settings') && (
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          )}

          {accessibleTabs.includes('security') && (
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="general" className="space-y-6">
          <GeneralTab
            organization={organization}
            userRole={userRole}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <MembersTab
            organization={organization}
            userRole={userRole}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <InvitationsTab
            organization={organization}
            userRole={userRole}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsTab
            organization={organization}
            userRole={userRole}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityTab
            organization={{
              id: organization.id,
              name: organization.name,
              memberCount: organization.memberCount,
              activeProjects: (organization as any).activeProjects,
            }}
            userRole={userRole}
            currentUser={currentUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
