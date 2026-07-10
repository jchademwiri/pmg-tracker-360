ALTER TYPE "public"."po_status" ADD VALUE 'partially_delivered';--> statement-breakpoint
ALTER TYPE "public"."po_status" ADD VALUE 'disputed';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE 'new';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE 'review';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE 'approved_to_prepare';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE 'preparation';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE 'ready';--> statement-breakpoint
ALTER TYPE "public"."tender_status" ADD VALUE 'submitted';