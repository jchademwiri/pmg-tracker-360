import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Clock, AlertTriangle, Mail, Smartphone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Notification Settings
        </h1>
        <p className="text-muted-foreground">
          Configure how and when you receive notifications about your business
          activities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Configure email alerts for important business activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="tender-deadlines">Tender Deadlines</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts for upcoming submission deadlines
                </p>
              </div>
              <Switch id="tender-deadlines" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="project-updates">Project Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Status changes and milestone completions
                </p>
              </div>
              <Switch id="project-updates" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="po-alerts">Purchase Order Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  PO status changes and duplicate warnings
                </p>
              </div>
              <Switch id="po-alerts" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="payment-reminders">Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Overdue invoices and payment notifications
                </p>
              </div>
              <Switch id="payment-reminders" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-reports">Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Summary of business activities
                </p>
              </div>
              <Switch id="weekly-reports" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-500" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Instant alerts delivered to your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="urgent-alerts">Urgent Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Critical deadlines and issues
                </p>
              </div>
              <Switch id="urgent-alerts" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-opportunities">New Opportunities</Label>
                <p className="text-sm text-muted-foreground">
                  Matching tender opportunities
                </p>
              </div>
              <Switch id="new-opportunities" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="team-updates">Team Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Messages from team members
                </p>
              </div>
              <Switch id="team-updates" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-maintenance">System Maintenance</Label>
                <p className="text-sm text-muted-foreground">
                  Scheduled downtime and updates
                </p>
              </div>
              <Switch id="system-maintenance" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet-500" />
            Notification Timing
          </CardTitle>
          <CardDescription>
            Configure when and how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tender-timing">Tender Deadline Alerts</Label>
              <Select defaultValue="1-day">
                <SelectTrigger>
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-day">1 day before</SelectItem>
                  <SelectItem value="2-days">2 days before</SelectItem>
                  <SelectItem value="3-days">3 days before</SelectItem>
                  <SelectItem value="1-week">1 week before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestone-timing">
                Project Milestone Reminders
              </Label>
              <Select defaultValue="same-day">
                <SelectTrigger>
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same-day">Same day</SelectItem>
                  <SelectItem value="1-day">1 day before</SelectItem>
                  <SelectItem value="2-days">2 days before</SelectItem>
                  <SelectItem value="1-week">1 week before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiet-start">Quiet Hours Start</Label>
              <Input id="quiet-start" type="time" defaultValue="22:00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiet-end">Quiet Hours End</Label>
              <Input id="quiet-end" type="time" defaultValue="08:00" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Critical Alerts
          </CardTitle>
          <CardDescription>
            High-priority notifications that require immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="border-red-200 bg-red-50/50 dark:border-red-800/30 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="duplicate-po"
                    className="text-red-700 dark:text-red-400 font-medium"
                  >
                    Duplicate PO Warning
                  </Label>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    Alert when creating PO that may already exist
                  </p>
                </div>
                <Switch id="duplicate-po" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800/30 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="budget-overrun"
                    className="text-orange-700 dark:text-orange-400 font-medium"
                  >
                    Budget Overrun Alert
                  </Label>
                  <p className="text-sm text-orange-600 dark:text-orange-500">
                    Notify when project exceeds budget by 10%
                  </p>
                </div>
                <Switch id="budget-overrun" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="contract-expiry"
                    className="text-amber-700 dark:text-amber-400 font-medium"
                  >
                    Contract Expiry Warning
                  </Label>
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    Alert 30 days before contract expiration
                  </p>
                </div>
                <Switch id="contract-expiry" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Notification Settings</Button>
      </div>
    </div>
  );
}
