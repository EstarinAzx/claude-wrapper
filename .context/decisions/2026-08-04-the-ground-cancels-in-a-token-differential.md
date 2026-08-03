---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# The ground cancels in a token differential

**#97, shipped as `96fb20f`.** Measurement only — no `src/` change, `DESIGN.md`
not edited. `DESIGN.md:7` governs and had never had matching evidence:
*"Mint accent ≤10% of surface, spent only on: logo mark, assistant avatar, send
button, list markers, typing dots."* Two halves, neither measured. #92 offered a
count of ~45 `--mint` **reference sites** and its own Pressure agent refused it:
*"reference counts do not prove intended accent spend"* — a rule painting a 2px
marker and a rule filling a button are one reference each and wildly different
spends. Gate green: typecheck clean, **979 tests across 64 files** (unchanged),
harness 15/15 PASS at exit 0.

**Verdict: the enumeration half is VIOLATED, the budget half is SATISFIED under
both readings — and this ticket deliberately spends neither.**

## Decision

**1 — One mechanism answers both facts: override the token and diff.**

A declaration resolves to an accent token **iff its computed value changes when
that token changes**. That is the clause's own notion of "spent on" rather than a
proxy for it, and it catches `var(--mint)`, `var(--color-mint)`, alias chains and
`color-mix(in oklch, var(--mint) 22%, transparent)` with no colour parsing at
all. It is specifically **not** a grep — the ledger already carries that the long
name and the short alias are not interchangeable inside a nested `[data-theme]`
opt-in, so a grep both misses sites and mis-scopes others.

The same trick measures pixels. For a pixel where the accent composites at alpha
`a` over ground `G`:

```
A = a·M + (1-a)·G     (as shipped)
B = a·N + (1-a)·G     (same frame, token overridden to N)
A - B = a·(M - N)     ← G cancels, exactly
```

so `a = ((A-B)·(M-N)) / |M-N|²`, recovered per pixel by projection.

**2 — The acrylic trap is neutralised by construction, not worked around.**

The ticket warned that `--disable-gpu` flattens acrylic and that a mint pixel
over a tint is not mint on opaque ground. In a differential that question is
`G`, and **`G` cancels**. Flattened acrylic changes what the app looks like; it
cannot move this number. The same property kills the tolerance question — a hue
cone wide enough to catch a 10%-alpha wash would also catch the neutrals, which
are *deliberately* tinted toward the accent hue (h+30 in Frost). Nothing here
has to tolerate them.

**3 — Report two numbers, because the clause does not say which it means.**

A 10%-alpha wash over a third of the window is either "a third of the surface
carries accent" or "3% of the pigment is accent". Picking one silently is the
laundering this ticket exists to avoid, so both ship: **ink** (Σ alpha over the
viewport) and **coverage** (pixels the accent touches at all). Both pass.

**4 — Non-vacuity is built in, not argued.**

Every number came back comfortably low, and *a classifier that found nothing
would report exactly the same thing* — the ticket says so itself: "an empty
return measures nothing". Three guards, all in-run:

- a **calibration target** (a known solid-accent element) reads `a = 1.0000` in
  all eight cells, which proves the BGRA channel order, the compositing model and
  the capture scale **simultaneously** — get any one wrong and it moves off 1.0;
- the **null control** (capture twice, change nothing) reads **exactly 0**, which
  is the empirical noise floor for every figure;
- a **fixed-position band of known area** is recovered at **0 relative error**
  and trips the VIOLATED branch at **12.9%**.

Without the third, every SATISFIED above would be indistinguishable from a broken
instrument. Eighth instance of the vacuity reflex after #76, #82, #93, #94, #91,
#95, #96 — and the first where the guard is a quantitative calibration rather
than a mutation.

## Why

**The enumeration half is VIOLATED and the number is not the interesting part.**
52 declarations resolve to an accent token; **38 paint surface in this engine**,
of which **8 are on the five named sites and 30 are not**. The rest split into 4
token definitions (`:root { --mint: var(--color-mint) }` — plumbing, paints
nothing), 4 `--color-mint-ink` glyph colours (a colour *on* an accent fill, which
themes.css fixes in both lightness and chroma precisely because it is not an
accent), and **6 `color-mix()` fallbacks that never paint here**: the build emits
a plain `background: var(--mint)` fallback plus the real `color-mix(…)` behind
`@media (color: color-mix(in lab, red, red))`. Chromium takes the guarded branch,
so the fallback is dead **in this app** — but in an engine without `color-mix` it
would paint the accent at **full opacity** where the author asked for 6%.

