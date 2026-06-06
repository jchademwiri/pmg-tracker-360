-- Tender seed for accounts@livhuandmusa.co.za using actual client IDs.
-- user_id: 37MUiMcRfntoRUzuRCX4VmYKaAiZeM58
-- org_slug: livhu-and-musa-enterprise
-- org_id: 8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU
--
-- Source client snapshot saved at:
-- data/livhu-musa-clients.json
--
-- Duplicate handling:
-- - A-WS-03-2026 appears twice in the source data.
-- - This script keeps the later closing date / revised pricing row.

WITH tender_rows (
  tender_number,
  client_id,
  description,
  submission_date,
  status
) AS (
  VALUES
    ('JHB-25-27', '2f97c872-bdfc-4cec-be2f-542d7ce8a133', 'Tender document', '2026-01-22'::timestamp, 'Open'),
    ('GT-GDE-069-2025', 'client_df71357bb467cc3fa3bcb5f31faef690', 'Tender document', '2026-01-23'::timestamp, 'Open'),
    ('EEBU 10-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-02-18'::timestamp, 'Open'),
    ('EEBU 15-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-02-18'::timestamp, 'Open'),
    ('EEBU 08-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', '3-year primary substation tender', '2026-02-19'::timestamp, 'Open'),
    ('ROC 04-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-02-20'::timestamp, 'Open'),
    ('EAM 05-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-02-24'::timestamp, 'Open'),
    ('HS 03-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-02-24'::timestamp, 'Open'),
    ('IEM(IWM) 04-2026', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-02-24'::timestamp, 'Open'),
    ('IEM(IWM) 06-2026', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-02-24'::timestamp, 'Open'),
    ('IDS (R&T) 10-2026', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document / pricing', '2026-02-25'::timestamp, 'Open'),
    ('WSBU 08-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-02-26'::timestamp, 'Open'),
    ('DRT 03 01 2026', 'client_014d93adb4262c7d28a20f0ec82281b4', 'Tender document', '2026-03-13'::timestamp, 'Open'),
    ('Road Maintenance', 'client_1378caefa76603aaf8aca0c52867afbe', 'Road maintenance', '2026-03-23'::timestamp, 'Open'),
    ('A-WS-04-2026', 'client_baa11ca37dda68a821c0027ddf0572c6', 'Cleaning and repairs to sewer pipelines', '2026-04-15'::timestamp, 'Open'),
    ('A-WS-03-2026', 'client_baa11ca37dda68a821c0027ddf0572c6', 'Water meters', '2026-04-16'::timestamp, 'Open'),
    ('EEBU 16-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document / pricing', '2026-04-17'::timestamp, 'Open'),
    ('A-WS-05-2026', 'client_baa11ca37dda68a821c0027ddf0572c6', 'Water network', '2026-04-20'::timestamp, 'Open'),
    ('EEBU 21-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-04-20'::timestamp, 'Open'),
    ('EEBU 22-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Amended tender document', '2026-04-20'::timestamp, 'Open'),
    ('GFS 06-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-04-21'::timestamp, 'Open'),
    ('200420265907', 'client_3781bdc68da6fb7363fbe25adfbfaa95', 'Office cleaning, park homes, ablution facilities, mobile toilets', '2026-04-24'::timestamp, 'Open'),
    ('RFT81-10-2025/26', 'client_fcbefe077e46e93875dbccc2105953c7', 'Tender document', '2026-04-30'::timestamp, 'Open'),
    ('T21-2026', 'client_3b0886001bfee6f5618362475667e2ae', 'Roads material, Volksrust Ward 4', '2026-04-30'::timestamp, 'Open'),
    ('A-WS-03-2026', 'client_baa11ca37dda68a821c0027ddf0572c6', 'Water meters, erratum/revised pricing', '2026-05-07'::timestamp, 'Open'),
    ('A-WM-03-2026', 'client_baa11ca37dda68a821c0027ddf0572c6', 'New wheelie bins and accessories', '2026-05-13'::timestamp, 'Open'),
    ('8-2-4-244', 'client_5b8900bde7ddf05308a787d9a7663308', 'Bid document', '2026-05-19'::timestamp, 'Open'),
    ('8-2-4-245', 'client_5b8900bde7ddf05308a787d9a7663308', 'Bid document', '2026-05-20'::timestamp, 'Open'),
    ('8-2-4-246', 'client_5b8900bde7ddf05308a787d9a7663308', 'Bid document', '2026-05-22'::timestamp, 'Open'),
    ('E16 of 2026', 'client_f8c2c9ec6bc39a84f772d3d7d5d0f8d6', 'Supply and delivery of steel street lighting poles and accessories', '2026-05-26'::timestamp, 'Open'),
    ('ROC-03-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-05-26'::timestamp, 'Open'),
    ('GFS-07-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-05-29'::timestamp, 'Open'),
    ('BSM 103/26', 'client_7b1d113be940df0a4133668359efa6b0', 'Mowing / grass cutting of open spaces within WC024 ending 30 June 2029', '2026-06-01'::timestamp, 'Open'),
    ('PM37-25/26', 'client_271322d43bb59b3f101076c47f2ac19e', 'Tender document / BOQ', '2026-06-02'::timestamp, 'Open'),
    ('RLM-DTIS-0118-2025/26', 'client_7fa580805e2d61a27571b8176cd8d4ac', 'Streetlight poles', '2026-06-02'::timestamp, 'Open'),
    ('A-WS-06-2026', 'client_baa11ca37dda68a821c0027ddf0572c6', 'Mobile water tankers', '2026-06-04'::timestamp, 'Open'),
    ('11-2026', 'client_984ecc0462ab24013ccb599f61f3b0ac', 'Supply of cables', '2026-06-08'::timestamp, 'Open'),
    ('TSD04-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tow truck tender', '2026-06-11'::timestamp, 'Open'),
    ('IDS (R&T) 14-2026', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Final tender document', '2026-06-17'::timestamp, 'Open'),
    ('EEBU 24-2025/26', 'ac966b51-ee83-46f2-b7d8-07400948de61', 'Tender document', '2026-06-23'::timestamp, 'Open')
),
deduped_tenders AS (
  SELECT DISTINCT ON (tender_number)
    tender_number,
    client_id,
    description,
    submission_date,
    status
  FROM tender_rows
  ORDER BY tender_number, submission_date DESC
),
valid_tenders AS (
  SELECT deduped_tenders.*
  FROM deduped_tenders
  INNER JOIN client
    ON client.id = deduped_tenders.client_id
   AND client.organization_id = '8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU'
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
FROM valid_tenders
ON CONFLICT (tender_number) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  description = EXCLUDED.description,
  client_id = EXCLUDED.client_id,
  submission_date = EXCLUDED.submission_date,
  status = EXCLUDED.status,
  updated_at = now();
