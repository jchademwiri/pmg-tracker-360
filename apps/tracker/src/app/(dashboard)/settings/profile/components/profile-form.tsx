'use client';

import { useState, useTransition, useOptimistic, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useFormFocusManagement } from '@/hooks/use-focus-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Save, X, Loader2 } from 'lucide-react';
import { AvatarUpload } from './avatar-upload';
import { updateUserImage } from '@/server/users';

// Validation schema for profile form
const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  onSubmit: (
    data: ProfileFormData
  ) => Promise<{ success: boolean; message: string; data?: unknown }>;
}

export function ProfileForm({ user, onSubmit }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { focusFirstError, announceError } = useFormFocusManagement();

  // Optimistic state for user data
  const [optimisticUser, updateOptimisticUser] = useOptimistic(
    user,
    (state, updates: { name?: string; image?: string | null }) => ({
      ...state,
      ...updates,
    })
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
    },
  });

  // Focus first error when form validation fails
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      focusFirstError(form.formState.errors);
      const firstError = Object.values(form.formState.errors)[0];
      if (firstError?.message) {
        announceError(`Form validation error: ${firstError.message}`);
      }
    }
  }, [form.formState.errors, focusFirstError, announceError]);

  const handleSubmit = async (data: ProfileFormData) => {
    startTransition(async () => {
      // Start optimistic update inside the transition
      updateOptimisticUser({ name: data.name });

      try {
        const result = await onSubmit(data);

        if (result.success) {
          toast.success(result.message);
          setIsEditing(false);
          form.reset(data); // Reset form with new values
        } else {
          // Revert optimistic update on error
          updateOptimisticUser({ name: user.name });
          toast.error(result.message);

          // Handle field-specific errors
          if (result.data) {
            Object.entries(result.data).forEach(([field, errors]) => {
              if (Array.isArray(errors) && errors.length > 0) {
                form.setError(field as keyof ProfileFormData, {
                  type: 'server',
                  message: errors[0],
                });
              }
            });
          }
        }
      } catch (error) {
        // Revert optimistic update on error
        updateOptimisticUser({ name: user.name });
        toast.error('An unexpected error occurred. Please try again.');
        console.error('Profile update failed:', error);
      }
    });
  };

  const handleImageChange = (imageUrl: string | null) => {
    startTransition(() => {
      updateOptimisticUser({ image: imageUrl });
    });
  };

  const handleImageRemove = () => {
    updateOptimisticUser({ image: null });
    // In a real app, you would also remove the image from the server here
  };

  const handleCancel = () => {
    form.reset({ name: user.name }); // Reset to original values
    setIsEditing(false);
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await updateUserImage(formData);
  };

  return (
    <section aria-labelledby="profile-form-heading">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <CardTitle
              id="profile-form-heading"
              className="text-base sm:text-lg"
            >
              Profile Information
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                className="w-fit"
                aria-label="Edit profile information"
              >
                <Edit className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2 sm:inline">Edit</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
              aria-describedby="profile-form-description"
              noValidate
            >
              {/* Profile Picture Upload */}
              <div className="flex justify-center">
                <AvatarUpload
                  currentImage={optimisticUser.image}
                  userName={optimisticUser.name}
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                  disabled={isPending}
                  uploadAction={handleUpload}
                />
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!isEditing || isPending}
                        placeholder="Enter your full name"
                        value={isEditing ? field.value : optimisticUser.name}
                        aria-describedby="name-description"
                      />
                    </FormControl>
                    <FormDescription id="name-description">
                      Your display name (2-50 characters, letters and spaces
                      only)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isPending || !form.formState.isDirty}
                    className="flex items-center justify-center space-x-2"
                  >
                    {isPending ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{isPending ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="flex items-center justify-center space-x-2"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>Cancel</span>
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
