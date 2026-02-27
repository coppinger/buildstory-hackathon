CREATE TYPE "public"."mentor_application_status" AS ENUM('pending', 'approved', 'declined');--> statement-breakpoint
CREATE TABLE "mentor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"discord_handle" text NOT NULL,
	"twitter_handle" text,
	"website_url" text,
	"github_handle" text,
	"mentor_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"background" text NOT NULL,
	"availability" text NOT NULL,
	"status" "mentor_application_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_applications_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "mentor_applications" ADD CONSTRAINT "mentor_applications_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;