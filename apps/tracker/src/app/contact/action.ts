"use server";

import { createSupportTicket } from "@/server/support";
import { formSchema } from "./schema";
import {
  checkRateLimit,
  getClientIp,
  verifyBotProtection,
} from "@/lib/bot-protection";

type FormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitContactForm(
  prevState: FormState,
  data: FormData,
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = formSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the form for errors.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const clientIp = await getClientIp();

    // 1. IP Rate Limiting (Max 5 submissions per 10 minutes)
    const rateLimit = checkRateLimit(`contact:${clientIp}`, 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return {
        success: false,
        message: `Too many submissions. Please wait ${Math.ceil((rateLimit.retryAfterSeconds || 60) / 60)} minute(s) before trying again.`,
      };
    }

    // 2. Comprehensive Bot Protection (Honeypot, velocity timing, disposable emails, user-agents)
    const botCheck = await verifyBotProtection({
      name: parsed.data.name,
      email: parsed.data.email,
      honeypot: parsed.data.company_website_hp,
      formMountedAt: parsed.data.formMountedAt,
    });

    if (botCheck.isBot) {
      // Silently drop bot submissions without sending email or database insert
      console.warn(
        `[Anti-Spam] Bot submission blocked from ${clientIp}: ${botCheck.reason}`,
      );
      return {
        success: true,
        message: "Message sent successfully! We will get back to you shortly.",
      };
    }

    // 3. Create Ticket for legitimate inquiry
    const result = await createSupportTicket({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.details,
      subject: "Website Contact Request",
      priority: "medium",
      honeypot: parsed.data.company_website_hp,
      formMountedAt: parsed.data.formMountedAt,
    });

    if (!result.success) {
      return {
        success: false,
        message: result.error || "Failed to submit form",
      };
    }

    return {
      success: true,
      message: "Message sent successfully! We will get back to you shortly.",
    };
  } catch (error) {
    console.error("Contact form error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again or email us directly.",
    };
  }
}
