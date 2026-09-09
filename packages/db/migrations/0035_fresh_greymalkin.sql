ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
WITH ranked_owners AS (
	SELECT
		m.id,
		row_number() OVER (
			PARTITION BY m.organization_id
			ORDER BY
				CASE WHEN u.email = 'meggiemtsweni@gmail.com' THEN 0 ELSE 1 END,
				m.created_at ASC,
				m.id ASC
		) AS owner_rank
	FROM "member" AS m
	INNER JOIN "user" AS u ON u.id = m.user_id
	WHERE m.role = 'owner' AND m.deleted_at IS NULL
)
UPDATE "member" AS m
SET role = 'admin'
FROM ranked_owners
WHERE m.id = ranked_owners.id AND ranked_owners.owner_rank > 1;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "member_organization_id_owner_unique" ON "member" USING btree ("organization_id") WHERE role = 'owner' AND deleted_at IS NULL;
