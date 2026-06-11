---
name: Radix portal CSS token scoping
description: Why portaled Radix menus (Sheet/Popover/Dialog) render transparent/empty and how to fix it
---

# Radix portals render outside the app root → scoped CSS tokens are undefined

In `artifacts/web`, custom design tokens (`--c-*`) were defined only under a `.cadence`
root selector. Radix UI components that portal (Sheet, Popover, Dialog, DropdownMenu)
render their content at the end of `<body>`, **outside** the `.cadence` ancestor, so
those tokens resolve to nothing → menus appear transparent/empty (the classic "broken
nav" symptom on both desktop popovers and the mobile drawer).

**Why:** CSS custom properties inherit down the DOM tree from where they're declared.
A portaled node is not a descendant of `.cadence`, so it never inherits `.cadence`'s tokens.

**How to apply:** Declare global design tokens on `:root` (e.g. `:root, .cadence { --c-...: ... }`)
so every node — including portals — can see them. As belt-and-suspenders, also give portaled
content an explicit `background: var(--c-surface)` and add the app's theme class to the portal
content element. Watch for this any time a popover/drawer/modal looks see-through.
