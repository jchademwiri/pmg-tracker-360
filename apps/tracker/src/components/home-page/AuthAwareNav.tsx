'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { DOCS_URL } from '@/lib/constants';
import Link from 'next/link';
import Logout from '../ui/logout';

export default function AuthAwareNav() {
  const { data: session, isPending } = authClient.useSession();

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </Link>
        </Button>
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
        <Link href={DOCS_URL} target="_blank" rel="noopener noreferrer">
          Docs
        </Link>
      </Button>
      <Button variant="ghost" asChild size="sm">
        <Link href="/login">Sign In</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/sign-up">Sign Up</Link>
      </Button>
    </div>
  );
}
