CREATE TYPE "public"."sponsorship_inquiry_status" AS ENUM('pending', 'contacted', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "sponsorship_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"website_url" text,
	"offer_description" text NOT NULL,
	"additional_notes" text,
	"status" "sponsorship_inquiry_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sponsorship_inquiries_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "sponsorship_inquiries" ADD CONSTRAINT "sponsorship_inquiries_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;