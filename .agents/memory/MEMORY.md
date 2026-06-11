# Memory Index

- [Artifact workflow port detection](artifact-port-assignment.md) — path-router web artifact on a non-standard high port fails DIDNT_OPEN_A_PORT; move to a standard port.
- [Marketing app rebrand & reseed](marketing-app-rebrand.md) — single canonical web app (artifacts/web); brand text also lives in API seed/routes; seed skips when DB non-empty.
- [Expo port detection in task-agent sandbox](expo-port-detection-sandbox.md) — expo-domain workflow always fails port detection here (Metro socket invisible to detector); not a port/IPv6 issue; don't retry restarts/screenshots.
- [DB schema push before api-server seed](db-schema-push.md) — api-server seed throws "relation does not exist" until the drizzle schema is pushed; push then restart.
- [Mobile local notifications](mobile-notifications.md) — Cadence reminders are client-side expo-notifications; task scheduling needs ISO `dueAt`, not display `dueDate`.
