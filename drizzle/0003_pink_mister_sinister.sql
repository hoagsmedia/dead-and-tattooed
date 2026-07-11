ALTER TABLE "artwork" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "artwork" ADD COLUMN "status" text DEFAULT 'available' NOT NULL;--> statement-breakpoint
ALTER TABLE "artwork" ADD COLUMN "reserved_until" timestamp;--> statement-breakpoint
ALTER TABLE "artwork" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "artwork_id" text;