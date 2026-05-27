ALTER TABLE "purchase_order" ALTER COLUMN "supplier_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "po_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "po_date" timestamp;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_po_number_unique" UNIQUE("po_number");