import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const isLocal =
  process.env.DATABASE_URL.includes("localhost") ||
  process.env.DATABASE_URL.includes("127.0.0.1") ||
  process.env.DATABASE_URL.includes("sslmode=disable");

export const client = postgres(process.env.DATABASE_URL, {
  // In Vercel serverless environments, each invocation is single-threaded;
  // keep max connections low (1) and idle timeout short (3s) to prevent connection pool exhaustion and reduce active CPU.
  max: process.env.VERCEL ? 1 : 20,
  idle_timeout: process.env.VERCEL ? 3 : 20,
  connect_timeout: 10,
  ssl: isLocal ? false : "require",
  // Connection retry settings
  max_lifetime: 60 * 30, // 30 minutes
});
export const db = drizzle({ client, schema });
export { schema };

export type Database = typeof db;
