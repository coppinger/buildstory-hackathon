import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

// Node 20 lacks globalThis.WebSocket; provide ws as fallback
if (!globalThis.WebSocket) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws");
}

export const db = drizzle({
  connection: process.env.DATABASE_URL!,
  schema,
});
