"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Upload,
  Loader2,
  Check,
  Trash2,
  UploadCloud,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentImage?: string | null;
  userName: string;
  onImageChange: (imageUrl: string | null, storageKey?: string | null) => void;
  onImageRemove: () => void;
  disabled?: boolean;
  uploadAction: (file: File) => Promise<{
    success: boolean;
    imageUrl?: string;
    key?: string;
    error?: string;
  }>;
  entityName?: string; // e.g. "Profile picture" or "Organization logo"
}

export function AvatarUpload({
  currentImage,
  userName,
  onImageChange,
  onImageRemove,
  disabled = false,
  uploadAction,
  entityName = "Profile picture",
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return (name || "User")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WebP, GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setShowUploadDialog(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!previewImage) return;

    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setUploadProgress(20);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 80 ? prev + 15 : prev));
      }, 200);

      const result = await uploadAction(file);
      clearInterval(progressInterval);

      setUploadProgress(100);
      setIsUploading(false);

      if (result.success && result.imageUrl) {
        onImageChange(result.imageUrl, result.key);
        setShowUploadDialog(false);
        setPreviewImage(null);
        toast.success(`${entityName} updated successfully`);
      } else {
        toast.error(
          result.error || `Failed to update ${entityName.toLowerCase()}`,
        );
      }
    } catch (error) {
      setIsUploading(false);
      toast.error(`Failed to upload ${entityName.toLowerCase()}`);
      console.error("Upload error:", error);
    }
  };

  const handleRemoveImage = () => {
    onImageRemove();
    toast.success(`${entityName} removed`);
  };

  const handleCancelUpload = () => {
    setShowUploadDialog(false);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Current Avatar with Floating Camera Badge */}
      <div className="relative group">
        <Avatar
          className="h-28 w-28 cursor-pointer ring-2 ring-border/80 group-hover:ring-4 group-hover:ring-primary/30 transition-all duration-200 shadow-sm"
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <AvatarImage
            src={currentImage || undefined}
            alt={`Profile picture of ${userName}`}
            className="object-cover"
          />
          <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {/* Floating Quick Action Badge */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) fileInputRef.current?.click();
          }}
          disabled={disabled}
          aria-label={`Change ${entityName.toLowerCase()}`}
          className={cn(
            "absolute bottom-0 right-0 p-2 rounded-full border border-border/80 bg-background/95 backdrop-blur-sm shadow-md text-foreground hover:text-primary hover:bg-muted transition-all duration-150",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="h-8 text-xs gap-1.5 shadow-sm"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>
            Change {entityName === "Profile picture" ? "Photo" : "Logo"}
          </span>
        </Button>

        {currentImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            disabled={disabled}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remove</span>
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload & Circular Crop Preview Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload {entityName}</DialogTitle>
            <DialogDescription>
              Preview how your {entityName.toLowerCase()} will appear across the
              workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Circular Preview Container */}
            {previewImage && (
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border border-border/60 rounded-xl space-y-3">
                <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-lg ring-2 ring-primary/20">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Square preview format
                </p>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between text-xs font-medium text-primary">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading...
                  </span>
                  <span className="font-mono">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}

            {/* Drag and Drop Area inside Dialog */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-5 text-center transition-all duration-200",
                dragActive
                  ? "border-primary bg-primary/10 scale-[0.99] ring-2 ring-primary/20"
                  : "border-border/60 hover:border-primary/40 bg-muted/5",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <UploadCloud className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">
                Drag a new image here, or{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-semibold"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                >
                  browse files
                </button>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PNG, JPG, WebP up to 5MB
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelUpload}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmUpload}
              disabled={!previewImage || isUploading}
              className="gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save & Apply</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
