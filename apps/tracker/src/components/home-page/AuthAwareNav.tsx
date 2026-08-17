"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { DOCS_URL } from "@/lib/constants";
import Link from "next/link";
import Logout from "../ui/logout";
import { ArrowRight } from "lucide-react";

export default function AuthAwareNav() {
  const [mounted, setMounted] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // When mounted and user is logged in, show dashboard & logout
  if (mounted && session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={DOCS_URL} target="_blank" rel="noopener noreferrer">
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

  // Consistent SSR and initial client hydration render
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
          <ArrowRight
            className="h-3.5 w-3.5 ml-1 hidden sm:inline"
            aria-hidden="true"
          />
        </Link>
      </Button>
    </div>
  );
}
