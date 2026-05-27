-- Add expected and delivered dates to purchase_order for calendar
ALTER TABLE "purchase_order"
  ADD COLUMN IF NOT EXISTS "expected_delivery_date" timestamp NULL,
  ADD COLUMN IF NOT EXISTS "delivered_at" timestamp NULL;

-- Helpful indexes for range queries
CREATE INDEX IF NOT EXISTS "idx_tender_submission_date"
  ON "tender" ("submission_date");

CREATE INDEX IF NOT EXISTS "idx_po_expected_delivery_date"
  ON "purchase_order" ("expected_delivery_date");

CREATE INDEX IF NOT EXISTS "idx_po_delivered_at"
  ON "purchase_order" ("delivered_at");


