"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/ui/file-uploader";
import {
  Plus,
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  Mail,
  Phone,
} from "lucide-react";
import {
  createTenderExtension,
  updateTenderExtension,
} from "@/server/modules/extensions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const extensionFormSchema = z.object({
  extensionDate: z.string().min(1, "Extension date is required"),
  newEvaluationDate: z.string().min(1, "New evaluation date is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  file: z.any().optional(),
});

type ExtensionFormValues = z.infer<typeof extensionFormSchema>;

export interface EditableExtension {
  id: string;
  extensionDate: Date;
  newEvaluationDate: Date;
  contactName: string | null;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  documents: { id: string; name: string }[];
}

interface ExtensionFormProps {
  organizationId: string;
  tenderId: string;
  /** If provided, the form opens in edit mode for this extension */
  extension?: EditableExtension;
  /** Whether this extension is the latest (governing the tender's live evaluation date) */
  isLatestExtension?: boolean;
  /** Controlled open state for edit mode */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger button variant for edit mode */
  trigger?: React.ReactNode;
}

function toDateInputValue(date?: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function ExtensionForm({
  organizationId,
  tenderId,
  extension,
  isLatestExtension,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: ExtensionFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isEdit = !!extension;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<ExtensionFormValues>({
    resolver: zodResolver(extensionFormSchema),
    defaultValues: {
      extensionDate: extension ? toDateInputValue(extension.extensionDate) : "",
      newEvaluationDate: extension
        ? toDateInputValue(extension.newEvaluationDate)
        : "",
      contactName: extension?.contactName || "",
      contactEmail: extension?.contactEmail || "",
      contactPhone: extension?.contactPhone || "",
      notes: extension?.notes || "",
    },
  });

  // Reset form values and selected files when the dialog opens or extension changes
  useEffect(() => {
    if (open) {
      setSelectedFiles([]);
      form.reset({
        extensionDate: extension
          ? toDateInputValue(extension.extensionDate)
          : "",
        newEvaluationDate: extension
          ? toDateInputValue(extension.newEvaluationDate)
          : "",
        contactName: extension?.contactName || "",
        contactEmail: extension?.contactEmail || "",
        contactPhone: extension?.contactPhone || "",
        notes: extension?.notes || "",
      });
    }
  }, [open, extension, form]);

  const onSubmit = useCallback(
    async (data: ExtensionFormValues) => {
      const selectedFile = selectedFiles.length > 0 ? selectedFiles[0] : null;

      if (!isEdit && !selectedFile) {
        toast.error("File Required", {
          description: "Please upload the extension letter.",
        });
        return;
      }

      startTransition(async () => {
        const formData = selectedFile ? new FormData() : undefined;
        if (selectedFile && formData) {
          formData.append("file", selectedFile);
        }

        if (isEdit && extension) {
          const input = {
            extensionId: extension.id,
            extensionDate: data.extensionDate,
            newEvaluationDate: data.newEvaluationDate,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            notes: data.notes,
          };

          const result = await updateTenderExtension(
            organizationId,
            input,
            formData,
          );
          if (result.success) {
            toast.success("Extension updated successfully");
            setOpen(false);
            router.refresh();
          } else {
            toast.error(result.error || "Failed to update extension");
          }
        } else {
          const input = {
            tenderId,
            extensionDate: data.extensionDate,
            newEvaluationDate: data.newEvaluationDate,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            notes: data.notes,
          };

          const result = await createTenderExtension(
            organizationId,
            input,
            formData!,
          );
          if (result.success) {
            toast.success("Tender extension created successfully");
            setOpen(false);
            form.reset();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to create tender extension");
          }
        }
      });
    },
    [
      extension,
      organizationId,
      tenderId,
      setOpen,
      router,
      form,
      selectedFiles,
      isEdit,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Add Extension
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px] md:max-w-[780px] overflow-y-auto max-h-[90vh]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-amber-500" />
            {isEdit ? "Edit Tender Extension" : "Add Tender Extension"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-sm">
            Record a formal validity extension granted by the client to update
            the live validity deadline.
          </DialogDescription>
        </DialogHeader>

        {isEdit && !isLatestExtension && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Not the active extension
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs">
                This is not the latest extension. Editing this record will
                update its metadata but <strong>will not affect</strong> the
                tender's current evaluation deadline — that is governed by the
                most recent extension.
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-1"
          >
            {/* Validity Dates (2-col grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="extensionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-semibold">
                      Extension Notice Date *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="text-xs sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newEvaluationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm font-semibold">
                      New Validity Evaluation Date *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="text-xs sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client Official Contact Details (2-col grid) */}
            <div className="space-y-3 border-t border-border/40 pt-3">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Client Official Contact Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-semibold">
                        Contact Person Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Official contact name"
                            className="pl-9 text-xs sm:text-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-semibold">
                        Contact Email *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="official@client.gov.za"
                            type="email"
                            className="pl-9 text-xs sm:text-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-semibold">
                        Contact Phone Number
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="011 800 2000"
                            className="pl-9 text-xs sm:text-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Document upload */}
            <div className="space-y-2 border-t border-border/40 pt-3">
              <FormLabel className="text-xs sm:text-sm font-semibold">
                Extension Letter Document {!isEdit && "*"}
              </FormLabel>
              <FileUploader
                value={selectedFiles}
                onValueChange={setSelectedFiles}
                maxFiles={1}
                accept={{
                  "application/pdf": [".pdf"],
                  "application/msword": [".doc"],
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    [".docx"],
                }}
                maxSize={10 * 1024 * 1024}
              />
              {isEdit &&
                extension?.documents &&
                extension.documents.length > 0 &&
                selectedFiles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Current file:{" "}
                    <span className="font-semibold text-foreground">
                      {extension.documents[0]?.name}
                    </span>
                    . Upload a new file above to replace it.
                  </p>
                )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm font-semibold">
                    Extension Notes & Justification
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter details from the extension notice, rationale provided by the client, or special stipulations..."
                      className="min-h-[85px] text-xs sm:text-sm leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold h-9 px-4"
              >
                {isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                {isEdit ? "Save Changes" : "Record Extension"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
