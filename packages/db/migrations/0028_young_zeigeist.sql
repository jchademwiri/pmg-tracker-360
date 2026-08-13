ALTER TABLE "organization" ADD COLUMN "appeal_status" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "appeal_reason" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "appealed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "must_set_password" boolean DEFAULT false NOT NULL;