**The budget half is SATISFIED with an order of magnitude to spare.** Peak across
four palettes × two states is **1.02% ink / 1.08% coverage**. Welcome is the
expensive screen (~1.02%); a workspace with a session open is ~0.37%. Shrinking
the window to 900×600 raises the workspace figure 0.38% → **0.88%** — measured
rather than assumed, because the accent sites are mostly fixed-size and a
single-size measurement cannot tell whether the budget holds because the app is
restrained or because the window was generous.

**The largest unlisted spend on screen is state-dependent, and that is recorded
rather than averaged away.** `.backend-pill--wisped` measures 1483 device px —
more than the assistant avatar's 958 — and paints the accent **only in the wisped
backend mode**. On a native-backend machine that selector does not match and the
spend is absent. Every other unlisted element measured on screen is
mode-independent.

**Four instrument bugs were found and fixed before any number was trusted**, and
the first is the one that generalises:

1. **`rule.style` enumerates a var-shorthand's longhands with empty values.**
   Chromium has no computed value for `background`, only for `background-color`
   and friends, and with a `var()` present the longhands hold a pending
   substitution and serialise as `''`. Filtering candidates on
   `value.includes('var(')` therefore skipped **every `background:` declaration**
   — which is how the logo mark, the avatar, the send button, the welcome mark
   and the typing dots are all painted. The scan reported 21 declarations, missed
   **four of the five NAMED sites**, and read green. `cssText` is parsed instead.
   This is #92's failure one layer down: an instrument that answers a nearby
   question convincingly.
2. **The viewport premise compared CSS px against DIP.** Three different pixels
   live here — the window is sized in DIP, `capturePage` returns physical px, and
   `innerWidth` is CSS px (DIP ÷ the app's zoom, which is 1.25 and which Chromium
   persists per origin in `userData`, #78). The check failed on a
   correctly-captured window. Restated as the trap it exists for: **the capture
   must equal the window content in device pixels, exactly.**
3. **The typing-dot probe subtracted two frame totals and went negative.**
   Appending the probe reflows the scroller, so the two frames do not contain the
   same pixels and the subtraction isolates nothing. Measured over the probe's
   own region instead. Typing dots are in **neither** steady state (they render
   only while a turn is in flight with no assistant text yet), so they are a
   labelled probe: 146 device px, 0.011% of the viewport.
4. **The self-test rounded width and height independently** while the
   differential rounds region edges — a 0.93% "error" that was arithmetic rather
   than measurement, and which would have set the tolerance an order of magnitude
   too loose.

**Motion is frozen and the freeze is verified.** `prefers-reduced-motion: reduce`
turns `base.css:92` into `animation: none !important`, which is what makes A and
B the same frame. The media state is read back after being forced — #96's rule,
used here for the opposite purpose. Nothing hides: `msg-in` and `typing-pulse`
put their `opacity: 0` / `0.35` in **keyframes**, so with no animation both
render at their authored opacity.

**The harness restores what it borrows.** Window bounds (#79 persists them) and
the `theme` key are put back before close, so the next GUI driver measures what
it expects. A spike that left a 900×600 window and a non-default palette behind
would have moved `gui-51`'s device-pixel comparisons silently.

## Reversibility

**Fully reversible — there is nothing to revert.** No `src/` file was touched and
`DESIGN.md` was not amended. The deliverable is
`scripts/spike-97-mint-budget.mjs` plus `scripts/spike-97-findings.json`; the
sixth spike harness, and the first that drives the window rather than the CLI.

**The clause itself is still the owner's call, on #92**, and this ticket was
deliberately forbidden from spending its own evidence. The evidence now says
plainly: the proportion half holds with ~10× headroom, and the enumeration half
does not hold — so the remaining question is whether the *enumeration* should
change, which is exactly the taste call #92 parked. Amending `DESIGN.md` to
match measured drift is the laundering move #92 and #96 both refused, and
producing the numbers does not make it any less so.

## Related

- [[decisions]]
- [[2026-08-04-the-parked-owner-calls-are-taken]] — **filed this ticket**, and is
  where #92 call 2 was parked for lack of exactly this evidence
- [[2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit]] — #96,
  the other half of the same audit, and the same refusal to widen a doc
- [[2026-07-31-a-driver-establishes-its-premise]] — the premise rule this extends
  with a quantitative calibration target
- [[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]] — #91,
  whose `gui-91` mint scan was the nearest prior instrument and is superseded as
  a *method* by the differential
