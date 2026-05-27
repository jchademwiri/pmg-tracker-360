import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Download,
  CheckCircle,
  Building2,
  Key,
  Activity,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings Overview</h1>
        <p className="text-muted-foreground">
          Manage your account, organization, and system preferences.
        </p>
      </div>

      {/* Account Setup Progress */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:border-blue-800/30 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Account Setup Progress
          </CardTitle>
          <CardDescription>
            Complete your account setup to unlock all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile completion</span>
              <span className="text-sm text-muted-foreground">85%</span>
            </div>
            <Progress value={85} className="h-2" />
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                Profile information completed
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                Organisation details added
              </div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                Two-factor authentication pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your personal profile information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Profile completion</span>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                Complete
              </Badge>
            </div>
            <Separator />
            <Button asChild className="w-full">
              <Link href="/dashboard/settings/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 hover:border-purple-200 dark:hover:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              Organisation Settings
            </CardTitle>
            <CardDescription>
              Configure organization information and team settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Team members</span>
              <Badge
                variant="outline"
                className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400"
              >
                12 active
              </Badge>
            </div>
            <Separator />
            <Button asChild className="w-full">
              <Link
                href="/dashboard/settings"
                as="/dashboard/settings/organization"
              >
                Manage Organisation
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 hover:border-emerald-200 dark:hover:border-emerald-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              Notifications
            </CardTitle>
            <CardDescription>
              Control how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Active alerts</span>
              <Badge
                variant="outline"
                className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
              >
                8 enabled
              </Badge>
            </div>
            <Separator />
            <Button asChild className="w-full">
              <Link href="/dashboard/settings/notifications">
                Configure Alerts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:border-emerald-800/30 dark:from-emerald-950/20 dark:to-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              System Status
            </CardTitle>
            <CardDescription>
              Current system health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium">
                  All Systems Operational
                </span>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                ✓ Healthy
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last backup</span>
                <span>Dec 18, 2024 at 3:00 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">System uptime</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  99.9%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last check</span>
                <span>2 minutes ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:border-slate-800/30 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks and utilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20 dark:hover:border-blue-800"
              asChild
            >
              <Link href="/dashboard/settings" as="/dashboard/settings/backup">
                <Database className="h-4 w-4 mr-2 text-blue-500" />
                Create System Backup
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/20 dark:hover:border-green-800"
              asChild
            >
              <Link href="/dashboard/settings" as="/dashboard/settings/export">
                <Download className="h-4 w-4 mr-2 text-green-500" />
                Export Data
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:border-red-800"
              asChild
            >
              <Link
                href="/dashboard/settings"
                as="/dashboard/settings/security"
              >
                <Key className="h-4 w-4 mr-2 text-red-500" />
                Security Audit
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/20 dark:hover:border-purple-800"
              asChild
            >
              <Link href="/dashboard/settings" as="/dashboard/settings/logs">
                <Clock className="h-4 w-4 mr-2 text-purple-500" />
                View Activity Logs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            Recent Settings Changes
          </CardTitle>
          <CardDescription>
            Latest modifications to your account and system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
              <Bell className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Notification preferences updated
                </p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
              <User className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Profile information modified
                </p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
              <Shield className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">Password changed</p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
