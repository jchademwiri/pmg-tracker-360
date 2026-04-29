import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Drizzle Studio runs on port 4983 by default — kept explicit to avoid conflicts
  studio: {
    port: 4983,
  },
} satisfies Config;
