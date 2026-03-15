-- Extend Hackathon 00 submissions and judging deadline
-- Set status to "judging" (always respected by getComputedEventState)
-- Set reviewClosesAt to Wed March 18 10:00 AM Fiji time (UTC+12) = 2026-03-17T22:00:00Z
-- Once reviewClosesAt passes, getComputedEventState auto-transitions to "complete"
UPDATE "events"
SET "status" = 'judging',
    "review_closes_at" = '2026-03-17T22:00:00Z',
    "updated_at" = NOW()
WHERE "slug" = 'hackathon-00';
