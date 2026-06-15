CREATE TABLE "project_line_item" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" text NOT NULL,
	"description" text NOT NULL,
	"unit" text NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "purchase_order_line_item" ADD COLUMN "project_line_item_id" text;--> statement-breakpoint
ALTER TABLE "purchase_order_line_item" ADD COLUMN "unit" text DEFAULT 'unit' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_delivery_note" ADD COLUMN "project_id" text;--> statement-breakpoint
UPDATE "purchase_order_delivery_note" dn
SET "project_id" = po."project_id"
FROM "purchase_order" po
WHERE dn."purchase_order_id" = po."id";--> statement-breakpoint
ALTER TABLE "purchase_order_delivery_note" ALTER COLUMN "project_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_delivery_item" ADD COLUMN "unit_price" numeric(15, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_delivery_item" ADD COLUMN "delivery_value" numeric(15, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "purchase_order_delivery_item" di
SET
	"unit_price" = li."unit_price",
	"delivery_value" = di."quantity_delivered" * li."unit_price"
FROM "purchase_order_line_item" li
WHERE di."line_item_id" = li."id";--> statement-breakpoint
ALTER TABLE "project_line_item" ADD CONSTRAINT "project_line_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_line_item" ADD CONSTRAINT "project_line_item_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_line_item" ADD CONSTRAINT "purchase_order_line_item_project_line_item_id_project_line_item_id_fk" FOREIGN KEY ("project_line_item_id") REFERENCES "public"."project_line_item"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_delivery_note" ADD CONSTRAINT "purchase_order_delivery_note_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
