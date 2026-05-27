import { notFound, redirect } from 'next/navigation';
import { getOrganizationBySlug } from '@/server/organizations';
import { TransferOwnershipClient } from './client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

interface TransferOwnershipPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token: string;
  }>;
}

export default async function TransferOwnershipPage({
  params,
  searchParams,
}: TransferOwnershipPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) {
    return notFound();
  }

  // Manually check session to handle redirect with callbackUrl
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const callbackUrl = `/dashboard/organization/${slug}/settings/transfer-ownership?token=${token}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    return notFound();
  }

  return (
    <div className="container max-w-md mx-auto py-20">
      <TransferOwnershipClient
        slug={slug}
        organizationName={organization.name}
        token={token}
      />
    </div>
  );
}
