import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export function getDb(): Database {
  // During build, DATABASE_URL may be unset — fall back to a parse-safe placeholder.
  // Actual DB connections only happen at request time when the real URL is provided.
  const url = process.env.DATABASE_URL || "postgresql://placeholder@localhost/placeholder";
  return drizzle(neon(url), { schema });
}
