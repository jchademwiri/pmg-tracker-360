'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Monitor,
  Smartphone,
  MapPin,
  Eye,
  EyeOff,
  Lock,
  Key,
  Activity,
} from 'lucide-react';
import { useState } from 'react';

interface SecurityDashboardProps {
  emailVerified: boolean;
  sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: Date;
    current: boolean;
  }>;
  lastPasswordChange?: Date;
  twoFactorEnabled?: boolean;
}

interface SecurityMetric {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

export function SecurityDashboard({
  emailVerified,
  sessions,
  lastPasswordChange,
  twoFactorEnabled = false,
}: SecurityDashboardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate security score
  const calculateSecurityScore = (): number => {
    let score = 0;

    // Email verification (20 points)
    if (emailVerified) score += 20;

    // Two-factor authentication (30 points)
    if (twoFactorEnabled) score += 30;

    // Password strength (25 points) - assuming strong if recent change
    if (lastPasswordChange) {
      const daysSinceChange = Math.floor(
        (Date.now() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceChange < 90) score += 25;
      else if (daysSinceChange < 180) score += 15;
      else score += 5;
    }

    // Session management (15 points)
    if (sessions.length <= 3) score += 15;
    else if (sessions.length <= 5) score += 10;
    else score += 5;

    // Recent activity (10 points)
    const recentSessions = sessions.filter((session) => {
      const hoursSinceActive =
        (Date.now() - session.lastActive.getTime()) / (1000 * 60 * 60);
      return hoursSinceActive < 24;
    });
    if (recentSessions.length > 0) score += 10;

    return Math.min(score, 100);
  };

  const securityScore = calculateSecurityScore();

  const getSecurityLevel = (
    score: number
  ): { level: string; color: string; description: string } => {
    if (score >= 80)
      return {
        level: 'Excellent',
        color: 'text-green-600',
        description: 'Your account is well secured',
      };
    if (score >= 60)
      return {
        level: 'Good',
        color: 'text-blue-600',
        description: 'Your security is decent',
      };
    if (score >= 40)
      return {
        level: 'Fair',
        color: 'text-yellow-600',
        description: 'Consider improving your security',
      };
    return {
      level: 'Poor',
      color: 'text-red-600',
      description: 'Your account needs better security',
    };
  };

  const securityLevel = getSecurityLevel(securityScore);

  const securityMetrics: SecurityMetric[] = [
    {
      label: 'Email Verification',
      value: emailVerified ? 1 : 0,
      max: 1,
      color: emailVerified ? 'text-green-600' : 'text-red-600',
      icon: emailVerified ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      ),
      description: emailVerified ? 'Email verified' : 'Email not verified',
    },
    {
      label: 'Two-Factor Authentication',
      value: twoFactorEnabled ? 1 : 0,
      max: 1,
      color: twoFactorEnabled ? 'text-green-600' : 'text-red-600',
      icon: twoFactorEnabled ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Lock className="h-4 w-4" />
      ),
      description: twoFactorEnabled ? '2FA enabled' : '2FA not enabled',
    },
    {
      label: 'Password Strength',
      value: lastPasswordChange ? 1 : 0,
      max: 1,
      color: lastPasswordChange ? 'text-green-600' : 'text-yellow-600',
      icon: <Key className="h-4 w-4" />,
      description: lastPasswordChange
        ? 'Recent password change'
        : 'Password may need updating',
    },
    {
      label: 'Active Sessions',
      value: sessions.length,
      max: 5,
      color:
        sessions.length <= 3
          ? 'text-green-600'
          : sessions.length <= 5
            ? 'text-yellow-600'
            : 'text-red-600',
      icon: <Activity className="h-4 w-4" />,
      description: `${sessions.length} active sessions`,
    },
  ];

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Overview</span>
            </CardTitle>
            <Badge
              variant={
                securityScore >= 80
                  ? 'default'
                  : securityScore >= 60
                    ? 'secondary'
                    : 'destructive'
              }
              className={securityLevel.color}
            >
              {securityScore}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Security Score</span>
              <span className={`text-sm font-medium ${securityLevel.color}`}>
                {securityLevel.level}
              </span>
            </div>
            <Progress value={securityScore} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {securityLevel.description}
            </p>
          </div>

          {/* Security Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {securityMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={metric.color}>{metric.icon}</div>
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={(metric.value / metric.max) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <Button
              variant="ghost"
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
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions
              .slice(0, showDetails ? sessions.length : 3)
              .map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-full">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{session.device}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{session.location}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatLastActive(session.lastActive)}</span>
                      </div>
                    </div>
                  </div>
                  {session.current && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              ))}

            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span>Security Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!emailVerified && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Verify your email address
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Email verification helps secure your account and enables
                    password recovery.
                  </p>
                </div>
              </div>
            )}

            {!twoFactorEnabled && (
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Enable two-factor authentication
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Add an extra layer of security to your account with 2FA.
                  </p>
                </div>
              </div>
            )}

            {sessions.length > 5 && (
              <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Monitor className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Review active sessions
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    You have many active sessions. Consider signing out of
                    unused devices.
                  </p>
                </div>
              </div>
            )}

            {securityScore >= 80 && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Great security practices!
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Your account is well secured. Keep up the good work!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
