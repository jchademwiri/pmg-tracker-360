'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Phone, Mail, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { ExtensionForm } from './extension-form';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteTenderExtension } from '@/server/modules/extensions';

export interface ExtensionDocument {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  createdAt: Date;
  signedUrl?: string;
}

export interface ExtendedTenderExtension {
  id: string;
  extensionDate: Date;
  newEvaluationDate: Date;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  createdByUser: {
    name: string;
    image: string | null;
  } | null;
  documents: ExtensionDocument[];
}

interface ExtensionListProps {
  extensions: ExtendedTenderExtension[];
  organizationId: string;
  tenderId: string;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function ExtensionList({
  extensions,
  organizationId,
  tenderId,
}: ExtensionListProps) {
  const router = useRouter();
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (extensionId: string) => {
    setIsDeletingId(extensionId);
    startTransition(async () => {
      const result = await deleteTenderExtension(organizationId, extensionId);
      if (result.success) {
        toast.success('Extension deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete extension');
      }
      setIsDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Extension History</h3>
        <ExtensionForm organizationId={organizationId} tenderId={tenderId} />
      </div>

      {extensions.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
            <Calendar className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">No extensions recorded</p>
              <p className="text-sm text-muted-foreground">
                Add an extension to extend the evaluation period.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {extensions.map((ext) => (
            <Card key={ext.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Extended on {format(new Date(ext.extensionDate), 'PPP')}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    New Deadline:{' '}
                    {format(new Date(ext.newEvaluationDate), 'PPP')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {ext.notes && (
                  <div className="bg-muted/30 p-3 rounded-md italic text-muted-foreground">
                    "{ext.notes}"
                  </div>
                )}

                {/* Extension Document */}
                {ext.documents && ext.documents.length > 0 && (
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-md p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Attached Extension Letter
                    </p>
                    {ext.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-xs truncate" title={doc.name}>
                            {doc.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            ({formatFileSize(parseInt(doc.size))})
                          </span>
                        </div>
                        {doc.signedUrl && (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                          >
                            <Download className="h-3 w-3" />
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Contact Person
                    </p>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>{ext.contactName || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Contact Details
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <a
                          href={`mailto:${ext.contactEmail}`}
                          className="hover:underline text-primary"
                        >
                          {ext.contactEmail}
                        </a>
                      </div>
                      {ext.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <a
                            href={`tel:${ext.contactPhone}`}
                            className="hover:underline"
                          >
                            {ext.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Recorded by{' '}
                    <span className="font-medium text-foreground">
                      {ext.createdByUser?.name || 'Unknown'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    onClick={() => handleDelete(ext.id)}
                    disabled={isDeletingId === ext.id}
                  >
                    {isDeletingId === ext.id ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
