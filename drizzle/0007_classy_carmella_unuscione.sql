CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_profile_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_profile_id" uuid,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "banned_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "banned_by" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "hidden_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "hidden_by" uuid;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_profile_id_profiles_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_target_profile_id_profiles_id_fk" FOREIGN KEY ("target_profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;