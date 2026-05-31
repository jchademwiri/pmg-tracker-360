'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Bell, Settings, Eye } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  description?: string;
  component: React.ReactNode;
}

interface ProfileTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
}

export function ProfileTabs({ tabs, defaultTab }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <Badge
                  variant={
                    typeof tab.badge === 'number' && tab.badge > 0
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="ml-1 text-xs"
                >
                  {tab.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Description */}
      {activeTabData?.description && (
        <div className="text-sm text-muted-foreground">
          {activeTabData.description}
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6">{activeTabData?.component}</div>
    </div>
  );
}

// Tab configuration helper
export const createProfileTabs = (
  components: {
    personal: React.ReactNode;
    security: React.ReactNode;
  },
  metrics?: {
    securityScore?: number;
    unreadNotifications?: number;
    pendingVerifications?: number;
  }
): TabItem[] => [
  {
    id: 'personal',
    label: 'Personal',
    icon: <User className="h-4 w-4" />,
    description: 'Manage your personal information and profile settings',
    component: components.personal,
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="h-4 w-4" />,
    badge:
      metrics?.securityScore && metrics.securityScore < 60 ? '!' : undefined,
    description: 'Security settings, sessions, and authentication methods',
    component: components.security,
  },
];
