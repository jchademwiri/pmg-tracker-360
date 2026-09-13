/**
 * South African Currency & Date Formatters for PMG Tracker 360 PDF generation.
 */

export function formatZar(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "R 0.00";
  }

  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    return "R 0.00";
  }

  const parts = numeric.toFixed(2).split(".");
  const integerPart = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, " ") ?? "0";
  const decimalPart = parts[1] ?? "00";

  return `R ${integerPart}.${decimalPart}`;
}

export function formatDateSa(
  date: Date | string | number | null | undefined,
  fallback = "-"
): string {
  if (!date) return fallback;

  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return fallback;

    return new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Johannesburg",
    }).format(d);
  } catch {
    return fallback;
  }
}

export function formatDateTimeSa(
  date: Date | string | number | null | undefined,
  fallback = "-"
): string {
  if (!date) return fallback;

  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return fallback;

    return new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Johannesburg",
    }).format(d);
  } catch {
    return fallback;
  }
}

export function formatNumber(
  value: number | string | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numeric = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numeric)) {
    return "0";
  }

  return numeric.toLocaleString("en-ZA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(
  ratio: number | string | null | undefined,
  decimals = 1
): string {
  if (ratio === null || ratio === undefined || ratio === "") {
    return "0.0%";
  }

  const numeric = typeof ratio === "string" ? parseFloat(ratio) : ratio;
  if (isNaN(numeric)) {
    return "0.0%";
  }

  return `${(numeric * (numeric <= 1 && numeric > 0 ? 100 : 1)).toFixed(decimals)}%`;
}
