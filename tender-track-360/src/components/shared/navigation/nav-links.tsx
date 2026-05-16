'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function NavLinks() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const pathname = usePathname();

  // Extract current org slug from URL if available
  const currentOrgSlug = pathname.match(/\/organization\/([^\/]+)/)?.[1];

  // Use current org slug or active org slug as fallback
  const orgSlug = currentOrgSlug || activeOrganization?.slug;

  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard/organization" className="text-sm hover:underline">
        Organization
      </Link>
      {orgSlug && (
        <Link href="/dashboard" className="text-sm hover:underline">
          Dashboard
        </Link>
      )}
      <Link
        href="/dashboard/settings/profile"
        className="text-sm hover:underline"
      >
        Profile
      </Link>
    </div>
  );
}
