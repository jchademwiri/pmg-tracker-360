'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Trash2,
  Upload,
  File,
  Image,
  FileSpreadsheet,
  FileArchive,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate, formatFileSize } from '@/lib/format';
import { uploadDocument, deleteDocument } from '@/server/documents';
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

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: Date;
  signedUrl?: string;
  url?: string;
  uploadedBy?: { id: string; name: string | null } | null;
}

interface DocumentManagerProps {
  organizationId: string;
  entityId: string;
  entityType: 'tender' | 'project' | 'purchaseOrder';
  initialDocuments?: Document[];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return FileArchive;
  if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) return FileCode;
  return File;
}

function getFileColor(mimeType: string) {
  if (mimeType.includes('pdf')) return 'text-red-500 bg-red-500/10';
  if (mimeType.startsWith('image/')) return 'text-purple-500 bg-purple-500/10';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-500 bg-blue-500/10';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-green-500 bg-green-500/10';
  return 'text-zinc-500 bg-zinc-500/10';
}

export function DocumentManager({
  organizationId,
  entityId,
  entityType,
  initialDocuments = [],
}: DocumentManagerProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);      const result = await uploadDocument(organizationId, formData, {
  [entityType === 'tender' ? 'tenderId' : entityType === 'project' ? 'projectId' : 'purchaseOrderId']: entityId,
});

      if (result.success && result.document) {
        setDocuments((prev) => [
          {
            id: result.document!.id,
            name: result.document!.name,
            size: result.document!.size,
            type: result.document!.type,
            createdAt: new Date(),
            url: result.document!.url,
          },
          ...prev,
        ]);
        toast.success('Document uploaded successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to upload document');
      }
    } catch (err) {
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be re-selected
      e.target.value = '';
    }
  }, [organizationId, entityId, entityType, router]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await deleteDocument(organizationId, deleteTarget.id);
      if (result.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        toast.success('Document deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete document');
      }
    } catch (err) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const getDownloadUrl = (doc: Document) => {
    return doc.signedUrl || doc.url || '#';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Upload and manage tender documents, specifications, and attachments
          </CardDescription>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="relative cursor-pointer"
            asChild
          >
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                disabled={isUploading}
              />
            </label>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-sm">No documents uploaded yet</p>
            <p className="text-xs mt-1">
              Upload PDFs, Word documents, Excel files, or images
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.type);
              const colorClass = getFileColor(doc.type);

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)} • {formatDate(doc.createdAt)}
                        {doc.uploadedBy?.name && ` • by ${doc.uploadedBy.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Download"
                      asChild
                    >
                      <a
                        href={getDownloadUrl(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.name}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      title="Delete"
                      onClick={() => setDeleteTarget(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
