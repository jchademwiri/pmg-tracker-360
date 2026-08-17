"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  useActionState,
  useRef,
  useTransition,
  useState,
  useEffect,
} from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm } from "./action";
import { formSchema } from "./schema";

type FormValues = z.infer<typeof formSchema>;

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, {
    message: "",
  });

  const [formMountedAt, setFormMountedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    setFormMountedAt(Date.now());
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      details: "",
      company_website_hp: "",
      formMountedAt,
    },
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      formAction(new FormData(formRef.current!));
      form.reset();
      setFormMountedAt(Date.now());
    });
  };

  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="w-full space-y-6">
      <div className="text-left mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Send us a message</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Fill out the form below and we'll get back to you shortly.
        </p>

        {state.message && (
          <div
            role="status"
            className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium border transition-all duration-200 ${
              state.success
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
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
          className="space-y-5"
        >
          {/* Honeypot field (hidden from humans, caught by bots) */}
          <div
            aria-hidden="true"
            className="opacity-0 absolute -z-50 select-none pointer-events-none h-0 w-0 overflow-hidden"
            tabIndex={-1}
          >
            <label htmlFor="company_website_hp">Leave this field blank</label>
            <input
              id="company_website_hp"
              type="text"
              name="company_website_hp"
              autoComplete="off"
              tabIndex={-1}
              defaultValue=""
            />
            <input type="hidden" name="formMountedAt" value={formMountedAt} />
          </div>

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
                    className="min-h-[120px] resize-y"
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
            {isPending ? "Sending..." : "Contact Us"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
