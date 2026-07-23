---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decision]
---

# Tailwind 4 adopted, tokens in `@theme`, preflight off

**Decision:** Renderer styling uses Tailwind 4 (`tailwindcss` + `@tailwindcss/vite`, plugin on the renderer only). The OKLCH design tokens live in a Tailwind `@theme` block in `src/renderer/src/styles.css` (namespaced `--color-*` / `--radius-*` / `--text-*` / `--font-sans`) so utilities like `bg-wash`, `text-mint`, `rounded-bubble` generate for future work. The legacy short names (`--wash`, `--mint`, `--r-bubble`, `--fs-body`, …) stay as `:root` aliases so the existing ~695 lines of component CSS are byte-identical. Tailwind **preflight is intentionally off** (theme + utilities layers only, no `@import "tailwindcss"`), because the app has its own reset and preflight would clobber the mint markdown/list markers and button styling.

**Why:** User's call, overriding the initial YAGNI push-back — the app "will evolve," and they want utilities available from day one for maintainability. Depth chosen was **infra + tokens** (not a full utility rewrite): the custom CSS (acrylic, `-webkit-app-region`, scrollbars, markdown, motion) is better as CSS and is what the tests pin, so it stays. New/evolving UI uses utilities.

**Constraints kept:** `vite ^7`, `@vitejs/plugin-react ^5`, `typescript 7.0.2` unchanged. Test class pins (`.tool-card`, `.assistant-body`, `.msg-notice`, …) and aria-labels untouched. jsdom tests don't load real CSS, so Tailwind can't affect them. Gate stayed green (typecheck, 76/76, build); utility generation verified with a throwaway `text-mint` probe.

**Reversibility:** Moderate. Remove the two deps + the plugin line, inline the `@theme` values back into `:root`. The alias layer means component CSS needs no change either way.

## Related

- [[decisions]]
- [[2026-07-22-glassy-acrylic-visual]]
- [[stack]]
