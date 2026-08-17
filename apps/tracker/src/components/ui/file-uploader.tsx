"use client";

import * as React from "react";
import {
  useDropzone,
  type FileRejection,
  type DropzoneOptions,
} from "react-dropzone";
import {
  UploadCloud,
  X,
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface FileUploaderProps extends Omit<DropzoneOptions, "onDrop"> {
  value?: File[];
  onValueChange?: (files: File[]) => void;
  className?: string;
  maxFiles?: number;
  maxSize?: number;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return ImageIcon;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["pdf", "doc", "docx", "txt"].includes(ext)) return FileText;
  return FileIcon;
}

function getFileColor(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return "text-purple-600 bg-purple-500/10 border-purple-500/20";
  if (["xls", "xlsx", "csv"].includes(ext))
    return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
  if (["pdf"].includes(ext))
    return "text-rose-600 bg-rose-500/10 border-rose-500/20";
  if (["doc", "docx"].includes(ext))
    return "text-sky-600 bg-sky-500/10 border-sky-500/20";
  return "text-zinc-600 bg-zinc-500/10 border-zinc-500/20";
}

export function FileUploader({
  value = [],
  onValueChange,
  className,
  maxFiles = 5,
  maxSize = 1024 * 1024 * 10, // 10MB
  disabled,
  ...dropzoneProps
}: FileUploaderProps) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejection) => {
          const reason = rejection.errors[0]?.message || "File rejected";
          toast.error(`${rejection.file.name}: ${reason}`);
        });
      }

      if (onValueChange && acceptedFiles.length > 0) {
        // Prevent duplicates based on name and size
        const currentFiles = value || [];
        const newFiles = acceptedFiles.filter(
          (newFile) =>
            !currentFiles.some(
              (currentFile) =>
                currentFile.name === newFile.name &&
                currentFile.size === newFile.size,
            ),
        );

        if (newFiles.length === 0 && acceptedFiles.length > 0) {
          toast.info("File already added");
          return;
        }

        const combinedFiles = [...currentFiles, ...newFiles].slice(0, maxFiles);
        if (currentFiles.length + newFiles.length > maxFiles) {
          toast.warning(
            `Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`,
          );
        }
        onValueChange(combinedFiles);
      }
    },
    [value, maxFiles, onValueChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    disabled,
    ...dropzoneProps,
  });

  const removeFile = (indexToRemove: number) => {
    if (onValueChange) {
      const newFiles = value.filter((_, index) => index !== indexToRemove);
      onValueChange(newFiles);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-primary bg-primary/10 scale-[0.99] ring-4 ring-primary/20"
            : "border-border/60 hover:border-primary/50 hover:bg-muted/30 bg-muted/10",
          disabled && "opacity-60 cursor-not-allowed pointer-events-none",
          "flex flex-col items-center justify-center text-center space-y-2.5",
        )}
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            "p-3.5 rounded-full border shadow-sm transition-transform duration-200",
            isDragActive
              ? "scale-110 bg-primary/20 text-primary"
              : "bg-background text-muted-foreground",
          )}
        >
          <UploadCloud className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {isDragActive
              ? "Drop files here..."
              : "Click to upload or drag & drop"}
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, Word, Excel, Images (max {Math.round(maxSize / 1024 / 1024)}MB
            per file, up to {maxFiles} {maxFiles === 1 ? "file" : "files"})
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <ScrollArea
          className={cn(
            value.length > 3 ? "h-[200px]" : "h-auto",
            "w-full rounded-lg border border-border/60 p-2.5 bg-background/50",
          )}
        >
          <div className="space-y-2">
            {value.map((file, index) => {
              const Icon = getFileIcon(file.name);
              const colorClass = getFileColor(file.name);

              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-2.5 bg-muted/40 hover:bg-muted/70 rounded-lg border border-border/40 transition-colors group"
                >
                  <div className="flex items-center space-x-3 overflow-hidden min-w-0 flex-1">
                    <div
                      className={cn(
                        "p-2 rounded-md border shrink-0",
                        colorClass,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
