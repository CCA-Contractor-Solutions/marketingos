# Predictive Intelligence (Phase 5)

MarketingOS's predictive layer moves the system from "what happened / why" to **"what is likely to happen"** and **"what should we do"** — as **recommendations only, never autonomous actions**. Every predictive output is deterministic, explainable, carries a confidence band (via the Phase 4.5 governance layer), and never executes anything on an external platform.

## Guardrail (non-negotiable)
- Everything here is a **recommendation**. Budget "apply", opportunity "accept", etc. only record a human decision — they never change ad spend, post content, schedule outreach, or write to any external system. There is no code path that does.
- No runtime LLM calls. Models are documented, deterministic rules calibrated on real data. Low data → honestly low confidence.
- Confidence + explainability are required on every predictive output.

## Models

### 1. Predictive Lead Intelligence — `lib/intelligence/prediction/leadConversion.ts`
Per lead, computes:
- **conversionProbability (0..1)** — blends the rule-based lead score tier's base prior (high ≈0.55, medium ≈0.28, low ≈0.10) with the lead's **cohort base rate** (historical conversion % of comparable leads by tier/industry/source, computed live from existing customers vs leads), adjusted by event signals (phone call, meeting request, recency). Clamped 0..1.
- **expectedRevenue** — conversionProbability × expected deal size (cohort avg `revenueGenerated` of converted leads in the same industry; falls back to global avg).
- **bestFollowUpAt + reason** — from last-touch recency + intent (e.g. "recently active → within 24h"; "cooling → re-engage now").
- **factors** — the explainability list (each with label/detail/effect) shown in the UI under "Why this prediction".
- **confidence** — `computeConfidence` with sampleSize = cohort size behind the base rate.

### 2. Budget Intelligence — `budgetIntelligence.ts`
Considers only channels with **spend > 0** (ROI is undefined without spend). Picks the lowest-efficiency channel (`from`) and highest-efficiency (`to`), proposes shifting a capped % (≤20%), and projects qualified/revenue deltas linearly from current per-dollar efficiency (clearly labeled a projection). Requires ≥2 channels with spend, else it produces nothing (it will not fabricate a recommendation). **Recommendation only** — "apply" records intent; nothing changes spend.
> Note: channel spend currently comes from seeded/ingested values. Feeding ad-connector spend (Google/Meta) into `computeChannelIntelligence`'s `spendByChannelName` is the input that lights this module up across multiple channels.

### 3. Market Opportunity Detection — `marketOpportunity.ts`
Surfaces geography/industry/segment/trend signals from lead volume, conversion lift by industry/location, and source/event growth (e.g. "Rising interest from google_search", "Commercial contractors in FL show rising compliance demand"). Each carries signalStrength + confidence + dataBasis.

### 4. Content Intelligence — `contentIntelligence.ts`
Finds high-performing topics (content_download / engagement by campaign/topic) and gaps (demand without analogous content), e.g. "Create electrical contractor licensing guide — analogous HVAC guide drove 4x engagement." Rationale + projectedImpact + confidence.

### 5. Executive Growth Briefing — `briefing.ts`
Assembles the "Good Morning, Rose" digest from all the above: **Wins** (new customers, up-trending metrics), **Risks** (channels spending more than they return, high-value leads going cold, slow response), **Opportunities** (top market + content), **Recommended Actions** (top budget/lead/content moves). Returns a structured briefing + a templated natural-language summary (no LLM).

## Data model (all `lib/db/src/schema/intelligence.ts`, no duplicate models)
`lead_predictions`, `budget_recommendations`, `market_opportunities`, `content_opportunities`, `growth_briefings` — string PKs (PRED-/BUD-/MOP-/COP-/BRIEF-), text ISO timestamps, jsonb, no FKs.

## Routes
```
GET  /predictions/leads              GET /predictions/leads/:id      POST /predictions/recompute
GET  /budget/recommendations         POST /budget/recommendations/generate     PATCH /budget/recommendations/:id
GET  /market/opportunities           POST /market/opportunities/generate       PATCH /market/opportunities/:id
GET  /content/opportunities          POST /content/opportunities/generate      PATCH /content/opportunities/:id
GET  /growth/briefing                POST /growth/briefing/generate
```
`PATCH .../:id` only changes a `status` (reviewed/applied/dismissed) — a recorded human decision, inert w.r.t. real spend/systems. Where a prediction becomes an action, it reuses the existing `POST /actions/from-recommendation` (tasks) and the `recommendation_audit` trail.

## Confidence & governance
Reuses Phase 4.5 `computeConfidence` (volume/reliability/consistency → high/medium/low) and the audit trail. With the small demo seed, most bands are honestly **low** — the models are appropriately skeptical of small samples. Real ingested volume raises confidence.
