-- Backfill client_contact table from existing tender, extension, and client data
-- This ensures historical contacts (like "Selo") are immediately available
-- for autocomplete in extension and tender forms.

-- 1. Insert distinct contacts from tenders (most recently used first)
INSERT INTO "client_contact" ("id", "organization_id", "client_id", "name", "email", "phone", "last_used_at", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  t."organization_id",
  t."client_id",
  TRIM(t."contact_name"),
  TRIM(t."contact_email"),
  TRIM(t."contact_phone"),
  t."created_at",
  NOW(),
  NOW()
FROM "tender" t
WHERE t."contact_name" IS NOT NULL
  AND TRIM(t."contact_name") != ''
  AND t."deleted_at" IS NULL
GROUP BY t."organization_id", t."client_id", TRIM(t."contact_name"), TRIM(t."contact_email"), TRIM(t."contact_phone"), t."created_at"
ON CONFLICT DO NOTHING;

-- 2. Insert distinct contacts from tender extensions
INSERT INTO "client_contact" ("id", "organization_id", "client_id", "name", "email", "phone", "last_used_at", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  te."organization_id",
  t."client_id",
  TRIM(te."contact_name"),
  TRIM(te."contact_email"),
  TRIM(te."contact_phone"),
  te."created_at",
  NOW(),
  NOW()
FROM "tender_extension" te
JOIN "tender" t ON t."id" = te."tender_id"
WHERE te."contact_name" IS NOT NULL
  AND TRIM(te."contact_name") != ''
  AND te."deleted_at" IS NULL
  AND t."deleted_at" IS NULL
GROUP BY te."organization_id", t."client_id", TRIM(te."contact_name"), TRIM(te."contact_email"), TRIM(te."contact_phone"), te."created_at"
ON CONFLICT DO NOTHING;

-- 3. Insert distinct contacts from client records (embedded contact fields)
INSERT INTO "client_contact" ("id", "organization_id", "client_id", "name", "email", "phone", "last_used_at", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  c."organization_id",
  c."id",
  TRIM(c."contact_name"),
  TRIM(c."contact_email"),
  TRIM(c."contact_phone"),
  c."created_at",
  NOW(),
  NOW()
FROM "client" c
WHERE c."contact_name" IS NOT NULL
  AND TRIM(c."contact_name") != ''
  AND c."deleted_at" IS NULL
GROUP BY c."organization_id", c."id", TRIM(c."contact_name"), TRIM(c."contact_email"), TRIM(c."contact_phone"), c."created_at"
ON CONFLICT DO NOTHING;

-- 4. Update last_used_at to reflect the most recent usage across all sources
UPDATE "client_contact" cc
SET "last_used_at" = GREATEST(
  COALESCE((
    SELECT MAX(t."created_at")
    FROM "tender" t
    WHERE t."organization_id" = cc."organization_id"
      AND t."client_id" = cc."client_id"
      AND TRIM(t."contact_name") = cc."name"
      AND t."deleted_at" IS NULL
  ), cc."created_at"),
  COALESCE((
    SELECT MAX(te."created_at")
    FROM "tender_extension" te
    JOIN "tender" t ON t."id" = te."tender_id"
    WHERE te."organization_id" = cc."organization_id"
      AND t."client_id" = cc."client_id"
      AND TRIM(te."contact_name") = cc."name"
      AND te."deleted_at" IS NULL
      AND t."deleted_at" IS NULL
  ), cc."created_at")
);
