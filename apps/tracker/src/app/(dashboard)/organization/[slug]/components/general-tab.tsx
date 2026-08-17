"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@pmg/db/schema";
import { updateOrganizationDetails } from "@/server/organization-members";
import { updateOrganizationLogo } from "@/server/organizations";
import { AvatarUpload } from "../../../settings/profile/components/avatar-upload";

interface GeneralTabProps {
  organization: {
    id: string;
    name: string;
    slug?: string | null;
    logo?: string | null;
    metadata?: string | null;
    createdAt: Date;
  };
  userRole: Role;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

// Form schema for organization details
const organizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

// Helper function to check if user can edit
function canEditOrganization(role: Role): boolean {
  return ["owner", "admin", "manager"].includes(role);
}

// Helper function to get organization initials
function getOrganizationInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function GeneralTab({
  organization,
  userRole,
  currentUser: _currentUser,
}: GeneralTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Preview URL for the logo avatar. The form itself stores the durable
  // storage key (or external URL) so saving details never persists a
  // short-lived signed URL.
  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization.logo || null,
  );
  const canEdit = canEditOrganization(userRole);

  // Parse metadata if it exists
  const metadata = organization.metadata
    ? typeof organization.metadata === "string"
      ? (() => {
          try {
            return JSON.parse(organization.metadata);
          } catch {
            return {};
          }
        })()
      : organization.metadata
    : {};

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization.name,
      description: metadata.description || "",
      logo: organization.logo || "",
      website: metadata.website || "",
      phone: metadata.phone || "",
      address: metadata.address || "",
    },
  });

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await updateOrganizationLogo(organization.id, formData);
  };

  const handleLogoChange = (
    imageUrl: string | null,
    storageKey?: string | null,
  ) => {
    // Persist the durable key (or an external URL) in the form; the signed
    // URL is only used for immediate display.
    const value = storageKey || imageUrl || "";
    form.setValue("logo", value);
    setLogoPreview(imageUrl || value);
  };

  const handleLogoRemove = () => {
    form.setValue("logo", "");
    setLogoPreview(null);
  };

  const onSubmit = async (data: OrganizationFormData) => {
    if (!canEdit) {
      toast.error("You do not have permission to edit this organization");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateOrganizationDetails(organization.id, {
        name: data.name,
        logo: data.logo,
        description: data.description,
        website: data.website,
        phone: data.phone,
        address: data.address,
      });

      if (result.success) {
        toast.success("Organization updated successfully", {
          description: "Your organization details have been saved.",
        });
      } else {
        toast.error(result.error?.message || "Failed to update organization");
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Failed to update organization", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Details (logo + information) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            {canEdit
              ? "Update your organization logo, information, and contact details"
              : "View organization information and contact details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center py-2 border-b">
            <AvatarUpload
              currentImage={logoPreview}
              userName={organization.name}
              onImageChange={handleLogoChange}
              onImageRemove={handleLogoRemove}
              disabled={!canEdit}
              uploadAction={handleLogoUpload}
              entityName="Organization Logo"
            />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter organization name"
                          disabled={!canEdit}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This is your organization&#x27;s display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://www.example.com"
                          disabled={!canEdit}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your organization&#x27;s website URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your organization..."
                        className="min-h-[100px]"
                        disabled={!canEdit}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of your organization and what you do.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          disabled={!canEdit}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Primary contact phone number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Business Street, City, State, ZIP Code"
                        className="min-h-[80px]"
                        disabled={!canEdit}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your organization&#x27;s primary business address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canEdit && (
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Organization
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!canEdit && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  You have read-only access to this organization. Contact an
                  admin or owner to make changes.
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
