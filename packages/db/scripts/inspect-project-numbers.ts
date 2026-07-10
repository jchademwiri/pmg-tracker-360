/**
 * inspect-project-numbers.ts
 *
 * Quick inspection to understand the state of project numbers in the database
 * before creating a migration script.
 */
import "../src/load-env";
import postgres from "postgres";

async function run() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  try {
    const projects = await sql<{
      id: string;
      organization_id: string;
      project_number: string;
    }[]>`
      SELECT id, organization_id, project_number
      FROM project
      WHERE deleted_at IS NULL
      ORDER BY project_number
    `;

    console.log("Total projects:", projects.length);
    console.log("");

    // Check if any contain dirty characters (slashes, spaces, backslashes)
    const dirtyProjects = projects.filter((p) =>
      /[/\\ ]/.test(p.project_number),
    );
    console.log("Projects with slashes/spaces:", dirtyProjects.length);
    if (dirtyProjects.length > 0) {
      for (const p of dirtyProjects) {
        console.log("  ", p.project_number);
      }
    }
    console.log("");

    // Check if any are uppercase (not already lowercase)
    const nonLowercase = projects.filter(
      (p) => p.project_number !== p.project_number.toLowerCase(),
    );
    console.log("Projects with uppercase letters:", nonLowercase.length);
    if (nonLowercase.length > 0) {
      for (const p of nonLowercase) {
        console.log(
          "  ",
          p.project_number,
          "→",
          p.project_number.toLowerCase(),
        );
      }
    }
    console.log("");

    // Check for potential collisions (same lowercase value within same org)
    const orgGroups = new Map<string, string[]>();
    for (const p of projects) {
      const key = p.organization_id + ":" + p.project_number.toLowerCase();
      if (!orgGroups.has(key)) orgGroups.set(key, []);
      orgGroups.get(key)!.push(p.project_number);
    }
    let dupes = 0;
    for (const [key, vals] of orgGroups) {
      if (vals.length > 1) {
        console.log("⚠️  Potential collision:", key, vals);
        dupes++;
      }
    }
    if (dupes === 0) console.log("✅ No potential collisions detected.");
  } finally {
    await sql.end();
  }
}

run().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
