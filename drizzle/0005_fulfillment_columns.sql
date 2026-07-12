ALTER TABLE "order" ADD COLUMN "shipped_at" timestamp;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "carrier" text;