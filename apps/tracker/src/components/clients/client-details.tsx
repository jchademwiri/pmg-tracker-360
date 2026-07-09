'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  MoreHorizontal,
  ClipboardList,
  FolderKanban,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteClient } from '@/server';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Client } from '@pmg/db/schema';
import Link from 'next/link';
import { formatDate, formatDateTime } from '@/lib/format';

interface ClientDetailsProps {
  client: Client;
  organizationId: string;
  relatedTenders?: Array<{
    id: string;
    tenderNumber: string;
    description: string | null;
    status: string;
    submissionDate: Date | null;
    value: string | null;
    createdAt: Date;
  }>;
  relatedProjects?: Array<{
    id: string;
    projectNumber: string;
    description: string | null;
    status: string;
    contractStartDate: Date | null;
    contractEndDate: Date | null;
    awardValue: string | null;
    createdAt: Date;
  }>;
  purchaseOrderCount?: number;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  awarded: 'secondary',
  evaluation: 'outline',
  lost: 'destructive',
  closed: 'outline',
  cancelled: 'destructive',
  active: 'default',
  completed: 'secondary',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  new: 'New',
  review: 'Review',
  approved_to_prepare: 'Approved to Prepare',
  preparation: 'Preparation',
  ready: 'Ready',
  submitted: 'Submitted',
  evaluation: 'Evaluation',
  awarded: 'Awarded',
  lost: 'Lost',
  closed: 'Closed',
  cancelled: 'Cancelled',
  active: 'Active',
  completed: 'Completed',
};

