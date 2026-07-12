CREATE TABLE "subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriber_email_unique" UNIQUE("email")
);
