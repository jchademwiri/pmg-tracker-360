import { z } from "zod";

export const PaymentMethodSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .min(16, "Card number must be at least 16 digits")
    .max(19, "Card number is too long"),
  cardHolder: z.string().min(1, "Cardholder name is required"),
  expiryDate: z
    .string()
    .min(1, "Expiry date is required")
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Format: MM/YY"),
  cvv: z
    .string()
    .min(1, "CVV is required")
    .min(3, "CVV must be 3-4 digits")
    .max(4, "CVV must be 3-4 digits"),
});

export type PaymentMethodInput = z.infer<typeof PaymentMethodSchema>;
