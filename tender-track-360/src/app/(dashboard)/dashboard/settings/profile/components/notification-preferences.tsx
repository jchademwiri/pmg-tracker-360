'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Shield,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  description: string;
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    sms?: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export function NotificationPreferences() {
  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'security',
      name: 'Security Alerts',
      description: 'Important security notifications and account changes',
      icon: <Shield className="h-4 w-4" />,
      enabled: true,
      channels: { email: true, push: true, inApp: true },
      frequency: 'immediate',
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
    },
    {
      id: 'account',
      name: 'Account Updates',
      description:
        'Profile changes, password updates, and account modifications',
      icon: <Users className="h-4 w-4" />,
      enabled: true,
      channels: { email: true, push: false, inApp: true },
      frequency: 'immediate',
    },
    {
      id: 'tenders',
      name: 'Tender Notifications',
      description: 'New tenders, deadlines, and submission updates',
      icon: <FileText className="h-4 w-4" />,
      enabled: true,
      channels: { email: true, push: true, inApp: true },
      frequency: 'daily',
    },
    {
      id: 'team',
      name: 'Team Activities',
      description: 'Member invitations, role changes, and team updates',
      icon: <Users className="h-4 w-4" />,
      enabled: false,
      channels: { email: false, push: false, inApp: true },
      frequency: 'daily',
    },
    {
      id: 'system',
      name: 'System Updates',
      description: 'Maintenance notifications and feature announcements',
      icon: <Monitor className="h-4 w-4" />,
      enabled: true,
      channels: { email: true, push: false, inApp: true },
      frequency: 'weekly',
    },
  ]);

  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="h-4 w-4" />,
      enabled: true,
      description: 'Receive notifications via email',
    },
    {
      id: 'push',
      name: 'Push Notifications',
      icon: <Smartphone className="h-4 w-4" />,
      enabled: true,
      description: 'Browser and mobile push notifications',
    },
    {
      id: 'inApp',
      name: 'In-App',
      icon: <Bell className="h-4 w-4" />,
      enabled: true,
      description: 'Notifications within the application',
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: <Smartphone className="h-4 w-4" />,
      enabled: false,
      description: 'Text message notifications for critical alerts',
    },
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    doNotDisturb: false,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
    soundEnabled: true,
    desktopNotifications: true,
  });

  const updateCategory = (
    categoryId: string,
    updates: Partial<NotificationCategory>
  ) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates } : cat))
    );
    toast.success('Notification preferences updated');
  };

  const updateChannel = (channelId: string, enabled: boolean) => {
    setChannels((prev) =>
      prev.map((channel) =>
        channel.id === channelId ? { ...channel, enabled } : channel
      )
    );
    toast.success('Notification channel updated');
  };

  const updateGlobalSettings = (updates: Partial<typeof globalSettings>) => {
    setGlobalSettings((prev) => ({ ...prev, ...updates }));
    toast.success('Global settings updated');
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'immediate':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'hourly':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'daily':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'weekly':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'immediate':
        return 'Immediate';
      case 'hourly':
        return 'Hourly Digest';
      case 'daily':
        return 'Daily Summary';
      case 'weekly':
        return 'Weekly Summary';
      default:
        return 'Custom';
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Global Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="do-not-disturb">Do Not Disturb</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable all notifications
                  </p>
                </div>
                <Switch
                  id="do-not-disturb"
                  checked={globalSettings.doNotDisturb}
                  onCheckedChange={(checked) =>
                    updateGlobalSettings({ doNotDisturb: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sound-enabled">Notification Sounds</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications
                  </p>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={globalSettings.soundEnabled}
                  onCheckedChange={(checked) =>
                    updateGlobalSettings({ soundEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="desktop-notifications">
                    Desktop Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show desktop notifications
                  </p>
                </div>
                <Switch
                  id="desktop-notifications"
                  checked={globalSettings.desktopNotifications}
                  onCheckedChange={(checked) =>
                    updateGlobalSettings({ desktopNotifications: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quiet Hours</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {globalSettings.quietHours.start} -{' '}
                      {globalSettings.quietHours.end}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No notifications during these hours
                    </p>
                  </div>
                  <Switch
                    checked={globalSettings.quietHours.enabled}
                    onCheckedChange={(checked) =>
                      updateGlobalSettings({
                        quietHours: {
                          ...globalSettings.quietHours,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Channels</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-full">
                    {channel.icon}
                  </div>
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {channel.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={channel.enabled}
                  onCheckedChange={(checked) =>
                    updateChannel(channel.id, checked)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Notification Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-full">
                    {category.icon}
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={category.enabled}
                  onCheckedChange={(checked) =>
                    updateCategory(category.id, { enabled: checked })
                  }
                />
              </div>

              {category.enabled && (
                <div className="ml-11 space-y-4">
                  {/* Channel Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Email</Label>
                      <Switch
                        checked={category.channels.email}
                        onCheckedChange={(checked) =>
                          updateCategory(category.id, {
                            channels: { ...category.channels, email: checked },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Push Notifications</Label>
                      <Switch
                        checked={category.channels.push}
                        onCheckedChange={(checked) =>
                          updateCategory(category.id, {
                            channels: { ...category.channels, push: checked },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">In-App</Label>
                      <Switch
                        checked={category.channels.inApp}
                        onCheckedChange={(checked) =>
                          updateCategory(category.id, {
                            channels: { ...category.channels, inApp: checked },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className="flex items-center space-x-3">
                    <Label className="text-sm">Frequency:</Label>
                    <Select
                      value={category.frequency}
                      onValueChange={(frequency) =>
                        updateCategory(category.id, {
                          frequency: frequency as
                            | 'immediate'
                            | 'hourly'
                            | 'daily'
                            | 'weekly',
                        })
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFrequencyIcon(category.frequency)}
                    <span className="text-sm text-muted-foreground">
                      {getFrequencyLabel(category.frequency)}
                    </span>
                  </div>

                  {/* Quiet Hours for Category */}
                  {category.quietHours && (
                    <div className="flex items-center space-x-3">
                      <Label className="text-sm">Category Quiet Hours:</Label>
                      <Switch
                        checked={category.quietHours.enabled}
                        onCheckedChange={(checked) =>
                          updateCategory(category.id, {
                            quietHours: {
                              ...category.quietHours!,
                              enabled: checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        Override global quiet hours
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>Test Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Test notification sent!')}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Test Success</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.error('Test error notification!')}
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Test Alert</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Test info notification!')}
              className="flex items-center space-x-2"
            >
              <Bell className="h-4 w-4" />
              <span>Test Info</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
