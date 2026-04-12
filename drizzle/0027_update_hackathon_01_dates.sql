-- Update Hackathon #01 dates to April 19–26, 2026 (Sunday 12pm PT = 19:00 UTC)
UPDATE "events"
SET
    "starts_at" = '2026-04-19T19:00:00Z',
    "ends_at" = '2026-04-26T19:00:00Z',
    "updated_at" = NOW()
WHERE "slug" = 'hackathon-01';
