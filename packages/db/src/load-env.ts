import { config } from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export function loadEnv() {
  // Determine a starting directory for climbing up to find the workspace root
  let startDir = process.cwd();
  
  // Try to use import.meta.url if available in ESM
  try {
    if (import.meta.url) {
      const { fileURLToPath } = require("url");
      startDir = path.dirname(fileURLToPath(import.meta.url));
    }
  } catch (e) {
    // If require is not defined (standard ESM), try a dynamic import or fallback
    try {
      // In bun / modern ESM environment
      // @ts-ignore
      startDir = path.dirname(new URL(import.meta.url).pathname);
      // On Windows, pathname may start with leading slash (e.g. /D:/...)
      if (process.platform === "win32" && startDir.startsWith("/")) {
        startDir = startDir.substring(1);
      }
    } catch (err) {
      // Fallback to process.cwd()
    }
  }

  // Find workspace root .env.local
  let dir = startDir;
  let workspaceEnvPath = "";

  while (dir) {
    const potentialPath = path.join(dir, ".env.local");
    if (fs.existsSync(potentialPath)) {
      workspaceEnvPath = potentialPath;
      break;
    }
    
    // Also check if we hit a workspace marker like turbo.json or package.json
    // to stop traversing beyond the workspace. But checking the env file directly is safer.
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  // If not found climbing from the file directory, try process.cwd() as well
  if (!workspaceEnvPath) {
    dir = process.cwd();
    while (dir) {
      const potentialPath = path.join(dir, ".env.local");
      if (fs.existsSync(potentialPath)) {
        workspaceEnvPath = potentialPath;
        break;
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }

  if (workspaceEnvPath) {
    // Resolve full absolute path to avoid ambiguities
    const absoluteWorkspacePath = path.resolve(workspaceEnvPath);
    config({ path: absoluteWorkspacePath });
  } else {
    // If not found in the workspace, fallback to global .env.local in user's home directory
    const globalEnvPath = path.resolve(path.join(os.homedir(), ".env.local"));
    if (fs.existsSync(globalEnvPath)) {
      config({ path: globalEnvPath });
    } else {
      console.warn("⚠️ No .env.local found in workspace or global (home) directory.");
    }
  }
}

// Run immediately on import
loadEnv();
