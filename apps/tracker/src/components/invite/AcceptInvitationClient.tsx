'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { signOut } from '@/lib/auth-client';

export default function AcceptInvitationClient({
  invitationId,
  inviteEmail,
  userExists,
  currentUserEmail,
}: {
  invitationId: string;
  inviteEmail: string;
  userExists: boolean;
  currentUserEmail?: string | null;
}) {
  const [showSignUp, setShowSignUp] = useState(!userExists && !currentUserEmail);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPath = `/invite/accept/${invitationId}`;
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;

  // Full page navigation — fetch() drops Set-Cookie headers on redirects,
  // which breaks the nextCookies() session write in the route handler.
  const acceptNow = () => {
    setIsAccepting(true);
    window.location.href = `/api/accept-invitation/${invitationId}`;
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // After sign-out, reload the invite page so the user can log in as the correct account
      window.location.href = currentPath;
    } catch {
      toast.error('Sign out failed. Please try again.');
      setIsSigningOut(false);
    }
  };

  /* ── Case 1: Logged in ─────────────────────────────────────────────── */
  if (currentUserEmail) {
    const isCorrectUser =
      currentUserEmail.toLowerCase() === inviteEmail.toLowerCase();

    return (
      <div className="space-y-4 rounded-md border p-6 bg-card">
        <div className="flex flex-col gap-2">
          <p>
            Logged in as: <strong>{currentUserEmail}</strong>
          </p>
          {!isCorrectUser && (
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded text-sm border border-yellow-200">
              This invitation was sent to <strong>{inviteEmail}</strong>. Sign
              out and log in as that account to accept it.
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 flex-wrap">
          {isCorrectUser && (
            <button
              onClick={acceptNow}
              disabled={isAccepting}
              className="rounded bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAccepting ? 'Accepting…' : 'Accept Invitation'}
            </button>
          )}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded border px-4 py-2 hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    );
  }

  /* ── Case 2: Account exists, not logged in ─────────────────────────── */
  if (userExists) {
    return (
      <div className="space-y-4 rounded-md border p-6 bg-card">
        <p>
          Invitation sent to: <strong>{inviteEmail}</strong>
        </p>
        <div className="p-4 bg-blue-50 text-blue-800 rounded border border-blue-200">
          <p className="font-medium">You already have an account.</p>
          <p className="text-sm mt-1">
            Please sign in to accept this invitation.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href={loginHref}
            className="inline-block rounded bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Sign in to Accept
          </Link>
        </div>
      </div>
    );
  }

  /* ── Case 3: New user — no account yet ─────────────────────────────── */
  return (
    <div className="space-y-4 rounded-md border p-6 bg-card">
      <p>
        Invitation sent to: <strong>{inviteEmail}</strong>
      </p>

      {!showSignUp ? (
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowSignUp(true)}
            className="rounded bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Create Account &amp; Accept
          </button>
          <Link
            href={loginHref}
            className="rounded border px-4 py-2 hover:bg-muted transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-4">Create your account</h3>
          <div className="grid gap-4 max-w-md">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="border rounded p-2 w-full bg-background"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                className="border rounded p-2 w-full bg-background"
              />
            </div>

            <div className="flex gap-3 pt-2 flex-wrap">
              <button
                onClick={async () => {
                  if (!name || !password) {
                    setError('Name and password are required');
                    return;
                  }
                  setIsSubmitting(true);
                  setError(null);
                  try {
                    const resp = await fetch('/api/invite/complete-signup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        invitationId,
                        name,
                        email: inviteEmail,
                        password,
                      }),
                    });
                    const data = await resp.json();
                    if (data?.success) {
                      toast.success('Account created and invitation accepted!');
                      window.location.href = data.redirectUrl || '/dashboard';
                    } else {
                      setError(data?.message || 'Failed to create account');
                      toast.error(data?.message || 'Failed to create account');
                    }
                  } catch {
                    setError('Network error');
                    toast.error('Network error occurred');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="rounded bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account…' : 'Create & Accept'}
              </button>
              <Link
                href={loginHref}
                className="flex items-center justify-center rounded border px-4 py-2 hover:bg-muted transition-colors"
              >
                I already have an account
              </Link>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
