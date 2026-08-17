DO $$ BEGIN
  CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'expired', 'cancelled');
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."ownership_transfer_status" AS ENUM('pending', 'accepted', 'cancelled', 'expired');
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."po_status" AS ENUM('open', 'draft', 'sent', 'delivered', 'completed', 'cancelled');
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."project_status" AS ENUM('active', 'completed', 'cancelled');
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."risk_severity" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."risk_status" AS ENUM('open', 'mitigated', 'closed');
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."tender_priority" AS ENUM('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."tender_status" AS ENUM('draft', 'open', 'closed', 'evaluation', 'awarded', 'lost', 'cancelled');
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "document" ALTER COLUMN "size" SET DATA TYPE bigint USING NULLIF("size", '')::bigint;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS "invitation_organization_id_email_pending_unique";
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invitation" ALTER COLUMN "status" DROP DEFAULT;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invitation" ALTER COLUMN "status" SET DATA TYPE "public"."invitation_status" USING "status"::text::"public"."invitation_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invitation" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."invitation_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invitation_organization_id_email_pending_unique" ON "invitation" USING btree ("organization_id","email") WHERE status = 'pending'::"public"."invitation_status";
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "organization" ALTER COLUMN "metadata" SET DATA TYPE jsonb USING "metadata"::jsonb;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ownership_transfer" ALTER COLUMN "status" DROP DEFAULT;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ownership_transfer" ALTER COLUMN "status" SET DATA TYPE "public"."ownership_transfer_status" USING "status"::text::"public"."ownership_transfer_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ownership_transfer" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."ownership_transfer_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project" ALTER COLUMN "status" DROP DEFAULT;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project" ALTER COLUMN "status" SET DATA TYPE "public"."project_status" USING "status"::text::"public"."project_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."project_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_risk" ALTER COLUMN "severity" DROP DEFAULT;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_risk" ALTER COLUMN "severity" SET DATA TYPE "public"."risk_severity" USING "severity"::text::"public"."risk_severity";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_risk" ALTER COLUMN "severity" SET DEFAULT 'medium'::"public"."risk_severity";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_risk" ALTER COLUMN "status" DROP DEFAULT;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_risk" ALTER COLUMN "status" SET DATA TYPE "public"."risk_status" USING "status"::text::"public"."risk_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "project_risk" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."risk_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "purchase_order" ALTER COLUMN "status" DROP DEFAULT;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "purchase_order" ALTER COLUMN "status" SET DATA TYPE "public"."po_status" USING "status"::text::"public"."po_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "purchase_order" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."po_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "security_audit_log" ALTER COLUMN "details" SET DATA TYPE jsonb USING "details"::jsonb;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "session_tracking" ALTER COLUMN "device_info" SET DATA TYPE jsonb USING "device_info"::jsonb;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "session_tracking" ALTER COLUMN "location_info" SET DATA TYPE jsonb USING "location_info"::jsonb;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tender" ALTER COLUMN "status" DROP DEFAULT;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tender" ALTER COLUMN "status" SET DATA TYPE "public"."tender_status" USING "status"::text::"public"."tender_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tender" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."tender_status";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tender" ALTER COLUMN "priority" DROP DEFAULT;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tender" ALTER COLUMN "priority" SET DATA TYPE "public"."tender_priority" USING "priority"::text::"public"."tender_priority";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tender" ALTER COLUMN "priority" SET DEFAULT 'medium'::"public"."tender_priority";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_client_org_id" ON "client" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_tender_id" ON "document" USING btree ("tender_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_project_id" ON "document" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doc_po_id" ON "document" USING btree ("purchase_order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_org_id" ON "member" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_user_id" ON "member" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_status" ON "project" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_org_id" ON "project" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_po_project_id" ON "purchase_order" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_po_org_id" ON "purchase_order" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tender_status" ON "tender" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tender_client_id" ON "tender" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tender_org_id" ON "tender" USING btree ("organization_id");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "verification" ADD CONSTRAINT "verification_identifier_value_unique" UNIQUE("identifier","value");
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "validity_days" integer;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "validity_date" timestamp;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "briefing_date" timestamp;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "briefing_location" text;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "is_briefing_mandatory" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "briefing_attended" boolean DEFAULT false NOT NULL;
