ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "award_value" numeric(15, 2);
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "loss_reason" text;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "loss_details" text;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "evaluation_notes" text;
