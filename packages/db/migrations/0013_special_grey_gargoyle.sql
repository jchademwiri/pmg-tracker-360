CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security_audit_log" DROP CONSTRAINT IF EXISTS "security_audit_log_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "security_audit_log" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint

ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "security_audit_log" ADD CONSTRAINT "security_audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_user_id_unique" UNIQUE("organization_id","user_id");
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id");
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;