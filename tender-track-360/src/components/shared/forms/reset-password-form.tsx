'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import {
  Loader,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';

const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

function ResetPasswordFormContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // 1. Define your form.
  const form = useForm<z.infer<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof resetPasswordFormSchema>) {
    if (!token) {
      toast.error(
        'Invalid reset token. Please request a new password reset link.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token: token,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setPasswordReset(true);
        toast.success('Password has been reset successfully!');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Check if token exists
  if (!token) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4',
          className
        )}
        {...props}
      >
        <div className="w-full max-w-4xl">
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px]">
              <div className="flex items-center justify-center p-8 md:p-12">
                <div className="w-full max-w-sm space-y-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight">
                        Invalid Reset Link
                      </h1>
                      <p className="text-muted-foreground text-lg">
                        This password reset link is invalid or has expired.
                        Please request a new one.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push('/forgot-password')}
                      className="w-full h-12 text-base font-semibold cursor-pointer"
                      size="lg"
                    >
                      Request New Reset Link
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => router.push('/login')}
                      className="w-full h-12 text-base cursor-pointer"
                      size="lg"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-background relative hidden md:block">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-foreground space-y-4 p-8">
                    <Shield className="w-16 h-16 mx-auto opacity-80" />
                    <h2 className="text-2xl font-bold">
                      Secure Password Reset
                    </h2>
                    <p className="text-primary text-lg">
                      Your security is our priority. We use industry-standard
                      encryption to protect your account.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state after password reset
  if (passwordReset) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4',
          className
        )}
        {...props}
      >
        <div className="w-full max-w-4xl">
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px]">
              <div className="flex items-center justify-center p-8 md:p-12">
                <div className="w-full max-w-sm space-y-8">
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="space-y-3">
                      <h1 className="text-3xl font-bold tracking-tight text-green-900">
                        Password Reset Successful!
                      </h1>
                      <p className="text-muted-foreground text-lg">
                        Your password has been successfully reset. You can now
                        login with your new password.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 cursor-pointer"
                    size="lg"
                  >
                    Continue to Login
                  </Button>
                </div>
              </div>
              <div className="bg-background relative hidden md:block">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-foreground space-y-4 p-8">
                    <CheckCircle className="w-16 h-16 mx-auto opacity-80 text-green-600" />
                    <h2 className="text-2xl font-bold">All Set!</h2>
                    <p className="text-foreground text-lg">
                      Your account is now secure with your new password. Welcome
                      back to Tender Track 360!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4',
        className
      )}
      {...props}
    >
      <div className="w-full max-w-4xl">
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2 min-h-[600px]">
            <div className="flex items-center justify-center p-8 md:p-12">
              <div className="w-full max-w-sm">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    <div className="text-center space-y-3">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                          Reset Your Password
                        </h1>
                        <p className="text-muted-foreground text-lg">
                          Enter your new password below
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              New Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your new password"
                                type="password"
                                className="h-12 text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              Confirm New Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Confirm your new password"
                                type="password"
                                className="h-12 text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 text-base font-semibold cursor-pointer"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader className="mr-2 h-5 w-5 animate-spin" />
                            Resetting Password...
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => router.push('/login')}
                        className="w-full h-12 text-base cursor-pointer"
                        size="lg"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </div>

                    <div className="text-center text-base">
                      <span className="text-muted-foreground">
                        Remember your password?{' '}
                      </span>
                      <Link
                        href="/login"
                        className="font-medium text-blue-600 hover:text-blue-500 underline underline-offset-4"
                      >
                        Sign in
                      </Link>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
            <div className="bg-background relative hidden md:block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-foreground space-y-6 p-8">
                  <Shield className="w-20 h-20 mx-auto opacity-80" />
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold">Secure & Protected</h2>
                    <p className="text-foreground text-lg leading-relaxed">
                      Your new password will be encrypted and stored securely.
                      We follow industry best practices to keep your account
                      safe.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm text-foreground mt-8">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
                      256-bit encryption
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
                      Secure token validation
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
                      Auto-expiring links
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-8">
          <div className="text-muted-foreground text-sm">
            <Link
              href="/"
              className="hover:text-primary underline underline-offset-4 transition-colors"
            >
              Terms of Service
            </Link>
            <span className="mx-2">•</span>
            <Link
              href="/"
              className="hover:text-primary underline underline-offset-4 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function ResetPasswordFormFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2 min-h-[600px]">
            <div className="flex items-center justify-center p-8 md:p-12">
              <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                      Loading...
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Please wait while we verify your reset token.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background relative hidden md:block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-foreground space-y-4 p-8">
                  <Shield className="w-16 h-16 mx-auto opacity-80" />
                  <h2 className="text-2xl font-bold">Secure Password Reset</h2>
                  <p className="text-primary text-lg">
                    Your security is our priority. We use industry-standard
                    encryption to protect your account.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <Suspense fallback={<ResetPasswordFormFallback />}>
      <ResetPasswordFormContent className={className} {...props} />
    </Suspense>
  );
}
