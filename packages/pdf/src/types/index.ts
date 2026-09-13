import type { ReactNode } from "react";

export type PdfDocumentKind =
  | "purchase-order"
  | "tender-detail"
  | "tender-win-loss"
  | "tender-register"
  | "platform-executive"
  | "storage-audit"
  | "security-audit";

export interface PdfRenderContext {
  generatedAt: Date;
  locale: "en-ZA";
  timeZone: "Africa/Johannesburg";
}

export interface PdfBranding {
  organizationName: string;
  logoDataUri?: string;
  phone?: string;
  address?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  registrationNumber?: string;
}

export interface PdfRenderResult {
  bytes: Uint8Array;
  pageCount?: number;
  durationMs?: number;
}

export type PdfOrientation = "portrait" | "landscape";
export type PdfPageSize = "a4" | "a3" | "letter";

export interface PdfColorTokens {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  borderLight: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
  card: string;
  cardForeground: string;
  tableHeaderBg: string;
  tableRowEven: string;
  tableRowOdd: string;
}

export interface PdfTheme {
  name: "tracker" | "admin";
  colors: PdfColorTokens;
  fontFamily: string;
  margins: {
    portrait: { top: number; right: number; bottom: number; left: number };
    landscape: { top: number; right: number; bottom: number; left: number };
  };
}

export interface KeyValueItem {
  label: string;
  value: ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
}

export interface KpiCardItem {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

export interface DataTableColumn<T> {
  id: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => ReactNode;
  accessorKey?: keyof T;
}

export type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "destructive" | "outline";
