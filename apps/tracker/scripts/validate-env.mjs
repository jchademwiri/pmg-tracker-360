const requiredVars = ["DATABASE_URL"];

const missing = requiredVars.filter((name) => !process.env[name]);

if (missing.length > 0) {
  const message = [
    "",
    "Tracker build blocked: required environment variables are missing.",
    `Missing: ${missing.join(", ")}`,
    "",
    "How to fix on Vercel:",
    "1) Project Settings -> Environment Variables",
    "2) Add DATABASE_URL for Preview/Production (or reconnect your Postgres/Neon integration)",
    "",
  ].join("\n");

  // Use stderr so the error is obvious in CI logs.
  console.error(message);
  process.exit(1);
}
