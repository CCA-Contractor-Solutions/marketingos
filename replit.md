# MarketingOS

A marketing "command center": create and approve campaigns, manage tasks, collaborate in threads, view analytics/KPI dashboards, and chat with an AI marketing copilot. Ships as a web app and a companion Expo mobile app, backed by one Express API server.

## Run & Operate

- `pnpm --filter @workspace/web run dev` — run the web app
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` (Postgres), `AI_INTEGRATIONS_OPENAI_*` (AI copilot), `API_ACCESS_TOKEN` + `VITE_API_ACCESS_TOKEN` + `EXPO_PUBLIC_API_ACCESS_TOKEN` (shared app-token guard — see Security)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Web: React + Vite. Mobile: Expo.

## Where things live

- DB schema (source of truth): `lib/db/src/schema/marketing.ts` — tables: campaigns, tasks, threads, messages, assistant_messages, app_content
- DB seed (idempotent demo content): `artifacts/api-server/src/seed.ts`
- API routes: `artifacts/api-server/src/routes/*` (real OpenAI call in `assistant.ts`)
- Security middleware: `artifacts/api-server/src/lib/security.ts` (CORS allowlist, token guard, AI rate limiter)
- Static demo widgets (dashboard, SEO, market, competitor, etc.): `artifacts/web/src/pages/dashboard/sampleData.ts`
- Brand mark/wordmark: `artifacts/web/src/components/BrandMark.tsx` (CSS monogram — no image dependency)
- Readiness / migration analysis: `MARKETINGOS-HANDOFF.md`

## Architecture decisions

- **Data is real plumbing, demo content.** Campaigns/tasks/threads/messages/assistant history are DB-backed (Postgres), but their values are seeded demo data. Most dashboard widgets are static frontend sample data. The only real external call is the OpenAI copilot.
- **Shared app-token guard is NOT real auth.** `API_ACCESS_TOKEN` gates all non-GET API routes + the AI route; reads stay public. The same value is mirrored to `VITE_API_ACCESS_TOKEN` / `EXPO_PUBLIC_API_ACCESS_TOKEN`, which Vite/Expo **inline into the client bundles at build time** — so the value is shipped to every browser/app and is, by design, **not confidential**. It exists to block casual anonymous abuse and (with the AI rate limiter) cap OpenAI spend. It is intentionally a non-secret env var, not a Replit Secret: storing it as a Secret would add no confidentiality (the client copies are public) while complicating the build. Replace with real per-user auth (Replit Auth / Clerk / internal gate) before production — that is the only fix that makes it confidential.
- **AI rate limiting** (`aiRateLimiter`, 15 req / 5 min per IP) protects against runaway OpenAI cost. Keep it.
- **Deployment surface:** only `web` (+ `api-server`) are part of the published app. `mockup-sandbox` (internal previews), `walkthrough` (orphaned video builder), and `mobile` (ships via Expo, not the web autoscale deployment) have **no `[services.production]`** block, so they are excluded from the public deployment.

## Product

Campaigns, task board, collaboration threads, analytics/KPI dashboards, and an AI marketing copilot (real OpenAI). Demo-grade today: no real customer/CRM/lead data, no payments, no email/CRM/storage integrations.

## User preferences

- Do not add features or implement real auth unless explicitly asked.
- Do not change AI prompts without explicit approval.
- Brand name is **MarketingOS** (confirmed). Lowercase `cadence` may still appear as a common marketing noun (e.g. "posting cadence") and as internal CSS class names (`cadence`, `cadence-rise`, `cadence-scroll`) — these are intentional and are NOT the old brand name; do not rename them.

## Gotchas

- `api-server` dev runs build→start (no HMR). After editing server code or changing env vars, restart the `artifacts/api-server: API Server` workflow.
- Do not hand-edit `artifact.toml` or `.replit`; use the artifacts skill (`verifyAndReplaceArtifactToml`) and the environment-secrets skill.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
