ALTER TABLE "purchase_order" ALTER COLUMN "supplier_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "po_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "po_date" timestamp;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_po_number_unique" UNIQUE("po_number");
EXCEPTION
  WHEN duplicate_object OR undefined_column OR undefined_table OR invalid_foreign_key THEN null;
END $$;