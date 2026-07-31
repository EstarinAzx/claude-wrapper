# DESIGN.md

Frost Mono design system. Source of truth for the renderer. Reference: `docs/design/frost-mono-reference.png`.

Theme: dark, forced by the scene (owner running coding sessions at night on a Win11 machine, acrylic translucency over a dark desktop) and by the user-supplied reference. Not a category reflex.

Color strategy: Restrained. Mint accent ≤10% of surface, spent only on: logo mark, assistant avatar, send button, list markers, typing dots.

Themeable since #70, within limits that keep this document true of every palette. **Frost** (mint, below) is the default and the identity; **Ember**, **Moss** and **Slate** re-hue it. A theme moves the accent's hue, the accent fills' chroma within `0.05`–`0.09`, and the neutrals' hue angle. It moves **no lightness and no alpha anywhere**, and no neutral's chroma — so every contrast ratio, the seven-step tint ladder, the ≤10% budget and the match to the reference hold in all four. All four are dark; there is no light theme. The blocks live in `styles/themes.css` and `tests/theme.test.ts` enforces those limits structurally.

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

  /* the accent: frost mint — one at a time, four to choose from (#70) */
  --color-mint: oklch(0.87 0.07 180);
  --color-mint-press: oklch(0.8 0.08 182);
  --color-mint-ink: oklch(0.25 0.02 200);          /* glyphs on mint fills */
  --color-mint-wash: oklch(0.87 0.07 180 / 0.1);   /* active row ground (#67) */

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

Never `#000`/`#fff`. Backgrounds under the acrylic must stay translucent; `html, body { background: transparent }`, the app root paints `--wash`. Wash/surface/bubble were deepened from the original 0.16/0.24/0.29 lightness to read as flat near-black against `docs/design/frost-mono-reference.png`, tuned with the desktop showing through the acrylic. **These values are the design, not a placeholder.** An earlier version of this line said they held only "until the persistent-glass follow-up lands", which described a mechanism that does not exist: acrylic *always* shows the desktop, because blur-behind is what acrylic is. That follow-up was only ever about the flip to flat when the window loses focus, and it could never have changed what sits behind the wash. **The neutrals are not re-tuned per backdrop** (#69): backdrop and theme would then be two independent controls writing the same three custom properties, from one `:root` block, with a suite that loads no CSS. If Mica ever reads too dark, that is a theme value or a defect, not a coupling to build.

## Type

One family (Segoe UI Variable, native Win11). Body 15/1.6. UI labels 13. Divider/footer 11, letterspaced 0.12em uppercase for the date divider only. Weights: 400 body, 600 app name and bubble-less emphasis. Scale ratio ~1.15, fixed rem-equivalents, no fluid type.

## Layout

- Chat column: max-width 760px, centered; messages breathe (24px vertical gaps, 40px around the date divider).
- Titlebar: height 48px, full-width drag region (`-webkit-app-region: drag`; controls `no-drag`). Left: 22px mint rounded-square mark + app name 600. Center: session title, `--text-muted`. Right: the Agents-dock toggle, then a hairline separator, then min / max / close, 40px hit targets, muted glyphs, subtle hover wash (close hovers red-tinted `oklch(0.55 0.16 25 / 0.9)`). The Agents toggle is a centered 28px rounded square, not a 40px full-height cell, so the window-control run stays its own group and the toggle is never a mis-click away from Close; it is absent until a project folder is open, and takes a mint tint while the dock is showing.
- Agents dock: in-flow resizable `aside` on the right of the workspace (`--surface`, hairline `border-left`), mirroring the Sessions rail — same 44px head, same row shell, grip on the edge that faces the chat. In-flow, never an overlay: opening it narrows the chat rather than covering it.
- Appearance dock: third right-slot panel, fixed width, no grip, every control commits on change. Backdrop offers exactly two values, **Acrylic (default, and the identity)** and Mica; each states its own trade, and the word "persistent" is banned from that copy because what ships is Mica, which is persistent without being acrylic.
- User bubble: right-aligned, max-width 60%, `--bubble`, radius `--r-bubble`, padding 12px 16px.
- Assistant message: no bubble. 28px mint circle avatar left, text beside it; list items use mint en-dash markers.
- Typing indicator: avatar + three 6px mint dots, staggered opacity pulse.
- Scrollbars: one global rule for the whole window, never scoped to a component. Thin neutral thumb (10px gutter on both axes, 3px transparent inset, so the bar reads 4px and the drag target stays 10px), transparent track and corner, stepper arrows suppressed; never Chromium's default bar, which is opaque Windows chrome and breaks the acrylic. Writing this per component is what let four near-copies drift apart while four later scrollables shipped the default (#51); adding a scrollable must not require remembering a class.
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
