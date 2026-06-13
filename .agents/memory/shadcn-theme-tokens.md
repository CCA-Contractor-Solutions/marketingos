---
name: shadcn theme tokens are hsl(red) placeholders
description: react-vite scaffold ships --background/--popover/etc. as hsl(red); portaled shadcn components render unstyled until filled with real H S L triples
---

# shadcn theme tokens ship as invalid placeholders

The react-vite scaffold's `index.css` declares the shadcn theme tokens
(`--background`, `--foreground`, `--popover`, `--card`, `--primary`, `--muted`,
`--border`, `--input`, `--ring`, `--chart-*`, `--sidebar*`) as literal `red` with
a `/*replace with H S L */` comment, in BOTH the `:root` and `.dark` blocks.

`@theme inline` maps them as `--color-background: hsl(var(--background))`, so the
utility classes (`bg-background`, `bg-popover`, `text-foreground`, `bg-muted`,
etc.) resolve to `hsl(red)` — **invalid CSS**, which renders as unstyled /
transparent, NOT red.

**Why it matters:** shadcn UI components (Select dropdown `bg-popover`, Dialog,
Tooltip `bg-primary`, Tabs, Toast) rely on these utilities. Until the tokens are
filled with real space-separated `H S% L%` triples (e.g. `--popover: 0 0% 100%`),
those portaled components appear transparent/broken. The app's own surfaces use a
separate `--c-*` token system scoped to `:root, .cadence`, which masks the problem
until you use a stock shadcn component.

**How to apply:** When theming this app (or any react-vite scaffold here), fill
the `:root` (light) and `.dark` shadcn token blocks with HSL triples that match
the palette. Keep `--c-*` tokens scoped to `:root, .cadence` so portaled
Sheet/Popover/Dialog still resolve them (see radix-portal-css-tokens).
