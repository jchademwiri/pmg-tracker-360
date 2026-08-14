'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumb } from '@/lib/breadcrumb-context';

const SEGMENT_LABELS: Record<string, string> = {
  reports: 'Reports & Analytics',
  organizations: 'Organizations',
  users: 'Users',
  sessions: 'Sessions',
  'support-tickets': 'Support Tickets',
  feedback: 'Feedback',
  setup: 'Setup',
  login: 'Login',
};

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const { labels } = useBreadcrumb();

  const segments = useMemo(
    () => pathname.split('/').filter(Boolean),
    [pathname]
  );

  if (segments.length === 0) return null;

  function formatSegment(segment: string) {
    if (labels[segment]) return labels[segment];
    if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
    // If it looks like a database ID (nanoid / uuid > 15 chars)
    if (segment.length > 15) return 'Detail View';

    return segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

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
              <span className="font-medium text-foreground truncate max-w-[240px]" title={label}>
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[240px]"
                title={label}
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
