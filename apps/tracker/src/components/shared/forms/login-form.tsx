'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { signIn, sendVerificationEmail, verifyOTPAndGetToken } from '@/server';
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
import { useState } from 'react';
import { Loader, LockKeyhole, Mail, Key, ShieldCheck } from 'lucide-react';
import { signInWithGoogle, getRedirectPath, authClient } from '@/lib/auth-client';

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [activeTab, setActiveTab] = useState<'password' | 'passcode'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState('');
  
  // Passwordless state
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // 1. Define password form.
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 2. Password submit handler.
  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    setIsLoading(true);
    const { success, message } = await signIn(values.email, values.password);
    if (success) {
      toast.success(message as string);
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

  // 3. Send Magic Link & OTP handler.
  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!emailForOtp || !emailForOtp.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.signIn.magicLink({
        email: emailForOtp.trim().toLowerCase(),
        callbackURL: getRedirectPath(),
      });
      
      if (response?.error) {
        toast.error(response.error.message || 'Failed to send verification link.');
      } else {
        setIsOtpSent(true);
        toast.success('Sign-in link and passcode successfully sent to your inbox!');
      }
    } catch (err) {
      toast.error('Failed to trigger sign-in link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // 4. Verify OTP passcode handler.
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit passcode.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOTPAndGetToken(emailForOtp, otpCode);
      if (response.success && response.token) {
        toast.success('Code verified successfully! Redirecting...');
        // Authenticate programmatically by navigating to standard verification endpoint
        window.location.replace(`/api/auth/magic-link?token=${response.token}&callbackURL=${encodeURIComponent(getRedirectPath())}`);
      } else {
        toast.error(response.error || 'Invalid or expired passcode.');
      }
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        <CardContent className="p-6 md:p-8 pt-0 space-y-6">
          
          {/* TAB SELECTOR */}
          <div className="grid grid-cols-2 p-1 bg-background/60 border border-white/5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab('password');
                setShowResend(false);
              }}
              className={cn(
                "py-2 rounded-md transition-all cursor-pointer",
                activeTab === 'password'
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              PASSWORD
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('passcode');
                setShowResend(false);
              }}
              className={cn(
                "py-2 rounded-md transition-all cursor-pointer",
                activeTab === 'passcode'
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              CODE & LINK
            </button>
          </div>

          {activeTab === 'password' ? (
            /* PASSWORD LOGIN FLOW */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <Link
                              href="/forgot-password"
                              className="text-sm underline-offset-2 hover:underline text-muted-foreground"
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
                  </div>

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
                </div>
              </form>
            </Form>
          ) : (
            /* PASSWORDLESS (OTP/MAGIC LINK) FLOW */
            <div className="space-y-6">
              {!isOtpSent ? (
                /* PHASE 1: Input email to request code */
                <form onSubmit={handleSendMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        disabled={isLoading}
                        value={emailForOtp}
                        onChange={(e) => setEmailForOtp(e.target.value)}
                        placeholder="m@example.com"
                        className="pl-9 bg-background/50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    {isLoading ? (
                      <Loader className="size-4 animate-spin" />
                    ) : (
                      'Send Sign-in Link & Code'
                    )}
                  </Button>
                </form>
              ) : (
                /* PHASE 2: Input 6-digit OTP code to verify */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto my-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Code sent to {emailForOtp}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Click the link in your email to sign in instantly, or enter the 6-digit passcode below:
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="sr-only">6-Digit Passcode</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        maxLength={6}
                        required
                        disabled={isLoading}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="123456"
                        className="pl-9 text-center font-mono tracking-[0.2em] bg-background/50 text-lg font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      {isLoading ? (
                        <Loader className="size-4 animate-spin" />
                      ) : (
                        'Verify Passcode'
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsOtpSent(false)}
                      disabled={isLoading}
                      className="text-xs hover:bg-transparent underline underline-offset-4"
                    >
                      Change email or resend link
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* SOCIAL LOGIN SEGMENT */}
          <div className="space-y-4">
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
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

        </CardContent>
      </Card>
      <div className="text-muted-foreground/60 text-center text-xs text-balance">
        By clicking continue, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-primary">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-primary">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
