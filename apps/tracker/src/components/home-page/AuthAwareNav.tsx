'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import Logout from '../ui/logout';

export default function AuthAwareNav() {
  const { data: session, isPending } = authClient.useSession();

  <div className="flex items-center gap-3">
    <Button variant="ghost" asChild size="sm">
      <Link href="/login">Sign In</Link>
    </Button>
    <Button size="sm" asChild>
      <Link href="/sign-up">Sign Up</Link>
    </Button>
  </div>;

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Logout />
      </div>
    );
  }

  if (isPending) {
    return (
      <>
        <div className="hidden md:flex gap-2">
          <Button variant="ghost" size="sm" disabled>
            Sign In
          </Button>
          <Button size="sm" disabled>
            Sign Up
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" asChild size="sm">
        <Link href="/login">Sign In</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/sign-up">Sign Up</Link>
      </Button>
    </div>
  );
}
