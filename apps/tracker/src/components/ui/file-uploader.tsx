'use client';

import * as React from 'react';
import {
  useDropzone,
  type FileRejection,
  type DropzoneOptions,
} from 'react-dropzone';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileUploaderProps extends Omit<DropzoneOptions, 'onDrop'> {
  value?: File[];
  onValueChange?: (files: File[]) => void;
  className?: string;
  maxFiles?: number;
  maxSize?: number;
}

export function FileUploader({
  value = [],
  onValueChange,
  className,
  maxFiles = 5,
  maxSize = 1024 * 1024 * 10, // 10MB
  ...dropzoneProps
}: FileUploaderProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (onValueChange) {
        // Prevent duplicates based on name and size
        const currentFiles = value || [];
        const newFiles = acceptedFiles.filter(
          (newFile) =>
            !currentFiles.some(
              (currentFile) =>
                currentFile.name === newFile.name &&
                currentFile.size === newFile.size
            )
        );

        const combinedFiles = [...currentFiles, ...newFiles].slice(0, maxFiles);
        onValueChange(combinedFiles);
      }

      if (rejectedFiles.length > 0) {
        console.warn('Files rejected:', rejectedFiles);
      }
    },
    [value, maxFiles, onValueChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    ...dropzoneProps,
  });

  const removeFile = (indexToRemove: number) => {
    if (onValueChange) {
      const newFiles = value.filter((_, index) => index !== indexToRemove);
      onValueChange(newFiles);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          'flex flex-col items-center justify-center text-center space-y-2'
        )}
      >
        <input {...getInputProps()} />
        <div className="p-4 bg-background rounded-full border shadow-sm">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, Word, Excel, Images (max {Math.round(maxSize / 1024 / 1024)}MB)
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
          <div className="space-y-4">
            {value.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-background rounded-md border">
                    <FileIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
