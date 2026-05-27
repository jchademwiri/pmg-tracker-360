ALTER TABLE "project" ALTER COLUMN "project_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order" ALTER COLUMN "supplier_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tender" ALTER COLUMN "client_id" DROP NOT NULL;