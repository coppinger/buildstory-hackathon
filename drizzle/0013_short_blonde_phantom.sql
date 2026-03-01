CREATE TABLE "twitch_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"twitch_id" text NOT NULL,
	"name" text NOT NULL,
	"box_art_url" text,
	"added_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "twitch_categories_twitch_id_unique" UNIQUE("twitch_id")
);
--> statement-breakpoint
ALTER TABLE "twitch_categories" ADD CONSTRAINT "twitch_categories_added_by_profiles_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;