---
name: api-client-react stale dist declarations
description: Why a field present in the api-client-react source is still "missing" when an artifact type-checks, and how to fix it.
---

# api-client-react stale dist declarations

Artifacts (e.g. `artifacts/web`) consume `@workspace/api-client-react` via TS **project references**
(`references: [{ path: "../../lib/api-client-react" }]`), so `tsc` resolves the lib's **built `dist/*.d.ts`**,
NOT its `src`. The package `exports` map points at `./src/index.ts`, which is misleading — project references win.

**Symptom:** a field exists in `lib/api-client-react/src/generated/api.schemas.ts` (e.g. `TaskUpdate.dueAt`)
but the consuming artifact errors `Property 'X' does not exist on type 'Y'` because `dist` is stale.

**Fix:** rebuild the lib declarations from the repo root: `pnpm run typecheck:libs` (runs `tsc --build`).
Then re-run the artifact's `tsc --noEmit`.

**Why:** `dist` is checked-in/generated output that can lag behind `src` after the OpenAPI spec / codegen changes.
**How to apply:** any time a shared `@workspace/*` lib type looks out of date in an artifact, rebuild libs before chasing the error in app code.
