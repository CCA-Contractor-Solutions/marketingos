---
name: DB schema push before api-server seed
description: api-server seed crashes with "relation does not exist" on a fresh database until the drizzle schema is pushed
---

On a fresh database, `artifacts/api-server` fails at startup with
`Failed to seed database ... relation "campaigns" does not exist` because the tables
don't exist yet. The seed runs but there is no schema.

**Why:** The api-server's dev command builds + starts + seeds, but it does not create
tables. Schema creation is a separate drizzle step in `lib/db`.

**How to apply:** Run `pnpm --filter @workspace/db run push` (drizzle-kit push, config
at `lib/db/drizzle.config.ts`), then restart the api-server workflow so the seed
succeeds. Verify with `curl https://$REPLIT_DEV_DOMAIN/api/dashboard/summary`.
