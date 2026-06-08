'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  organizations: 'Organizations',
  users: 'Users',
  sessions: 'Sessions',
  'support-tickets': 'Support Tickets',
  feedback: 'Feedback',
  setup: 'Setup',
  login: 'Login',
};

function formatSegment(segment: string) {
  return (
    SEGMENT_LABELS[segment] ||
    segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

export function AdminBreadcrumb() {
  const pathname = usePathname();

  const segments = useMemo(
    () => pathname.split('/').filter(Boolean),
    [pathname]
  );

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const label = formatSegment(segment);

        return (
          <div key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
