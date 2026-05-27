'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Calendar,
  Search,
  Shield,
  LogIn,
  LogOut,
  Key,
  Mail,
  Smartphone,
  Monitor,
  AlertTriangle,
  MapPin,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ActivityEvent {
  id: string;
  type:
    | 'login'
    | 'logout'
    | 'password_change'
    | 'email_verification'
    | 'session_revoke'
    | 'profile_update'
    | 'security_alert';
  timestamp: Date;
  description: string;
  device?: string;
  location?: string;
  ipAddress?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

interface ActivityTimelineProps {
  activities: ActivityEvent[];
  sessions?: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: Date;
    current: boolean;
  }>;
}

export function ActivityTimeline({
  activities,
  sessions = [],
}: ActivityTimelineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);

  // Combine activities with session data for a comprehensive timeline
  const timelineEvents = useMemo(() => {
    const sessionEvents: ActivityEvent[] = sessions.map((session) => ({
      id: `session-${session.id}`,
      type: 'login',
      timestamp: session.lastActive,
      description: `Active session on ${session.device}`,
      device: session.device,
      location: session.location,
      severity: session.current ? 'low' : 'medium',
      metadata: { current: session.current },
    }));

    const allEvents = [...activities, ...sessionEvents].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return allEvents.filter((event) => {
      const matchesSearch =
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.device?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || event.type === filterType;
      const matchesSeverity =
        filterSeverity === 'all' || event.severity === filterSeverity;

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [activities, sessions, searchTerm, filterType, filterSeverity]);

  const getEventIcon = (type: string, severity?: string) => {
    const iconClass =
      severity === 'critical' || severity === 'high'
        ? 'text-red-500'
        : severity === 'medium'
          ? 'text-yellow-500'
          : severity === 'low'
            ? 'text-green-500'
            : 'text-blue-500';

    switch (type) {
      case 'login':
        return <LogIn className={`h-4 w-4 ${iconClass}`} />;
      case 'logout':
        return <LogOut className={`h-4 w-4 ${iconClass}`} />;
      case 'password_change':
        return <Key className={`h-4 w-4 ${iconClass}`} />;
      case 'email_verification':
        return <Mail className={`h-4 w-4 ${iconClass}`} />;
      case 'session_revoke':
        return <Shield className={`h-4 w-4 ${iconClass}`} />;
      case 'profile_update':
        return <Activity className={`h-4 w-4 ${iconClass}`} />;
      case 'security_alert':
        return <AlertTriangle className={`h-4 w-4 ${iconClass}`} />;
      default:
        return <Activity className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const getDeviceIcon = (device?: string) => {
    if (!device) return <Monitor className="h-4 w-4" />;

    if (
      device.toLowerCase().includes('mobile') ||
      device.toLowerCase().includes('phone')
    ) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;

    const variants = {
      critical: 'destructive' as const,
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const,
    };

    return (
      <Badge
        variant={variants[severity as keyof typeof variants] || 'outline'}
        className="text-xs"
      >
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'login', label: 'Logins' },
    { value: 'logout', label: 'Logouts' },
    { value: 'password_change', label: 'Password Changes' },
    { value: 'email_verification', label: 'Email Verification' },
    { value: 'session_revoke', label: 'Session Management' },
    { value: 'profile_update', label: 'Profile Updates' },
    { value: 'security_alert', label: 'Security Alerts' },
  ];

  const severityLevels = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Activity Timeline</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-1"
              >
                {showDetails ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span>{showDetails ? 'Hide' : 'Show'} Details</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Activity Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map((severity) => (
                  <SelectItem key={severity.value} value={severity.value}>
                    {severity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {timelineEvents.length > 0 ? (
              timelineEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-start space-x-4 p-4 ${
                    index !== timelineEvents.length - 1
                      ? 'border-b border-border'
                      : ''
                  }`}
                >
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {getEventIcon(event.type, event.severity)}
                    </div>
                    {index !== timelineEvents.length - 1 && (
                      <div className="w-px h-8 bg-border mt-2" />
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium">
                            {event.description}
                          </p>
                          {getSeverityBadge(event.severity)}
                          {(event.metadata as { current?: boolean })
                            ?.current && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatTimestamp(event.timestamp)}</span>
                          </div>

                          {event.device && (
                            <div className="flex items-center space-x-1">
                              {getDeviceIcon(event.device)}
                              <span>{event.device}</span>
                            </div>
                          )}

                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Additional Details */}
                        {showDetails && (event.ipAddress || event.metadata) && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                            {event.ipAddress && (
                              <div>
                                <span className="font-medium">IP Address:</span>{' '}
                                {event.ipAddress}
                              </div>
                            )}
                            {event.metadata &&
                              Object.keys(event.metadata).length > 0 && (
                                <div>
                                  <span className="font-medium">Details:</span>{' '}
                                  {JSON.stringify(event.metadata, null, 2)}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  No activities found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  filterType !== 'all' ||
                  filterSeverity !== 'all'
                    ? 'Try adjusting your filters to see more activities.'
                    : 'Your activity timeline will appear here as you use the application.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {timelineEvents.filter((e) => e.type === 'login').length}
              </div>
              <div className="text-xs text-muted-foreground">Recent Logins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {
                  timelineEvents.filter(
                    (e) => e.severity === 'high' || e.severity === 'critical'
                  ).length
                }
              </div>
              <div className="text-xs text-muted-foreground">
                Security Events
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sessions.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Active Sessions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.floor(
                  (Date.now() -
                    (timelineEvents[0]?.timestamp.getTime() || Date.now())) /
                    (1000 * 60 * 60 * 24)
                )}
              </div>
              <div className="text-xs text-muted-foreground">Days Active</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
