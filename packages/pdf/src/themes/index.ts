export * from "./tracker";
export * from "./admin";

import { trackerTheme } from "./tracker";
import { adminTheme } from "./admin";
import type { PdfTheme } from "../types/index";

export function getTheme(themeName?: "tracker" | "admin"): PdfTheme {
  if (themeName === "admin") return adminTheme;
  return trackerTheme;
}
