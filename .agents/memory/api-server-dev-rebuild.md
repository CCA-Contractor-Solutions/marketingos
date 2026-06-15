---
name: api-server dev rebuild
description: Why source edits to artifacts/api-server don't appear until the workflow restarts.
---

The `@workspace/api-server` dev script builds a bundle then runs the built
output (build → start), so it does NOT hot-reload on source changes like the
Vite/Expo artifacts do.

**Why:** the server is bundled and run from `dist/`, not executed from source.

**How to apply:** after editing any api-server source file, or after changing
environment variables the server reads, restart the
`artifacts/api-server: API Server` workflow before testing — otherwise you're
hitting a stale process. The same applies to Vite/Expo clients for env-var
changes (env is injected at dev-server start, so restart to pick up new vars).
