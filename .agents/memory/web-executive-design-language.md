---
name: Web executive design language
description: Durable design-system decisions for the artifacts/web "executive" look (fonts, color, card hover).
---

- Display headings use **Fraunces** (serif) via `.cadence .font-display` in `artifacts/web/src/index.css`. It cascades to hero/page-title/card-title/KPI numbers. Do NOT set `font-weight` in that rule — existing `font-bold` utilities must keep controlling emphasis.
  **Why:** serif headings are the primary "executive/editorial" signal; a forced weight would override per-element bold/medium intent.
- Brand is **deep green** (`--c-brand: #15803d`, `--c-brand-600: #14532d`). Secondary accent is intentionally **violet/purple** (`--c-violet`, `--c-purple`) — kept on wordmark + some KPI/section accents. Green ≠ "remove all other hues"; the violet/teal/rose accents are deliberate.
- Card hover-lift uses the `.cadence-card` utility class. ModuleCard (`pages/dashboard/Shared.tsx`) and KpiCard (`pages/dashboard/DashboardMetrics.tsx`) set base border + box-shadow as **inline styles**, so the `:hover` rule needs `!important` on `box-shadow`/`border-color` to win.
  **How to apply:** if you ever move those base card styles from inline to CSS classes, drop the `!important`.
- Fonts load via `<link>` in `artifacts/web/index.html` (Fraunces opsz axis + Inter + Plus Jakarta Sans), not via CSS @import.
