DO $$ BEGIN
  ALTER TABLE "member" DROP CONSTRAINT IF EXISTS "member_organization_id_user_id_pk";
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_user_id_unique" UNIQUE("organization_id", "user_id");
EXCEPTION
  WHEN others THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;
