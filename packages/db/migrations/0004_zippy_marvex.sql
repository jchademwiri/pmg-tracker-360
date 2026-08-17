-- Client table updates: Add primary contact fields and remove industry
ALTER TABLE "client" ADD COLUMN IF NOT EXISTS "primary_contact_name" text;
--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN IF NOT EXISTS "primary_contact_email" text;
--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN IF NOT EXISTS "primary_contact_phone" text;
--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN IF NOT EXISTS "primary_contact_position" text;
--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN IF EXISTS "industry";
--> statement-breakpoint
-- Project table updates: Replace name with project_number, description with project_description
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "project_number" text;
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "project_description" text;
--> statement-breakpoint
DO $$ BEGIN
  -- Migrate existing data
UPDATE "project"
SET "project_number" = "name"
WHERE "name" IS NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  UPDATE "project"
SET "project_description" = "description"
WHERE "description" IS NOT NULL;
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
-- Drop old columns
ALTER TABLE "project" DROP COLUMN IF EXISTS "name";
--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN IF EXISTS "description";
--> statement-breakpoint
-- Tender table updates: Remove title, add client_id column
ALTER TABLE "tender" ADD COLUMN IF NOT EXISTS "client_id" text;
--> statement-breakpoint
ALTER TABLE "tender" DROP COLUMN IF EXISTS "title";
--> statement-breakpoint
-- Note: Keep client column for data migration, will be dropped in next migration
-- Note: Foreign key constraint will be added in next migration after data migration
-- Purchase order table updates: Add supplier_name field
ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "supplier_name" text;
