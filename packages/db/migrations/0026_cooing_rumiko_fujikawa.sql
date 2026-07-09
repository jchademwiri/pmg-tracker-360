CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ownership_transfer_status" AS ENUM('pending', 'accepted', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('open', 'draft', 'sent', 'delivered', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."risk_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."risk_status" AS ENUM('open', 'mitigated', 'closed');--> statement-breakpoint
CREATE TYPE "public"."tender_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."tender_status" AS ENUM('draft', 'open', 'closed', 'evaluation', 'awarded', 'lost', 'cancelled');--> statement-breakpoint
ALTER TABLE "document" ALTER COLUMN "size" SET DATA TYPE bigint USING NULLIF("size", '')::bigint;--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."invitation_status";--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "status" SET DATA TYPE "public"."invitation_status" USING "status"::"public"."invitation_status";--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "metadata" SET DATA TYPE jsonb USING "metadata"::jsonb;--> statement-breakpoint
ALTER TABLE "ownership_transfer" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."ownership_transfer_status";--> statement-breakpoint
ALTER TABLE "ownership_transfer" ALTER COLUMN "status" SET DATA TYPE "public"."ownership_transfer_status" USING "status"::"public"."ownership_transfer_status";--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."project_status";--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "status" SET DATA TYPE "public"."project_status" USING "status"::"public"."project_status";--> statement-breakpoint
ALTER TABLE "project_risk" ALTER COLUMN "severity" SET DEFAULT 'medium'::"public"."risk_severity";--> statement-breakpoint
ALTER TABLE "project_risk" ALTER COLUMN "severity" SET DATA TYPE "public"."risk_severity" USING "severity"::"public"."risk_severity";--> statement-breakpoint
ALTER TABLE "project_risk" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."risk_status";--> statement-breakpoint
ALTER TABLE "project_risk" ALTER COLUMN "status" SET DATA TYPE "public"."risk_status" USING "status"::"public"."risk_status";--> statement-breakpoint
ALTER TABLE "purchase_order" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."po_status";--> statement-breakpoint
ALTER TABLE "purchase_order" ALTER COLUMN "status" SET DATA TYPE "public"."po_status" USING "status"::"public"."po_status";--> statement-breakpoint
ALTER TABLE "security_audit_log" ALTER COLUMN "details" SET DATA TYPE jsonb USING "details"::jsonb;--> statement-breakpoint
ALTER TABLE "session_tracking" ALTER COLUMN "device_info" SET DATA TYPE jsonb USING "device_info"::jsonb;--> statement-breakpoint
ALTER TABLE "session_tracking" ALTER COLUMN "location_info" SET DATA TYPE jsonb USING "location_info"::jsonb;--> statement-breakpoint
ALTER TABLE "tender" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."tender_status";--> statement-breakpoint
ALTER TABLE "tender" ALTER COLUMN "status" SET DATA TYPE "public"."tender_status" USING "status"::"public"."tender_status";--> statement-breakpoint
ALTER TABLE "tender" ALTER COLUMN "priority" SET DEFAULT 'medium'::"public"."tender_priority";--> statement-breakpoint
ALTER TABLE "tender" ALTER COLUMN "priority" SET DATA TYPE "public"."tender_priority" USING "priority"::"public"."tender_priority";--> statement-breakpoint
CREATE INDEX "idx_client_org_id" ON "client" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_doc_tender_id" ON "document" USING btree ("tender_id");--> statement-breakpoint
CREATE INDEX "idx_doc_project_id" ON "document" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_doc_po_id" ON "document" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "idx_member_org_id" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_member_user_id" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_status" ON "project" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_org_id" ON "project" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_po_project_id" ON "purchase_order" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_po_org_id" ON "purchase_order" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tender_status" ON "tender" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tender_client_id" ON "tender" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_tender_org_id" ON "tender" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "verification" ADD CONSTRAINT "verification_identifier_value_unique" UNIQUE("identifier","value");