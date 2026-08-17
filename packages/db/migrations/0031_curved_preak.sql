CREATE TABLE "subscription_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price_zar" integer DEFAULT 0 NOT NULL,
	"period" text DEFAULT 'per month' NOT NULL,
	"max_storage_mb" integer DEFAULT 100 NOT NULL,
	"max_tenders_per_month" integer DEFAULT 10 NOT NULL,
	"max_active_projects" integer DEFAULT 0 NOT NULL,
	"max_owned_orgs" integer DEFAULT 1 NOT NULL,
	"features" jsonb NOT NULL,
	"popular" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"cta_text" text DEFAULT 'Select Plan' NOT NULL,
	"badge_text" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
