-- Client table updates: Add primary contact fields and remove industry
ALTER TABLE "client"
ADD COLUMN "primary_contact_name" text;
--> statement-breakpoint
ALTER TABLE "client"
ADD COLUMN "primary_contact_email" text;
--> statement-breakpoint
ALTER TABLE "client"
ADD COLUMN "primary_contact_phone" text;
--> statement-breakpoint
ALTER TABLE "client"
ADD COLUMN "primary_contact_position" text;
--> statement-breakpoint
ALTER TABLE "client" DROP COLUMN "industry";
--> statement-breakpoint
-- Project table updates: Replace name with project_number, description with project_description
ALTER TABLE "project"
ADD COLUMN "project_number" text;
--> statement-breakpoint
ALTER TABLE "project"
ADD COLUMN "project_description" text;
--> statement-breakpoint
-- Migrate existing data
UPDATE "project"
SET "project_number" = "name"
WHERE "name" IS NOT NULL;
--> statement-breakpoint
UPDATE "project"
SET "project_description" = "description"
WHERE "description" IS NOT NULL;
--> statement-breakpoint
-- Drop old columns
ALTER TABLE "project" DROP COLUMN "name";
--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "description";
--> statement-breakpoint
-- Tender table updates: Remove title, add client_id column
ALTER TABLE "tender"
ADD COLUMN "client_id" text;
--> statement-breakpoint
ALTER TABLE "tender" DROP COLUMN "title";
--> statement-breakpoint
-- Note: Keep client column for data migration, will be dropped in next migration
-- Note: Foreign key constraint will be added in next migration after data migration
-- Purchase order table updates: Add supplier_name field
ALTER TABLE "purchase_order"
ADD COLUMN "supplier_name" text;