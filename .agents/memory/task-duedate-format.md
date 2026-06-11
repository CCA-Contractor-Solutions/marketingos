---
name: Task dueDate is a real ISO date
description: How task due dates are stored and how the task views render date-based layouts
---

Task `dueDate` (Task type in `@workspace/api-client-react`, seeded in the API server) is a **real ISO date string** stored as date-only `"YYYY-MM-DD"`. It is NOT a free-form display label anymore (it used to be `"Today"`/`"Oct 12"`/null, which drifted). Seed values are computed relative to seed time via `inDays(offset)` in `artifacts/api-server/src/seed.ts`, so Calendar/Timeline/sorting/overdue stay accurate as time passes. Reseed (truncate seeded tables) to pick up new seed values — `seedDatabase()` skips when the campaigns table is non-empty.

**Why:** stored display strings drifted ("Today" was always today) and unparseable labels silently became "Unscheduled". Storing real dates makes scheduling trustworthy.

**How to apply:**
- Web views (`artifacts/web/src/pages/task-views/*` and `TaskBoard.tsx`) read the date via the shared `parseDueDate` in `task-views/dates.ts`. That helper now parses ISO only (date-only `YYYY-MM-DD` is built in *local* time to avoid a UTC off-by-one; full ISO timestamps also accepted). It returns `null` for empty/invalid.
- Do NOT use `new Date("YYYY-MM-DD")` directly — that is UTC midnight and shifts the calendar day in negative-offset timezones. Use `parseDueDate`.
- For display, format with `relativeLabel(date)` (Today/Tomorrow/Yesterday/"Mon DD") and `formatShort`; color overdue/today via `isOverdue`/`isSameDay`.
- `dueDate` (date-only) is separate from `dueAt` (precise ISO timestamp used only by mobile reminders). Both are seeded consistently per task but serve different layers; mobile schedules off `dueAt`, web reads `dueDate`.

**Write format decision:** when *writing* a due date back (e.g. drag-to-reschedule on the calendar/timeline), use `formatISODate(date)` → `"YYYY-MM-DD"` (in `task-views/dates.ts`), built from *local* date parts (not `toISOString`, which would shift the day in negative-offset timezones). This round-trips cleanly through `parseDueDate`. Do NOT write `formatShort` ("Mon DD") or relative labels ("Today"/"Tomorrow") — the store is ISO now and those would no longer parse / would drift.
