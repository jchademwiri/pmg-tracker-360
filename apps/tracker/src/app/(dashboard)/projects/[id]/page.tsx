import { getCurrentUser } from '@/server';
import { getProjectById } from '@/server/projects';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit, FileText, Building, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { session } = await getCurrentUser();
  const { id } = await params;

  if (!session.activeOrganizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Organization Selected
          </h2>
          <p className="text-gray-600">
            Please select an organization to view projects.
          </p>
        </div>
      </div>
    );
  }

  const result = await getProjectById(session.activeOrganizationId, id);

  if (!result.success || !result.project) {
    notFound();
  }

  const project = result.project;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/projects">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-xl text-foreground/80 font-bold">
            {project.projectNumber.toUpperCase()}
          </h1>

          <Link href={`/dashboard/projects/${id}/edit`}>
            <Button variant="outline" className="cursor-pointer">
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Information */}
        <div className="xl:col-span-3 space-y-6">
          {/* Basic Information */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Project Number
                  </label>
                  <p className="text-lg font-medium text-blue-600">
                    {project.projectNumber.toUpperCase()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={
                        statusColors[project.status as keyof typeof statusColors]
                      }
                    >
                      {statusLabels[project.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </div>
              </div>

              {project.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="text-foreground whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              )}

              {!project.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="text-muted-foreground italic">
                    No description added
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Information */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Building className="h-5 w-5 mr-2 text-green-600" />
                Related Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.client && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Client
                    </label>
                    <p className="text-lg font-medium">
                      {project.client.name}
                    </p>
                    {project.client.contactName && (
                      <p className="text-sm text-muted-foreground">
                        Contact: {project.client.contactName}
                      </p>
                    )}
                  </div>
                )}

                {!project.client && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Client
                    </label>
                    <p className="text-muted-foreground italic">
                      No client assigned
                    </p>
                  </div>
                )}

                {project.tender && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-muted-foreground">
                      Related Tender
                    </label>
                    <p className="text-lg font-medium text-blue-600">
                      {project.tender.tenderNumber.toUpperCase()}
                    </p>
                    {project.tender.description && (
                      <p className="text-sm text-muted-foreground">
                        {project.tender.description}
                      </p>
                    )}
                  </div>
                )}

                {!project.tender && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-muted-foreground">
                      Related Tender
                    </label>
                    <p className="text-muted-foreground italic">
                      No tender linked
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/projects/${id}/edit`}>
                <Button
                  variant="outline"
                  className="w-full justify-start cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <p className="text-sm">{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="text-sm">{formatDate(project.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}