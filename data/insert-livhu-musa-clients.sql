-- Client seed for accounts@livhuandmusa.co.za
-- user_id: 37MUiMcRfntoRUzuRCX4VmYKaAiZeM58
-- org_slug: livhu-and-musa-enterprise
-- org_id: 8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU
--
-- Excludes:
-- - City of Tshwane
-- - City of Johannesburg

WITH clients_to_insert(name) AS (
  VALUES
    ('City of Ekurhuleni'),
    ('Dr Pixley Ka Isaka Seme Local Municipality'),
    ('eMakhazeni Local Municipality / Belfast'),
    ('Eskom / Medupi Power Station'),
    ('Gauteng Department of Education'),
    ('Gauteng Department of Roads and Transport'),
    ('Lesedi Local Municipality'),
    ('Madibeng Local Municipality'),
    ('Midvaal Local Municipality'),
    ('Msunduzi Municipality'),
    ('Polokwane Municipality'),
    ('Rustenburg Local Municipality'),
    ('Stellenbosch Municipality')
)
INSERT INTO client (
  id,
  organization_id,
  name,
  updated_at
)
SELECT
  'client_' || md5('8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU:' || lower(name)) AS id,
  '8XE1555PnWFzLZsa2qlNfFjlDMwFaQTU' AS organization_id,
  name,
  now() AS updated_at
FROM clients_to_insert
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();
