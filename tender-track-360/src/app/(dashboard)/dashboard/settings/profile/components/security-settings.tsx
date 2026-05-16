'use client';

import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  Monitor,
  Smartphone,
  MapPin,
  Clock,
  LogOut,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  SessionInfo,
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
} from '../actions';

interface SecuritySettingsProps {
  initialSessions?: SessionInfo[];
}

export function SecuritySettings({
  initialSessions = [],
}: SecuritySettingsProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>(initialSessions);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState<string | null>(null);

  // Load sessions on component mount if not provided
  useEffect(() => {
    if (initialSessions.length === 0) {
      loadSessions();
    }
  }, [initialSessions.length]);

  const loadSessions = async () => {
    setIsRefreshing(true);
    startTransition(async () => {
      try {
        const result = await getUserSessions();
        if (result.success && result.data) {
          setSessions(result.data as SessionInfo[]);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Failed to load sessions');
        console.error('Load sessions error:', error);
      } finally {
        setIsRefreshing(false);
      }
    });
  };

  const handleRevokeSession = async (sessionId: string) => {
    startTransition(async () => {
      try {
        const result = await revokeSession(sessionId);
        if (result.success) {
          toast.success(result.message);
          // Remove the revoked session from the list
          setSessions((prev) =>
            prev.filter((session) => session.id !== sessionId)
          );
          setShowRevokeDialog(null);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Failed to revoke session');
        console.error('Revoke session error:', error);
      }
    });
  };

  const handleRevokeAllOtherSessions = async () => {
    startTransition(async () => {
      try {
        const result = await revokeAllOtherSessions();
        if (result.success) {
          toast.success(result.message);
          // Keep only the current session
          setSessions((prev) => prev.filter((session) => session.current));
          setShowRevokeAllDialog(false);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Failed to sign out other sessions');
        console.error('Revoke all sessions error:', error);
      }
    });
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const otherSessions = sessions.filter((session) => !session.current);
  const currentSession = sessions.find((session) => session.current);

  return (
    <section aria-labelledby="security-settings-heading">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle
              id="security-settings-heading"
              className="flex items-center space-x-2 text-base sm:text-lg"
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span>Security & Sessions</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSessions}
                disabled={isPending || isRefreshing}
                className="justify-center"
                aria-label={
                  isRefreshing
                    ? 'Refreshing sessions...'
                    : 'Refresh session list'
                }
              >
                {isRefreshing ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="ml-2 sm:inline">Refresh</span>
              </Button>
              {otherSessions.length > 0 && (
                <Dialog
                  open={showRevokeAllDialog}
                  onOpenChange={setShowRevokeAllDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      className="justify-center"
                      aria-label={`Sign out all other devices (${otherSessions.length} active sessions)`}
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span className="ml-2">Sign Out All Other Devices</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    role="alertdialog"
                    aria-describedby="revoke-all-description"
                  >
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <AlertTriangle
                          className="h-5 w-5 text-destructive"
                          aria-hidden="true"
                        />
                        <span>Sign Out All Other Devices?</span>
                      </DialogTitle>
                      <DialogDescription id="revoke-all-description">
                        This will sign you out of all other devices and
                        sessions. You will remain signed in on this device.
                        Other devices will need to sign in again.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setShowRevokeAllDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRevokeAllOtherSessions}
                        disabled={isPending}
                        variant="destructive"
                        aria-describedby="revoke-all-description"
                      >
                        {isPending ? (
                          <Loader2
                            className="h-4 w-4 animate-spin mr-2"
                            aria-hidden="true"
                          />
                        ) : (
                          <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                        )}
                        Sign Out All Other Devices
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Session */}
          {currentSession && (
            <div>
              <h3
                className="text-sm font-medium text-muted-foreground mb-3"
                id="current-session-heading"
              >
                Current Session
              </h3>
              <div
                className="border rounded-lg p-4 bg-muted/50"
                aria-labelledby="current-session-heading"
                role="region"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start space-x-3">
                    <div aria-hidden="true">
                      {getDeviceIcon(currentSession.device)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                        <p
                          className="text-sm font-medium break-words"
                          aria-label={`Current device: ${currentSession.device}`}
                        >
                          {currentSession.device}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-xs w-fit"
                          aria-label="This is your current session"
                        >
                          Current
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin
                            className="h-3 w-3 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span
                            className="break-words"
                            aria-label={`Location: ${currentSession.location}`}
                          >
                            {currentSession.location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock
                            className="h-3 w-3 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span
                            aria-label={`Last active: ${formatLastActive(currentSession.lastActive)}`}
                          >
                            {formatLastActive(currentSession.lastActive)}
                          </span>
                        </div>
                      </div>
                      {currentSession.ipAddress && (
                        <p
                          className="text-xs text-muted-foreground mt-1 break-all"
                          aria-label={`IP address: ${currentSession.ipAddress}`}
                        >
                          IP: {currentSession.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Sessions */}
          {otherSessions.length > 0 ? (
            <div>
              <h3
                className="text-sm font-medium text-muted-foreground mb-3"
                id="other-sessions-heading"
              >
                Other Sessions ({otherSessions.length})
              </h3>
              <div
                className="space-y-3"
                aria-labelledby="other-sessions-heading"
                role="region"
              >
                {otherSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4"
                    aria-label={`Session ${index + 1} of ${otherSessions.length}: ${session.device}`}
                  >
                    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div aria-hidden="true">
                          {getDeviceIcon(session.device)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium break-words"
                            aria-label={`Device: ${session.device}`}
                          >
                            {session.device}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin
                                className="h-3 w-3 flex-shrink-0"
                                aria-hidden="true"
                              />
                              <span
                                className="break-words"
                                aria-label={`Location: ${session.location}`}
                              >
                                {session.location}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock
                                className="h-3 w-3 flex-shrink-0"
                                aria-hidden="true"
                              />
                              <span
                                aria-label={`Last active: ${formatLastActive(session.lastActive)}`}
                              >
                                {formatLastActive(session.lastActive)}
                              </span>
                            </div>
                          </div>
                          {session.ipAddress && (
                            <p
                              className="text-xs text-muted-foreground mt-1 break-all"
                              aria-label={`IP address: ${session.ipAddress}`}
                            >
                              IP: {session.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      <Dialog
                        open={showRevokeDialog === session.id}
                        onOpenChange={(open) =>
                          setShowRevokeDialog(open ? session.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            className="w-full sm:w-auto justify-center"
                            aria-label={`Sign out session on ${session.device}`}
                          >
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                            <span className="ml-2">Sign Out</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent
                          role="alertdialog"
                          aria-describedby="revoke-session-description"
                        >
                          <DialogHeader>
                            <DialogTitle>Sign Out Device?</DialogTitle>
                            <DialogDescription id="revoke-session-description">
                              This will sign out the session on {session.device}
                              . The device will need to sign in again to access
                              your account.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              disabled={isPending}
                              onClick={() => setShowRevokeDialog(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={isPending}
                              variant="destructive"
                              aria-describedby="revoke-session-description"
                            >
                              {isPending ? (
                                <Loader2
                                  className="h-4 w-4 animate-spin mr-2"
                                  aria-hidden="true"
                                />
                              ) : (
                                <LogOut
                                  className="h-4 w-4 mr-2"
                                  aria-hidden="true"
                                />
                              )}
                              Sign Out
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3
                className="text-sm font-medium text-muted-foreground mb-3"
                id="no-other-sessions-heading"
              >
                Other Sessions
              </h3>
              <div
                className="text-center py-8 text-muted-foreground"
                aria-labelledby="no-other-sessions-heading"
                role="status"
              >
                <Shield
                  className="h-8 w-8 mx-auto mb-2 opacity-50"
                  aria-hidden="true"
                />
                <p className="text-sm">No other active sessions</p>
                <p className="text-xs mt-1">
                  You are only signed in on this device
                </p>
              </div>
            </div>
          )}

          {/* Security Information */}
          <div className="border-t pt-4">
            <h3
              className="text-sm font-medium text-muted-foreground mb-2"
              id="security-info-heading"
            >
              Security Information
            </h3>
            <div
              className="text-xs text-muted-foreground space-y-1"
              aria-labelledby="security-info-heading"
              role="list"
            >
              <p role="listitem">
                • Sessions automatically expire after a period of inactivity
              </p>
              <p role="listitem">
                • You can sign out of individual sessions or all other sessions
                at once
              </p>
              <p role="listitem">
                • If you notice any suspicious activity, change your password
                immediately
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
