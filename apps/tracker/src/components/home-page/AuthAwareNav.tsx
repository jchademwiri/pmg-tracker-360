'use client';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import Logout from '../ui/logout';
import { LayoutDashboard, ArrowRight } from 'lucide-react';

export default function AuthAwareNav() {
  const { data: session, isPending } = authClient.useSession();

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Button size="sm" asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs cursor-pointer">
          <Link href="/dashboard">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
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
    <div className="flex items-center gap-2.5 sm:gap-3">
      <Button variant="ghost" asChild size="sm" className="text-muted-foreground hover:text-foreground font-medium">
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
