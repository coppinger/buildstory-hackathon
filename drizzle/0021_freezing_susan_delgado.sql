CREATE TYPE "public"."post_context_type" AS ENUM('project', 'tool');--> statement-breakpoint
CREATE TYPE "public"."post_source" AS ENUM('manual', 'cli', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."reaction_emoji" AS ENUM('fire', 'rocket', 'lightbulb', 'clap', 'wrench');--> statement-breakpoint
CREATE TYPE "public"."reaction_target_type" AS ENUM('post', 'comment');--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"parent_comment_id" uuid,
	"reaction_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"image_url" text,
	"link_url" text,
	"context_type" "post_context_type" NOT NULL,
	"context_id" uuid NOT NULL,
	"source" "post_source" DEFAULT 'manual' NOT NULL,
	"reaction_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"target_type" "reaction_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"emoji" "reaction_emoji" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_target_type_target_id_profile_id_emoji_unique" UNIQUE("target_type","target_id","profile_id","emoji")
);
--> statement-breakpoint
ALTER TABLE "ai_tools" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "ai_tools" ADD COLUMN "icon_url" text;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_post_comments_post" ON "post_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_comments_author" ON "post_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_post_comments_parent" ON "post_comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "idx_posts_context" ON "posts" USING btree ("context_type","context_id");--> statement-breakpoint
CREATE INDEX "idx_posts_author" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_posts_created" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_reactions_target" ON "reactions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_reactions_profile" ON "reactions" USING btree ("profile_id");