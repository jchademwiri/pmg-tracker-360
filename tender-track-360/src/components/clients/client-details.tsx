'use client';

import { useTransition } from 'react';
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
import type { Client } from '@/db/schema';
import Link from 'next/link';

interface ClientDetailsProps {
  client: Client;
  organizationId: string;
}

export function ClientDetails({ client, organizationId }: ClientDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEdit = () => {
    router.push(`/dashboard/clients/${client.id}/edit`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this client? This action cannot be undone.'
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteClient(organizationId, client.id);
      if (result.success) {
        router.push('/dashboard/clients');
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete client');
      }
    });
  };

  const handleBack = () => {
    router.push('/dashboard/clients');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const hasContactInfo =
    client.contactName || client.contactEmail || client.contactPhone;

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
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-xl text-gray-600 font-bold">{client.name}</h1>

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
                onClick={handleDelete}
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
            <CardHeader className="">
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Client Name
                </label>
                <p className="text-lg font-medium">{client.name}</p>
              </div>

              {client.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Notes
                  </label>
                  <p className="text-foreground whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}

              {!client.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Notes
                  </label>
                  <p className="text-gray-400 italic">No notes added</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="">
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
                        <label className="text-sm font-medium text-gray-500">
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
                        <label className="text-sm font-medium text-gray-500">
                          Email Address
                        </label>
                        <p className="text-foreground">
                          <Link
                            href={`mailto:${client.contactEmail}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
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
                        <label className="text-sm font-medium text-gray-500">
                          Phone Number
                        </label>
                        <p className="text-foreground">
                          <Link
                            href={`tel:${client.contactPhone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
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
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
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

          {/* Related Records Placeholder */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="">
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Related Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Related Records
                </h3>
                <p className="text-gray-500">
                  Tenders and projects for this client will appear here once the
                  tender management system is implemented.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="">
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

          {/* Client Status */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader className="">
              <CardTitle className="text-lg">Client Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Contact Info</span>
                <Badge variant={hasContactInfo ? 'default' : 'secondary'}>
                  {hasContactInfo ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
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
                <label className="text-sm font-medium text-gray-500">
                  Created
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(client.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900">
                  {formatDate(client.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
