# MarketingOS — Handoff & Migration Notes (Priority Pass 2)

> Analysis-only pass. **No features added, no data/assets deleted, no AI prompts
> changed, no auth implemented.** This document inventories the current state and
> recommends next steps ahead of any future migration.

Date: 2026-06-15
Scope: pnpm monorepo, artifacts: `web`, `mobile`, `api-server`, `walkthrough`,
`mockup-sandbox`. Canonical user-facing app is **`artifacts/web`**.

---

## 0. Pass 1 recap (already shipped)

- Non-GET API routes + the AI route are guarded by a shared bearer token.
- AI endpoint (`POST /api/assistant/messages`) is rate limited (15 req / 5 min per IP).
- CORS restricted to Replit domains + localhost + no-origin clients.
- Web and mobile attach the shared token via `setAuthTokenGetter`.
- Global "Demo data" badge in the app header; Analytics subtitle = "Last 30 Days · Demo data".
- "Soon" badge on the Brand Memory nav item.
- **Residual risk:** the shared token is NOT real per-user authentication (see §6).

---

## 1. Real vs. Demo Data Inventory

### Real, DB-backed (PostgreSQL via Drizzle)
Schema: `lib/db/src/schema/marketing.ts` — tables: `campaigns`, `tasks`,
`threads`, `messages`, `assistant_messages`, `app_content`.

| Feature | Source | Notes |
| --- | --- | --- |
| Campaigns | `campaigns` table | CRUD via `artifacts/api-server/src/routes/campaigns.ts` |
| Tasks | `tasks` table | CRUD via `routes/tasks.ts` |
| Collaboration threads | `threads` table | `routes/threads.ts` |
| Messages | `messages` table | `routes/threads.ts` |
| AI assistant history | `assistant_messages` table | `routes/assistant.ts` |
| Dashboard summary | DB joins + `app_content` (`dashboard:*`) | `routes/dashboard.ts` |
| Analytics page values | `app_content` (`analytics`) | `routes/analytics.ts` |

> These tables are **real** in the sense that they are persisted in Postgres and
> read/written through the API. Their *contents* are currently demo content
> placed there by the seed (see below) — real plumbing, demo values.

### Seeded/demo data (written into the DB by the seed)
File: `artifacts/api-server/src/seed.ts` (idempotent — skips if campaigns already
exist; never wipes existing data).
- Initial campaigns, tasks, threads, messages, assistant messages.
- `app_content` rows: `dashboard:*` KPIs, `dashboard:insights`, `analytics`.
- "AI Suggestions" on the dashboard read from campaign `insights` / `dashboard:insights`
  — **simulated**, sourced from the seed, not from a live model.

### Hardcoded / static sample data (frontend only)
File: `artifacts/web/src/pages/dashboard/sampleData.ts` (rendered by the dashboard
widget components in `artifacts/web/src/pages/dashboard/`).
- Dashboard widget modules: Executive Health, ROI on Leads, Budget Pacing, Funnel
  Quality, Social Pulse, Webinars & Events, Referral Engine, Automation Flows,
  Ad Health, Email Builder.
- SEO Suggestions / SEO Analytics, Market Trends, Competitor Watch, Futurecast,
  Reputation Signals, Award Center, Brainstorm Corner.
- These never touch the API — they are static constants compiled into the web bundle.

### AI: real vs. simulated
| Surface | Status | Detail |
| --- | --- | --- |
| AI Assistant / Copilot chat | **REAL** | Live OpenAI call (model `gpt-5.4`) in `routes/assistant.ts` via `@workspace/integrations-openai-ai-server` |
| Dashboard "AI Suggestions" | Simulated | Seeded text from `campaigns.insights` / `app_content` |
| Brainstorm Corner | Static | Hardcoded in `sampleData.ts` |

---

## 2. Data-Source Cleanup Plan (recommendations only — not applied)

Where things live today and the recommended *future* home. **No data sources were
changed in this pass.**

| Data | Lives now | Recommendation |
| --- | --- | --- |
| Campaigns | Postgres (`campaigns`) | **Stay Postgres.** Core transactional entity. |
| Tasks | Postgres (`tasks`) | **Stay Postgres.** |
| Threads / Messages | Postgres (`threads`/`messages`) | **Stay Postgres.** |
| Assistant history | Postgres (`assistant_messages`) | **Stay Postgres.** |
| Dashboard KPIs / Analytics | Postgres `app_content` (seeded) | Keep in Postgres, but **replace seeded values with a real feed** (Zoho / Company Brain) before launch. Until then: demo. |
| SEO Suggestions / SEO Analytics | Frontend `sampleData.ts` | **Move off static.** Candidate for Company Brain or an SEO integration. Demo for now. |
| Market Trends | Frontend `sampleData.ts` | Candidate for **Company Brain** or external market data. Demo for now. |
| Competitor Watch | Frontend `sampleData.ts` | Candidate for **Company Brain**. Demo for now. |
| Futurecast / Reputation / Award Center / Brainstorm | Frontend `sampleData.ts` | **Stay demo** unless a clear data owner is identified. |

