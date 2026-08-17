import { SAST_TIMEZONE } from "./timezone";

const KNOWN_UPPERCASE_ACRONYMS = new Set([
  "SOC",
  "LTD",
  "PTY",
  "NPC",
  "JV",
  "CC",
  "CO",
  "RF",
  "SOE",
  "DWS",
  "PRASA",
  "SANRAL",
  "SARS",
  "SABC",
  "PMG",
  "CSIR",
  "SITA",
  "SAPO",
  "SAPS",
]);

const LOWERCASE_WORDS = new Set([
  // Articles
  "a",
  "an",
  "the",
  // Conjunctions
  "and",
  "but",
  "for",
  "nor",
  "or",
  "so",
  "yet",
  // Short Prepositions & Particles
  "of",
  "off",
  "in",
  "on",
  "at",
  "to",
  "by",
  "with",
  "from",
  "into",
  "onto",
  "per",
  "via",
  "as",
  "up",
  "out",
  "re",
  "vs",
  // Pronouns / Small connecting words
  "it",
  "its",
]);

/**
 * Formats a client/organization name with proper title casing while preserving
 * standard South African business acronyms (SOC, LTD, PTY, JV, etc.).
 * e.g. "ESKOM HOLDINGS SOC LTD" -> "Eskom Holdings SOC LTD"
 * e.g. "CITY OF TSHWANE" -> "City of Tshwane"
 */
export function formatClientName(value: string | null | undefined): string {
  if (!value) return "";
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (KNOWN_UPPERCASE_ACRONYMS.has(cleanWord)) {
        return word.toUpperCase();
      }
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_WORDS.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Capitalizes the first letter of every word ("Title Case"), while keeping
 * minor connecting words (e.g. of, off, and, the, in, on, at, to, for, with, it)
 * in lowercase unless they are the first word. Also preserves known acronyms.
 * e.g. "SUPPLY AND DELIVERY OF IT EQUIPMENT" -> "Supply and Delivery of it Equipment"
 * e.g. "SWITCH OFF POWER AT SUBSTATION" -> "Switch off Power at Substation"
 */
export function toTitleCase(value: string | null | undefined): string {
  if (!value) return "";
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      if (KNOWN_UPPERCASE_ACRONYMS.has(cleanWord)) {
        return word.toUpperCase();
      }
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_WORDS.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Formats a date as "24 Feb 2026" in SAST timezone.
 * Pass a fallback string as the second argument (default '-').
 */
export function formatDate(
  date: Date | string | null | undefined,
  fallback = "-",
): string {
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SAST_TIMEZONE,
  }).format(new Date(date));
}

/**
 * Formats a date + time as "24 Feb 2026, 10:00" in SAST timezone.
 * Pass a fallback string as the second argument (default '-').
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  fallback = "-",
): string {
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SAST_TIMEZONE,
  }).format(new Date(date));
}

/**
 * Formats a monetary value as South African Rand (ZAR).
 * Accepts number, numeric string, null, or undefined.
 *
 * Deliberately does NOT use Intl.NumberFormat's 'en-ZA' currency style: its
 * digit-group separator (comma vs. narrow no-break space) depends on the
 * runtime's ICU/CLDR data, which differs between Node (SSR) and the
 * browser (CSR) — causing a React hydration mismatch on every rendered
 * currency value. 'en-US' grouping is a plain comma everywhere, so we
 * format the digits with it and prepend "R" ourselves for a
 * deterministic result regardless of runtime.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  if (amount === null || amount === undefined || amount === "") return "R 0";

  const numericAmount =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[Rr\s,]/g, ""))
      : amount;

  if (isNaN(numericAmount)) return "R 0";

  const minimumFractionDigits = options.minimumFractionDigits ?? 0;
  const maximumFractionDigits =
    options.maximumFractionDigits ?? minimumFractionDigits;

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Math.abs(numericAmount));

  const sign = numericAmount < 0 ? "-" : "";
  return `${sign}R ${formatted}`;
}

export function formatNumber(
  amount: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat("en-US", {
    ...options,
  }).format(amount);
}

export function formatPercentage(
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options,
  }).format(value / 100);
}

/**
 * Normalizes and standardizes phone numbers into a consistent, readable format.
 * e.g. "0118002000" -> "011 800 2000"
 * e.g. "+27118002000" -> "+27 11 800 2000"
 * e.g. "082 1234567" -> "082 123 4567"
 * e.g. "+27 (0) 82 123 4567" -> "+27 82 123 4567"
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  // Remove parentheses around (0) in international formats: "+27 (0) 11" -> "+27 11"
  const cleanParentheses = trimmed.replace(/\(\s*0\s*\)/g, "");

  const hasPlus = cleanParentheses.startsWith("+");
  const digitsOnly = cleanParentheses.replace(/\D/g, "");

  // South African 10-digit standard: 0XX XXX XXXX (e.g. 0118002000, 0821234567)
  if (!hasPlus && digitsOnly.length === 10 && digitsOnly.startsWith("0")) {
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  }

  // South African international 11-digit standard: 27XX XXX XXXX (e.g. +27118002000)
  if (hasPlus && digitsOnly.startsWith("27") && digitsOnly.length === 11) {
    return `+27 ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 7)} ${digitsOnly.slice(7)}`;
  }

  // General 9-digit without leading 0: XX XXX XXXX -> 0XX XXX XXXX
  if (!hasPlus && digitsOnly.length === 9) {
    return `0${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5)}`;
  }

  // Fallback: chunk digits cleanly in 3s/4s or return clean formatted string
  if (digitsOnly.length > 6) {
    const prefix = hasPlus ? "+" : "";
    if (digitsOnly.length <= 10) {
      return `${prefix}${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`.trim();
    }
    return `${prefix}${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5, 8)} ${digitsOnly.slice(8)}`.trim();
  }

  return trimmed;
}

/**
 * Formats a byte count into a human-readable file size string.
 * e.g. 1024 → "1 KB", 1048576 → "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
