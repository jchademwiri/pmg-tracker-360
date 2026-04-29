import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@pmg/ui/components/ui/card';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notification Settings' };

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how and when you receive notifications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Notification preferences will be available once email and push notification
            services are configured. Check back after Phase 4 (Auth) is complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Planned notifications include tender deadline alerts, project updates,
            purchase order status changes, and team activity summaries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
