import { getCurrentUser } from '@/server';
import { getProjectWorkspaceData } from '@/server/projects';
import { getDocuments } from '@/server/documents';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProjectWorkspace } from '@/components/projects/project-workspace';

export const dynamic = 'force-dynamic';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { session, user } = await getCurrentUser();
  const { id } = await params;

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-zinc-400">
            Please select an organization to view projects.
          </p>
        </div>
      </div>
    );
  }

  // 1. Fetch project workspace data
  const result = await getProjectWorkspaceData(session.activeOrganizationId, id);

  if (!result.success || !result.project) {
    notFound();
  }

  // 2. Fetch project documents (with signed URLs)
  const docsResult = await getDocuments(session.activeOrganizationId, 'project', id);
  const documents = docsResult.success ? docsResult.documents : [];

  const project = result.project;

  return (
    <div className="w-full space-y-6">
      {/* Back navigation */}
      <div className="flex items-center">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="cursor-pointer hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      {/* Render Workspace Dashboard */}
      <ProjectWorkspace
        project={project as any}
        purchaseOrders={(project as any).purchaseOrders || []}
        documents={documents as any}
        activities={(project as any).activities || []}
        risks={(project as any).risks || []}
        organizationId={session.activeOrganizationId}
        userId={user.id}
      />
    </div>
  );
}