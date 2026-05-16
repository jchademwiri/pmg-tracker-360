ALTER TABLE "member" DROP CONSTRAINT "member_organization_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_user_id_unique" UNIQUE("organization_id", "user_id");--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;