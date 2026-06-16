---
name: Artifact deployment exclusion (pnpm monorepo)
description: How to keep an artifact out of the public autoscale deployment in this Replit pnpm monorepo
---

# Excluding an artifact from the public deployment

To keep an artifact out of the published (autoscale, `router = "application"`)
deployment, **remove its `[services.production]` block** (and any
`[[services.production.rewrites]]`) from `artifacts/<slug>/.replit-artifact/artifact.toml`.
Edit via the artifacts skill's `verifyAndReplaceArtifactToml` (full-file temp), never in place.

**Why:** the published app is assembled from each artifact's `[services.production]`
config. An artifact with no production block (e.g. `mockup-sandbox` by default) is
served only in dev, never in production.

**How to apply:** keep production blocks only for surfaces that should be public
(here: `web` + `api-server`). The root `.replit` `[[ports]]` map only control
**dev workspace** external exposure — they do NOT control the autoscale prod
deployment, and removing them can break dev previews/tooling, so leave them unless
the goal is specifically to hide a dev preview.
