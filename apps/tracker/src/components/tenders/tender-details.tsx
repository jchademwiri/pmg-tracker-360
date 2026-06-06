'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Building,
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
import { deleteTender, updateTenderStatus } from '@/server/tenders';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentManager } from '@/components/documents/document-manager';

interface TenderWithClient {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  value: string | null;
  status: string;
  evaluationDate: Date | null;
  validityDays: number | null;
  validityDate: Date | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  } | null;
}

interface Document {
  id: string;
  name: string;
  size: string;
  type: string;
  createdAt: Date;
  signedUrl?: string; // Optional if we fetch signed URLs
  url?: string;
}

import { ExtensionList, ExtendedTenderExtension } from './extension-list';

interface TenderDetailsProps {
  tender: TenderWithClient;
  organizationId: string;
  documents: Document[];
  extensions: ExtendedTenderExtension[];
}

const statusColors = {
  open: 'bg-green-100/10 text-green-400 border border-green-500/20',
  closed: 'bg-zinc-800 text-zinc-400 border border-zinc-700/30',
  evaluation: 'bg-blue-100/10 text-blue-400 border border-blue-500/20',
  awarded: 'bg-amber-100/10 text-amber-400 border border-amber-500/20',
  lost: 'bg-red-100/10 text-red-400 border border-red-500/20',
  cancelled: 'bg-zinc-100/10 text-zinc-400 border border-zinc-500/20',
};

const statusLabels = {
  open: 'Open',
  closed: 'Closed',
  evaluation: 'Evaluation',
  awarded: 'Appointed / Awarded',
  lost: 'Rejected / Lost',
  cancelled: 'Cancelled',
};

