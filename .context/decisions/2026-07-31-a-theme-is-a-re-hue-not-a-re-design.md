---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision]
---

# A theme is a re-hue, not a re-design

**Decision:** Four themes — **Frost** (default, current values), **Ember**, **Moss**, **Slate** — each re-hueing the accent **quartet** and the neutral hue angle. **Lightness and alpha are fixed across every theme; chroma may move within `0.05`–`0.09` on `--color-mint` and `--color-mint-press` only.** The app stays dark. Overrides live in `src/renderer/src/styles/themes.css`, selected by `data-theme` on `documentElement`.

## The accent is four tokens, not three

`rails.css:324` is `oklch(0.87 0.07 180 / 0.1)` — mint **at 10% alpha** — and CSS cannot apply an alpha to `var(--color-mint)`. The fix is therefore either `color-mix()`, a new mechanism in an app that expresses everything as flat tokens, or a fourth token. Take the token: **`--color-mint-wash`**. Every theme block declares **four** accent values, and the key-set test's expected set is four, not three. Finding this now is the difference between a correct pin and one that greens while the third theme silently inherits Frost's wash.

## The mechanism, verified in the built output

`@theme` compiles to `:root, :host` **inside `@layer theme`** (`out/renderer/assets/index-*.css:22-42`); the short aliases sit **unlayered** at `:root` (line 94+, `--mint: var(--color-mint)`). Unlayered normal declarations beat layered ones outright, so a plain `:root[data-theme="…"]` block overrides the defaults with no specificity gymnastics — and because the aliases resolve `var(--color-mint)` at substitution time, **they inherit the override for free and none of them needs touching.**

`themes.css` imports **immediately after `tokens.css` and before `base.css`**. The import order is the cascade ([[2026-07-30-the-import-order-is-the-cascade]]); a theme block landing before the tokens it overrides is exactly the silent restyle that rule exists to prevent. The overview's cascade paragraph goes from eleven imports to twelve.

## Why dark only

DESIGN.md:5 argues dark from the scene — one user, coding at night, acrylic over a dark desktop — and calls it explicitly "not a category reflex". A light theme is not a token swap: `--color-wash` at 64% alpha over a light surface inverts every contrast assumption in the app, and DESIGN.md's "never `#000`/`#fff`" plus "backgrounds under the acrylic must stay translucent" would both need re-deriving. That is a design project, not this feature. PRODUCT.md:20-21 also rules out both directions a light theme drifts toward (SaaS cream one way, neon glow the other).

## Why lightness and alpha are fixed, and chroma is not

Holding lightness fixed keeps every contrast ratio. Holding alpha fixed keeps the seven-step tint ladder intact. Together they mean a theme **cannot break the reference match — only re-tint it**, and `docs/design/frost-mono-reference.png` stays the canonical arbiter per PRODUCT.md:15.

The objection that this makes four variations of one theme rather than four themes is the wrong worry: Frost Mono **is** one quiet accent on near-black — that is the product, not a limitation of the token set. A theme system that can move lightness is one that can produce a window no longer matching the reference. The restraint is the identity surviving the feature.

**Chroma is the exception, and it is what makes these read as distinct rather than as a hue slider.** Mint sits at `0.07`, deliberately quiet. A hue intrinsically duller at the same chroma needs a little more to register as an accent at all; one intrinsically louder needs less. Chroma is the one axis that carries "different colour" without touching contrast or the tint ladder. The band is `0.05`–`0.09`, and the result is eyeballed against DESIGN.md's ≤10% accent budget in a real window.

**The band is the accent's alone.** The neutrals sit at chroma `0.008`–`0.01`; a theme pushing them anywhere near `0.05` produces a strongly-coloured near-black instead of a tinted one, which is the identity gone. **Neutrals move by hue angle only — chroma fixed.** The band applies to `--color-mint` and `--color-mint-press` and nothing else. `--color-mint-ink` (`oklch(0.25 0.02 200)`) follows the hue and keeps **both** its lightness and its chroma, because it is a glyph colour on a fill, not an accent.

