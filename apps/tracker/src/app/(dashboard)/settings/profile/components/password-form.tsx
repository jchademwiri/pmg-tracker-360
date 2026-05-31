'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useFormFocusManagement } from '@/hooks/use-focus-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  EyeOff,
  Lock,
  Save,
  X,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

// Password strength validation schema
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^a-zA-Z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    signOutOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordFormSchema>;

interface PasswordFormProps {
  onSubmit: (
    data: PasswordFormData
  ) => Promise<{ success: boolean; message: string; data?: unknown }>;
}

// Password strength calculation
const calculatePasswordStrength = (password: string): number => {
  let score = 0;

  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  return Math.min(score, 100);
};

const getPasswordStrengthLabel = (
  strength: number
): { label: string; color: string } => {
  if (strength < 40) return { label: 'Weak', color: 'text-red-500' };
  if (strength < 70) return { label: 'Fair', color: 'text-yellow-500' };
  if (strength < 90) return { label: 'Good', color: 'text-blue-500' };
  return { label: 'Strong', color: 'text-green-500' };
};

export function PasswordForm({ onSubmit }: PasswordFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { focusFirstError, announceError } = useFormFocusManagement();

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      signOutOtherSessions: false,
    },
  });

  // Focus first error when form validation fails
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      focusFirstError(form.formState.errors);
      const firstError = Object.values(form.formState.errors)[0];
      if (firstError?.message) {
        announceError(`Password form error: ${firstError.message}`);
      }
    }
  }, [form.formState.errors, focusFirstError, announceError]);

  const newPassword = form.watch('newPassword');
  const passwordStrength = newPassword
    ? calculatePasswordStrength(newPassword)
    : 0;
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  const handleSubmit = async (data: PasswordFormData) => {
    startTransition(async () => {
      try {
        const result = await onSubmit(data);

        if (result.success) {
          toast.success(result.message);
          setIsEditing(false);
          form.reset();
        } else {
          toast.error(result.message);

          // Handle field-specific errors
          if (result.data) {
            Object.entries(result.data).forEach(([field, errors]) => {
              if (Array.isArray(errors) && errors.length > 0) {
                form.setError(field as keyof PasswordFormData, {
                  type: 'server',
                  message: errors[0],
                });
              }
            });
          }
        }
      } catch (error) {
        toast.error('An unexpected error occurred. Please try again.');
        console.error('Password change failed:', error);
      }
    });
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  // Password requirements checklist
  const passwordRequirements = [
    { test: (pwd: string) => pwd.length >= 8, label: 'At least 8 characters' },
    { test: (pwd: string) => /[a-z]/.test(pwd), label: 'One lowercase letter' },
    { test: (pwd: string) => /[A-Z]/.test(pwd), label: 'One uppercase letter' },
    { test: (pwd: string) => /[0-9]/.test(pwd), label: 'One number' },
    {
      test: (pwd: string) => /[^a-zA-Z0-9]/.test(pwd),
      label: 'One special character',
    },
  ];

  return (
    <section aria-labelledby="password-form-heading">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <CardTitle
              id="password-form-heading"
              className="flex items-center space-x-2 text-base sm:text-lg"
            >
              <Lock className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              <span>Password & Security</span>
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                className="w-fit"
                aria-label="Change password"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">Change Password</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Password
                </label>
                <p className="mt-1 text-sm">
                  Your password was last updated recently. Click "Change
                  Password" to update it.
                </p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
                aria-describedby="password-form-description"
                noValidate
              >
                {/* Current Password */}
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showCurrentPassword ? 'text' : 'password'}
                            disabled={isPending}
                            placeholder="Enter your current password"
                            className="pr-10"
                            aria-describedby="current-password-description"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            disabled={isPending}
                            aria-label={
                              showCurrentPassword
                                ? 'Hide current password'
                                : 'Show current password'
                            }
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription id="current-password-description">
                        Enter your current password to verify your identity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* New Password */}
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showNewPassword ? 'text' : 'password'}
                            disabled={isPending}
                            placeholder="Enter your new password"
                            className="pr-10"
                            aria-describedby="new-password-description password-requirements"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            disabled={isPending}
                            aria-label={
                              showNewPassword
                                ? 'Hide new password'
                                : 'Show new password'
                            }
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="space-y-2" aria-live="polite">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Password strength:
                            </span>
                            <span
                              className={`text-sm font-medium ${strengthInfo.color}`}
                              aria-label={`Password strength: ${strengthInfo.label}`}
                            >
                              {strengthInfo.label}
                            </span>
                          </div>
                          <Progress
                            value={passwordStrength}
                            className="h-2"
                            aria-label={`Password strength: ${passwordStrength}%`}
                          />
                        </div>
                      )}

                      {/* Password Requirements */}
                      {newPassword && (
                        <div className="space-y-1" id="password-requirements">
                          <p className="text-sm text-muted-foreground">
                            Requirements:
                          </p>
                          <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-1"
                            role="list"
                          >
                            {passwordRequirements.map((req, index) => {
                              const isValid = req.test(newPassword);
                              return (
                                <div
                                  key={index}
                                  className={`flex items-center space-x-2 text-xs ${
                                    isValid
                                      ? 'text-green-600'
                                      : 'text-muted-foreground'
                                  }`}
                                  role="listitem"
                                  aria-label={`${req.label}: ${isValid ? 'satisfied' : 'not satisfied'}`}
                                >
                                  {isValid ? (
                                    <Check
                                      className="h-3 w-3 flex-shrink-0"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <AlertCircle
                                      className="h-3 w-3 flex-shrink-0"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span>{req.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            disabled={isPending}
                            placeholder="Confirm your new password"
                            className="pr-10"
                            aria-describedby="confirm-password-description"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={isPending}
                            aria-label={
                              showConfirmPassword
                                ? 'Hide confirm password'
                                : 'Show confirm password'
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription id="confirm-password-description">
                        Re-enter your new password to confirm
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Session Management Option */}
                <FormField
                  control={form.control}
                  name="signOutOtherSessions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                          aria-describedby="session-management-description"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Sign out other sessions</FormLabel>
                        <FormDescription id="session-management-description">
                          Sign out all other devices and sessions after changing
                          your password. This is recommended for security.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
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
                    <span>
                      {isPending ? 'Changing Password...' : 'Change Password'}
                    </span>
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
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
