import { getCurrentUser } from '@/server';
import {
  User,
  Bell,
  Shield,
  Check,
  Settings,
  ChevronRight,
  Building2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

// Force dynamic rendering since we use headers() in server functions
export const dynamic = 'force-dynamic';

// Helper function to get user initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to calculate profile completion
function calculateProfileCompletion(user: {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
}): number {
  let completion = 0;
  if (user.name) completion += 25;
  if (user.email) completion += 25;
  if (user.emailVerified) completion += 25;
  if (user.image) completion += 25;
  return completion;
}

export default async function SettingsPage() {
  const { currentUser } = await getCurrentUser();
  const profileCompletion = calculateProfileCompletion(currentUser);
  const securityScore = currentUser.emailVerified ? 80 : 60; // Simple security score calculation

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-6xl">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* User Profile Summary */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={currentUser.image || ''}
                alt={`Profile picture of ${currentUser.name}`}
              />
              <AvatarFallback className="text-lg">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{currentUser.name}</h2>
              <p className="text-muted-foreground">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {currentUser.emailVerified ? (
                  <Badge variant="secondary" className="text-xs">
                    Email Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Email Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Profile Complete</p>
                <p className="text-xs text-muted-foreground">
                  {profileCompletion}% completed
                </p>
              </div>
            </div>
            <Progress value={profileCompletion} className="mt-3 h-2" />
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Security Score</p>
                <p className="text-xs text-muted-foreground">
                  {securityScore >= 80 ? 'Good' : 'Needs Attention'}
                </p>
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < Math.floor(securityScore / 20)
                      ? 'bg-blue-200 dark:bg-blue-800'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
            <Badge variant="secondary" className="mt-3 text-xs">
              Configured
            </Badge>
          </Card>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Settings Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Profile Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Manage your personal information, security settings, and account
              preferences.
            </CardDescription>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Update profile information</div>
              <div>• Change password and security</div>
              <div>• Manage email preferences</div>
            </div>
            <Link href="/dashboard/settings/profile">
              <Button type="button" className="w-full">
                Manage Profile
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Organization Settings Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">Organizations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Manage your organizations, team members, and organizational
              settings.
            </CardDescription>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• View all your organizations</div>
              <div>• Manage team members</div>
              <div>• Configure organization settings</div>
            </div>
            <Link href="/dashboard/organization">
              <Button type="button" className="w-full">
                Manage Organizations
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Configure how and when you receive notifications about your
              business activities.
            </CardDescription>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Email notification preferences</div>
              <div>• Tender deadline alerts</div>
              <div>• System notifications</div>
            </div>
            <Link href="/dashboard/settings/notifications">
              <Button type="button" className="w-full">
                Configure Notifications
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
