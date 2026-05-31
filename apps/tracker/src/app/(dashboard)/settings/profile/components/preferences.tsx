'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Keyboard,
  Palette,
  Clock,
  Moon,
  Sun,
  Monitor,
  Zap,
  Eye,
  HelpCircle,
  Command,
} from 'lucide-react';
import { toast } from 'sonner';

interface KeyboardShortcut {
  id: string;
  key: string;
  description: string;
  category: string;
  action: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface Language {
  id: string;
  name: string;
  code: string;
  flag: string;
}

interface Timezone {
  id: string;
  name: string;
  offset: string;
  region: string;
}

export function Preferences() {
  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    animations: true,
    soundEffects: true,
    keyboardShortcuts: true,
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
    autoSave: true,
    confirmActions: true,
  });

  const [showShortcuts, setShowShortcuts] = useState(false);

  const themes: Theme[] = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: <Sun className="h-4 w-4" />,
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: <Moon className="h-4 w-4" />,
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follows your system preference',
      icon: <Monitor className="h-4 w-4" />,
    },
  ];

  const languages: Language[] = [
    { id: 'en', name: 'English', code: 'en-US', flag: '🇺🇸' },
    { id: 'es', name: 'Spanish', code: 'es-ES', flag: '🇪🇸' },
    { id: 'fr', name: 'French', code: 'fr-FR', flag: '🇫🇷' },
    { id: 'de', name: 'German', code: 'de-DE', flag: '🇩🇪' },
  ];

  const timezones: Timezone[] = [
    {
      id: 'UTC',
      name: 'UTC',
      offset: '+00:00',
      region: 'Coordinated Universal Time',
    },
    {
      id: 'EST',
      name: 'Eastern Time',
      offset: '-05:00',
      region: 'America/New_York',
    },
    {
      id: 'CST',
      name: 'Central Time',
      offset: '-06:00',
      region: 'America/Chicago',
    },
    {
      id: 'MST',
      name: 'Mountain Time',
      offset: '-07:00',
      region: 'America/Denver',
    },
    {
      id: 'PST',
      name: 'Pacific Time',
      offset: '-08:00',
      region: 'America/Los_Angeles',
    },
  ];

  const keyboardShortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      id: 'nav-profile',
      key: 'Ctrl + P',
      description: 'Go to Profile',
      category: 'Navigation',
      action: 'navigate',
    },
    {
      id: 'nav-settings',
      key: 'Ctrl + ,',
      description: 'Open Settings',
      category: 'Navigation',
      action: 'navigate',
    },
    {
      id: 'nav-dashboard',
      key: 'Ctrl + D',
      description: 'Go to Dashboard',
      category: 'Navigation',
      action: 'navigate',
    },

    // Actions
    {
      id: 'save',
      key: 'Ctrl + S',
      description: 'Save Changes',
      category: 'Actions',
      action: 'save',
    },
    {
      id: 'cancel',
      key: 'Escape',
      description: 'Cancel/Close',
      category: 'Actions',
      action: 'cancel',
    },
    {
      id: 'search',
      key: 'Ctrl + K',
      description: 'Search',
      category: 'Actions',
      action: 'search',
    },
    {
      id: 'refresh',
      key: 'F5',
      description: 'Refresh Page',
      category: 'Actions',
      action: 'refresh',
    },

    // Profile
    {
      id: 'edit-profile',
      key: 'Ctrl + E',
      description: 'Edit Profile',
      category: 'Profile',
      action: 'edit',
    },
    {
      id: 'upload-avatar',
      key: 'Ctrl + U',
      description: 'Upload Avatar',
      category: 'Profile',
      action: 'upload',
    },
    {
      id: 'change-password',
      key: 'Ctrl + Shift + P',
      description: 'Change Password',
      category: 'Profile',
      action: 'security',
    },

    // Accessibility
    {
      id: 'focus-search',
      key: '/',
      description: 'Focus Search',
      category: 'Accessibility',
      action: 'focus',
    },
    {
      id: 'toggle-shortcuts',
      key: '?',
      description: 'Show Shortcuts',
      category: 'Accessibility',
      action: 'help',
    },
  ];

  const updatePreference = (key: string, value: string | boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    toast.success('Preference updated');
  };

  const resetToDefaults = () => {
    setPreferences({
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      animations: true,
      soundEffects: true,
      keyboardShortcuts: true,
      reducedMotion: false,
      highContrast: false,
      fontSize: 'medium',
      autoSave: true,
      confirmActions: true,
    });
    toast.success('Preferences reset to defaults');
  };

  const getShortcutIcon = (key: string) => {
    if (key.includes('Ctrl') || key.includes('Cmd')) {
      return <Command className="h-3 w-3" />;
    }
    return <Keyboard className="h-3 w-3" />;
  };

  const groupedShortcuts = keyboardShortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme */}
            <div className="space-y-3">
              <Label>Theme</Label>
              <Select
                value={preferences.theme}
                onValueChange={(value) => updatePreference('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      <div className="flex items-center space-x-2">
                        {theme.icon}
                        <span>{theme.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <Label>Font Size</Label>
              <Select
                value={preferences.fontSize}
                onValueChange={(value) => updatePreference('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-3">
              <Label>Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => updatePreference('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.id} value={language.id}>
                      <div className="flex items-center space-x-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-3">
              <Label>Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(value) => updatePreference('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((timezone) => (
                    <SelectItem key={timezone.id} value={timezone.id}>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {timezone.name} ({timezone.offset})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-3">
              <Label>Date Format</Label>
              <Select
                value={preferences.dateFormat}
                onValueChange={(value) => updatePreference('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Format */}
            <div className="space-y-3">
              <Label>Time Format</Label>
              <Select
                value={preferences.timeFormat}
                onValueChange={(value) => updatePreference('timeFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Behavior</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="animations">Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable smooth transitions and animations
                  </p>
                </div>
                <Switch
                  id="animations"
                  checked={preferences.animations}
                  onCheckedChange={(checked) =>
                    updatePreference('animations', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sound-effects">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications and actions
                  </p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={preferences.soundEffects}
                  onCheckedChange={(checked) =>
                    updatePreference('soundEffects', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-save">Auto Save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes as you type
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) =>
                    updatePreference('autoSave', checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="confirm-actions">Confirm Actions</Label>
                  <p className="text-sm text-muted-foreground">
                    Show confirmation dialogs for destructive actions
                  </p>
                </div>
                <Switch
                  id="confirm-actions"
                  checked={preferences.confirmActions}
                  onCheckedChange={(checked) =>
                    updatePreference('confirmActions', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="keyboard-shortcuts">Keyboard Shortcuts</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable keyboard shortcuts for faster navigation
                  </p>
                </div>
                <Switch
                  id="keyboard-shortcuts"
                  checked={preferences.keyboardShortcuts}
                  onCheckedChange={(checked) =>
                    updatePreference('keyboardShortcuts', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="reduced-motion">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce animations for accessibility
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={preferences.reducedMotion}
                  onCheckedChange={(checked) =>
                    updatePreference('reducedMotion', checked)
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Accessibility</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="high-contrast">High Contrast Mode</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better readability
              </p>
            </div>
            <Switch
              id="high-contrast"
              checked={preferences.highContrast}
              onCheckedChange={(checked) =>
                updatePreference('highContrast', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Keyboard className="h-5 w-5" />
              <span>Keyboard Shortcuts</span>
            </CardTitle>
            <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Keyboard className="h-5 w-5" />
                    <span>Keyboard Shortcuts</span>
                  </DialogTitle>
                  <DialogDescription>
                    Use these shortcuts to navigate and interact with the
                    application faster.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {Object.entries(groupedShortcuts).map(
                    ([category, shortcuts]) => (
                      <div key={category} className="space-y-3">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {shortcuts.map((shortcut) => (
                            <div
                              key={shortcut.id}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">
                                  {shortcut.description}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="flex items-center space-x-1"
                              >
                                {getShortcutIcon(shortcut.key)}
                                <span className="text-xs font-mono">
                                  {shortcut.key}
                                </span>
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyboardShortcuts.slice(0, 6).map((shortcut) => (
              <div
                key={shortcut.id}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm">{shortcut.description}</span>
                <Badge
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  {getShortcutIcon(shortcut.key)}
                  <span className="text-xs font-mono">{shortcut.key}</span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <Zap className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Import Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
