'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Save, Bell, Users, Globe, Clock, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '@/db/schema';
import { updateOrganizationSettings } from '@/server/organization-members';
import { updateOrganizationLogo } from '@/server/organizations';
import { AvatarUpload } from '../../../settings/profile/components/avatar-upload';

interface SettingsTabProps {
  organization: {
    id: string;
    name: string;
    metadata?: string | null;
    logo?: string | null;
  };
  userRole: Role;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

// Form schema for organization settings
const settingsSchema = z.object({
  defaultMemberRole: z.enum(['member', 'manager'] as const),
  allowMemberInvites: z.boolean(),
  requireEmailVerification: z.boolean(),
  enableNotifications: z.boolean(),
  notifyOnNewMembers: z.boolean(),
  notifyOnRoleChanges: z.boolean(),
  timezone: z.string(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const),
  language: z.string(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

// Helper function to check if user can edit settings
function canEditSettings(role: Role): boolean {
  return ['owner', 'admin'].includes(role);
}

// Helper function to check if user can edit owner-only settings
function canEditOwnerSettings(role: Role): boolean {
  return role === 'owner';
}

export function SettingsTab({
  organization,
  userRole,
  currentUser: _currentUser, // eslint-disable-line @typescript-eslint/no-unused-vars
}: SettingsTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(
    organization.logo || null
  );
  const canEdit = canEditSettings(userRole);
  const canEditOwner = canEditOwnerSettings(userRole);

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await updateOrganizationLogo(organization.id, formData);
  };

  const handleLogoRemove = () => {
    // Implement removal logic if needed, for now just UI update or separate action
    // We could add updateOrganizationLogo(id, emptyFormData?) or dedicated remove
    // For now, let's just toast
    setLogoUrl(null);
    toast.info('Logo removed (UI only for now)');
  };

  // Parse metadata if it exists
  const metadata = organization.metadata
    ? JSON.parse(organization.metadata)
    : {};
  const settings = metadata.settings || {};

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultMemberRole: settings.defaultMemberRole || 'member',
      allowMemberInvites: settings.allowMemberInvites || false,
      requireEmailVerification: settings.requireEmailVerification || true,
      enableNotifications: settings.enableNotifications || true,
      notifyOnNewMembers: settings.notifyOnNewMembers || true,
      notifyOnRoleChanges: settings.notifyOnRoleChanges || true,
      timezone: settings.timezone || 'UTC',
      dateFormat: settings.dateFormat || 'MM/DD/YYYY',
      language: settings.language || 'en',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit organization settings');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateOrganizationSettings(organization.id, data);

      if (result.success) {
        toast.success('Organization settings updated successfully', {
          description: 'Your settings have been saved.',
        });
      } else {
        toast.error(
          result.error?.message || 'Failed to update organization settings'
        );
      }
    } catch (error) {
      console.error('Error updating organization settings:', error);
      toast.error('Failed to update organization settings', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Identity
          </CardTitle>
          <CardDescription>
            Update your organization's logo and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center py-4">
            <AvatarUpload
              currentImage={logoUrl}
              userName={organization.name}
              onImageChange={setLogoUrl}
              onImageRemove={handleLogoRemove}
              disabled={!canEdit}
              uploadAction={handleLogoUpload}
              entityName="Organization Logo"
            />
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Member Management Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Management
              </CardTitle>
              <CardDescription>
                Configure how members are managed in your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="defaultMemberRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Member Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEditOwner}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select default role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The default role assigned to new members when they join
                      the organization.
                      {!canEditOwner && ' (Owner only)'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowMemberInvites"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Member Invitations
                      </FormLabel>
                      <FormDescription>
                        Allow managers and members to send invitations to new
                        users.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requireEmailVerification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Email Verification
                      </FormLabel>
                      <FormDescription>
                        New members must verify their email address before
                        accessing the organization.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure notification preferences for organization activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Notifications
                      </FormLabel>
                      <FormDescription>
                        Send notifications for organization activities and
                        updates.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyOnNewMembers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        New Member Notifications
                      </FormLabel>
                      <FormDescription>
                        Notify admins when new members join the organization.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyOnRoleChanges"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Role Change Notifications
                      </FormLabel>
                      <FormDescription>
                        Notify users when their role in the organization
                        changes.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canEdit}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Configure timezone, date format, and language preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Timezone
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!canEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UTC">🌍 UTC</SelectItem>
                          <SelectItem value="America/New_York">
                            🇺🇸 Eastern Time
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            🇺🇸 Central Time
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            🇺🇸 Mountain Time
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            🇺🇸 Pacific Time
                          </SelectItem>
                          <SelectItem value="Europe/London">
                            🇬🇧 London
                          </SelectItem>
                          <SelectItem value="Europe/Paris">🇫🇷 Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">🇯🇵 Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Default timezone for the organization.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!canEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">
                            MM/DD/YYYY (US)
                          </SelectItem>
                          <SelectItem value="DD/MM/YYYY">
                            DD/MM/YYYY (EU)
                          </SelectItem>
                          <SelectItem value="YYYY-MM-DD">
                            YYYY-MM-DD (ISO)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How dates are displayed throughout the organization.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full md:w-1/2">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Default language for the organization interface.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          {canEdit && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Settings
                  </>
                )}
              </Button>
            </div>
          )}

          {!canEdit && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              You have read-only access to organization settings. Contact an
              admin or owner to make changes.
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
