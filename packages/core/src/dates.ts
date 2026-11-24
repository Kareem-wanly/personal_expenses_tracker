/**
 * Calendar-date helpers. Expense dates are stored as plain `YYYY-MM-DD`
 * strings in the user's local calendar, so we never do timezone math on them.
 */
export const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const TZ_COOKIE = "tz";

const pad = (n: number) => String(n).padStart(2, "0");

/** Today's date (`YYYY-MM-DD`) in the given IANA time zone. */
export function todayISO(timeZone = "UTC", now = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse `YYYY-MM-DD` as a local date at noon (DST-safe for arithmetic). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthRange(month: string) {
  return {
    start: `${month}-01`,
    end: `${month}-${pad(daysInMonth(month))}`,
  };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Last `count` months ending with `month`, oldest first. */
export function lastMonths(month: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    shiftMonth(month, i - (count - 1)),
  );
}

export function normalizeMonth(value: unknown, fallback: string): string {
  return typeof value === "string" && MONTH_RE.test(value) ? value : fallback;
}

const LOCALE = "ar-u-nu-latn";

export function formatMonthLabel(month: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    year: "numeric",
  }).format(parseISODate(`${month}-01`));
}

export function formatShortMonth(month: string): string {
  return new Intl.DateTimeFormat(LOCALE, { month: "short" }).format(
    parseISODate(`${month}-01`),
  );
}

export function formatDayLabel(iso: string, today: string): string {
  if (iso === today) return "اليوم";
  if (iso === addDays(today, -1)) return "أمس";
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseISODate(iso));
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
  }).format(parseISODate(iso));
}
