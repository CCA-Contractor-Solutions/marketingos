---
name: shared app-token guard
description: The API access token is a shared, client-bundled gate — not real per-user auth.
---

The API protects mutating (non-GET) and AI endpoints with a single shared
bearer token, compared in `artifacts/api-server/src/lib/security.ts`. The same
value lives in three shared env vars (all identical): `API_ACCESS_TOKEN`
(server), `VITE_API_ACCESS_TOKEN` (web), `EXPO_PUBLIC_API_ACCESS_TOKEN`
(mobile).

**Why:** `VITE_`/`EXPO_PUBLIC_` env vars are inlined into the client bundle, so
the token is recoverable by anyone inspecting the app. It is therefore stored
as a plain shared env var (not a secret) and treated as a non-secret. It exists
to stop casual/anonymous public abuse and to pair with the per-IP AI rate
limiter — NOT as a substitute for authentication.

**How to apply:** do not present this token as security/auth. If real
per-user authentication is needed, that is a separate feature (e.g. the
clerk-auth or replit-auth skills), not an extension of this token. Reads
(GET/HEAD) are intentionally public; keep them that way unless asked otherwise.
