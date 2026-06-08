ALTER TABLE "tender" DROP CONSTRAINT IF EXISTS "tender_tender_number_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invitation_organization_id_email_pending_unique" ON "invitation" USING btree ("organization_id","email") WHERE status = 'pending';--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_organization_id_name_unique" UNIQUE("organization_id","name");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_organization_id_project_number_unique" UNIQUE("organization_id","project_number");--> statement-breakpoint
ALTER TABLE "tender" ADD CONSTRAINT "tender_organization_id_tender_number_unique" UNIQUE("organization_id","tender_number");