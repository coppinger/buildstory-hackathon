import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { aiTools } from "../lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const TOOLS_BY_CATEGORY: Record<string, string[]> = {
  Planning: ["Claude", "ChatGPT", "Gemini", "Cursor Composer", "v0", "Bolt"],
  Coding: [
    "Claude Code",
    "Cursor",
    "Windsurf",
    "GitHub Copilot",
    "Aider",
    "Devin",
  ],
  "Code Review": [
    "CodeRabbit",
    "Claude PR Review",
    "Copilot Review",
    "Manual",
  ],
  Models: [
    "Claude 3.5 Sonnet",
    "Claude 3 Opus",
    "GPT-4o",
    "Gemini Pro",
    "Llama",
    "DeepSeek",
  ],
};

async function seed() {
  const rows = Object.entries(TOOLS_BY_CATEGORY).flatMap(
    ([category, tools]) =>
      tools.map((name) => ({
        name,
        slug: slugify(name),
        category,
      }))
  );

  for (const row of rows) {
    await db
      .insert(aiTools)
      .values(row)
      .onConflictDoNothing({ target: aiTools.slug });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${rows.length} AI tools`);
}

seed().catch(console.error);
