"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Trash2,
  UploadCloud,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  Search,
  Eye,
  Loader2,
  ExternalLink,
  Plus,
  X,
  LayoutGrid,
  List,
  Copy,
  Check,
  Calendar,
  User as UserIcon,
  HardDrive,
  Maximize2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate, formatFileSize } from "@/lib/format";
import { uploadDocument, deleteDocument } from "@/server/documents";
import { cn } from "@/lib/utils";

export interface Document {
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
  entityType: "tender" | "project" | "purchaseOrder";
  initialDocuments?: Document[];
}

type FilterCategory = "all" | "pdf" | "spreadsheet" | "image" | "word";
type ViewMode = "list" | "grid";

function getFileIcon(mimeType: string, fileName?: string) {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";
  if (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
  )
    return ImageIcon;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(ext)
  )
    return FileSpreadsheet;
  if (mimeType.includes("pdf") || ext === "pdf") return FileText;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar") ||
    ["zip", "rar", "7z"].includes(ext)
  )
    return FileArchive;
  if (
    mimeType.includes("text") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    ["txt", "json", "xml"].includes(ext)
  )
    return FileCode;
  return File;
}

function getFileColor(mimeType: string, fileName?: string) {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";
  if (mimeType.includes("pdf") || ext === "pdf")
    return "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400";
  if (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
  )
    return "text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    ["doc", "docx"].includes(ext)
  )
    return "text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-400";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(ext)
  )
    return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400";
  return "text-zinc-600 bg-zinc-500/10 border-zinc-500/20 dark:text-zinc-400";
}

function getCategory(doc: Document): FilterCategory {
  const ext = doc.name.split(".").pop()?.toLowerCase() || "";
  if (doc.type.includes("pdf") || ext === "pdf") return "pdf";
  if (
    doc.type.includes("spreadsheet") ||
    doc.type.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(ext)
  )
    return "spreadsheet";
  if (
    doc.type.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
  )
    return "image";
  if (
    doc.type.includes("word") ||
    doc.type.includes("document") ||
    ["doc", "docx"].includes(ext)
  )
    return "word";
  return "all";
}

