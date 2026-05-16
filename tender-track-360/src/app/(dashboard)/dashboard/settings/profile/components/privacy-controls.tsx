'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Eye,
  Download,
  Trash2,
  Shield,
  FileText,
  Database,
  AlertTriangle,
  Loader2,
  User,
  Mail,
  Calendar,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface PrivacySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'profile' | 'activity' | 'data' | 'security';
  icon: React.ReactNode;
}

interface DataExport {
  id: string;
  name: string;
  description: string;
  size: string;
  format: 'json' | 'csv' | 'pdf';
  status: 'available' | 'processing' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export function PrivacyControls() {
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      id: 'profile-visibility',
      name: 'Profile Visibility',
      description: 'Allow other users to see your profile information',
      enabled: false,
      category: 'profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      id: 'activity-tracking',
      name: 'Activity Tracking',
      description: 'Track your activity for analytics and improvements',
      enabled: true,
      category: 'activity',
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      id: 'data-analytics',
      name: 'Data Analytics',
      description: 'Use your data for product analytics and research',
      enabled: false,
      category: 'data',
      icon: <Database className="h-4 w-4" />,
    },
    {
      id: 'marketing-emails',
      name: 'Marketing Communications',
      description: 'Receive promotional emails and product updates',
      enabled: false,
      category: 'data',
      icon: <Mail className="h-4 w-4" />,
    },
    {
      id: 'location-tracking',
      name: 'Location Tracking',
      description: 'Allow location-based features and security monitoring',
      enabled: true,
      category: 'security',
      icon: <Shield className="h-4 w-4" />,
    },
  ]);

  const [dataExports, setDataExports] = useState<DataExport[]>([
    {
      id: '1',
      name: 'Complete Account Data',
      description:
        'All your account information, settings, and activity history',
      size: '2.4 MB',
      format: 'json',
      status: 'available',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Activity Report',
      description: 'Your login history and account activity timeline',
      size: '856 KB',
      format: 'csv',
      status: 'processing',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updatePrivacySetting = (id: string, enabled: boolean) => {
    setPrivacySettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled } : setting
      )
    );
    toast.success('Privacy setting updated');
  };

  const handleDataExport = async (format: 'json' | 'csv' | 'pdf') => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate export process
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);

          // Add new export to list
          const newExport: DataExport = {
            id: Date.now().toString(),
            name: `Account Data Export - ${new Date().toLocaleDateString()}`,
            description: `Complete account data export in ${format.toUpperCase()} format`,
            size: '2.1 MB',
            format,
            status: 'available',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          };

          setDataExports((prev) => [newExport, ...prev]);
          toast.success('Data export completed successfully!');
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const handleDeleteAccount = () => {
    // This would trigger the actual account deletion process
    toast.error(
      'Account deletion initiated. You will receive a confirmation email.'
    );
    setShowDeleteDialog(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profile':
        return <User className="h-4 w-4" />;
      case 'activity':
        return <Calendar className="h-4 w-4" />;
      case 'data':
        return <Database className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <Badge variant="default" className="text-xs">
            Available
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="text-xs">
            Processing
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive" className="text-xs">
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unknown
          </Badge>
        );
    }
  };

  const getFormatIcon = () => {
    return <FileText className="h-4 w-4" />;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilExpiry = (date: Date) => {
    const days = Math.ceil(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Privacy Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {['profile', 'activity', 'data', 'security'].map((category) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(category)}
                <h3 className="font-medium capitalize">{category} Settings</h3>
              </div>

              <div className="space-y-3 ml-6">
                {privacySettings
                  .filter((setting) => setting.category === category)
                  .map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-full">
                          {setting.icon}
                        </div>
                        <div>
                          <p className="font-medium">{setting.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={(checked) =>
                          updatePrivacySetting(setting.id, checked)
                        }
                      />
                    </div>
                  ))}
              </div>

              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Data Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Options */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Export Your Data</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Download a copy of your account data in various formats
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleDataExport('json')}
                disabled={isExporting}
                className="flex items-center space-x-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span>JSON Export</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDataExport('csv')}
                disabled={isExporting}
                className="flex items-center space-x-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span>CSV Export</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDataExport('pdf')}
                disabled={isExporting}
                className="flex items-center space-x-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span>PDF Report</span>
              </Button>
            </div>

            {/* Export Progress */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exporting your data...</span>
                  <span>{Math.round(exportProgress)}%</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
              </div>
            )}
          </div>

          <Separator />

          {/* Previous Exports */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Previous Exports</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Download previously generated data exports
              </p>
            </div>

            {dataExports.length > 0 ? (
              <div className="space-y-3">
                {dataExports.map((export_) => (
                  <div
                    key={export_.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded-full">
                        {getFormatIcon()}
                      </div>
                      <div>
                        <p className="font-medium">{export_.name}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{export_.description}</span>
                          <span>•</span>
                          <span>{export_.size}</span>
                          <span>•</span>
                          <span>Created {formatDate(export_.createdAt)}</span>
                          <span>•</span>
                          <span>
                            Expires in {getDaysUntilExpiry(export_.expiresAt)}{' '}
                            days
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(export_.status)}
                      {export_.status === 'available' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No previous exports found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-destructive">Delete Account</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all associated data. This
                action cannot be undone. You will receive a confirmation email
                before the deletion is processed.
              </p>
            </div>
          </div>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Account</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span>Delete Account</span>
                </DialogTitle>
                <DialogDescription>
                  Are you absolutely sure you want to delete your account? This
                  will:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Permanently delete all your personal data</li>
                  <li>Remove all your tenders and submissions</li>
                  <li>Revoke access to all organizations</li>
                  <li>Delete all activity history and logs</li>
                  <li>Cancel any pending notifications</li>
                </ul>
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <p className="text-sm text-destructive font-medium">
                    This action cannot be undone. You will receive a
                    confirmation email.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
