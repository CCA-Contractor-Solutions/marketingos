---
name: Marketing app rebrand & reseed
description: How the CCA/Cadence marketing app is structured and the gotchas when rebranding or reseeding its data
---

The marketing "command center" product lives in `artifacts/web` (the live, API-backed app).
`artifacts/mockup-sandbox/src/components/mockups/marketing-os/*` are the ORIGINAL static
source mockups — not the live app; do not treat them as production surfaces.

**Brand text is split across two artifacts.** A rebrand of the web frontend is not complete
until the API content is also updated, because the frontend renders live API data:
- `artifacts/api-server/src/seed.ts` — seeded message senders, assistant variants, app content.
- `artifacts/api-server/src/routes/assistant.ts` — hardcoded assistant draft responses.

**Why:** Pages like AI Assistant and Collaboration display API responses verbatim, so legacy
brand strings in seed/route content leak into the rebranded UI even when all frontend source
strings are changed.

**Reseed gotcha:** `seedDatabase()` in `artifacts/api-server/src/index.ts` runs on startup but
**skips if any campaigns row exists** (`if (existing.length > 0) return`). Editing `seed.ts`
alone does nothing to an already-seeded DB.
**How to apply:** To pick up new seed content, TRUNCATE the seeded tables, then restart the
api-server workflow (its `dev` script rebuilds from source, then re-seeds the empty DB):
`TRUNCATE TABLE app_content, assistant_messages, messages, threads, tasks, campaigns RESTART IDENTITY CASCADE;`
Table names (SQL): campaigns, tasks, threads, messages (cols: sender/content, not author),
assistant_messages (content/intro/variants), app_content (data jsonb). Schema:
`lib/db/src/schema/marketing.ts`.

**Single canonical app:** there was previously a duplicate `artifacts/cadence` that conflicted
with `artifacts/web` because both declared `previewPath "/"`. Only `artifacts/web` should exist.

**Build env:** `pnpm --filter @workspace/web run build` requires `PORT` and `BASE_PATH` env vars
(vite.config.ts throws if absent), e.g. `PORT=5000 BASE_PATH=/ pnpm ... build`.

**Task API limitation:** the create-task endpoint accepts title/status/priority (+optional
campaign/dueDate) only — there is NO assignee field, despite assignees showing on cards.
