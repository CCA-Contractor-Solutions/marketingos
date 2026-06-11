---
name: Task dueDate is free-form text, not a date
description: How task due dates are stored and how the task views render date-based layouts
---

Task `dueDate` (Task type in `@workspace/api-client-react`, seeded in the API server) is a **free-form string**, not an ISO date or timestamp. Seed values are mixed relative + absolute labels: `"Today"`, `"Tomorrow"`, `"Yesterday"`, `"Oct 12"`, `null`/absent.

**Why:** the app was built design-first; due dates are display labels, never real Date objects in the data model.

**How to apply:** any date-based feature (calendar placement, timeline/Gantt, sorting by due date, overdue detection) must parse these strings into Dates relative to *now*. The Task Board views use a shared parser in `artifacts/web/src/pages/task-views/dates.ts` (`parseDueDate`) that handles today/tomorrow/yesterday offsets and `"Mon DD"` month-abbrev parsing, returning `null` for unparseable/empty values — unparseable tasks are shown as "Unscheduled"/"No due date" rather than dropped. Reuse that helper instead of `new Date(dueDate)`, which fails on relative labels.
