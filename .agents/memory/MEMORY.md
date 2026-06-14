# Memory Index

- [Artifact workflow port detection](artifact-port-assignment.md) — path-router web artifact on a non-standard high port fails DIDNT_OPEN_A_PORT; move to a standard port.
- [Marketing app rebrand & reseed](marketing-app-rebrand.md) — single canonical web app (artifacts/web); brand text also lives in API seed/routes; seed skips when DB non-empty.
- [Expo port detection in task-agent sandbox](expo-port-detection-sandbox.md) — expo-domain workflow always fails port detection here (Metro socket invisible to detector); not a port/IPv6 issue; don't retry restarts/screenshots.
- [DB schema push before api-server seed](db-schema-push.md) — api-server seed throws "relation does not exist" until the drizzle schema is pushed; push then restart.
- [Mobile local notifications](mobile-notifications.md) — Cadence reminders are client-side expo-notifications; task scheduling needs ISO `dueAt`, not display `dueDate`.
- [Task dueDate is ISO date-only](task-duedate-format.md) — dueDate is real `YYYY-MM-DD` (not free-form); parse/format via task-views/dates.ts (local time), never `new Date("YYYY-MM-DD")`.
- [api-client-react stale dist](api-client-stale-dist.md) — artifacts type-check against the lib's built dist via project refs; rebuild with `pnpm run typecheck:libs` when a src field looks "missing".
- [Radix portal CSS tokens](radix-portal-css-tokens.md) — portaled menus render outside the app root; scope design tokens to :root or they're undefined (transparent menus).
- [shadcn theme tokens are hsl(red)](shadcn-theme-tokens.md) — scaffold ships --background/--popover/etc. as placeholder hsl(red); fill :root + .dark with real H S L triples or portaled shadcn components render unstyled.
- [Composite project typecheck](composite-project-typecheck.md) — `tsc -p --noEmit` uses stale lib dist; rebuild with `tsc --build <lib> --force` when a workspace export looks "missing".
- [Gesture handlers inside a Modal](mobile-gesture-in-modal.md) — RN Modal is a detached view tree; GestureDetector needs its own nested GestureHandlerRootView or pans never fire.
- [Tailwind v4 external @import ordering](tailwind-v4-font-imports.md) — external font @import after `@import "tailwindcss"` throws "must precede"; put font <link>s in index.html instead.
