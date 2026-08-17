ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "contact_name" text;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "contact_email" text;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "contact_phone" text;
