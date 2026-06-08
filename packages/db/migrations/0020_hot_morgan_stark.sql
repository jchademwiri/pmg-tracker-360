CREATE TABLE "purchase_order_delivery_item" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_note_id" text NOT NULL,
	"line_item_id" text NOT NULL,
	"quantity_delivered" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_delivery_note" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_order_id" text NOT NULL,
	"delivery_note_number" text NOT NULL,
	"recipient_name" text NOT NULL,
	"received_at" timestamp NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"pod_file_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_order_delivery_item" ADD CONSTRAINT "purchase_order_delivery_item_delivery_note_id_purchase_order_delivery_note_id_fk" FOREIGN KEY ("delivery_note_id") REFERENCES "public"."purchase_order_delivery_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_delivery_item" ADD CONSTRAINT "purchase_order_delivery_item_line_item_id_purchase_order_line_item_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."purchase_order_line_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_delivery_note" ADD CONSTRAINT "purchase_order_delivery_note_purchase_order_id_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE cascade ON UPDATE no action;