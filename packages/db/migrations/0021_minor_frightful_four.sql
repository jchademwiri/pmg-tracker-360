CREATE TABLE "tender_follow_up" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"tender_id" text NOT NULL,
	"follow_up_date" timestamp NOT NULL,
	"contact_person" text,
	"notes" text,
	"outcome" text,
	"next_follow_up_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN "priority" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "tender_follow_up" ADD CONSTRAINT "tender_follow_up_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender_follow_up" ADD CONSTRAINT "tender_follow_up_tender_id_tender_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tender"("id") ON DELETE cascade ON UPDATE no action;