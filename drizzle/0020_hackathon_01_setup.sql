-- Update Hackathon 00 end date for the state machine
-- endsAt → March 11 00:00 UTC (retroactive submission window)
-- Judging: March 11–13 (computed via 48hr JUDGING_DURATION_MS)
-- Complete: after March 13 (computed)
UPDATE "events"
SET "ends_at" = '2026-03-11T00:00:00Z',
    "updated_at" = NOW()
WHERE "slug" = 'hackathon-00';
--> statement-breakpoint
-- Insert Hackathon 01
INSERT INTO "events" ("name", "slug", "description", "starts_at", "ends_at", "registration_opens_at", "status")
VALUES (
  'Hackathon 01',
  'hackathon-01',
  'The second Buildstory hackathon. One week, fully remote. Build something real with AI tools, share your process, and connect with builders worldwide.',
  '2026-03-28T12:00:00Z',
  '2026-04-04T12:00:00Z',
  NOW(),
  'open'
);
