CREATE TABLE "ai_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tools_name_unique" UNIQUE("name"),
	CONSTRAINT "ai_tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_submission_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	CONSTRAINT "event_submission_tools_submission_id_tool_id_unique" UNIQUE("submission_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE "event_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"what_built" text NOT NULL,
	"demo_url" text,
	"demo_media_url" text,
	"demo_media_type" text,
	"repo_url" text,
	"lesson_learned" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_submissions_event_id_project_id_unique" UNIQUE("event_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "event_submission_tools" ADD CONSTRAINT "event_submission_tools_submission_id_event_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."event_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_submission_tools" ADD CONSTRAINT "event_submission_tools_tool_id_ai_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."ai_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_submissions" ADD CONSTRAINT "event_submissions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_submissions" ADD CONSTRAINT "event_submissions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_submissions" ADD CONSTRAINT "event_submissions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_event_submission_tools_submission" ON "event_submission_tools" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_event_submissions_event" ON "event_submissions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_submissions_profile" ON "event_submissions" USING btree ("profile_id");