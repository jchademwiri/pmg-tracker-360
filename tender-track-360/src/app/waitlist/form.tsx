'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useActionState, useRef, useTransition } from 'react';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { submitWaitlistForm } from './action';
import { formSchema } from './schema';
import { Sparkles, CheckCircle2 } from 'lucide-react';

type FormValues = z.infer<typeof formSchema>;

export function WaitlistForm() {
  const [state, formAction] = useActionState(submitWaitlistForm, {
    message: '',
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      companyName: '',
    },
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      formAction(new FormData(formRef.current!));
      form.reset();
    });
  };

  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="max-w-md w-full mx-auto border-white/10 bg-card/50 backdrop-blur-sm shadow-xl">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="mx-auto text-green-500 inline-flex items-center gap-2 rounded-full border border-green-500/20 px-3 py-1 text-xs font-medium ">
          <Sparkles className="h-3 w-3" />
          <span className="">Coming Soon</span>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Join the Waitlist
          </CardTitle>
          <CardDescription className="text-balance text-base">
            Get early access to the most advanced tender management platform.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {state.message && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{state.message}</p>
          </div>
        )}

        <Form {...form}>
          <form
            ref={formRef}
            action={formAction}
            onSubmit={onSubmit}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Company Name{' '}
                    <span className="text-muted-foreground font-normal text-xs ml-1">
                      (Optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Corp"
                      {...field}
                      value={field.value ?? ''}
                      className="bg-background/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@company.com"
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
              className="w-full bg-primary cursor-pointer hover:bg-primary/90 text-primary-foreground font-semibold h-11"
              disabled={isPending}
            >
              {isPending ? 'Joining...' : 'Join the Waitlist'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
