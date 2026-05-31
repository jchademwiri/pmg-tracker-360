'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAccessibilityAnnouncer } from '@/components/accessibility-announcer';

interface EmailSettingsProps {
  email: string;
  emailVerified: boolean;
  onResendVerification?: () => Promise<void>;
}

export function EmailSettings({
  email,
  emailVerified: initialEmailVerified,
  onResendVerification,
}: EmailSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [isResending, setIsResending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [emailVerified, setEmailVerified] = useState(initialEmailVerified);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const router = useRouter();
  const { announce, AnnouncerComponent } = useAccessibilityAnnouncer();

  // Polling for verification status changes
  const checkVerificationStatus = useCallback(async () => {
    if (emailVerified) return; // Don't poll if already verified

    try {
      setIsRefreshing(true);
      // Refresh the page data to get updated verification status
      router.refresh();

      // Removed artificial wait; rely on router.refresh() and parent re-render
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [emailVerified, router]);

  // Auto-refresh verification status every 30 seconds if unverified and recently sent email
  useEffect(() => {
    if (emailVerified || !lastResendTime) return;

    const interval = setInterval(() => {
      const timeSinceResend = Date.now() - lastResendTime;
      // Stop polling after 10 minutes
      if (timeSinceResend > 10 * 60 * 1000) {
        return;
      }
      checkVerificationStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [emailVerified, lastResendTime, checkVerificationStatus]);

  // Update local state when prop changes
  useEffect(() => {
    if (initialEmailVerified !== emailVerified) {
      setEmailVerified(initialEmailVerified);
      if (initialEmailVerified) {
        const successMessage = 'Email verified successfully!';
        toast.success(successMessage);
        announce(successMessage, 'assertive');
      }
    }
  }, [initialEmailVerified, emailVerified, announce]);

  const handleResendVerification = () => {
    if (!onResendVerification) return;

    setIsResending(true);
    startTransition(async () => {
      try {
        await onResendVerification();
        setLastResendTime(Date.now());
        const successMessage =
          'Verification email sent successfully! Check your inbox.';
        toast.success(successMessage);
        announce(successMessage, 'polite');
      } catch (error) {
        console.error('Failed to send verification email:', error);
        toast.error('Failed to send verification email. Please try again.');
      } finally {
        setIsResending(false);
      }
    });
  };

  const handleRefreshStatus = () => {
    checkVerificationStatus();
  };

  const getVerificationIcon = () => {
    if (emailVerified) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getVerificationBadge = () => {
    if (emailVerified) {
      return (
        <Badge
          variant="secondary"
          className="bg-green-50 text-green-700 border-green-200"
          aria-label="Email verified"
        >
          <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge
        variant="destructive"
        className="bg-red-50 text-red-700 border-red-200"
        aria-label="Email not verified"
      >
        <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
        Unverified
      </Badge>
    );
  };

  return (
    <section aria-labelledby="email-settings-heading">
      <Card>
        <CardHeader>
          <CardTitle
            id="email-settings-heading"
            className="flex items-center space-x-2 text-base sm:text-lg"
          >
            <Mail className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span>Email Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="current-email"
              >
                Email Address
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="flex items-center space-x-2">
                    {getVerificationIcon()}
                    <span
                      id="current-email"
                      className="font-medium text-sm sm:text-base break-all"
                    >
                      {email}
                    </span>
                  </div>
                  {getVerificationBadge()}
                </div>
              </div>
            </div>

            {!emailVerified && (
              <div
                className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                role="alert"
                aria-labelledby="verification-required"
              >
                <div className="flex items-start space-x-3">
                  <Clock
                    className="h-5 w-5 text-amber-600 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <h4
                      id="verification-required"
                      className="text-sm font-medium text-amber-800"
                    >
                      Email Verification Required
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Please verify your email address to ensure you receive
                      important notifications and can recover your account if
                      needed.
                    </p>
                    <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={
                          isPending || isResending || !onResendVerification
                        }
                        className="border-amber-300 text-amber-700 hover:bg-amber-100 justify-center"
                      >
                        {isResending ? (
                          <>
                            <Clock
                              className="h-4 w-4 mr-2 animate-spin"
                              aria-hidden="true"
                            />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                            Resend Verification Email
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshStatus}
                        disabled={isRefreshing}
                        className="text-amber-700 hover:bg-amber-100 justify-center"
                      >
                        {isRefreshing ? (
                          <>
                            <RefreshCw
                              className="h-4 w-4 mr-2 animate-spin"
                              aria-hidden="true"
                            />
                            Checking...
                          </>
                        ) : (
                          <>
                            <RefreshCw
                              className="h-4 w-4 mr-2"
                              aria-hidden="true"
                            />
                            Check Status
                          </>
                        )}
                      </Button>
                    </div>
                    {lastResendTime && (
                      <p className="text-xs text-amber-600 mt-2">
                        Verification email sent. If you don&#x27;t see it, check
                        your spam folder. Status will refresh automatically.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {emailVerified && (
              <div
                className="bg-green-50 border border-green-200 rounded-lg p-4"
                role="status"
                aria-labelledby="email-verified"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle
                    className="h-5 w-5 text-green-600"
                    aria-hidden="true"
                  />
                  <div>
                    <h4
                      id="email-verified"
                      className="text-sm font-medium text-green-800"
                    >
                      Email Verified
                    </h4>
                    <p className="text-sm text-green-700">
                      Your email address has been verified and is ready to
                      receive notifications.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <AnnouncerComponent />
      </Card>
    </section>
  );
}
