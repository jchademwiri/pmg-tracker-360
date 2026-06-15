/**
 * promote-admin.ts
 * Promotes a registered user's role to 'admin'.
 * Run with: bun scripts/promote-admin.ts <email>
 */
import "../src/load-env";
import { db } from "../src/index";
import { user } from "../src/schema";
import { eq } from "drizzle-orm";


async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error("❌ Error: Please specify the user's email address.");
    console.log("Usage: bun scripts/promote-admin.ts <email>");
    process.exit(1);
  }

  console.log(`🔍 Searching for user with email: ${email}...`);

  const foundUser = await db.query.user.findFirst({
    where: eq(user.email, email.trim().toLowerCase()),
  });

  if (!foundUser) {
    console.error(`❌ User not found with email: ${email}`);
    console.log("Please sign up first at http://localhost:3000/sign-up");
    process.exit(1);
  }

  console.log(`👤 Found user: ${foundUser.name} (Role: ${foundUser.role})`);
  console.log(`⚡ Promoting to 'admin' role...`);

  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.id, foundUser.id));

  console.log(`✅ Success! ${foundUser.name} has been promoted to 'admin'.`);
  console.log(`🚀 You can now access the Admin Portal at http://localhost:3001`);
}

run()
  .catch((err) => {
    console.error("❌ Promotion failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    const { client } = await import("../src/index");
    await client.end();
    process.exit(0);
  });
