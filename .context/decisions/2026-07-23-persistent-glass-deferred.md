---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decision]
---

# Persistent acrylic-on-blur deferred (accept Win11 default)

**Decision:** Keep `backgroundMaterial: 'acrylic'` (`src/main/index.ts:38`) as-is. The window's acrylic goes solid when it loses focus and glassifies only when active — that is Win11 DWM behavior for the `acrylic` system-backdrop (blur runs only on the focused window, by OS design; Electron 43 exposes no "stay active" flag). Making it persist is **deferred**, not solved.

**Why deferred:** There is no free persistent acrylic — Windows removed it deliberately (GPU/battery, distraction). Forcing it means paying one of two ways, and the owner judged neither worth it right now:
- **Native acrylic (keep the exact blur):** legacy `SetWindowCompositionAttribute` blur-behind via `electron-acrylic-window` or a koffi FFI call. Costs: undocumented API (a Windows update can break it), a known window drag/resize lag, a native/FFI dependency fragile across Electron upgrades, small always-on GPU cost, slightly non-native feel.
- **Mica (`backgroundMaterial: 'mica'`):** native, no dep, always-on, stable — but tints from the wallpaper instead of blurring what's behind, so it loses the see-through glass. Different aesthetic.

**Status:** Owner reviewed the trade-off and chose to ship the Tailwind + darker-palette work and defer this. Revisit as its own ticket if/when the unfocused-opaque flip becomes worth a dependency or an aesthetic change. The darker palette (deeper wash) already reduces how much the flip reads.

## Related

- [[decisions]]
- [[2026-07-22-glassy-acrylic-visual]]
