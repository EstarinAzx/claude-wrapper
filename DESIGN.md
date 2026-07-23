# DESIGN.md

Frost Mono design system. Source of truth for the renderer. Reference: `docs/design/frost-mono-reference.png`.

Theme: dark, forced by the scene (owner running coding sessions at night on a Win11 machine, acrylic translucency over a dark desktop) and by the user-supplied reference. Not a category reflex.

Color strategy: Restrained. Mint accent ≤10% of surface, spent only on: logo mark, assistant avatar, send button, list markers, typing dots.

## Tokens (Tailwind 4 `@theme`, OKLCH)

Tokens live in Tailwind 4's `@theme` block in `styles.css` (namespaced so
utilities like `bg-wash`, `text-mint`, `rounded-bubble` are generated for new
work). Short legacy names (`--wash`, `--mint`, `--r-bubble`, `--fs-body`, …) are
kept as `:root` aliases, so component CSS reads unchanged. Tailwind preflight is
intentionally **off** (the app has its own reset; preflight would clobber the
markdown list markers and button styling).

```css
@theme {
  /* neutrals, tinted toward the accent hue (h≈210) — deep near-black, matches reference */
  --color-wash: oklch(0.12 0.008 210 / 0.64);      /* app wash over OS acrylic */
  --color-surface: oklch(0.19 0.008 210 / 0.58);   /* titlebar, input pill */
  --color-bubble: oklch(0.27 0.007 220 / 0.9);     /* user prompt bubble */
  --color-border: oklch(0.92 0.01 210 / 0.08);     /* hairlines */
  --color-text: oklch(0.94 0.008 190);
  --color-text-muted: oklch(0.68 0.01 200);
  --color-text-faint: oklch(0.53 0.01 210);

  /* the one accent: frost mint */
  --color-mint: oklch(0.87 0.07 180);
  --color-mint-press: oklch(0.8 0.08 182);
  --color-mint-ink: oklch(0.25 0.02 200);          /* glyphs on mint fills */

  /* shape */
  --radius-bubble: 16px;
  --radius-pill: 999px;
  --radius-mark: 7px;                              /* logo rounded square */

  /* type */
  --font-sans: "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
  --text-body: 15px;
  --text-ui: 13px;
  --text-micro: 11px;
}
```

Never `#000`/`#fff`. Backgrounds under the acrylic must stay translucent; `html, body { background: transparent }`, the app root paints `--wash`. Wash/surface/bubble were deepened from the original 0.16/0.24/0.29 lightness to read as flat near-black against the reference (the desktop bleeds through the acrylic until the persistent-glass follow-up lands).

## Type

One family (Segoe UI Variable, native Win11). Body 15/1.6. UI labels 13. Divider/footer 11, letterspaced 0.12em uppercase for the date divider only. Weights: 400 body, 600 app name and bubble-less emphasis. Scale ratio ~1.15, fixed rem-equivalents, no fluid type.

## Layout

- Chat column: max-width 760px, centered; messages breathe (24px vertical gaps, 40px around the date divider).
- Titlebar: height 48px, full-width drag region (`-webkit-app-region: drag`; controls `no-drag`). Left: 22px mint rounded-square mark + app name 600. Center: session title, `--text-muted`. Right: min / max / close, 40px hit targets, muted glyphs, subtle hover wash (close hovers red-tinted `oklch(0.55 0.16 25 / 0.9)`).
- User bubble: right-aligned, max-width 60%, `--bubble`, radius `--r-bubble`, padding 12px 16px.
- Assistant message: no bubble. 28px mint circle avatar left, text beside it; list items use mint en-dash markers.
- Typing indicator: avatar + three 6px mint dots, staggered opacity pulse.
- Chat scrollbar: thin neutral thumb (10px gutter, 3px transparent inset), transparent track; never Chromium's default bar.
- Input bar: pill, `--surface`, hairline `--border`, paperclip icon left (muted), placeholder "Message Claude…" in `--text-faint`, 36px mint circular send button right with ↑ in `--mint-ink`.
- Footer: centered `--fs-micro` `--text-faint` line under the input: "Claude can make mistakes. Verify important information."

## Motion

All transitions 150ms, entries 200ms, ease-out cubic-bezier(0.22, 1, 0.36, 1). The full set, nothing else:

- Message entry (bubbles, assistant text, tool cards, notices): 200ms fade + 4px rise, opacity/transform only.
- Typing dots: staggered 1.2s opacity pulse (loading state).
- Send/stop button: hover fill shift, active scale 0.92.
- Input pill: focus-within hairline brighten.
- Window controls: hover wash.

All motion conveys state. No load choreography, no layout-property animation. `prefers-reduced-motion: reduce` disables everything.

## Bans in force

No side-stripe borders, no gradient text, no decorative extra glass layers inside the window (the OS acrylic is the one glass), no card grids, no em dashes in copy.
