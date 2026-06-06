-- Bulk tender import template.
-- Usage:
-- 1. Replace __ORGANIZATION_ID__ with an existing organization.id.
-- 2. Replace the JSON array in raw_tenders with your tender records.
-- 3. Run this against the same Postgres database used by the app.
--
-- Notes:
-- - Clients are upserted by a deterministic id generated from organization id + clientName.
-- - Tenders are upserted by tender_number, which is unique in the schema.
-- - Date fields accept ISO timestamp strings or null/omitted values.

WITH import_context AS (
  SELECT '__ORGANIZATION_ID__'::text AS organization_id
),
raw_tenders AS (
  SELECT *
  FROM jsonb_to_recordset(
    $json$
    [
      {
        "tenderNumber": "TND-2026-001",
        "description": "Supply and delivery of office equipment",
        "clientName": "Example Municipality",
        "clientNotes": "Main public-sector client",
        "clientContactName": "Procurement Office",
        "clientContactEmail": "procurement@example.gov.za",
        "clientContactPhone": "+27 11 000 0000",
        "submissionDate": "2026-07-15T10:00:00+02:00",
        "value": "R 250,000.00",
        "status": "draft",
        "evaluationDate": "2026-08-15T00:00:00+02:00",
        "validityDays": 90,
        "validityDate": "2026-10-13T00:00:00+02:00",
        "contactName": "Tender Contact",
        "contactEmail": "tender.contact@example.gov.za",
        "contactPhone": "+27 11 111 1111",
        "briefingDate": "2026-06-20T11:00:00+02:00",
        "briefingLocation": "City Hall, Room 3",
        "isBriefingMandatory": true,
        "briefingAttended": false
      }
    ]
    $json$::jsonb
  ) AS tender_data(
    "tenderNumber" text,
    description text,
    "clientName" text,
    "clientNotes" text,
    "clientContactName" text,
    "clientContactEmail" text,
    "clientContactPhone" text,
    "submissionDate" text,
    value text,
    status text,
    "evaluationDate" text,
    "validityDays" integer,
    "validityDate" text,
    "contactName" text,
    "contactEmail" text,
    "contactPhone" text,
    "briefingDate" text,
    "briefingLocation" text,
    "isBriefingMandatory" boolean,
    "briefingAttended" boolean
  )
),
normalized_tenders AS (
  SELECT
    import_context.organization_id,
    trim(raw_tenders."tenderNumber") AS tender_number,
    nullif(trim(raw_tenders.description), '') AS description,
    trim(raw_tenders."clientName") AS client_name,
    nullif(trim(raw_tenders."clientNotes"), '') AS client_notes,
    nullif(trim(raw_tenders."clientContactName"), '') AS client_contact_name,
    nullif(trim(raw_tenders."clientContactEmail"), '') AS client_contact_email,
    nullif(trim(raw_tenders."clientContactPhone"), '') AS client_contact_phone,
    nullif(trim(raw_tenders."submissionDate"), '')::timestamp AS submission_date,
    nullif(trim(raw_tenders.value), '') AS value,
    coalesce(nullif(trim(raw_tenders.status), ''), 'draft') AS status,
    nullif(trim(raw_tenders."evaluationDate"), '')::timestamp AS evaluation_date,
    raw_tenders."validityDays" AS validity_days,
    nullif(trim(raw_tenders."validityDate"), '')::timestamp AS validity_date,
    nullif(trim(raw_tenders."contactName"), '') AS contact_name,
    nullif(trim(raw_tenders."contactEmail"), '') AS contact_email,
    nullif(trim(raw_tenders."contactPhone"), '') AS contact_phone,
    nullif(trim(raw_tenders."briefingDate"), '')::timestamp AS briefing_date,
    nullif(trim(raw_tenders."briefingLocation"), '') AS briefing_location,
    coalesce(raw_tenders."isBriefingMandatory", false) AS is_briefing_mandatory,
    coalesce(raw_tenders."briefingAttended", false) AS briefing_attended
  FROM raw_tenders
  CROSS JOIN import_context
  WHERE nullif(trim(raw_tenders."tenderNumber"), '') IS NOT NULL
    AND nullif(trim(raw_tenders."clientName"), '') IS NOT NULL
),
upserted_clients AS (
  INSERT INTO client (
    id,
    organization_id,
    name,
    notes,
    contact_name,
    contact_email,
    contact_phone,
    updated_at
  )
  SELECT DISTINCT ON (organization_id, client_name)
    'client_' || md5(organization_id || ':' || lower(client_name)) AS id,
    organization_id,
    client_name,
    client_notes,
    client_contact_name,
    client_contact_email,
    client_contact_phone,
    now()
  FROM normalized_tenders
  ORDER BY organization_id, client_name
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    notes = coalesce(EXCLUDED.notes, client.notes),
    contact_name = coalesce(EXCLUDED.contact_name, client.contact_name),
    contact_email = coalesce(EXCLUDED.contact_email, client.contact_email),
    contact_phone = coalesce(EXCLUDED.contact_phone, client.contact_phone),
    updated_at = now()
  RETURNING id, organization_id, name
)
INSERT INTO tender (
  id,
  organization_id,
  tender_number,
  description,
  client_id,
  submission_date,
  value,
  status,
  evaluation_date,
  validity_days,
  validity_date,
  contact_name,
  contact_email,
  contact_phone,
  briefing_date,
  briefing_location,
  is_briefing_mandatory,
  briefing_attended,
  updated_at
)
SELECT
  'tender_' || md5(normalized_tenders.tender_number) AS id,
  normalized_tenders.organization_id,
  normalized_tenders.tender_number,
  normalized_tenders.description,
  upserted_clients.id AS client_id,
  normalized_tenders.submission_date,
  normalized_tenders.value,
  normalized_tenders.status,
  normalized_tenders.evaluation_date,
  normalized_tenders.validity_days,
  normalized_tenders.validity_date,
  normalized_tenders.contact_name,
  normalized_tenders.contact_email,
  normalized_tenders.contact_phone,
  normalized_tenders.briefing_date,
  normalized_tenders.briefing_location,
  normalized_tenders.is_briefing_mandatory,
  normalized_tenders.briefing_attended,
  now()
FROM normalized_tenders
JOIN upserted_clients
  ON upserted_clients.organization_id = normalized_tenders.organization_id
 AND upserted_clients.name = normalized_tenders.client_name
ON CONFLICT (tender_number) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  description = EXCLUDED.description,
  client_id = EXCLUDED.client_id,
  submission_date = EXCLUDED.submission_date,
  value = EXCLUDED.value,
  status = EXCLUDED.status,
  evaluation_date = EXCLUDED.evaluation_date,
  validity_days = EXCLUDED.validity_days,
  validity_date = EXCLUDED.validity_date,
  contact_name = EXCLUDED.contact_name,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  briefing_date = EXCLUDED.briefing_date,
  briefing_location = EXCLUDED.briefing_location,
  is_briefing_mandatory = EXCLUDED.is_briefing_mandatory,
  briefing_attended = EXCLUDED.briefing_attended,
  updated_at = now();
