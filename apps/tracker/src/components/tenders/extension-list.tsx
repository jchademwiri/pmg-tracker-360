'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Phone, Mail, FileText, Download, Trash2, Pencil } from 'lucide-react';
import { ExtensionForm, EditableExtension } from './extension-form';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteTenderExtension } from '@/server/modules/extensions';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { formatFileSize } from '@/lib/format';

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

export function ExtensionList({
  extensions,
  organizationId,
  tenderId,
}: ExtensionListProps) {
  const router = useRouter();
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [editExtensionId, setEditExtensionId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Extensions are sorted by extensionDate desc from the server; first = latest
  const latestExtensionId = extensions.length > 0 ? extensions[0].id : null;

  const extToDelete = deleteDialogId
    ? extensions.find((e) => e.id === deleteDialogId)
    : undefined;

  const extToEdit = editExtensionId
    ? extensions.find((e) => e.id === editExtensionId)
    : undefined;

  const isEditingLatestExtension = !!editExtensionId && editExtensionId === latestExtensionId;

  const editExtensionData: EditableExtension | undefined = extToEdit
    ? {
        id: extToEdit.id,
        extensionDate: extToEdit.extensionDate,
        newEvaluationDate: extToEdit.newEvaluationDate,
        contactName: extToEdit.contactName,
        contactEmail: extToEdit.contactEmail,
        contactPhone: extToEdit.contactPhone,
        notes: extToEdit.notes,
        documents: extToEdit.documents.map((d) => ({ id: d.id, name: d.name })),
      }
    : undefined;

  const handleDeleteConfirm = () => {
    if (!deleteDialogId) return;
    const id = deleteDialogId;
    setDeleteDialogId(null);
    startTransition(async () => {
      const result = await deleteTenderExtension(organizationId, id);
      if (result.success) {
        toast.success('Extension deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete extension');
      }
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => setEditExtensionId(ext.id)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={() => setDeleteDialogId(ext.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ExtensionForm
        organizationId={organizationId}
        tenderId={tenderId}
        extension={editExtensionData}
        isLatestExtension={isEditingLatestExtension}
        open={editExtensionId !== null}
        onOpenChange={(open) => { if (!open) setEditExtensionId(null); }}
        trigger={<span />}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogId !== null}
        onClose={() => setDeleteDialogId(null)}
        onConfirm={handleDeleteConfirm}
        itemName={extToDelete ? format(new Date(extToDelete.extensionDate), 'PPP') : 'this extension'}
        itemType="Extension"
      />
    </div>
  );
}