function isPreviewable(mimeType: string, fileName?: string): boolean {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";
  return (
    mimeType.startsWith("image/") ||
    mimeType.includes("pdf") ||
    ["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(ext)
  );
}

function getDocumentTypeBadge(fileName: string) {
  if (fileName.startsWith("Appointment-Letter-")) {
    return {
      label: "Appointment Letter",
      className:
        "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    };
  }
  if (fileName.startsWith("Contract-") || fileName.startsWith("SLA-")) {
    return {
      label: "Contract / SLA",
      className:
        "bg-indigo-500/10 text-indigo-700 border-indigo-500/30 dark:text-indigo-400",
    };
  }
  if (fileName.startsWith("Extension-")) {
    return {
      label: "Extension",
      className:
        "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
    };
  }
  if (fileName.startsWith("Briefing-")) {
    return {
      label: "Briefing",
      className:
        "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400",
    };
  }
  if (fileName.startsWith("Tender-")) {
    return {
      label: "Tender Spec",
      className:
        "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
    };
  }
  if (fileName.startsWith("POD-")) {
    return {
      label: "POD",
      className:
        "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    };
  }
  return null;
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDropzone, setShowDropzone] = useState(false);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>(
    entityType === "project" ? "general" : "tender",
  );
  const [extensionDate, setExtensionDate] = useState<string>("");

  const handleUploadFiles = useCallback(
    async (filesToUpload: File[]) => {
      if (filesToUpload.length === 0) return;

      if (uploadCategory === "extension" && !extensionDate) {
        toast.error("New Validity Date Required", {
          description:
            "Please select the new validity date before uploading the extension letter.",
        });
        return;
      }

      setIsUploading(true);
      setUploadProgress(10);

      const targetPayload: any = {
        [entityType === "tender"
          ? "tenderId"
          : entityType === "project"
            ? "projectId"
            : "purchaseOrderId"]: entityId,
        category: uploadCategory,
        extensionDate: extensionDate || undefined,
      };

      let successCount = 0;
      const uploadedDocs: Document[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const formData = new FormData();
        formData.append("file", file);

        try {
          const result = await uploadDocument(
            organizationId,
            formData,
            targetPayload,
          );

          if (result.success && result.document) {
            successCount++;
            uploadedDocs.push({
              id: result.document.id,
              name: result.document.name,
              size: result.document.size,
              type: result.document.type,
              createdAt: result.document.createdAt
                ? new Date(result.document.createdAt)
                : new Date(),
              url: result.document.url,
              signedUrl: (result.document as any).signedUrl,
            });
          } else {
            toast.error(
              `Failed to upload ${file.name}: ${result.error || "Unknown error"}`,
            );
          }
        } catch (err: any) {
          toast.error(`Failed to upload ${file.name}`);
        }

        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      if (uploadedDocs.length > 0) {
        setDocuments((prev) => [...uploadedDocs, ...prev]);
        toast.success(
          successCount === 1
            ? "Document uploaded successfully"
            : `${successCount} documents uploaded successfully`,
        );
        router.refresh();
      }

      setIsUploading(false);
      setUploadProgress(null);
    },
    [
      organizationId,
      entityId,
      entityType,
      uploadCategory,
      extensionDate,
      router,
    ],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rej) => {
          toast.error(
            `${rej.file.name}: ${rej.errors[0]?.message || "Invalid file"}`,
          );
        });
      }
      if (acceptedFiles.length > 0) {
        handleUploadFiles(acceptedFiles);
      }
    },
    [handleUploadFiles],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: documents.length > 0 && !showDropzone,
    noKeyboard: documents.length > 0 && !showDropzone,
    disabled: isUploading,
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await deleteDocument(organizationId, deleteTarget.id);
      if (result.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        toast.success("Document deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete document");
      }
    } catch (err) {
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const copyDownloadUrl = async (doc: Document) => {
    const url = doc.signedUrl || doc.url || "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedDocId(doc.id);
      toast.success("Direct link copied to clipboard");
      setTimeout(() => setCopiedDocId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      // Category filter
      if (activeCategory !== "all") {
        const cat = getCategory(d);
        if (cat !== activeCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesUploader = d.uploadedBy?.name?.toLowerCase().includes(q);
        const matchesType = d.type.toLowerCase().includes(q);
        if (!matchesName && !matchesUploader && !matchesType) return false;
      }

      return true;
    });
  }, [documents, activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = {
      all: documents.length,
      pdf: 0,
      spreadsheet: 0,
      image: 0,
      word: 0,
    };
    documents.forEach((d) => {
      const cat = getCategory(d);
      if (cat in counts && cat !== "all") {
        counts[cat as keyof typeof counts]++;
      }
    });
    return counts;
  }, [documents]);

  const totalStorageBytes = useMemo(() => {
    return documents.reduce((sum, d) => sum + (d.size || 0), 0);
  }, [documents]);

  const getDownloadUrl = (doc: Document) => {
    return doc.signedUrl || doc.url || "#";
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="shadow-sm border border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40 bg-card">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Documents & Attachments
              </CardTitle>
              <Badge
                variant="secondary"
                className="font-mono text-xs font-normal"
              >
                {documents.length} {documents.length === 1 ? "file" : "files"}
              </Badge>
              {documents.length > 0 && (
                <span className="text-xs text-muted-foreground font-mono">
                  ({formatFileSize(totalStorageBytes)})
                </span>
              )}
            </div>
            <CardDescription>
              Secure, centralized repository for tender specifications, pricing
              schedules, and compliance proofs
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDropzone((prev) => !prev)}
                className="text-xs h-9 gap-1.5"
              >
                {showDropzone ? (
                  <>
                    <X className="h-3.5 w-3.5" />
                    <span>Hide Dropzone</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Files</span>
                  </>
                )}
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              disabled={isUploading}
              onClick={openFileDialog}
              className="text-xs h-9 gap-1.5 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Upload Progress Notification */}
          {isUploading && uploadProgress !== null && (
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-medium text-primary">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading documents to secure cloud storage...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          {/* Collapsible / Empty-State Dropzone */}
          {(documents.length === 0 || showDropzone) && (
            <div className="space-y-3 p-4 rounded-2xl border border-primary/20 bg-muted/10">
              {/* Upload Category Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/40">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">
                    Upload As:
                  </span>
                  {entityType === "project" ? (
                    <>
                      <Button
                        type="button"
                        variant={
                          uploadCategory === "general" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setUploadCategory("general")}
                        className="text-xs h-7 px-2.5 rounded-full"
                      >
                        📄 General Document
                      </Button>
                      <Button
                        type="button"
                        variant={
                          uploadCategory === "appointment_letter"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setUploadCategory("appointment_letter")}
                        className="text-xs h-7 px-2.5 rounded-full"
                      >
                        📜 Appointment Letter
                      </Button>
                      <Button
                        type="button"
                        variant={
                          uploadCategory === "contract" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setUploadCategory("contract")}
                        className="text-xs h-7 px-2.5 rounded-full"
                      >
                        📝 Contract / SLA
                      </Button>
                      <Button
                        type="button"
                        variant={
                          uploadCategory === "extension" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setUploadCategory("extension")}
                        className="text-xs h-7 px-2.5 rounded-full"
                      >
                        ⏳ Extension
                      </Button>
                    </>
                  ) : entityType === "tender" ? (
                    <>
                      <Button
                        type="button"
                        variant={
                          uploadCategory === "tender" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setUploadCategory("tender")}
                        className="text-xs h-7 px-2.5 rounded-full"
                      >
                        📄 Tender Document
                      </Button>
                      <Button
                        type="button"
                        variant={
                          uploadCategory === "briefing" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setUploadCategory("briefing")}
                        className="text-xs h-7 px-2.5 rounded-full"
                      >
                        📋 Site Briefing
                      </Button>
                      <Button
                        type="button"
                        variant={
                          uploadCategory === "extension" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setUploadCategory("extension")}
                        className="text-xs h-7 px-2.5 rounded-full"
                      >
                        ⏳ Extension Letter
                      </Button>
                    </>
                  ) : null}
                </div>

                {uploadCategory === "extension" && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                    <label className="text-xs text-amber-300 whitespace-nowrap font-semibold">
                      New Validity Date <span className="text-rose-400">*</span>
                      :
                    </label>
                    <input
                      type="date"
                      value={extensionDate}
                      required
                      onChange={(e) => setExtensionDate(e.target.value)}
                      className={cn(
                        "h-7 text-xs px-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm",
                        !extensionDate &&
                          "border-amber-500 ring-1 ring-amber-500/50",
                      )}
                    />
                    <span className="text-[11px] text-amber-300/80 hidden sm:inline">
                      (Required to update validity status)
                    </span>
                  </div>
                )}
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 cursor-pointer text-center transition-all duration-200 bg-background/50",
                  isDragActive
                    ? "border-primary bg-primary/10 scale-[0.99] ring-4 ring-primary/20"
                    : "border-border/70 hover:border-primary/50 hover:bg-muted/30",
                  isUploading && "opacity-50 pointer-events-none",
                )}
              >
                <input {...getInputProps()} />
                <div className="mx-auto w-10 h-10 rounded-full border border-border/60 bg-background flex items-center justify-center shadow-sm mb-2">
                  <UploadCloud
                    className={cn(
                      "h-5 w-5",
                      isDragActive
                        ? "text-primary animate-bounce"
                        : "text-muted-foreground",
                    )}
                  />
                </div>
                <p className="font-medium text-sm text-foreground">
                  {isDragActive
                    ? "Drop files here to upload..."
                    : "Click to upload or drag & drop files here"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                  PDF, Word (.docx), Excel (.xlsx), Images (.png, .jpg), and
                  Text (up to 10MB per file)
                </p>
              </div>
            </div>
          )}

          {/* Controls Bar: Search, Category Filters, and View Toggle */}
          {documents.length > 0 && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <Button
                  variant={activeCategory === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory("all")}
                  className="text-xs h-8 px-2.5 rounded-full"
                >
                  All ({categoryCounts.all})
                </Button>
                {categoryCounts.pdf > 0 && (
                  <Button
                    variant={activeCategory === "pdf" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory("pdf")}
                    className="text-xs h-8 px-2.5 rounded-full gap-1"
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    PDFs ({categoryCounts.pdf})
                  </Button>
                )}
                {categoryCounts.spreadsheet > 0 && (
                  <Button
                    variant={
                      activeCategory === "spreadsheet" ? "secondary" : "ghost"
                    }
                    size="sm"
                    onClick={() => setActiveCategory("spreadsheet")}
                    className="text-xs h-8 px-2.5 rounded-full gap-1"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Excel ({categoryCounts.spreadsheet})
                  </Button>
                )}
                {categoryCounts.image > 0 && (
                  <Button
                    variant={activeCategory === "image" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory("image")}
                    className="text-xs h-8 px-2.5 rounded-full gap-1"
                  >
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    Images ({categoryCounts.image})
                  </Button>
                )}
                {categoryCounts.word > 0 && (
                  <Button
                    variant={activeCategory === "word" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory("word")}
                    className="text-xs h-8 px-2.5 rounded-full gap-1"
                  >
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Word ({categoryCounts.word})
                  </Button>
                )}
              </div>

              {/* Search & View Mode Switcher */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by file name or uploader..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-muted/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center border rounded-lg p-0.5 bg-muted/20 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                        className="h-7 w-7 rounded-md"
                      >
                        <List className="h-3.5 w-3.5" />
                        <span className="sr-only">List View</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List View</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className="h-7 w-7 rounded-md"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span className="sr-only">Grid View</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Grid View</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}

          {/* Document Content State */}
          {documents.length === 0 ? null : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/5">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">
                No documents match your filters
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Try clearing search or switching categories
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-3 text-xs h-8"
              >
                Reset Filters
              </Button>
            </div>
          ) : viewMode === "list" ? (
            /* LIST VIEW */
            <div className="space-y-2">
              {filteredDocuments.map((doc) => {
                const Icon = getFileIcon(doc.type, doc.name);
                const colorClass = getFileColor(doc.type, doc.name);
                const canPreview = isPreviewable(doc.type, doc.name);
                const downloadUrl = getDownloadUrl(doc);
                const typeBadge = getDocumentTypeBadge(doc.name);

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/40 hover:border-border transition-all duration-150 group shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => canPreview && setPreviewTarget(doc)}
                    >
                      <div
                        className={cn(
                          "p-2.5 rounded-lg border shrink-0",
                          colorClass,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {doc.name}
                          </p>
                          {typeBadge && (
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 border leading-none",
                                typeBadge.className,
                              )}
                            >
                              {typeBadge.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-mono">
                            {formatFileSize(doc.size)}
                          </span>
                          <span>•</span>
                          <span>{formatDate(doc.createdAt)}</span>
                          {doc.uploadedBy?.name && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                by {doc.uploadedBy.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbars */}
                    <div className="flex items-center gap-1 shrink-0">
                      {canPreview && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => setPreviewTarget(doc)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Preview</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Quick Preview</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => copyDownloadUrl(doc)}
                          >
                            {copiedDocId === doc.id ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="sr-only">Copy Link</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Download Link</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            asChild
                          >
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.name}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download File</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Document</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDocuments.map((doc) => {
                const Icon = getFileIcon(doc.type, doc.name);
                const colorClass = getFileColor(doc.type, doc.name);
                const canPreview = isPreviewable(doc.type, doc.name);
                const downloadUrl = getDownloadUrl(doc);
                const typeBadge = getDocumentTypeBadge(doc.name);

                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-card hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group space-y-3"
                  >
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => canPreview && setPreviewTarget(doc)}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-lg border shrink-0",
                          colorClass,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors"
                          title={doc.name}
                        >
                          {doc.name}
                        </p>
                        {typeBadge && (
                          <div className="mt-1">
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-md font-medium border leading-none",
                                typeBadge.className,
                              )}
                            >
                              {typeBadge.label}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                          <span className="font-mono">
                            {formatFileSize(doc.size)}
                          </span>
                          <span>•</span>
                          <span>{formatDate(doc.createdAt)}</span>
                        </div>
                        {doc.uploadedBy?.name && (
                          <p className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                            by {doc.uploadedBy.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                      {canPreview ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => setPreviewTarget(doc)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground uppercase font-mono">
                          {doc.name.split(".").pop() || "FILE"}
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => copyDownloadUrl(doc)}
                            >
                              {copiedDocId === doc.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy Link</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              asChild
                            >
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.name}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(doc)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* In-App Interactive Preview Modal with Metadata Drawer */}
        <Dialog
          open={!!previewTarget}
          onOpenChange={(open) => !open && setPreviewTarget(null)}
        >
          <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
            <DialogHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between gap-3 pr-6">
                <div className="min-w-0 flex-1">
                  <DialogTitle
                    className="text-base font-semibold truncate"
                    title={previewTarget?.name}
                  >
                    {previewTarget?.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs flex items-center gap-2 mt-0.5">
                    <span>
                      {previewTarget && formatFileSize(previewTarget.size)}
                    </span>
                    <span>•</span>
                    <span>
                      {previewTarget && formatDate(previewTarget.createdAt)}
                    </span>
                    {previewTarget?.uploadedBy?.name && (
                      <>
                        <span>•</span>
                        <span>by {previewTarget.uploadedBy.name}</span>
                      </>
                    )}
                  </DialogDescription>
                </div>

                {previewTarget && (
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => copyDownloadUrl(previewTarget)}
                    >
                      {copiedDocId === previewTarget.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs gap-1.5"
                      asChild
                    >
                      <a
                        href={getDownloadUrl(previewTarget)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={previewTarget.name}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-[420px] max-h-[68vh] w-full overflow-auto bg-muted/20 rounded-xl flex items-center justify-center p-3">
              {previewTarget?.type.startsWith("image/") ||
              ["jpg", "jpeg", "png", "gif", "webp"].includes(
                previewTarget?.name.split(".").pop()?.toLowerCase() || "",
              ) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewTarget ? getDownloadUrl(previewTarget) : ""}
                  alt={previewTarget?.name || "Document preview"}
                  className="max-h-[62vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : previewTarget?.type.includes("pdf") ||
                previewTarget?.name.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewTarget ? getDownloadUrl(previewTarget) : ""}
                  title={previewTarget?.name || "PDF preview"}
                  className="w-full h-[62vh] rounded-lg border border-border/60 bg-white"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm font-medium">
                    In-app preview not available for this file format
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Download the file to inspect it on your device.
                  </p>
                  <Button size="sm" asChild>
                    <a
                      href={previewTarget ? getDownloadUrl(previewTarget) : "#"}
                      download={previewTarget?.name}
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete &quot;
                {deleteTarget?.name}&quot;? This file will be removed from cloud
                storage and cannot be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Document"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </TooltipProvider>
  );
}
