-- Tender seed for accounts@livhuandmusa.co.za
-- user_id: 37MUiMcRfntoRUzuRCX4VmYKaAiZeM58
-- org_slug: livhu-and-musa-enterprise
-- org_id: 8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU
--
-- Uses clients already inserted for this organization.
-- Excludes tenders for:
-- - City of Tshwane
-- - City of Johannesburg
-- - rows where clientName still needs document review
--
-- Duplicate handling:
-- - a-ws-03-2026 appears twice in the source data.
-- - This script keeps the later closing date / revised pricing row.

WITH tender_rows (
  tender_number,
  client_name,
  description,
  submission_date,
  status
) AS (
  VALUES
    ('gt-gde-069-2025', 'Gauteng Department of Education', 'Tender document', '2026-01-23'::timestamp, 'draft'::tender_status),
    ('drt-03-01-2026', 'Gauteng Department of Roads and Transport', 'Tender document', '2026-03-13'::timestamp, 'draft'::tender_status),
    ('road-maintenance', 'eMakhazeni Local Municipality / Belfast', 'Road maintenance', '2026-03-23'::timestamp, 'draft'::tender_status),
    ('a-ws-04-2026', 'City of Ekurhuleni', 'Cleaning and repairs to sewer pipelines', '2026-04-15'::timestamp, 'draft'::tender_status),
    ('a-ws-03-2026', 'City of Ekurhuleni', 'Water meters', '2026-04-16'::timestamp, 'draft'::tender_status),
    ('a-ws-05-2026', 'City of Ekurhuleni', 'Water network', '2026-04-20'::timestamp, 'draft'::tender_status),
    ('200420265907', 'Eskom / Medupi Power Station', 'Office cleaning, park homes, ablution facilities, mobile toilets', '2026-04-24'::timestamp, 'draft'::tender_status),
    ('rft81-10-2025-26', 'Madibeng Local Municipality', 'Tender document', '2026-04-30'::timestamp, 'draft'::tender_status),
    ('t21-2026', 'Dr Pixley Ka Isaka Seme Local Municipality', 'Roads material, Volksrust Ward 4', '2026-04-30'::timestamp, 'draft'::tender_status),
    ('a-ws-03-2026', 'City of Ekurhuleni', 'Water meters, erratum/revised pricing', '2026-05-07'::timestamp, 'draft'::tender_status),
    ('a-wm-03-2026', 'City of Ekurhuleni', 'New wheelie bins and accessories', '2026-05-13'::timestamp, 'draft'::tender_status),
    ('8-2-4-244', 'Midvaal Local Municipality', 'Bid document', '2026-05-19'::timestamp, 'draft'::tender_status),
    ('8-2-4-245', 'Midvaal Local Municipality', 'Bid document', '2026-05-20'::timestamp, 'draft'::tender_status),
    ('8-2-4-246', 'Midvaal Local Municipality', 'Bid document', '2026-05-22'::timestamp, 'draft'::tender_status),
    ('e16-of-2026', 'Msunduzi Municipality', 'Supply and delivery of steel street lighting poles and accessories', '2026-05-26'::timestamp, 'draft'::tender_status),
    ('bsm-103-26', 'Stellenbosch Municipality', 'Mowing / grass cutting of open spaces within WC024 ending 30 June 2029', '2026-06-01'::timestamp, 'draft'::tender_status),
    ('pm37-25-26', 'Polokwane Municipality', 'Tender document / BOQ', '2026-06-02'::timestamp, 'draft'::tender_status),
    ('rlm-dtis-0118-2025-26', 'Rustenburg Local Municipality', 'Streetlight poles', '2026-06-02'::timestamp, 'draft'::tender_status),
    ('a-ws-06-2026', 'City of Ekurhuleni', 'Mobile water tankers', '2026-06-04'::timestamp, 'draft'::tender_status),
    ('11-2026', 'Lesedi Local Municipality', 'Supply of cables', '2026-06-08'::timestamp, 'draft'::tender_status)
),
deduped_tenders AS (
  SELECT DISTINCT ON (tender_number)
    tender_number,
    client_name,
    description,
    submission_date,
    status
  FROM tender_rows
  ORDER BY tender_number, submission_date DESC
),
tenders_with_clients AS (
  SELECT
    deduped_tenders.tender_number,
    deduped_tenders.description,
    deduped_tenders.submission_date,
    deduped_tenders.status,
    client.id AS client_id
  FROM deduped_tenders
  INNER JOIN client
    ON client.organization_id = '8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU'
   AND lower(trim(client.name)) = lower(trim(deduped_tenders.client_name))
   AND client.deleted_at IS NULL
)
INSERT INTO tender (
  id,
  organization_id,
  tender_number,
  description,
  client_id,
  submission_date,
  status,
  updated_at
)
SELECT
  'tender_' || md5('8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU:' || tender_number) AS id,
  '8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU' AS organization_id,
  tender_number,
  description,
  client_id,
  submission_date,
  status,
  now() AS updated_at
FROM tenders_with_clients
ON CONFLICT (organization_id, tender_number) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  description = EXCLUDED.description,
  client_id = EXCLUDED.client_id,
  submission_date = EXCLUDED.submission_date,
  status = EXCLUDED.status,
  updated_at = now();
