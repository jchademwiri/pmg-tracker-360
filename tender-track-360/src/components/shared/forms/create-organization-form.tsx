'use client';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader, Check, X, AlertCircle, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

const createOrganizationFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(50, 'Organization name must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'Organization name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(
      /^[a-z0-9\-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
    .refine(
      (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
      'Slug cannot start or end with a hyphen'
    ),
  logo: z.string().url('Logo must be a valid URL').optional().or(z.literal('')),
});

type SlugValidationState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'error';

interface CreateOrganizationFormProps {
  currentOrganizationCount?: number;
}

export function CreateOrganizationForm({
  currentOrganizationCount = 0,
}: CreateOrganizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [slugManuallyChanged, setSlugManuallyChanged] = useState(false);
  const [slugEditable, setSlugEditable] = useState(false);
  const [slugValidation, setSlugValidation] =
    useState<SlugValidationState>('idle');
  const [slugCheckTimeout, setSlugCheckTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof createOrganizationFormSchema>>({
    resolver: zodResolver(createOrganizationFormSchema),
    mode: 'onSubmit', // Show validation errors on change
    defaultValues: {
      name: '',
      slug: '',
      logo: '',
    },
  });

  const watchedName = form.watch('name');
  const debouncedName = useDebounce(watchedName, 500);

  useEffect(() => {
    if (debouncedName) {
      form.trigger('name');
      if (!slugManuallyChanged) {
        const newSlug = slugify(debouncedName);
        form.setValue('slug', newSlug, {
          shouldValidate: true,
        });
        if (newSlug) {
          debouncedSlugCheck(newSlug);
        }
      }
    }
  }, [debouncedName, form, slugManuallyChanged]);

  // Slugify helper
  function slugify(text: string) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Debounced slug validation
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugValidation('idle');
      return;
    }

    setSlugValidation('checking');

    try {
      const result = await authClient.organization.checkSlug({ slug });
      setSlugValidation(result.data?.status ? 'available' : 'taken');
    } catch (error) {
      console.error('Error checking slug availability:', error);
      setSlugValidation('error');
    }
  }, []);

  // Debounce slug checking
  const debouncedSlugCheck = useCallback(
    (slug: string) => {
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }

      const timeout = setTimeout(() => {
        checkSlugAvailability(slug);
      }, 500);

      setSlugCheckTimeout(timeout);
    },
    [checkSlugAvailability, slugCheckTimeout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }
    };
  }, [slugCheckTimeout]);

  async function onSubmit(
    values: z.infer<typeof createOrganizationFormSchema>
  ) {
    // Final slug availability check before submission
    if (slugValidation === 'taken') {
      toast.error(
        'This organization slug is already taken. Please choose a different one.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.organization.create({
        name: values.name,
        slug: values.slug,
        logo: values.logo || undefined,
      });

      // Set the newly created organization as active
      if (result.data?.id) {
        await authClient.organization.setActive({
          organizationId: result.data.id,
        });
      }

      // Show success state with animation
      setIsSuccess(true);
      toast.success('Organization created successfully!');

      // Navigate immediately for production responsiveness
      router.push(`/dashboard`);
      router.refresh();
    } catch (error: unknown) {
      console.error('Organization creation error:', error);

      // Handle specific error cases
      if (
        typeof error === 'object' &&
        error &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        const errorMessage = (
          error as { message: string }
        ).message.toLowerCase();

        if (errorMessage.includes('slug')) {
          toast.error(
            'This organization slug is already taken. Please choose a different one.'
          );
          setSlugValidation('taken');
        } else if (errorMessage.includes('name')) {
          toast.error('An organization with this name already exists.');
        } else {
          toast.error('Failed to create organization. Please try again.');
        }
      } else {
        toast.error('Failed to create organization. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Get slug validation icon and color
  const getSlugValidationIcon = () => {
    switch (slugValidation) {
      case 'checking':
        return <Loader className="size-4 animate-spin text-muted-foreground" />;
      case 'available':
        return <Check className="size-4 text-green-600" />;
      case 'taken':
        return <X className="size-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="size-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getSlugValidationMessage = () => {
    switch (slugValidation) {
      case 'checking':
        return 'Checking availability...';
      case 'available':
        return 'This slug is available!';
      case 'taken':
        return 'This slug is already taken';
      case 'error':
        return 'Error checking availability';
      default:
        return null;
    }
  };

  // Show limit reached message before form if user has reached max organizations
  if (currentOrganizationCount >= 2) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="relative">
          <div className="size-16 bg-linear-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="size-8 text-amber-600" />
          </div>
        </div>

        <div className="text-center space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          <h3 className="text-lg font-bold text-amber-900">
            Organization Limit Reached
          </h3>
          <p className="text-sm text-amber-700">
            You&#x27;ve reached the maximum number of organizations (2/2) for
            your current plan.
          </p>
          <p className="text-xs text-muted-foreground">
            Upgrade to Pro to create unlimited organizations and unlock more
            features.
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="relative">
          {/* Main success circle with faster animations */}
          <div className="size-16 bg-linear-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
            <Check className="size-8 text-green-600 animate-in zoom-in-50 duration-150" />
          </div>

          {/* Simplified ripple effect */}
          <div className="absolute inset-0 size-16 bg-green-200 rounded-full animate-ping opacity-75"></div>
        </div>

        <div className="text-center space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          <h3 className="text-lg font-bold text-green-900">
            🎉 Organization Created!
          </h3>
          <p className="text-sm text-green-700">
            Redirecting you to your new organization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Organization Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your organization name"
                  className={cn(
                    'transition-all duration-200',
                    fieldState.error && 'border-red-500 focus:border-red-500',
                    !fieldState.error && field.value && 'border-green-500'
                  )}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                This will be the display name for your organization
              </FormDescription>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Organization Slug
              </FormLabel>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <FormControl>
                      <Input
                        placeholder="organization-slug"
                        className={cn(
                          'transition-all duration-200 pr-10',
                          fieldState.error &&
                            'border-red-500 focus:border-red-500',
                          !fieldState.error &&
                            field.value &&
                            slugValidation === 'available' &&
                            'border-green-500',
                          !fieldState.error &&
                            field.value &&
                            slugValidation === 'taken' &&
                            'border-red-500'
                        )}
                        {...field}
                        disabled={!slugEditable}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9\-]/g, '');
                          field.onChange(value);
                          setSlugManuallyChanged(
                            value !== slugify(debouncedName)
                          );
                          if (value) {
                            debouncedSlugCheck(value);
                          } else {
                            setSlugValidation('idle');
                          }
                        }}
                      />
                    </FormControl>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getSlugValidationIcon()}
                    </div>
                  </div>
                  {!slugEditable && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setSlugEditable(true)}
                    >
                      <Eye className="size-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>

                {/* URL Preview */}
                {field.value && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <span className="text-xs text-muted-foreground">
                      URL Preview:
                    </span>
                    <Badge variant="secondary" className="text-xs font-mono">
                      /dashboard/settings/organization/{field.value}
                    </Badge>
                  </div>
                )}

                {/* Slug validation message */}
                {getSlugValidationMessage() && (
                  <p
                    className={cn(
                      'text-xs',
                      slugValidation === 'available' && 'text-green-600',
                      slugValidation === 'taken' && 'text-red-600',
                      slugValidation === 'checking' && 'text-muted-foreground',
                      slugValidation === 'error' && 'text-yellow-600'
                    )}
                  >
                    {getSlugValidationMessage()}
                  </p>
                )}
              </div>
              <FormDescription className="text-xs text-muted-foreground">
                This will be used in your organization&#x27;s URL. Only
                lowercase letters, numbers, and hyphens allowed.
              </FormDescription>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logo"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Logo URL (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/logo.png"
                  className={cn(
                    'transition-all duration-200',
                    fieldState.error && 'border-red-500 focus:border-red-500',
                    !fieldState.error && field.value && 'border-green-500'
                  )}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                Provide a URL to your organization&#x27;s logo image
              </FormDescription>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button
          disabled={
            !form.formState.isValid ||
            isLoading ||
            slugValidation === 'taken' ||
            slugValidation === 'checking' ||
            currentOrganizationCount >= 2
          }
          type="submit"
          className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center animate-in fade-in-0 duration-200">
              <Loader className="size-4 animate-spin mr-2" />
              <span className="animate-pulse">Creating Organization...</span>
            </div>
          ) : (
            <span className="transition-all duration-200">
              Create Organization
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
