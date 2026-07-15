# Source of Truth

This document is the canonical record of *what is real* for the MarketingOS / CCA Marketing Command Center project. GitHub is the durable source of truth for code; this file resolves the "duplicate app confusion" pain point. Update it whenever the answers change.

## Canonical code

| Item | Value | Notes |
|---|---|---|
| **Repository** | `contractorcomplianceco-cmyk/marketingos` | The one and only canonical repo. |
| **Canonical branch** | `main` | All production deploys come from here. |
| **Package manager** | `pnpm` (pinned via `packageManager` / corepack) | `npm`/`yarn` are blocked by the `preinstall` guard. |
| **Node version** | 22+ (repo targets 24) | Required for pnpm and the API server. |

> ACTION (Carmen, Phase 0): fill in the currently deployed commit SHA for web and api-server and confirm they map to `main`.

| Surface | Deployed commit | Deploy target | Confirmed by / date |
|---|---|---|---|
| Web (`artifacts/web`) | `__________` | Replit autoscale (`[services.production]`) | |
| API (`artifacts/api-server`) | `__________` | Replit autoscale (`[services.production]`) | |

## Artifact status — what is the product vs. not

| Artifact | Path | Role | Publicly exposed? |
|---|---|---|---|
| **Web app** | `artifacts/web` | **THE product** — the marketing command center | Yes (gated until auth decided) |
| **Mobile app** | `artifacts/mobile` | Companion (approvals, task reminders) | Via app stores / internal |
| **API server** | `artifacts/api-server` | Backend for web + mobile | API only |
| **Walkthrough** | `artifacts/walkthrough` | Standalone marketing/intro video builder | **NO — internal/marketing only** |
| **Mockup sandbox** | `artifacts/mockup-sandbox` | Internal component/preview canvas | **NO — internal only** |

**Rule:** `walkthrough` and `mockup-sandbox` are NOT the product. They must not be reachable from public/client-facing URLs. Only `web` and `api-server` carry production service blocks.

## Other repos / copies

> ACTION (Carmen, Phase 0): list every other repo or Replit project that contains a copy of this code. Each must be marked "archived" or "reference only" so no work lands in the wrong place.

| Location | Status | Notes |
|---|---|---|
| (e.g. old Replit project) | archived / reference only | |

## Environment variables (injected at deploy — never committed)

| Variable | Used by | Required |
|---|---|---|
| `DATABASE_URL` | api-server, `lib/db` | Yes (throws if missing) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI copilot | Yes |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI copilot | Yes |
| `API_ACCESS_TOKEN` | api-server auth | Yes (see security note below) |
| `VITE_API_ACCESS_TOKEN` | web client | Yes (bundled by design, not a per-user secret) |
| `EXPO_PUBLIC_API_ACCESS_TOKEN` | mobile client | Yes |
| `EXPO_PUBLIC_DOMAIN` | mobile API base URL | Yes (mobile) |

## Security notes (Phase 0 / Phase 1)

- **Token rotation (DONE/PENDING):** a real `API_ACCESS_TOKEN` value was previously committed in `.replit`. It has been removed from the tracked file and must be rotated in the deploy environment. Treat the old value as compromised. → status: `__________`
- **Fail-open auth (fixed in Phase 1):** `requireApiToken` previously called `next()` when `API_ACCESS_TOKEN` was unset, leaving mutations unprotected. It now denies by default in production. See `artifacts/api-server/src/lib/security.ts`.

## Known follow-ups (Carmen)

- **Rotate the access token** in the deploy secret store (the committed value was removed from `.replit`; treat the old value as compromised).
- ~~Regenerate + review `pnpm-lock.yaml`.~~ **Resolved in Phase 2** — the lockfile was refreshed (also added `zod` to api-server) and now supports `--frozen-lockfile`; CI uses frozen install again.
- **Enable branch protection** on `main` requiring the CI check to pass.
- **`mockup-sandbox` typecheck** is excluded from the gate due to a duplicate `@types/react` (19.1.x from the mobile Expo toolchain vs 19.2.x elsewhere). Resolve the version conflict to re-include it (`pnpm run typecheck:all`).
- **Fill in the deployed commit SHAs** in the table above.

## Decisions

See `docs/decisions.md`. No project decision lives only in chat/email.
