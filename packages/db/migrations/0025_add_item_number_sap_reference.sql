ALTER TABLE "project_line_item" ADD COLUMN IF NOT EXISTS "item_number" text DEFAULT 'ITEM' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_line_item" ADD COLUMN IF NOT EXISTS "sap_reference" text;--> statement-breakpoint
ALTER TABLE "purchase_order_line_item" ADD COLUMN IF NOT EXISTS "item_number" text DEFAULT 'ITEM' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_line_item" ADD COLUMN IF NOT EXISTS "sap_reference" text;