**Derive press from mint per theme; do not author the two independently.** The *relationship* is what carries across: press is one lightness step down and slightly more chromatic — `0.8 0.08 182` against `0.87 0.07 180` — including the 2° hue offset. Authoring them separately is how a theme ends up with a press state that reads as a different colour rather than a pressed one.

The neutral hue angle moves with the accent. That is what stops a theme reading as a sticker on a mint app.

**The four:** Frost — mint, `h≈180`, unchanged, default. Ember — warm amber near `h≈70`, deliberately clear of the orange-red that would collide with `--color-danger-*`. Moss — muted green-gold near `h≈130`. Slate — cool blue-grey near `h≈240`, quietest of the four. All hold `L≈0.87` on the accent. None is purple, none glows, none is cream.

## The two duplicate literals are bugs this feature exposes

`rails.css:324` is `oklch(0.87 0.07 180 / 0.1)` — `--color-mint` verbatim at 10% alpha — and `titlebar.css:209` is `oklch(0.94 0.008 190)`, `--color-text` verbatim. Both survive an accent swap visibly: a mint-tinted active row inside an amber theme, and a hardcoded text colour on the one control whose hover is a red fill. Both get tokenised — the first onto the new `--color-mint-wash`, the second onto the existing `--color-text`.

The other 16 colour literals outside `tokens.css` are **left alone**. The shadows are pure black and theme-neutral by definition; the danger shades and the three markdown syntax colours are semantic rather than brand — red must stay red in every theme, and re-hueing syntax highlighting is a feature nobody asked for.

## The test, and what it honestly cannot cover

Ship a text test over `themes.css` with two assertions:

1. **Every theme block declares exactly the same key set** — including all **four** accent tokens. The failure this catches is real, silent and specific: a theme missing `--color-mint-ink` inherits Frost's dark glyph colour and the send button's glyph goes invisible on an amber fill, with nothing red anywhere. jsdom cannot see it and a screenshot at rest may not either.
2. **No theme declares a lightness or alpha differing from Frost's for the same key**, and no theme moves a *neutral's* chroma. This makes the rules above *structural* rather than remembered — the same trick as naming the panel Appearance, and the same reason the scrollbar rule went global. Without it, "lightness stays fixed" is a sentence in an ADR that the fourth theme quietly breaks.

**This file will be the third raw-text CSS reader in the suite**, joining `scrollbar.test.ts` (which scans every line naming a scrollbar pseudo-element, comments included) and `multiline-composer.test.tsx` (which slices between literal braces). Both have already gone red on prose. `themes.css` will *want* comments explaining each hue, and a naïve `--color-\w+:` regex counts a commented-out declaration happily — so **strip comments before parsing**, and add this trap to the landmine ledger beside the other two.

This is not a green-for-the-wrong-reason test: it asserts a **structural equality between blocks**, not a symptom with more than one cause. Two conditions on it. **Mutation-verify in both directions** — deleting one declaration must redden it, and a value re-tint must *not*, because a key-set test that fires on a re-tint gets retired the first time someone adjusts a hue. And **name it for what it pins** ("every theme declares the same keys"), never "themes are correct" — [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]]'s lesson is that a test whose name overclaims is how weak code stays frozen in place.

**No test covers whether Ember actually looks good.** That is eyeballed in a real window, never a driver screenshot — `--disable-gpu` flattens acrylic, a recorded trap.

## Trust boundary

The theme preference is a **four-string whitelist**, same shape as Backdrop's two. The value reaches `documentElement`'s `data-theme` and nothing else, so an unknown string falls back to `frost` rather than setting an attribute matching no block and silently rendering the defaults anyway.

## Tailwind's fate stays open

"Should Tailwind stay at all?" is a live open question and theming touches it — `@theme` is the store being overridden. It is deliberately **not** bundled: the override mechanism is indifferent to whether the defaults come from `@theme` or a plain `:root` block, and making a reversible feature wait on an irreversible cleanup is backwards.

**Reversibility:** easy.

## Related

- [[decisions]]
- [[2026-07-30-the-import-order-is-the-cascade]] — why `themes.css` sits where it does
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] · [[2026-07-23-tailwind4-tokens]] — the store being overridden
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — the naming condition on the test
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — where the picker lives
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — the axis deliberately kept separate from this one