export function ClientDetails({
  client,
  organizationId,
  relatedTenders = [],
  relatedProjects = [],
  purchaseOrderCount = 0,
}: ClientDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEdit = () => {
    router.push(`/clients/${client.id}/edit`);
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const confirmDelete = async () => {
    startTransition(async () => {
      const result = await deleteClient(organizationId, client.id);
      if (result.success) {
        toast.success('Client deleted successfully');
        router.push('/clients');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete client');
      }
      setShowDeleteDialog(false);
    });
  };

  const handleBack = () => {
    router.push('/clients');
  };

  const hasContactInfo =
    client.contactName || client.contactEmail || client.contactPhone;

  const totalRelatedRecords =
    relatedTenders.length + relatedProjects.length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          <h1 className="text-xl font-bold">{client.name}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 cursor-pointer"
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Information */}
        <div className="xl:col-span-3 space-y-6">
          {/* Basic Information */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Client Name
                </label>
                <p className="text-lg font-medium">{client.name}</p>
              </div>

              {client.notes ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </label>
                  <p className="text-foreground whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </label>
                  <p className="text-muted-foreground italic">No notes added</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Mail className="h-5 w-5 mr-2 text-green-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasContactInfo ? (
                <div className="space-y-4">
                  {client.contactName && (
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Contact Person
                        </label>
                        <p className="text-foreground">{client.contactName}</p>
                      </div>
                    </div>
                  )}

                  {client.contactEmail && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email Address
                        </label>
                        <p className="text-foreground">
                          <Link
                            href={`mailto:${client.contactEmail}`}
                            className="text-primary hover:text-primary/80 hover:underline"
                          >
                            {client.contactEmail}
                          </Link>
                        </p>
                      </div>
                    </div>
                  )}

                  {client.contactPhone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Phone Number
                        </label>
                        <p className="text-foreground">
                          <Link
                            href={`tel:${client.contactPhone}`}
                            className="text-primary hover:text-primary/80 hover:underline"
                          >
                            {client.contactPhone}
                          </Link>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Contact Information
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    No contact person or contact details have been added for
                    this client.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Add Contact Info
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Records - Tenders */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <ClipboardList className="h-5 w-5 mr-2 text-purple-600" />
                Tenders ({relatedTenders.length})
              </CardTitle>
              <Link href={`/tenders/create?clientId=${client.id}`}>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-1" />
                  New Tender
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {relatedTenders.length > 0 ? (
                <div className="space-y-3">
                  {relatedTenders.map((tender) => (
                    <Link
                      key={tender.id}
                      href={`/tenders/${tender.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {tender.tenderNumber.toUpperCase()}
                            </span>
                            <Badge
                              variant={
                                statusVariant[tender.status] || 'secondary'
                              }
                              className="text-xs"
                            >
                              {statusLabels[tender.status] || tender.status}
                            </Badge>
                          </div>
                          {tender.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {tender.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {tender.value && (
                              <span>
                                Value: R{' '}
                                {Number(tender.value).toLocaleString()}
                              </span>
                            )}
                            {tender.submissionDate && (
                              <span>
                                Submission:{' '}
                                {formatDate(tender.submissionDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Tenders Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    No tenders have been created for this client yet.
                  </p>
                  <Link href={`/tenders/create?clientId=${client.id}`}>
                    <Button variant="outline" className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Tender
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Records - Projects */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <FolderKanban className="h-5 w-5 mr-2 text-indigo-600" />
                Projects ({relatedProjects.length})
              </CardTitle>
              {relatedProjects.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {purchaseOrderCount} Purchase Order{purchaseOrderCount !== 1 ? 's' : ''}
                </span>
              )}
            </CardHeader>
            <CardContent>
              {relatedProjects.length > 0 ? (
                <div className="space-y-3">
                  {relatedProjects.map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {proj.projectNumber.toUpperCase()}
                            </span>
                            <Badge
                              variant={
                                statusVariant[proj.status] || 'secondary'
                              }
                              className="text-xs"
                            >
                              {statusLabels[proj.status] || proj.status}
                            </Badge>
                          </div>
                          {proj.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {proj.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {proj.awardValue && (
                              <span>
                                Award: R{' '}
                                {Number(proj.awardValue).toLocaleString()}
                              </span>
                            )}
                            {proj.contractStartDate && (
                              <span>
                                Start: {formatDate(proj.contractStartDate)}
                              </span>
                            )}
                            {proj.contractEndDate && (
                              <span>
                                End: {formatDate(proj.contractEndDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Projects Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    No projects have been created for this client yet. Projects
                    are automatically created when a tender is awarded.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Client Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contact</span>
                <Badge variant={hasContactInfo ? 'default' : 'secondary'}>
                  {hasContactInfo ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tenders</span>
                <span className="font-medium">{relatedTenders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Projects</span>
                <span className="font-medium">{relatedProjects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Purchase Orders
                </span>
                <span className="font-medium">{purchaseOrderCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start cursor-pointer"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Button>
              <Link href={`/tenders/create?clientId=${client.id}`}>
                <Button
                  variant="outline"
                  className="w-full justify-start cursor-pointer"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  New Tender
                </Button>
              </Link>
              <Link href={`/projects/create?clientId=${client.id}`}>
                <Button
                  variant="outline"
                  className="w-full justify-start cursor-pointer"
                >
                  <FolderKanban className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
              {client.contactEmail && (
                <Button
                  variant="outline"
                  className="w-full justify-start cursor-pointer"
                  onClick={() =>
                    window.open(`mailto:${client.contactEmail}`, '_blank')
                  }
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              )}
              {client.contactPhone && (
                <Button
                  variant="outline"
                  className="w-full justify-start cursor-pointer"
                  onClick={() =>
                    window.open(`tel:${client.contactPhone}`, '_blank')
                  }
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Client
                </Button>
              )}
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
                <p className="text-sm text-foreground">
                  {formatDateTime(client.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="text-sm text-foreground">
                  {formatDateTime(client.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be
              undone.
              {totalRelatedRecords > 0 && (
                <span className="block mt-2 text-amber-600">
                  This client has {totalRelatedRecords} related record
                  {totalRelatedRecords !== 1 ? 's' : ''}. You may need to
                  reassign them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
