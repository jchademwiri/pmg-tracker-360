ALTER TABLE "tender" ADD COLUMN "award_value" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN "loss_reason" text;--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN "loss_details" text;--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN "evaluation_notes" text;