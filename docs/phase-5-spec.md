# Phase 5 Spec — Predictive Growth Engine

Move MarketingOS from "what happened / why" (Phases 2–4.5) to **"what is likely to happen"** and **"what should we do"** — as recommendations only. Built INTO the existing repo on top of Phase 4.5 governance. **Recommendation-only: NEVER autonomous. No budget auto-changes, no auto-posting, no autonomous campaigns, no AI-generated ads, no CRM replacement.** Every prediction carries a confidence band + explainability + audit trail, reusing the Phase 4.5 governance layer. No duplicate models. No runtime LLM calls (deterministic, explainable models — the `generateWithLLM` hook may remain but must not be required).

## Ground truth (match exactly)
- Prediction inputs already exist: `lib/intelligence/scoring.ts` (weighted rule-based lead score + tier + contributions), `confidence.ts` (`computeConfidence`, `sourceReliability`), `channels.ts` (`computeChannelIntelligence` → leads/qualified/customers/revenue/spend/roi), `attribution.ts`, campaign_intelligence rollups, and lead outcome fields (`isCustomer`, `qualified`, `revenueGenerated`, `industry`, `companySize`, `scoreTier`, `status`).
- Schema: `lib/db/src/schema/intelligence.ts` conventions (string PKs, text ISO timestamps, jsonb $type, real/integer/boolean, no FKs, $inferSelect, re-export via existing `export *`).
- Routes: Router/IRouter, inline zod, export default, register in `routes/index.ts`. Reuse the audit trail (`recommendation_audit`) + `computeConfidence` from Phase 4.5.
- Web: `intel-api.ts` (`${API}` prefix + DEMO_MODE branch for EVERY new fn), `intel-types.ts`, `hooks/useIntel.ts`, pages under `src/pages/intel/`, nav in AppLayout "Growth Intelligence" section. Do NOT touch api-zod/api-client-react generation.
- Must pass `pnpm run typecheck`, api + web builds, and the demo build.

## Prediction philosophy (deterministic + explainable — NOT black box)
All predictions are computed by documented, deterministic models from real data, and every prediction returns: a value, a **confidence band** (via `computeConfidence` using sample size + source reliability + consistency), and an **explanation** (the factors that drove it). This keeps Phase 4.5 governance intact — no unexplained ML. Put the math in pure libs under `lib/intelligence/prediction/`.

## Data model — extend `lib/db/src/schema/intelligence.ts` (no dup models)
- `lead_predictions` "lead_predictions": id (`PRED-…`), leadId, conversionProbability (real 0..1), expectedRevenue (integer), bestFollowUpAt (text ISO nullable), bestFollowUpReason (text), confidence (real), confidenceBand (text), factors (jsonb — explainability list), modelVersion (text), createdAt. (Latest prediction per lead; recompute on demand.)
- `budget_recommendations` "budget_recommendations": id (`BUD-…`), fromChannel (text), toChannel (text), shiftPct (real), shiftAmount (integer), projectedQualifiedDelta (integer), projectedRevenueDelta (integer), rationale (text), confidence (real), confidenceBand (text), status (text: "new"|"reviewed"|"applied"|"dismissed" — human decides; NEVER auto-applied), createdAt.
- `market_opportunities` "market_opportunities": id (`MOP-…`), kind (text: "geography"|"industry"|"trend"|"segment"), title, insight (text), signalStrength (real), confidence (real), confidenceBand (text), dataBasis (jsonb), status (text), createdAt.
- `content_opportunities` "content_opportunities": id (`COP-…`), topic (text), rationale (text), basedOn (jsonb — e.g. high-performing analogous content/engagement), projectedImpact (text), confidence (real), confidenceBand (text), status (text), createdAt.
- `growth_briefings` "growth_briefings": id (`BRIEF-…`), periodLabel (text — "Daily · Jul 16" etc.), wins (jsonb array), risks (jsonb array), opportunities (jsonb array), recommendedActions (jsonb array), summary (text), createdAt.
Add `$inferSelect` types.

## Prediction libs — `lib/intelligence/prediction/`
- `leadConversion.ts` — Module 1. `predictLeadConversion(lead, events, cohortStats)`:
  - conversionProbability from the lead's score/tier + event signals, **calibrated against cohort base rates** (historical conversion rate by tier / industry / source computed from existing customers vs leads). Deterministic logistic-style blend documented in comments; clamp 0..1.
  - expectedRevenue = conversionProbability × expected deal size (from cohort avg `revenueGenerated` of converted leads in the same industry, fallback to global avg).
  - bestFollowUpAt + reason: derive from event recency + intent (e.g. "high intent, contacted 0 times → follow up within 24h"; "warm, last touch 6 days ago → re-engage now"). Simple documented rules.
  - factors: list of {label, effect} explaining the probability (e.g. "phone_call (+)", "no recent activity (−)", "commercial industry converts 2.1x (+)").
  - confidence via computeConfidence (sampleSize = cohort size behind the base rate; reliability from sources; consistency default).
