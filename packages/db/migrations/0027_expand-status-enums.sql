ALTER TYPE "public"."po_status" ADD VALUE IF NOT EXISTS 'partially_delivered';--> statement-breakpoint
ALTER TYPE "public"."po_status" ADD VALUE IF NOT EXISTS 'disputed';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE IF NOT EXISTS 'new';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE IF NOT EXISTS 'review';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE IF NOT EXISTS 'approved_to_prepare';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE IF NOT EXISTS 'preparation';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE IF NOT EXISTS 'ready';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE IF NOT EXISTS 'submitted';