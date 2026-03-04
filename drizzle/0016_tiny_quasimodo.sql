CREATE TYPE "public"."feature_board_status" AS ENUM('inbox', 'exploring', 'next', 'now', 'shipped', 'closed', 'archived');--> statement-breakpoint
CREATE TABLE "feature_board_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"project_id" uuid
);
--> statement-breakpoint
CREATE TABLE "feature_board_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text,
	"description" text,
	"status" "feature_board_status" DEFAULT 'inbox' NOT NULL,
	"category_id" uuid,
	"author_id" uuid NOT NULL,
	"project_id" uuid,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"linear_issue_id" text,
	"linear_issue_url" text,
	"image_url" text,
	"internal_notes" text,
	"shipped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_board_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "feature_board_upvotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_board_upvotes_item_id_profile_id_unique" UNIQUE("item_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "feature_board_items" ADD CONSTRAINT "feature_board_items_category_id_feature_board_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."feature_board_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_board_items" ADD CONSTRAINT "feature_board_items_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_board_upvotes" ADD CONSTRAINT "feature_board_upvotes_item_id_feature_board_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."feature_board_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_board_upvotes" ADD CONSTRAINT "feature_board_upvotes_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feature_board_items_status" ON "feature_board_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feature_board_items_author" ON "feature_board_items" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_feature_board_items_project" ON "feature_board_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_feature_board_items_category" ON "feature_board_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_feature_board_upvotes_item" ON "feature_board_upvotes" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_feature_board_upvotes_profile" ON "feature_board_upvotes" USING btree ("profile_id");