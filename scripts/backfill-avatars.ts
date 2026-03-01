import { config } from "dotenv";
config({ path: ".env.local" });

import { createClerkClient } from "@clerk/backend";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, isNull } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const { profiles } = schema;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 1000;

async function main() {
  const allProfiles = await db
    .select({ id: profiles.id, clerkId: profiles.clerkId })
    .from(profiles)
    .where(isNull(profiles.avatarUrl));

  console.log(`Found ${allProfiles.length} profiles without avatarUrl`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < allProfiles.length; i += BATCH_SIZE) {
    const batch = allProfiles.slice(i, i + BATCH_SIZE);

    for (const profile of batch) {
      try {
        const user = await clerk.users.getUser(profile.clerkId);
        if (user.imageUrl) {
          await db
            .update(profiles)
            .set({ avatarUrl: user.imageUrl })
            .where(eq(profiles.id, profile.id));
          updated++;
        } else {
          skipped++;
        }
      } catch (err) {
        errors++;
        console.error(`Failed for ${profile.clerkId}:`, err);
      }
    }

    const progress = Math.min(i + BATCH_SIZE, allProfiles.length);
    console.log(`Progress: ${progress}/${allProfiles.length} (updated: ${updated}, skipped: ${skipped}, errors: ${errors})`);

    if (i + BATCH_SIZE < allProfiles.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch(console.error);
