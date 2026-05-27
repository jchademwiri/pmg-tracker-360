ALTER TYPE "public"."role" ADD VALUE 'manager' BEFORE 'member';--> statement-breakpoint
CREATE TABLE "organization_deletion_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"organization_name" text NOT NULL,
	"deleted_by" text NOT NULL,
	"deletion_reason" text,
	"deletion_type" text DEFAULT 'soft' NOT NULL,
	"data_exported" boolean DEFAULT false NOT NULL,
	"export_format" text,
	"confirmation_token" text NOT NULL,
	"related_data_count" text,
	"soft_deleted_at" timestamp DEFAULT now() NOT NULL,
	"permanent_deletion_scheduled_at" timestamp,
	"permanent_deleted_at" timestamp,
	"restored_at" timestamp,
	"restored_by" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "organization_security_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"require_2fa" boolean DEFAULT false NOT NULL,
	"ip_whitelist" text,
	"session_timeout" text DEFAULT '86400' NOT NULL,
	"max_concurrent_sessions" text DEFAULT '5' NOT NULL,
	"login_attempt_limit" text DEFAULT '5' NOT NULL,
	"lockout_duration" text DEFAULT '900' NOT NULL,
	"password_policy" text,
	"audit_retention_days" text DEFAULT '365' NOT NULL,
	"auto_permanent_delete_days" text DEFAULT '30' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ownership_transfer" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"from_user_id" text NOT NULL,
	"to_user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transfer_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"cancelled_at" timestamp,
	"metadata" text,
	CONSTRAINT "ownership_transfer_transfer_token_unique" UNIQUE("transfer_token")
);
--> statement-breakpoint
CREATE TABLE "security_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"session_id" text,
	"severity" text DEFAULT 'info' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"organization_id" text,
	"login_time" timestamp DEFAULT now() NOT NULL,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_info" text,
	"location_info" text,
	"is_suspicious" boolean DEFAULT false NOT NULL,
	"logout_time" timestamp
);
--> statement-breakpoint
ALTER TABLE "contract" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "contract" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "follow_up" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "follow_up" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "deletion_reason" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "permanent_deletion_scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "organization_deletion_log" ADD CONSTRAINT "organization_deletion_log_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_deletion_log" ADD CONSTRAINT "organization_deletion_log_restored_by_user_id_fk" FOREIGN KEY ("restored_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_security_settings" ADD CONSTRAINT "organization_security_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_audit_log" ADD CONSTRAINT "security_audit_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_audit_log" ADD CONSTRAINT "security_audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_tracking" ADD CONSTRAINT "session_tracking_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_tracking" ADD CONSTRAINT "session_tracking_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract" ADD CONSTRAINT "contract_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up" ADD CONSTRAINT "follow_up_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;