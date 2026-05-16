-- Migration: Rename purchase_order.notes -> purchase_order.delivery_address
-- Up (apply): rename column
BEGIN;
ALTER TABLE purchase_order
  RENAME COLUMN notes TO delivery_address;
COMMIT;

-- Down (rollback): rename back
-- To rollback, run the following:
-- BEGIN;
-- ALTER TABLE purchase_order
--   RENAME COLUMN delivery_address TO notes;
-- COMMIT;
