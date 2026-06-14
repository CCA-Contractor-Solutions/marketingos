---
name: Tailwind v4 external @import ordering
description: Why external font @import in index.css throws "@import must precede" under Tailwind v4, and where to put it instead.
---

External `@import url('https://fonts.googleapis.com/...')` placed in `src/index.css` **after** `@import "tailwindcss";` throws postcss `@import must precede all other statements`. The error points at a huge line number (e.g. 556) that does not exist in the 38-line source file — misleading.

**Why:** Tailwind v4 inlines `@import "tailwindcss"` into hundreds of generated statements at build time. A literal external `@import` that follows it then lands after non-@import rules, violating the CSS spec, so postcss drops it (fonts silently fail to load via that path).

**How to apply:** Put external font links in `index.html` as `<link rel="stylesheet">` (the video-js / vite scaffolds already preconnect + link fonts there), and remove the `@import url(...)` from `index.css`. Keep `@import "tailwindcss";` as the only import in the CSS. The dev server may still show a *stale* cached postcss error after the fix — confirm by curling the compiled `.../src/index.css` and grepping for "must precede" (vite compiles CSS lazily, so the log can lag the actual fix).
