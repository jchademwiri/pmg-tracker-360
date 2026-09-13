export * from "./tracker.js";
export * from "./admin.js";

import { trackerTheme } from "./tracker.js";
import { adminTheme } from "./admin.js";
import type { PdfTheme } from "../types/index.js";

export function getTheme(themeName?: "tracker" | "admin"): PdfTheme {
  if (themeName === "admin") return adminTheme;
  return trackerTheme;
}
