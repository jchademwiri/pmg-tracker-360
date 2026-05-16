'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
  const router = useRouter();
  // If user doesn't exist and isn't logged in, default to showing signup
  const [showSignUp, setShowSignUp] = useState(!userExists && !currentUserEmail);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptNow = () => {
    window.location.href = `/api/accept-invitation/${invitationId}`;
  };

  const currentPath = `/invite/accept/${invitationId}`;
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;

  // If logged in
  if (currentUserEmail) {
    const isCorrectUser = currentUserEmail === inviteEmail;
    return (
      <div className="space-y-4 rounded-md border p-6 bg-card">
        <div className="flex flex-col gap-2">
          <p>
            Logged in as: <strong>{currentUserEmail}</strong>
          </p>
          {!isCorrectUser && (
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded text-sm border border-yellow-200">
              Warning: This invitation was sent to <strong>{inviteEmail}</strong>.
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={acceptNow}
            className="rounded bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Accept Invitation
          </button>
          <button
             onClick={async () => {
               await fetch('/api/auth/sign-out', { method: 'POST' });
               window.location.reload();
             }}
             className="rounded border px-4 py-2 hover:bg-muted transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // If user exists but not logged in
  if (userExists) {
    return (
      <div className="space-y-4 rounded-md border p-6 bg-card">
        <p>
          Invitation sent to: <strong>{inviteEmail}</strong>
        </p>
        <div className="p-4 bg-blue-50 text-blue-800 rounded border border-blue-200">
          <p className="font-medium">You already have an account.</p>
          <p className="text-sm mt-1">Please sign in to accept this invitation.</p>
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

  // If user does NOT exist (New User Flow)
  return (
    <div className="space-y-4 rounded-md border p-6 bg-card">
      <p>
        Invitation sent to: <strong>{inviteEmail}</strong>
      </p>
      
      {!showSignUp ? (
        <div className="flex gap-3">
           <button
            onClick={() => setShowSignUp(true)}
            className="rounded bg-primary px-4 py-2 text-primary-foreground"
          >
            Create Account & Accept
          </button>
          <Link href={loginHref} className="rounded border px-4 py-2 hover:bg-muted">
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
                placeholder="John Doe"
                className="border rounded p-2 w-full"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                className="border rounded p-2 w-full"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
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
                  } catch (e) {
                    setError('Network error');
                    toast.error('Network error occurred');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="rounded bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create & Accept'}
              </button>
              <Link href={loginHref} className="flex items-center justify-center rounded border px-4 py-2 hover:bg-muted">
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