Migration ordering suggestion: (1) point dashboard/analytics widgets at the API
instead of `sampleData.ts`, (2) back those API responses with a real source
(Zoho/Company Brain), (3) retire `sampleData.ts` once every widget is wired.

---

## 3. Branding Cleanup Review

The project is mid-rebrand: **MarketingOS** (current intended brand) over earlier
**Cadence** and **CCA / Contractor Compliance Authority** layers.

### Naming conflict: visible brand is inconsistent
- `artifacts/web` UI copy = **MarketingOS** ("MarketingOS Command Center",
  "MarketingOS AI Copilot") — `index.html`, `AppLayout.tsx`, `Dashboard.tsx`,
  `Welcome.tsx`, `AiCopilotPanel.tsx`.
- BUT the **crest image is still the CCA crest** (`artifacts/web/public/brand/crest.png`),
  rendered by `BrandMark.tsx` in the sidebar, dashboard hero, and AI Copilot panel.
  So the wordmark says MarketingOS while the logo still shows CCA.
- `artifacts/mobile/app.json` name = **Cadence**.
- `artifacts/walkthrough` (`index.html`, `Scene4.tsx`, `Scene5.tsx`) still say
  **Cadence / CCA**.
- `lib/api-spec/openapi.yaml` describes the assistant as "Cadence AI assistant".
- `artifacts/web/src/index.css` has legacy "CCA" scope tokens/comments.
- `artifacts/mockup-sandbox` copies use "Cadence AI".

### Asset cleanup list (keep / replace / archive / delete — **none actioned**)
| Asset / reference | Recommendation | Why |
| --- | --- | --- |
| `artifacts/web/public/brand/crest.png` | **Replace** | Still a CCA crest shown under MarketingOS text. Swap for a MarketingOS mark. |
| `artifacts/web/src/components/CcaLogo.tsx` | **Archive/Delete (safe)** | Appears orphaned — no imports found in current source. Confirm before deleting. |
| `attached_assets/cca-*` (badge/crest/horizontal variants) | **Archive** | Source artifacts, not imported by app code (except the one `CcaLogo.tsx` references). Keep out of the app bundle. |
| `artifacts/web/public/favicon.png` / `favicon.svg` | **Verify/Replace** | Confirm they depict MarketingOS, not CCA/Cadence. |
| `index.css` "CCA" tokens/comments | **Replace (rename)** | Cosmetic/legacy naming; rename for clarity. Low risk. |
| `artifacts/mobile/app.json` name "Cadence" | **Replace** | Should match final brand. |
| `artifacts/walkthrough` Cadence/CCA copy | **Replace or archive** | Tied to walkthrough decision (§4). |
| `lib/api-spec/openapi.yaml` "Cadence AI" | **Replace** | Spec drift from current brand. |

### Open question for the owner
**Confirm the final visible brand name: MarketingOS, Cadence, or another name?**
Everything above assumes **MarketingOS** is canonical. Nothing is renamed/deleted
until this is confirmed.

---

## 4. Walkthrough Decision Prep

Two parallel walkthrough implementations exist:

| Item | Path | Status |
| --- | --- | --- |
| In-app Welcome Center | `artifacts/web/src/pages/Welcome.tsx` (`/welcome`) | **Linked & visible** — sidebar "Getting Started" |
| In-app walkthrough component | `artifacts/web/src/components/WelcomeWalkthrough.tsx` | Embedded in `/welcome`; uses `artifacts/web/public/audio/welcome_walkthrough.mp3` |
| Guided tour | `artifacts/web/src/components/Tour.tsx` | Linked — sidebar "Take a tour" + Welcome page |
| Standalone video app | `artifacts/walkthrough` (`/walkthrough/`) | **Orphaned from app nav** — not linked from web or mobile; uses `public/audio/composite_audio.mp3` + scene VO clips |

Animation/scene logic is **duplicated** between `artifacts/walkthrough/.../video_scenes/`
and `artifacts/web/.../WelcomeWalkthrough.tsx`.

