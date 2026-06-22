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
import { Textarea } from '@/components/ui/textarea';
import { submitContactForm } from './action';
import { formSchema } from './schema';

type FormValues = z.infer<typeof formSchema>;

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, {
    message: '',
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      details: '',
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
    <div className="w-full space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold">Send us a message</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Fill out the form below and we'll get back to you shortly.
        </p>

        {state.message && (
          <div
            className={`mt-4 px-3 py-2 rounded-md text-sm border ${
              state.success
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 border-red-500/20'
            }`}
          >
            {state.message}
          </div>
        )}
      </div>

      <Form {...form}>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={onSubmit}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormDescription className="sr-only">Your name</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="sr-only">
                  Your email
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us how we can help..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="sr-only">
                  Your message
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Sending...' : 'Contact Us'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
