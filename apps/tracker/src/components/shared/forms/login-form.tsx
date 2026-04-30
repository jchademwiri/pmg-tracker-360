'use client';

import { cn } from '@/lib/utils';
import { Button } from '@pmg/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@pmg/ui/components/ui/card';
import { Input } from '@pmg/ui/components/ui/input';

import { signIn, sendVerificationEmail } from '@/server';
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
} from '@pmg/ui/components/ui/form';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader } from 'lucide-react';
import { signInWithGoogle, getRedirectPath } from '@/lib/auth-client';
import { LockKeyhole } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState('');

  // 1. Define your form.
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    setIsLoading(true);
    const { success, message } = await signIn(values.email, values.password);
    if (success) {
      toast.success(message as string);
      // If a `next` param is present in the URL, return there after login; otherwise go to dashboard or root depending on subdomain
      try {
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next') || params.get('callbackUrl');
        window.location.replace(next || getRedirectPath());
      } catch (e) {
        window.location.replace(getRedirectPath());
      }
    } else {
      toast.error(message as string);
      if (
        (message as string).toLowerCase().includes('verify') ||
        (message as string).toLowerCase().includes('verification')
      ) {
        setShowResend(true);
        setEmailToVerify(values.email);
      }
    }
    setIsLoading(false);
  }

  async function onResendVerification() {
    setIsLoading(true);
    const { success, message } = await sendVerificationEmail(emailToVerify);
    if (success) {
      toast.success(message as string);
      setShowResend(false);
    } else {
      toast.error(message as string);
    }
    setIsLoading(false);
  }
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden border-white/10 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-3 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Login to your Tender Track 360 account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="m@example.com"
                          {...field}
                          className="bg-background/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-xs underline-offset-2 hover:underline text-muted-foreground"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                          className="bg-background/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isLoading ? (
                    <Loader className="size-4 animate-spin" />
                  ) : (
                    'Login'
                  )}
                </Button>

                {showResend && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onResendVerification}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Resend Verification Email
                  </Button>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-muted-foreground">Or continue with</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    const next =
                      params.get('next') || params.get('callbackUrl');
                    signInWithGoogle(next || undefined);
                  }}
                  className="w-full cursor-pointer bg-background/50 hover:bg-background/80"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 h-4 w-4"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>

                <div className="text-center text-sm">
                  Don&#x27;t have an account?{' '}
                  <Link
                    href="/sign-up"
                    className="underline underline-offset-4 font-medium text-primary hover:text-primary/90"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </Form>

          {/* Terms — inside the card, separated by a subtle border */}
          <div className="mt-6 pt-5 border-t border-border/50 text-center text-xs text-muted-foreground/60 text-balance">
            By clicking continue, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-primary transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            .
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
