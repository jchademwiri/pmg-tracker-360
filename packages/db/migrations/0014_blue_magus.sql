ALTER TABLE "member" DROP CONSTRAINT IF EXISTS "member_organization_id_user_id_pk";--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'member_organization_id_user_id_unique'
    ) THEN
        ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_user_id_unique" UNIQUE("organization_id", "user_id");
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;