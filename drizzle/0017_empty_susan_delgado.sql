CREATE TYPE "public"."notification_type" AS ENUM('team_invite', 'mention', 'item_shipped', 'comment_reply');--> statement-breakpoint
CREATE TABLE "feature_board_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"parent_comment_id" uuid,
	"is_edited" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"actor_profile_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feature_board_comments" ADD CONSTRAINT "feature_board_comments_item_id_feature_board_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."feature_board_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_board_comments" ADD CONSTRAINT "feature_board_comments_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_profile_id_profiles_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feature_board_comments_item" ON "feature_board_comments" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_feature_board_comments_author" ON "feature_board_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_profile_read" ON "notifications" USING btree ("profile_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_profile_created" ON "notifications" USING btree ("profile_id","created_at");