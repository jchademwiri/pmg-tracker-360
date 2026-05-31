'use client';

import {
  useState,
  useTransition,
  useOptimistic,
  useRef,
  useEffect,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Mail,
  CalendarDays,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Edit2,
  Save,
  X,
  Loader2,
  Clock,
} from 'lucide-react';
import { AvatarUpload } from './avatar-upload';
import { updateUserImage } from '@/server/users';
import type { UpdateProfileData, ActionResult } from '../actions';

// Validation schema
const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface OrganizationMembership {
  id: string;
  role: string;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string | null;
    createdAt: Date;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileSidebarProps {
  currentUser: User;
  organizationMembership: OrganizationMembership | null;
  updateProfile: (data: UpdateProfileData) => Promise<ActionResult>;
}

export function ProfileSidebar({
  currentUser,
  organizationMembership,
  updateProfile,
}: ProfileSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Optimistic state
  const [optimisticUser, updateOptimisticUser] = useOptimistic(
    currentUser,
    (state, updates: { name?: string; image?: string | null }) => ({
      ...state,
      ...updates,
    })
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: currentUser.name,
    },
  });

  // Reset form when user updates externally (though unlikely here)
  useEffect(() => {
    form.reset({ name: currentUser.name });
  }, [currentUser.name, form]);

  const handleSubmit = async (data: ProfileFormData) => {
    startTransition(async () => {
      updateOptimisticUser({ name: data.name });

      try {
        const result = await updateProfile(data);

        if (result.success) {
          toast.success(result.message);
          setIsEditing(false);
          form.reset(data);
        } else {
          updateOptimisticUser({ name: currentUser.name });
          toast.error(result.message);
          if (result.data && typeof result.data === 'object') {
            const errors = result.data as Record<string, string[]>;
            if (errors.name?.[0]) {
              form.setError('name', { message: errors.name[0] });
            }
          }
        }
      } catch (error) {
        updateOptimisticUser({ name: currentUser.name });
        toast.error('An unexpected error occurred.');
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
    // Note: In a real implementation, you'd call a server action to remove the image here
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return await updateUserImage(formData);
  };

  // Helpers
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(currentUser.email);
    toast.success('Email copied to clipboard');
  };

  return (
    <Card className="h-fit sticky top-6 border-muted/60 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Cover / Header Background Pattern */}
      <div className="h-24 bg-linear-to-r from-primary/10 to-primary/5 border-b border-border/50 relative">
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background/80"
            onClick={() => setIsEditing(true)}
            title="Edit Profile"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardHeader className="relative pb-0 pt-0">
        <div className="flex flex-col items-center -mt-12 mb-4">
          {isEditing ? (
            <AvatarUpload
              currentImage={optimisticUser.image}
              userName={optimisticUser.name}
              onImageChange={handleImageChange}
              onImageRemove={handleImageRemove}
              disabled={isPending}
              uploadAction={handleUpload}
            />
          ) : (
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm bg-background">
              <AvatarImage
                src={optimisticUser.image || ''}
                alt={`Profile picture of ${optimisticUser.name}`}
              />
              <AvatarFallback className="text-xl font-medium bg-secondary text-secondary-foreground">
                {getInitials(optimisticUser.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 text-center pt-2">
        <div className="space-y-1">
          {isEditing ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4 px-2"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          className="text-center font-bold h-9"
                          placeholder="Your Name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending || !form.formState.isDirty}
                    className="h-8"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <Save className="h-3 w-3 mr-2" />
                    )}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      form.reset();
                    }}
                    disabled={isPending}
                    className="h-8"
                  >
                    <X className="h-3 w-3 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <h2 className="text-xl font-bold tracking-tight">
              {optimisticUser.name}
            </h2>
          )}

          <div className="flex items-center justify-center space-x-2 text-muted-foreground group">
            <Mail className="h-3.5 w-3.5" />
            <span className="text-sm">{currentUser.email}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={copyEmail}
              aria-label="Copy email address"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Verification Status Badge */}
        <div className="flex justify-center">
          {currentUser.emailVerified ? (
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Verified Account
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200"
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Unverified
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
