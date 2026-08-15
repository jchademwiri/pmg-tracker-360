'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { DOCS_URL } from '@/lib/constants';
import Link from 'next/link';
import Logout from '../ui/logout';
import { LayoutDashboard, ArrowRight } from 'lucide-react';

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
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 rounded-md bg-muted/40 animate-pulse hidden sm:block" />
        <div className="h-8 w-24 rounded-md bg-primary/20 animate-pulse" />
      </div>
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
      <Button
        size="sm"
        asChild
        className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
      >
        <Link href="/sign-up">
          <span>Start For Free</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1 hidden sm:inline" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
