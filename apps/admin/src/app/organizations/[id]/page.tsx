import { getOrgDetail } from '../actions';
import OrgDetailClient from './OrgDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrgDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const data = await getOrgDetail(id);
    return (
      <div className="container mx-auto py-6 max-w-7xl font-sans">
        <OrgDetailClient data={data} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching org detail:', error);
    return notFound();
  }
}
