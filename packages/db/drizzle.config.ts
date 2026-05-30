import { config } from "dotenv";
import type { Config } from "drizzle-kit";
import * as path from "path";

config({ path: path.resolve(__dirname, "../../.env.local") });


export default {
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
