CREATE TABLE "prize_draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed" text NOT NULL,
	"winners" jsonb NOT NULL,
	"winner_count" integer NOT NULL,
	"total_eligible" integer NOT NULL,
	"algorithm" text NOT NULL,
	"drawn_by" uuid NOT NULL,
	"drawn_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prize_draws" ADD CONSTRAINT "prize_draws_drawn_by_profiles_id_fk" FOREIGN KEY ("drawn_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;