'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileUploader } from '@/components/ui/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Trash2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Assuming sonner is used based on package.json
import { uploadDocument, deleteDocument } from '@/server/documents';

// Inline formatBytes if generic utils doesn't have it
function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

interface DocumentManagerProps {
  organizationId: string;
  entityId: string;
  entityType: 'tender' | 'project';
  initialDocuments: Document[];
}

export function DocumentManager({
  organizationId,
  entityId,
  entityType,
  initialDocuments,
}: DocumentManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    const formData = new FormData();
    // Currently handling single file upload for simplicity in UI feedback, but loop for multiple
    // If FileUploader supports multiple, we should iterate.
    // For now, let's assume we upload them one by one or batch.

    // We'll just take the first file for MVP simplicity or loop if needed.
    // Let's loop.
    let successCount = 0;

    for (const file of files) {
      formData.set('file', file);

      try {
        const result = await uploadDocument(organizationId, formData, {
          [entityType + 'Id']: entityId,
        });

        if (result.success) {
          successCount++;
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (err) {
        toast.error(`Error uploading ${file.name}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      router.refresh();
    }
  };

  const handleDelete = (docId: string) => {
    startTransition(async () => {
      const result = await deleteDocument(organizationId, docId);
      if (result.success) {
        toast.success('Document deleted');
        // router.refresh() is called in server action revalidate, but specific to path.
        // Client router refresh ensures we see it.
        // Actually router.refresh() only refreshes server components?
        // Yes.
      } else {
        toast.error('Failed to delete document');
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploader
            onValueChange={handleUpload}
            disabled={uploading || isPending}
            maxFiles={5}
          />
          {uploading && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialDocuments.map((doc) => (
          <Card key={doc.id} className="overflow-hidden">
            <div className="p-4 flex items-start justify-between space-x-4">
              <div className="flex items-start space-x-3 truncate">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1 truncate">
                  <p className="font-medium text-sm truncate" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(parseInt(doc.size))} •{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {doc.signedUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(doc.id)}
                  disabled={isPending}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {initialDocuments.length === 0 && !uploading && (
          <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No documents attached</p>
          </div>
        )}
      </div>
    </div>
  );
}
