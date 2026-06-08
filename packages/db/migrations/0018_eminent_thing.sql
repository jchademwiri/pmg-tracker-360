ALTER TABLE "purchase_order" ALTER COLUMN "total_amount" SET DATA TYPE numeric(15, 2) USING NULLIF("total_amount", '')::numeric(15, 2);--> statement-breakpoint
ALTER TABLE "purchase_order" ALTER COLUMN "status" SET DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "tender" ALTER COLUMN "value" SET DATA TYPE numeric(15, 2) USING NULLIF("value", '')::numeric(15, 2);--> statement-breakpoint
ALTER TABLE "tender" ALTER COLUMN "status" SET DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "contract_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "contract_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "award_value" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "signed_contract_url" text;