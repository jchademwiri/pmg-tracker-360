import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local if it exists (for local builds — Next.js only auto-loads it during `next dev/build`, not when Node runs this script directly)
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  const lines = readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const requiredVars = ["DATABASE_URL"];

const missing = requiredVars.filter((name) => !process.env[name]);

if (missing.length > 0) {
  const message = [
    "",
    "Tracker build blocked: required environment variables are missing.",
    `Missing: ${missing.join(", ")}`,
    "",
    "How to fix locally:",
    "  Add DATABASE_URL to apps/tracker/.env.local",
    "",
    "How to fix on Vercel:",
    "  Project Settings -> Environment Variables",
    "  Add DATABASE_URL for Preview/Production (or reconnect your Postgres/Neon integration)",
    "",
  ].join("\n");

  console.error(message);
  process.exit(1);
}
