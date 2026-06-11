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

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Parses a stored due date into a local Date at the start of that day.
 * Accepts a date-only value ("YYYY-MM-DD") or a full ISO timestamp.
 * Returns null when the value is empty or not a valid date.
 *
 * Mirrors the web helper in artifacts/web/src/pages/task-views/dates.ts so the
 * two clients agree on how the stored value is interpreted.
 */
export function parseDueDate(due: string | null | undefined): Date | null {
  if (!due) return null;
  const s = due.trim();
  if (!s) return null;

  // Date-only ISO (YYYY-MM-DD): build in local time so the calendar day is
  // not shifted by the viewer's timezone (new Date("YYYY-MM-DD") is UTC).
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  const parsed = Date.parse(s);
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

/**
 * Formats a local Date as a date-only ISO string ("YYYY-MM-DD") for storage.
 * Uses local date parts (not toISOString) so the stored calendar day matches
 * what the user sees, regardless of timezone. Round-trips through parseDueDate.
 *
 * This is the exact write format the web Calendar/Timeline drag uses
 * (TaskBoard.handleReschedule), so reschedules made on either client agree.
 */
export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns a relative label for a date compared to today, used for due-date
 * chips on the task cards.
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
