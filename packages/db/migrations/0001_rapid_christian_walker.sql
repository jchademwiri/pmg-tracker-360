DO $$ BEGIN
  CREATE TYPE "public"."follow_up_status" AS ENUM('under_evaluation', 'appointed', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."tender_status" AS ENUM('draft', 'submitted', 'appointed', 'rejected', 'under_evaluation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contract" (
	"id" text PRIMARY KEY NOT NULL,
	"tender_id" text NOT NULL,
	"follow_up_id" text,
	"contract_number" text,
	"appointed_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"documents" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contract_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "control_center" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"default_email" text,
	"notification_settings" text,
	"preferences" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "follow_up" (
	"id" text PRIMARY KEY NOT NULL,
	"tender_id" text NOT NULL,
	"contact_person" text,
	"phone_number" text NOT NULL,
	"email" text,
	"communication_log" text,
	"extension_letter" text,
	"feedback" text,
	"status_update" "follow_up_status" DEFAULT 'under_evaluation' NOT NULL,
	"next_follow_up_date" timestamp,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "role",
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tender" (
	"id" text PRIMARY KEY NOT NULL,
	"tender_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"client" text NOT NULL,
	"submission_date" timestamp,
	"value" text,
	"status" "tender_status" DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tender_tender_number_unique" UNIQUE("tender_number")
);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "active_organization_id" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "contract" ADD CONSTRAINT "contract_tender_id_tender_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tender"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "contract" ADD CONSTRAINT "contract_follow_up_id_follow_up_id_fk" FOREIGN KEY ("follow_up_id") REFERENCES "public"."follow_up"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "control_center" ADD CONSTRAINT "control_center_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "follow_up" ADD CONSTRAINT "follow_up_tender_id_tender_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tender"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tender" ADD CONSTRAINT "tender_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tender" ADD CONSTRAINT "tender_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;