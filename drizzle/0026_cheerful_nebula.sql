ALTER TABLE "events" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "events_featured_unique" ON "events" ("featured") WHERE "featured" = true;
--> statement-breakpoint
UPDATE "events" SET "featured" = true WHERE "slug" = 'hackathon-01';