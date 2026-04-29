"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "../../lib/utils";

interface FileUploaderProps {
  onUpload?: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  // Extra props the old app may pass
  [key: string]: unknown;
}

export function FileUploader({ onUpload, accept, multiple, disabled, className }: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onUpload?.(files);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] p-6 text-center cursor-pointer hover:border-[var(--primary)] transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <Upload className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Click to upload or drag and drop
      </p>
      <p className="text-xs text-muted-foreground">
        File storage coming soon
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
      />
    </div>
  );
}
