-- Add PO date column and make supplier optional
ALTER TABLE purchase_order ADD COLUMN po_date TIMESTAMP;
ALTER TABLE purchase_order ALTER COLUMN supplier_name DROP NOT NULL;