CREATE TYPE "public"."highlight_category" AS ENUM('creativity', 'business_case', 'technical_challenge', 'impact', 'design');--> statement-breakpoint
CREATE TABLE "hackathon_review_highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"category" "highlight_category" NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hackathon_review_highlights_review_id_category_unique" UNIQUE("review_id","category")
);
--> statement-breakpoint
CREATE TABLE "hackathon_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"reviewer_profile_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"feedback" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hackathon_reviews_reviewer_profile_id_project_id_unique" UNIQUE("reviewer_profile_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "review_opens_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "review_closes_at" timestamp;--> statement-breakpoint
ALTER TABLE "hackathon_review_highlights" ADD CONSTRAINT "hackathon_review_highlights_review_id_hackathon_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."hackathon_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_reviews" ADD CONSTRAINT "hackathon_reviews_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_reviews" ADD CONSTRAINT "hackathon_reviews_reviewer_profile_id_profiles_id_fk" FOREIGN KEY ("reviewer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hackathon_reviews" ADD CONSTRAINT "hackathon_reviews_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_hackathon_review_highlights_review" ON "hackathon_review_highlights" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "idx_hackathon_reviews_event" ON "hackathon_reviews" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_hackathon_reviews_project" ON "hackathon_reviews" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_hackathon_reviews_reviewer" ON "hackathon_reviews" USING btree ("reviewer_profile_id");