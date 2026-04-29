CREATE INDEX "client_organization_id_idx" ON "client" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "client_deleted_at_idx" ON "client" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "project_organization_id_idx" ON "project" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_status_idx" ON "project" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_tender_id_idx" ON "project" USING btree ("tender_id");--> statement-breakpoint
CREATE INDEX "project_deleted_at_idx" ON "project" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "purchase_order_organization_id_idx" ON "purchase_order" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "purchase_order_project_id_idx" ON "purchase_order" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "purchase_order_status_idx" ON "purchase_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "purchase_order_deleted_at_idx" ON "purchase_order" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "tender_organization_id_idx" ON "tender" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tender_status_idx" ON "tender" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tender_submission_date_idx" ON "tender" USING btree ("submission_date");--> statement-breakpoint
CREATE INDEX "tender_evaluation_date_idx" ON "tender" USING btree ("evaluation_date");--> statement-breakpoint
CREATE INDEX "tender_deleted_at_idx" ON "tender" USING btree ("deleted_at");