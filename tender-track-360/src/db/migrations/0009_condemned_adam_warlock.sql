ALTER TABLE "purchase_order" ADD COLUMN "expected_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "delivered_at" timestamp;