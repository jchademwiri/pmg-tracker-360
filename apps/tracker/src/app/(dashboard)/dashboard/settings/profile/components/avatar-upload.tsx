'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Upload,
  Loader2,
  Check,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentImage?: string | null;
  userName: string;
  onImageChange: (imageUrl: string | null) => void;
  onImageRemove: () => void;
  disabled?: boolean;
  uploadAction: (
    file: File
  ) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
  entityName?: string; // e.g. "Profile picture" or "Organization logo"
}

const UPLOAD_DISABLED = true; // Disabled for free MVP - enable when billing is implemented

export function AvatarUpload({
  currentImage,
  userName,
  onImageChange,
  onImageRemove,
  disabled = false,
  uploadAction,
  entityName = 'Profile picture',
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
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
    [disabled]
  );

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setShowUploadDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // NOTE: Removed simulated upload delay/progress. Wire to real API when ready.
  const simulateUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(100);
    setIsUploading(false);
    return URL.createObjectURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!previewImage) return;

    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setUploadProgress(10); // Start progress

      const result = await uploadAction(file);

      setUploadProgress(100);
      setIsUploading(false);

      if (result.success && result.imageUrl) {
        onImageChange(result.imageUrl);
        setShowUploadDialog(false);
        setPreviewImage(null);
        toast.success(`${entityName} updated successfully`);
      } else {
        toast.error(
          result.error || `Failed to update ${entityName.toLowerCase()}`
        );
      }
    } catch (error) {
      setIsUploading(false);
      toast.error(`Failed to upload ${entityName.toLowerCase()}`);
      console.error('Upload error:', error);
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
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Current Avatar */}
      <div className="relative group">
        <Avatar className="h-24 w-24 cursor-pointer transition-all duration-200 hover:ring-4 hover:ring-primary/20">
          <AvatarImage
            src={currentImage || undefined}
            alt={`Profile picture of ${userName}`}
            className="object-cover"
          />
          <AvatarFallback className="text-lg">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {/* Upload Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 ${
            disabled || UPLOAD_DISABLED
              ? 'cursor-not-allowed'
              : 'cursor-pointer'
          }`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent bubbling issues
            if (UPLOAD_DISABLED) {
              toast.info('Photo upload is currently unavailable. Coming soon!');
              return;
            }
            if (!disabled) fileInputRef.current?.click();
          }}
        >
          <Camera className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (UPLOAD_DISABLED) {
              toast.info('Photo upload is currently unavailable. Coming soon!');
              return;
            }
            fileInputRef.current?.click();
          }}
          disabled={disabled}
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Change Photo</span>
        </Button>

        {currentImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            disabled={disabled}
            className="flex items-center space-x-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span>Remove</span>
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload {entityName}</DialogTitle>
            <DialogDescription>
              Choose a new {entityName.toLowerCase()}. The image will be cropped
              to a square and resized to fit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview */}
            {previewImage && (
              <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                <Image
                  src={previewImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop an image here, or{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelUpload}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={!previewImage || isUploading}
              className="flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
