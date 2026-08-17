ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "appeal_status" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "appeal_reason" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "appealed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "must_set_password" boolean DEFAULT false NOT NULL;