export function TenderDetails({
  tender,
  organizationId,
  documents,
  extensions,
}: TenderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEdit = () => {
    router.push(`/tenders/${tender.id}/edit`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this tender? This action cannot be undone.'
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteTender(organizationId, tender.id);
      if (result.success) {
        router.push('/tenders');
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete tender');
      }
    });
  };

  const handleStatusUpdate = async (
    newStatus: 'open' | 'closed' | 'evaluation' | 'awarded' | 'lost'
  ) => {
    startTransition(async () => {
      const result = await updateTenderStatus(organizationId, tender.id, {
        status: newStatus,
      });
      if (result.success) {
        if (newStatus === 'awarded' && result.projectId) {
          router.push(`/projects/${result.projectId}/edit`);
        } else {
          router.refresh();
        }
      } else {
        alert(result.error || 'Failed to update tender status');
      }
    });
  };

  const handleBack = () => {
    router.push('/tenders');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDateOnly = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatValue = (value: string | null) => {
    if (!value) return 'Not set';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(numValue);
  };

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
            Back to Tenders
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-xl text-foreground/80 font-bold">
            {tender.tenderNumber.toUpperCase()}
          </h1>

          <Button
            variant="outline"
            onClick={handleEdit}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Tender
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
                Edit Tender
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 cursor-pointer"
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Tender
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Information */}
            <div className="xl:col-span-3 space-y-6">
              {/* Basic Information */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Tender Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tender Number
                      </label>
                      <p className="text-lg font-medium text-blue-600">
                        {tender.tenderNumber.toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <div className="mt-1">
                        <Badge
                          className={
                            statusColors[
                              tender.status as keyof typeof statusColors
                            ]
                          }
                        >
                          {
                            statusLabels[
                              tender.status as keyof typeof statusLabels
                            ]
                          }
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tender Value
                      </label>
                      <p className="text-lg font-medium">
                        {formatValue(tender.value)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Closing Date
                      </label>
                      <p className="text-foreground">
                        {formatDate(tender.submissionDate)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tender Validity (Initial)
                      </label>
                      <p className="text-foreground">
                        {tender.validityDays ? `${tender.validityDays} Days` : formatDateOnly(tender.validityDate)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Current Validity Deadline
                      </label>
                      <p className="text-foreground font-semibold text-blue-600">
                        {formatDateOnly(tender.evaluationDate)}
                      </p>
                    </div>
                  </div>

                  {tender.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Description
                      </label>
                      <p className="text-foreground whitespace-pre-wrap">
                        {tender.description}
                      </p>
                    </div>
                  )}

                  {!tender.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Description
                      </label>
                      <p className="text-muted-foreground italic">
                        No description added
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tender Follow-up Contact */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="h-5 w-5 mr-2 text-amber-600" />
                    Tender Follow-up Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tender.contactName || tender.contactEmail || tender.contactPhone ? (
                    <div className="space-y-3">
                      {tender.contactName && (
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Contact Person
                            </label>
                            <p className="text-foreground">{tender.contactName}</p>
                          </div>
                        </div>
                      )}

                      {tender.contactEmail && (
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Email Address
                            </label>
                            <p className="text-foreground">
                              <Link
                                href={`mailto:${tender.contactEmail}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {tender.contactEmail}
                              </Link>
                            </p>
                          </div>
                        </div>
                      )}

                      {tender.contactPhone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Phone Number
                            </label>
                            <p className="text-foreground">
                              <Link
                                href={`tel:${tender.contactPhone}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {tender.contactPhone}
                              </Link>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No tender-specific follow-up contact added.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Building className="h-5 w-5 mr-2 text-green-600" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tender.client ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Client Name
                          </label>
                          <p className="text-lg font-medium">
                            {tender.client.name}
                          </p>
                        </div>
                        <Link href={`/clients/${tender.client.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                          >
                            View Client
                          </Button>
                        </Link>
                      </div>

                      {(tender.client.contactName ||
                        tender.client.contactEmail ||
                        tender.client.contactPhone) && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Contact Information
                          </h4>
                          <div className="space-y-3">
                            {tender.client.contactName && (
                              <div className="flex items-center space-x-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Contact Person
                                  </label>
                                  <p className="text-foreground">
                                    {tender.client.contactName}
                                  </p>
                                </div>
                              </div>
                            )}

                            {tender.client.contactEmail && (
                              <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Email Address
                                  </label>
                                  <p className="text-foreground">
                                    <Link
                                      href={`mailto:${tender.client.contactEmail}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {tender.client.contactEmail}
                                    </Link>
                                  </p>
                                </div>
                              </div>
                            )}

                            {tender.client.contactPhone && (
                              <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Phone Number
                                  </label>
                                  <p className="text-foreground">
                                    <Link
                                      href={`tel:${tender.client.contactPhone}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {tender.client.contactPhone}
                                    </Link>
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No Client Information
                      </h3>
                      <p className="text-muted-foreground">
                        Client information is not available for this tender.
                      </p>
                    </div>
                  )}
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
                  <Button
                    variant="outline"
                    className="w-full justify-start cursor-pointer"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Tender
                  </Button>
                  {(tender.contactEmail || tender.client?.contactEmail) && (
                    <Button
                      variant="outline"
                      className="w-full justify-start cursor-pointer"
                      onClick={() =>
                        window.open(
                          `mailto:${tender.contactEmail || tender.client?.contactEmail}`,
                          '_blank'
                        )
                      }
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Follow-up Contact
                    </Button>
                  )}
                  {(tender.contactPhone || tender.client?.contactPhone) && (
                    <Button
                      variant="outline"
                      className="w-full justify-start cursor-pointer"
                      onClick={() =>
                        window.open(
                          `tel:${tender.contactPhone || tender.client?.contactPhone}`,
                          '_blank'
                        )
                      }
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Follow-up Contact
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Status Management */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Status Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground mb-3">
                    Current Status:{' '}
                    <span className="font-medium">
                      {statusLabels[tender.status as keyof typeof statusLabels]}
                    </span>
                  </div>

                   {tender.status !== 'evaluation' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('evaluation')}
                      disabled={isPending}
                    >
                      Mark as Submitted / Evaluation
                    </Button>
                  )}

                  {tender.status !== 'awarded' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('awarded')}
                      disabled={isPending}
                    >
                      Mark as Appointed / Awarded
                    </Button>
                  )}

                  {tender.status !== 'lost' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('lost')}
                      disabled={isPending}
                    >
                      Mark as Rejected / Lost
                    </Button>
                  )}

                  {tender.status !== 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('closed')}
                      disabled={isPending}
                    >
                      Mark as Closed
                    </Button>
                  )}

                  {tender.status !== 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('open')}
                      disabled={isPending}
                    >
                      Mark as Open
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
                    <p className="text-sm">{formatDate(tender.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </label>
                    <p className="text-sm">{formatDate(tender.updatedAt)}</p>
                  </div>
                  {tender.submissionDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Closing Date
                      </label>
                      <p className="text-sm">
                        {formatDate(tender.submissionDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-2">
                Document management is currently unavailable
              </p>
              <p className="text-sm text-muted-foreground/70">
                Coming soon in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extensions" className="mt-6">
          <ExtensionList
            extensions={extensions}
            organizationId={organizationId}
            tenderId={tender.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
