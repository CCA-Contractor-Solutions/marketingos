const MONTH_ABBR = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Parses the free-form `dueDate` strings used in the seed data
 * ("Today", "Tomorrow", "Yesterday", "Oct 12", ISO dates) into a Date.
 * Returns null when the value is empty or cannot be understood.
 */
export function parseDueDate(
  due: string | null | undefined,
  ref: Date = new Date(),
): Date | null {
  if (!due) return null;
  const s = due.trim().toLowerCase();
  if (!s) return null;

  const base = startOfDay(ref);
  if (s === "today") return base;
  if (s === "tomorrow") {
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (s === "yesterday") {
    const d = new Date(base);
    d.setDate(d.getDate() - 1);
    return d;
  }

  const m = s.match(/^([a-z]{3,})\.?\s+(\d{1,2})$/);
  if (m) {
    const monthIdx = MONTH_ABBR.indexOf(m[1].slice(0, 3));
    const day = parseInt(m[2], 10);
    if (monthIdx >= 0 && day >= 1 && day <= 31) {
      return new Date(ref.getFullYear(), monthIdx, day);
    }
  }

  const parsed = Date.parse(due);
  if (!Number.isNaN(parsed)) return startOfDay(new Date(parsed));

  return null;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayDiff(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatShort(d: Date): string {
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`;
}

export function formatMonthYear(d: Date): string {
  return `${
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][d.getMonth()]
  } ${d.getFullYear()}`;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Returns a relative label for a date compared to today, used for due-date
 * styling/messaging in the views.
 */
export function relativeLabel(d: Date, ref: Date = new Date()): string {
  const diff = dayDiff(d, ref);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatShort(d);
}

export function isOverdue(d: Date, ref: Date = new Date()): boolean {
  return dayDiff(d, ref) < 0;
}
