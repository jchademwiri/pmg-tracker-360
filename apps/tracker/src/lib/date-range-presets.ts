export type DateRangePreset =
  | "all"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "biannually"
  | "yearly"
  | "custom";

export interface DateRangePeriod {
  preset: DateRangePreset;
  startDate?: Date;
  endDate?: Date;
  periodLabel: string;
}

export function calculateDateRange(
  preset: DateRangePreset,
  customStart?: string | Date | null,
  customEnd?: string | Date | null,
  now: Date = new Date(),
): DateRangePeriod {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  switch (preset) {
    case "weekly": {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + diffToMonday,
        0,
        0,
        0,
        0,
      );
      const sunday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 6,
        23,
        59,
        59,
        999,
      );
      const fmt = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return {
        preset: "weekly",
        startDate: monday,
        endDate: sunday,
        periodLabel:
          "Week of " + fmt.format(monday) + " - " + fmt.format(sunday),
      };
    }

    case "monthly": {
      const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      const monthName = now.toLocaleString("en-GB", {
        month: "long",
        year: "numeric",
      });
      return {
        preset: "monthly",
        startDate: start,
        endDate: end,
        periodLabel: monthName,
      };
    }

    case "quarterly": {
      const quarterIndex = Math.floor(currentMonth / 3);
      const startMonth = quarterIndex * 3;
      const start = new Date(currentYear, startMonth, 1, 0, 0, 0, 0);
      const end = new Date(currentYear, startMonth + 3, 0, 23, 59, 59, 999);
      const quarterName = "Q" + (quarterIndex + 1) + " " + currentYear;
      const fmt = new Intl.DateTimeFormat("en-GB", { month: "short" });
      return {
        preset: "quarterly",
        startDate: start,
        endDate: end,
        periodLabel:
          quarterName +
          " (" +
          fmt.format(start) +
          " - " +
          fmt.format(end) +
          ")",
      };
    }

    case "biannually": {
      const isH1 = currentMonth < 6;
      const start = isH1
        ? new Date(currentYear, 0, 1, 0, 0, 0, 0)
        : new Date(currentYear, 6, 1, 0, 0, 0, 0);
      const end = isH1
        ? new Date(currentYear, 6, 0, 23, 59, 59, 999)
        : new Date(currentYear, 12, 0, 23, 59, 59, 999);
      const halfName = isH1
        ? "H1 " + currentYear + " (Jan - Jun)"
        : "H2 " + currentYear + " (Jul - Dec)";
      return {
        preset: "biannually",
        startDate: start,
        endDate: end,
        periodLabel: halfName,
      };
    }

    case "yearly": {
      const start = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      return {
        preset: "yearly",
        startDate: start,
        endDate: end,
        periodLabel: "Full Year " + currentYear,
      };
    }

    case "custom": {
      const s = customStart ? new Date(customStart) : undefined;
      const e = customEnd ? new Date(customEnd) : undefined;
      if (s) s.setHours(0, 0, 0, 0);
      if (e) e.setHours(23, 59, 59, 999);

      const fmt = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      let label = "Custom Range";
      if (s && e) {
        label = fmt.format(s) + " - " + fmt.format(e);
      } else if (s) {
        label = "From " + fmt.format(s);
      } else if (e) {
        label = "Up to " + fmt.format(e);
      }

      return {
        preset: "custom",
        startDate: s,
        endDate: e,
        periodLabel: label,
      };
    }

    case "all":
    default:
      return {
        preset: "all",
        periodLabel: "All Time",
      };
  }
}
