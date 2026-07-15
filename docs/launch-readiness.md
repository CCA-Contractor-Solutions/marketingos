# Launch-Readiness Tracker

One board that says what is actually shippable. Reviewed weekly by Rose + Carmen. A surface goes live only when status = **Ready** and its approver has signed.

Status legend: **Not ready** · **Gated** (internal/limited) · **Ready** (approved for public)

## Product surfaces

| Surface | Status | Blocker(s) | Owner | Approver | Notes |
|---|---|---|---|---|---|
| MarketingOS web app | Not ready | Auth model undecided; some widgets seeded/demo | Carmen | Rose | Fine for internal/gated use now |
| MarketingOS mobile app | Not ready | Verify nav on device; API domain | Carmen | Rose | |
| API server | Gated | Rotate token; fail-open fixed | Carmen | — | |
| Walkthrough (marketing video) | Gated | Keep internal; not the product | Carmen | Rose | Do NOT expose publicly |
| Mockup sandbox | Gated | Internal only | Carmen | — | Do NOT expose publicly |

## Public web / lead paths

| Surface | Status | Blocker(s) | Owner | Approver | Notes |
|---|---|---|---|---|---|
| CCA website | Not ready | Final CTA + AI language lock | Rose | Rose | |
| CAG parent website | Not ready | Brand architecture alignment | Rose | Rose | |
| Compliance Exposure Review form | Not ready | Zoho lead object + copy approval | Carmen/Rose | Rose | Lead-capture tool ONLY — human-reviewed framing |
| Public Client-Facing Link Inventory | Not ready | Audit every link: approve/gate/retire | Carmen | Rose | See sales-asset-registry.md |

## Lead flow (Phase 2)

| Step | Status | Owner | Notes |
|---|---|---|---|
| Website form → Zoho CRM lead (source-tagged) | Not ready | Carmen | Zoho is system of record |
| Lead → booking link | Not ready | Carmen | Booking stamped back on lead |
| First cadence step (email + RingCentral SMS) | Not ready | Carmen/Rose | Opt-in/opt-out required |
| Sales follow-up + stage/assignment in Zoho | Not ready | Rose | |
| Outcomes read-only in MarketingOS analytics | Not ready | Carmen | Reads from Zoho |

## Build / deploy health

| Item | Status | Notes |
|---|---|---|
| `pnpm run typecheck` passes | ✅ Done | All product surfaces green; mockup-sandbox excluded (documented) |
| Web + api-server build | ✅ Done | web → dist/public, api-server → dist/index.mjs |
| CI workflow added | ✅ Done | `.github/workflows/ci.yml` — enable branch protection on `main` |
| CI green on `main` | ⬜ Pending | After branch is merged + Actions enabled |
| Committed token removed from `.replit` | ✅ Done | Rotate in deploy secret store (Carmen) |
| Auth fail-open closed | ✅ Done | Denies mutations in production if token unset |
| Brand Memory dead control removed | ✅ Done | Nav entry hidden; /brand route retained |
| Last deployed commit documented | ⬜ Pending | See source-of-truth.md |
