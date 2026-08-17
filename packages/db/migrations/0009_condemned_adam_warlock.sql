ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "expected_delivery_date" timestamp;
--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp;
