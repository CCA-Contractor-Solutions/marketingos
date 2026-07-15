# Phase 3 — API Contracts

Every endpoint the Growth Intelligence UI (`src/pages/intel/**`) consumes, via
`src/lib/intel-api.ts`. New Phase 3 endpoints are marked **(new)**; all others
are Phase 2 endpoints being reused as-is (no schema changes).

All endpoints are mounted under the API server's `/api` prefix (omitted
below for brevity, matching Phase 2 docs). `requireApiToken` middleware
guards all non-GET methods automatically.

---

## Intelligence summary (new — `routes/intelligence-summary.ts`)

### `GET /intelligence/overview` (new)
Small read-aggregation over `leadsTable`. No new tables.

**Response 200**
```json
{
  "totalLeads": 128,
  "qualifiedLeads": 54,
  "customers": 21,
  "revenue": 184000,
  "conversionRate": 0.164
}
```
`conversionRate = customers / totalLeads` (0 when there are no leads).

### `GET /intelligence/funnel` (new)
Cumulative funnel stage counts derived from lead flags (`qualified`,
`salesAccepted`, `isCustomer`).

**Response 200**
```json
[
  { "stage": "Leads", "count": 128 },
  { "stage": "Qualified", "count": 54 },
  { "stage": "Sales Accepted", "count": 33 },
  { "stage": "Customers", "count": 21 }
]
```

### `GET /intelligence/lead-trend?weeks=8` (new)
Buckets `leadsTable.createdAt` and `conversionsTable.convertedAt` into
`weeks` (default 8, max 52) week-long periods ending at the current week.
Weeks start on Monday (UTC). Rows with unparsable timestamps are skipped
from bucketing — the endpoint never throws on sparse/malformed data.

**Query params:** `weeks` (optional integer, default 8)

**Response 200**
```json
[
  { "period": "2026-05-18", "leads": 9, "customers": 2 },
  { "period": "2026-05-25", "leads": 14, "customers": 3 }
]
```

### `POST /actions/from-recommendation` (new)
Module 5 "Create Action". **Reuses `tasksTable` — there is no separate
actions table.** Creates a task (same ID scheme as `POST /tasks`:
`TSK-${200 + count}`), sets `aiGenerated: true`, and PATCHes the source
recommendation's status to `applied` via `aiRecommendationsTable`.

**Request body**
```json
{
  "recommendationId": "REC-14",
  "title": "Increase paid search budget for Q3",
  "owner": "Jessica Miller",
  "dueAt": "2026-08-01"
}
```
`owner` and `dueAt` are optional.

**Response 201**
```json
{
  "task": {
    "id": "TSK-214",
    "title": "Increase paid search budget for Q3",
    "status": "backlog",
    "priority": "medium",
    "assignees": [{ "init": "JM", "color": "#0d9488" }],
    "dueDate": "2026-08-01",
    "dueAt": "2026-08-01",
    "campaign": null,
    "aiGenerated": true,
    "blocked": false
  },
  "recommendation": { "id": "REC-14", "status": "applied" }
}
```
**Errors:** `400` invalid body, `404` recommendation not found.

Created tasks are visible via the existing `GET /tasks` (Task Board can
filter on `aiGenerated: true`) and are editable via the existing
`PATCH /tasks/:id`.

---

## Leads (Phase 2 — reused)

### `GET /leads?tier=&status=&channel=`
Returns lead summaries. Query params optional; UI also applies additional
client-side filters (industry, location, free-text search) since the
backend doesn't support them directly.

### `GET /leads/:id`
Full lead detail: profile, journey, score, events, attribution
(attribution only populated once `isCustomer` is true).

### `PATCH /leads/:id`
Body: `{ qualified?, salesAccepted?, isCustomer?, status?, companyName?, contactName?, email?, phone? }`.
Used by Module 2 for "mark qualified" / "mark sales accepted".

### `POST /leads/:id/convert`
Body: `{ amount, convertedAt?, campaign?, channel? }` → creates conversion +
customer record. Used by Module 2's convert dialog.

### `POST /leads/:id/score`
Re-scores a lead. Not directly wired into a Phase 3 UI control but exposed
in `intel-api.ts` for future use.

---

## Attribution (Phase 2 — reused)

### `GET /attribution/summary`
Returns `{ byModel, byChannel, byCampaign }`, each an array of
`{ <key>, revenue, attributions }` sorted by revenue desc. Module 6's
Revenue Attribution chart uses `byChannel`.

### `GET /attribution/lead/:id`
Array of `RevenueAttribution` rows for a single lead. Embedded directly in
`GET /leads/:id`'s `attribution` field for Module 2, so this endpoint is
available in `intel-api.ts` but not separately called by the lead detail
page.

---

## Channels (Phase 2 — reused)

### `GET /channels/intelligence`
Array of `{ channelId, channelName, category, leads, qualifiedLeads, customers, revenue, spend, roi }`,
sorted by revenue desc server-side. Used by Module 1's Channel Performance
table and Module 6's Channel Comparison chart.

---

## Campaign intelligence (Phase 2 — reused)

### `GET /campaign-intelligence`
Array of campaign rollups. Used by Module 1's Campaign Performance table
(client-derives a 0–100 performance score — see
`src/lib/intel-scoring.ts`), Module 3's dashboard + revenue chart, and
Module 6's Campaign Performance chart.

### `GET /campaign-intelligence/:campaignId`
Single campaign rollup. Used by Module 3's detail page. 404 if not found.

### `PUT /campaign-intelligence/:campaignId`
Body: `{ objective?, audience?, service?, industry?, location?, budget?, ownerName?, channels? }`.
Upserts campaign intelligence row; server recomputes rollups
(`leadsGenerated`, `qualifiedLeads`, `customers`, `revenue`, `roi`) from
live lead/conversion data. Used by Module 3's "Edit strategy" dialog.

---

## Recommendations (Phase 2 — reused)

### `GET /recommendations`
Array of `{ id, category, title, body, confidence, dataBasis, status, createdAt }`,
ordered by `createdAt` desc. Used by Module 1's AI Intelligence Feed and
Module 4's Opportunity Center (grouped client-side by category).

### `POST /recommendations/generate`
Triggers generation of new recommendations; returns the newly-created rows
(`[]` if nothing new). Used by the "Generate insights" button in Modules 1
and 4 (gated to Marketing Director role — see `src/lib/roles.tsx`).

### `PATCH /recommendations/:id`
Body: `{ status }`. Used internally by the `POST /actions/from-recommendation`
flow (server-side) to mark a recommendation `applied`; also available in
`intel-api.ts` for manual status changes (e.g. "dismiss").

---

## Client-derived values (no new endpoints)

- **Campaign performance score (0–100):** computed in
  `src/lib/intel-scoring.ts` from `GET /campaign-intelligence` fields —
  `40% revenue (capped at $20k) + 35% conversion rate (customers/leads) + 25% ROI (capped at 3x)`.
  Documented inline in the source file.
- **Role-based UI gating:** `src/lib/roles.tsx` — presentational only, not
  a security boundary. See file header comment for the Phase 4 auth note.