**Recommendation (no deletion this pass):**
- **Canonical = the in-app Welcome Center** (`/welcome` + `WelcomeWalkthrough.tsx`),
  since it's the only one users actually reach.
- Treat `artifacts/walkthrough` as a **build/export tool** for producing the video,
  not a shipped surface. Candidate to **archive later** (and to exclude from
  production, see §5) once a canonical exported video is settled.
- Defer de-duplicating the scene logic until the brand (§3) is locked, to avoid
  reworking copy twice.

---

## 5. Production Deployment Surface

Deployment config (`.replit`): `deploymentTarget = "autoscale"`,
`router = "application"` (path-based). Ports currently exposed externally:

| Local port | External | Artifact | Path |
| --- | --- | --- | --- |
| 5000 | 5000 | web | `/` |
| 8080 | 80 | api-server | `/api` |
| 8081 | 8081 | mockup-sandbox | `/__mockup` |
| 18115 | 3001 | mobile (Expo) | `/mobile` |
| 20578 | 6800 | walkthrough | `/walkthrough/` |
| 8082 / 23919 | 3002 / 3000 | aux (Expo/dev) | — |

**Recommended for production:** `web` (+ `api-server`). These are the real product.

**Recommended to EXCLUDE from production:**
- **`mockup-sandbox` (`/__mockup`, port 8081)** — internal component previews/design
  mockups. **Should not be public.** To exclude: remove the `[[ports]]` entry for
  `localPort = 8081` from `.replit`, and drop/guard the artifact's
  `.replit-artifact/artifact.toml` (`paths = ["/__mockup"]`) so it isn't routed in
  the deployed app. (Use the artifacts skill to change artifact config — do not
  hand-edit `artifact.toml`.)
- **`walkthrough` (`/walkthrough/`, port 6800)** — standalone video builder, orphaned
  from app nav (§4). Exclude unless you intend a public video page.
- **Mobile (Expo)** ships through its own Expo channel, not the web deployment;
  confirm it isn't unintentionally exposed via the web autoscale deployment.

> This pass did **not** modify `.replit` or any port/artifact config. The above is
> a recommendation; flip these before going public.

---

## 6. Auth Migration Note

**Current state (temporary):** mutating + AI endpoints require a single shared
bearer token. The same value is in three shared env vars — `API_ACCESS_TOKEN`
(server), `VITE_API_ACCESS_TOKEN` (web), `EXPO_PUBLIC_API_ACCESS_TOKEN` (mobile).
Because the web/mobile values are **inlined into the client bundle**, the token is
recoverable by anyone inspecting the app. It is therefore stored as a **non-secret**
shared env var (it currently lives in `.replit` `[userenv.shared]`).

**What it is:** a hardening guard that stops casual/anonymous public abuse and,
paired with the AI rate limiter, caps OpenAI spend.
**What it is NOT:** real per-user authentication, identity, or authorization.

**Future auth options (not implemented this pass):**
1. **Replit Auth** — fastest path on this platform; OIDC, sessions, minimal setup.
   Good if the audience tolerates Replit sign-in. (See the `replit-auth` skill.)
2. **Clerk** — full-featured user management (orgs, social logins, branding,
   email verification). Best for a polished multi-tenant product. (See the
   `clerk-auth` skill.)
3. **Internal-only access gate** — keep it private (allowlist / SSO / network gate)
   if MarketingOS is an internal tool and per-user identity isn't needed yet.

When real auth lands, retire the shared token (or keep it only as a
service-to-service guard, never client-bundled).

---

## 7. Verification

- **Typecheck:** `pnpm run typecheck`. Changed product packages (`web`,
  `api-server`, `mobile`) pass. `artifacts/walkthrough` has **pre-existing**
  typecheck errors (framer-motion `Variant` typings + missing DOM lib in its
  tsconfig) unrelated to this pass — see §4/§5 (walkthrough is orphaned).
- **Tests:** none exist in the repo (no `test` scripts, no `*.test`/`*.spec` files).
- **App loads:** web (`/`) serves and renders; all workflows running.
- **Changed files this pass:** `MARKETINGOS-HANDOFF.md` (this file) only.

### Remaining blockers / decisions needed from owner
1. Confirm final brand name (§3) before any rename/asset deletion.
2. Decide real data sources for dashboard/analytics/SEO/market widgets (§2).
3. Decide production inclusion list and exclude `mockup-sandbox` (+ likely
   `walkthrough`) before publishing (§5).
4. Choose the future auth model (§6).
5. Pre-existing `walkthrough` typecheck failures will block a repo-wide
   `pnpm run typecheck`/`build` until fixed or the artifact is excluded.
