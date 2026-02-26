ALTER TABLE "profiles" ADD COLUMN "region" text;

-- Normalize existing free-text country values to ISO 3166-1 alpha-2 codes
UPDATE "profiles" SET country = 'NZ' WHERE LOWER(country) = 'new zealand';
UPDATE "profiles" SET country = 'IE' WHERE LOWER(country) = 'ireland';
UPDATE "profiles" SET country = 'US' WHERE LOWER(country) IN ('united states', 'usa', 'us');
UPDATE "profiles" SET country = 'GB' WHERE LOWER(country) IN ('united kingdom', 'uk', 'england', 'scotland', 'wales');
UPDATE "profiles" SET country = 'CA' WHERE LOWER(country) = 'canada';
UPDATE "profiles" SET country = 'AU' WHERE LOWER(country) = 'australia';
UPDATE "profiles" SET country = 'DE' WHERE LOWER(country) = 'germany';
UPDATE "profiles" SET country = 'FR' WHERE LOWER(country) = 'france';
UPDATE "profiles" SET country = 'IN' WHERE LOWER(country) = 'india';
UPDATE "profiles" SET country = 'BR' WHERE LOWER(country) = 'brazil';
-- Clear any remaining non-ISO values (longer than 2 chars)
UPDATE "profiles" SET country = NULL WHERE country IS NOT NULL AND LENGTH(country) > 2;
