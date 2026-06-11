---
name: Stale dist breaks typecheck across project references
description: Why a web package's typecheck reports missing exports from a workspace lib even when the source is correct
---

# `tsc -p --noEmit` does NOT rebuild referenced composite projects

The monorepo links workspace libs (e.g. `@workspace/api-client-react`) via TypeScript
**project references** (`composite: true`, emits `dist/*.d.ts`). A consuming package's
`typecheck` script runs `tsc -p tsconfig.json --noEmit`, which type-resolves references
against their **already-built `dist/` declarations**, not their current source.

Symptom: web typecheck fails with `has no exported member 'useCreateCampaign'` even though
the export clearly exists in the lib's source — because the committed `dist/*.d.ts` is stale
(source was regenerated/changed but dist was never rebuilt). Runtime is fine because the
package `exports` map points at `./src`.

**Why:** `tsc -p` (project mode) trusts existing reference outputs; only `tsc --build` walks
and rebuilds the reference graph.

**How to apply:** When a consumer reports missing members from a workspace lib, suspect a
stale `dist`. Rebuild it with `pnpm exec tsc --build <lib>/tsconfig.json --force`, then
re-run the consumer's typecheck. Note the api client can also be transiently torn mid-write
during concurrent task-agent codegen merges — re-check after merges settle before assuming a
real source error.
