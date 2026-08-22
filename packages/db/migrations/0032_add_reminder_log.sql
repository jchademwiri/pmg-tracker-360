CREATE TYPE "public"."reminder_stage" AS ENUM('upcoming_7d', 'upcoming_1d', 'due_today', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('tender_submission', 'tender_evaluation', 'tender_briefing', 'tender_follow_up', 'project_contract_end', 'project_close_out', 'po_expected_delivery');--> statement-breakpoint
CREATE TABLE "reminder_log" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"entity_type" "reminder_type" NOT NULL,
	"entity_id" text NOT NULL,
	"stage" "reminder_stage" NOT NULL,
	"target_date" timestamp NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "reminder_log_dedup_unique" UNIQUE("entity_type","entity_id","stage","target_date")
);
--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reminder_log_org_id" ON "reminder_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_reminder_log_entity" ON "reminder_log" USING btree ("entity_type","entity_id");