- `budgetIntelligence.ts` — Module 2. `recommendBudgetShifts(channelIntel)`: identify a lower-efficiency channel (low ROI / high cost-per-customer) and a higher-efficiency one; propose shifting a modest % (cap e.g. 20%) with **projected** qualified/revenue deltas (linear projection from current per-dollar efficiency, clearly labeled a projection, not a guarantee). Rationale + confidence. **Recommendation only** — never applies.
- `marketOpportunity.ts` — Module 3. `detectMarketOpportunities(leads, conversions, events)`: surface geography/industry/segment/trend signals (e.g. "Commercial contractors in FL show rising compliance demand" from lead volume + conversion lift by industry/location; "search interest in multi-state licensing trending" from event/source growth). Each with signalStrength + confidence + dataBasis.
- `contentIntelligence.ts` — Module 4. `identifyContentOpportunities(events, campaigns)`: find high-performing topics (content_download / engagement by campaign/topic) and gaps (industries with demand but no analogous content). e.g. "Create electrical contractor licensing guide — analogous HVAC guide drove 4x engagement." Rationale + projectedImpact + confidence.
- `briefing.ts` — Module 5. `buildGrowthBriefing(allIntel)`: assemble wins (up-trending metrics, new customers, high-confidence conversions), risks (declining channels, low response times, stale high-value leads), opportunities (top market + content opps), recommendedActions (top budget/lead/content actions). Return the structured briefing + a short natural-language summary (templated, not LLM). This is the "Good Morning Rose" digest.

## Routes (new `routes/predictions.ts` + `routes/growth.ts`; register in index.ts)
- `GET /predictions/leads` — predictions for all (or filtered) leads (probability, expectedRevenue, band).
- `GET /predictions/leads/:id` — full prediction w/ factors + follow-up timing.
- `POST /predictions/recompute` — recompute + persist lead_predictions (writes audit-style note; safe).
- `GET /budget/recommendations` + `POST /budget/recommendations/generate` + `PATCH /budget/recommendations/:id` (status: reviewed/applied/dismissed — human decision only; "applied" just marks intent, does NOT change any spend anywhere).
- `GET /market/opportunities` + `POST /market/opportunities/generate` + `PATCH .../:id` (status).
- `GET /content/opportunities` + `POST /content/opportunities/generate` + `PATCH .../:id` (status).
- `GET /growth/briefing` (latest) + `POST /growth/briefing/generate`.
- All generation reuses `computeConfidence`; where a prediction becomes an actionable recommendation, allow creating an action via the existing `POST /actions/from-recommendation` pattern (reuse tasks; no new action system) and log to the audit trail where a recommendationId is involved.

## AI recommendation engine tie-in
Predictions and opportunities feed the existing recommendation/insight surfaces. Keep the Phase 4.5 governance: confidence band + explainability on every predictive output; audit trail when an action is created from one. Do NOT introduce autonomous behavior.

## Front-end (pages under src/pages/intel/ + nav)
- **Predictive Lead Intelligence**: on `LeadDetail`, add a "Prediction" card — conversion probability (with band), expected revenue, best follow-up time + reason, and the factor list (explainability). On `Leads` list, add a probability column/badge and allow sorting by it. New optional `Predictions.tsx` overview (top likely-to-convert leads).
- **Budget Intelligence** page `/budget` (or a section): show recommended shifts as cards ("Reallocate 15% from Awareness → Expansion: projected +N qualified, +$X") with confidence, rationale, and Review/Apply-intent/Dismiss (clearly labeled "recommendation — you decide"; nothing auto-executes).
- **Market Opportunities** + **Content Opportunities**: extend the Opportunity Center (Phase 3) with these new AI-surfaced categories (reuse the card pattern + confidence pills + create-action).
- **Executive Growth Briefing** page `/briefing` ("Good Morning, Rose"): wins / risks / opportunities / recommended actions, with a Generate button and the templated summary at top. Premium, executive, on-brand. Nav entry.
- Every new intel-api fn needs a DEMO_MODE branch.

## Guardrails (enforce + state in UI/code)
- Everything is a **recommendation**. Budget "apply" only records a human decision/intent — it never changes spend on any external platform (and there's no integration write path for it). Add explicit code comments + a short UI note ("MarketingOS recommends; humans decide and execute").
- No autonomous scheduling, posting, spending, or ad generation.
- Confidence + explainability required on every predictive output; low-data → low confidence (honest).

## Docs
- Create `docs/predictive-intelligence.md`: each model (inputs, formula/rules, outputs), the calibration approach (cohort base rates), confidence handling, and the recommendation-only guardrail.
- Update `docs/architecture-map.md`: add a "Predictive Layer" above Recommendations — Intelligence → **Prediction (what's likely) → Recommendation (what to do)** → Actions (human) → Revenue — noting it's recommendation-only and governed.

## Testing / acceptance (verify on live DB)
- `POST /predictions/recompute` produces per-lead conversionProbability + expectedRevenue + follow-up timing + factors + confidence; ABC Construction (customer) and high-tier leads score higher probability; unscored/low leads score lower.
- Budget/market/content generate endpoints produce governed, explainable recommendations with confidence; nothing auto-applies (status changes are inert w.r.t. real spend).
- `POST /growth/briefing/generate` returns wins/risks/opportunities/actions + summary.
- Predictions/briefing render in the UI with confidence bands + explainability; budget "apply" is clearly a recorded human decision only.
- No duplicate models; all prior phases still work; typecheck + api + web + demo builds pass.

## Deliverables
Schema + prediction libs + routes + UI (lead prediction, budget, market/content opps, growth briefing) + docs. Do NOT commit/push/PR — parent verifies on live DB, builds, and PRs. Write `docs/phase-5-implementation-notes.md` and report back.
