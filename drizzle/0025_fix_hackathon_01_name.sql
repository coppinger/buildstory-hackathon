-- Fix Hackathon 01 name to include # for consistency with Hackathon #00
-- Update start/end dates to Sunday March 29 12pm PT – Sunday April 5 12pm PT
UPDATE "events"
SET "name" = 'Hackathon #01',
    "starts_at" = '2026-03-29T19:00:00Z',
    "ends_at" = '2026-04-05T19:00:00Z',
    "updated_at" = NOW()
WHERE "slug" = 'hackathon-01';
