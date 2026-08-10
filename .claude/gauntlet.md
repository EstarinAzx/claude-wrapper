---
slug: core-surfaces
bar: .gauntlet/bar/            # linear/ = craft ceiling, identity/ = identity floor
bar_win: >
  Every surface of the running app survives side by side with Linear — none reads
  as the one nobody finished, every empty state is authored copy plus a real
  action rather than a placeholder mark, and one type scale holds across all of
  them — while never drifting off frost-mono-reference.png: near-black, one mint
  accent under 10% of surface, no decorative glass beyond the single named
  exception.
inspect: SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/inspect.mjs
spec: DESIGN.md (design system, source of truth for the renderer) + PRODUCT.md (purpose, single user, anti-references)
pieces:
  - name: Welcome
    verdict: BAR WINS
    open: true
  - name: Titlebar
    verdict: BAR WINS
    open: true
  - name: Sidebar
    verdict: BAR WINS
    open: true
  - name: Chat
    verdict: BAR WINS
    open: true
  - name: InputBar
    verdict: BAR WINS
    open: true
critic: sonnet                 # resolved live at seed -> codex/gpt-5.6-sol; RE-RESOLVE every wave
critic_degraded: false
branch: gauntlet/core-surfaces
wave: 0
plateau: 0
max_waves: 12
page: false
stop: false
---

## Where things are

- **This file is the run's memory.** `.claude/relay/gauntlet.md` is only the relay
  machinery; it points here.
- **The tree stays on `gauntlet/core-surfaces`.** The seed commit is on `main` as
  well, so a leg that somehow boots on `main` still finds this file and does not
  re-seed — but `main`'s copy goes stale the moment wave 1 commits. **The live
  copy is the one on the branch.** If you are on `main` and `wave:` reads 0 while
  `git log gauntlet/core-surfaces` shows waves, you are reading the stale copy.

## Seed verification — what was checked rather than assumed

- `inspect:` was **run once at seed**, not trusted from the record: `PASS`, all
  seven files written, `FRAME {"width":1440,"height":900,"zoom":1}`. The
  instrument works on this machine at `21ee444`.
- `critic:` was resolved from live `wisp routing`, first non-Anthropic family.
  It landed on **`sonnet` -> `codex/gpt-5.6-sol`**, which is **not** what the
  vibe run used (`sonnet` -> `opencode-go/kimi-k3` on 2026-08-10). The routes
  moved in under a day. **Re-resolve every wave; never carry this value forward.**

## Piece -> capture -> reference map

`inspect:` writes seven files. Each piece gets its own surface file **plus** the
whole-window frame it lives in — a surface clipped to its own bounding box cannot
answer a composition question, and every `.gauntlet/bar/linear/` reference is a
whole-page frame.

| Piece | Surface capture | Window frame | Bar reference |
|---|---|---|---|
| Welcome | `welcome.png` | `window-welcome.png` | `linear/linear-method.png` |
| Titlebar | `titlebar.png` | `window-session.png` | `linear/linear-features.png` |
| Sidebar | `sidebar.png` | `window-session.png` | `linear/linear-home-hero.png` |
| Chat | `chat.png` | `window-session.png` | `linear/linear-changelog.png` |
| InputBar | `input-bar.png` | `window-session.png` | `linear/linear-home-product.png` |

`identity/frost-mono-reference.png` goes to **every** critic — it is the identity
floor, not one piece's reference. `identity/current-welcome-2026-08-10.png` is the
before-shot; judged against, never copied.

**A missing file means the run failed** — read its output rather than judging the
surface. A green run asserts all seven; a failing one prints `CAPTURED n/7`.

## Binding constraints — hand these to every builder and every critic

Assembled at seed from `.gauntlet/bar/README.md` and `.claude/vibe.md` so no leg
has to reconstruct them. **They are not up for re-litigation by a wave.**

**For the critic:**

1. **Colour, translucency and material are OUT OF SCOPE for any verdict.** The
   wash is `oklch(0.12 0.008 210 / 0.64)`, composited by Windows over OS acrylic,
   and no driver can see a DWM backdrop. The flat ground in every capture is an
   **instrument artifact, not a defect**. Judge composition, layout, type,
   hierarchy, spacing and state. This repo has read an artifact as a finding nine
   times; this is the tenth waiting to happen.
2. **The identity mark is SOLID BY DESIGN — no glyph, ever.** Verified three ways
   (`titlebar.css:26`, `chat.css:199` are bare `background: var(--mint)`; both
   elements self-closing and `aria-hidden="true"`; DESIGN.md prescribes size,
   radius and fill but never content). A wave may question the fill's **depth** —
   that is a different question and is fair game.
3. **No defect list is supplied, on purpose.** Naming gaps hands the critic the
   verdict it exists to reach independently.
4. Return exactly one of `BAR WINS` / `TOO CLOSE` / `YOURS WINS`, plus **one**
   biggest remaining gap in a sentence. `SPEC BREAK <what>` if the piece violates
   `spec:`.

**For the builder:**

5. **D3 — the stylesheet pins are literal-text and brittle.** A wave MAY edit
   `src/renderer/src/styles/`, but: three tests scan the **whole** `styles/`
   directory; no comment may contain a closing brace (even *naming* the scrollbar
   pseudo-element in a comment trips the scan); no scrollbar rule may be
   component-scoped; `.bubble` and `.message-input` stay ungrouped; **`.bubble {`
   must stay the FIRST literal match of that string in `chat.css`**; **exactly ONE
   `backdrop-filter` in all of `styles/`** and `gui-98` criterion 5 is *positive*
   — never soften it to clear a red; the `@import` order in `styles.css` IS the
   cascade, so add rules inside a file and never reorder; `theme.test.ts` allows
   hue and accent-chroma movement but **no lightness and no alpha anywhere**.
   Token names are `--fs-micro` and `--danger-text`.
6. **D4 — any CSS change owes a driver pin.** jsdom loads no CSS, so an unknown
   `var()` resolves silently to nothing and every raw-text pin still passes. #129
   shipped two nonexistent tokens past all of them. An existing `gui-*.mjs` that
   covers the change discharges this; a new driver is not required.
7. **#125's glass exception is ONE named pane and is explicitly not a precedent.**
   Any warrant used to add `backdrop-filter` or a second glass layer to these five
   surfaces has the warrant backwards.
8. Close **one** named gap. Do not redesign, do not touch other pieces.

**For the wave:**

9. **D7 — the gate is green on all three: `npm run typecheck`, `npm test`,
   `npm run build`.**
10. **A wave must be GREEN before it commits.** Owner-call default taken
    2026-08-10, reversible, recorded in `.claude/vibe.md` `## Needs you`: a red
    wave **reverts its piece and records the gap** rather than committing red.
11. **D6 — no pushing to `origin` on a leg's own initiative.** Land locally and
    say so.

## Verdicts
| wave | piece | verdict | biggest gap |
|---|---|---|---|

## Log
- [seed] Seeded 2026-08-10 off `21ee444`, slug `core-surfaces` (five core
  surfaces; the other six are a second run under a separate slug — `pieces` is
  capped at 6 and fixed at seed, so they cannot be a widening inside this run).
  Five pieces seeded leaves **exactly one slot** for the smoothing pass's one
  permitted addition.
- [seed] `inspect:` smoke-run before being pinned as a fixed field — `PASS`, 7/7
  files, frame 1440x900 @ zoom 1. The bar and the four fixed fields come from
  `.gauntlet/bar/README.md`, owner-confirmed 2026-08-10.
- [seed] Critic resolved live to `sonnet` -> `codex/gpt-5.6-sol`. The vibe run one
  day earlier resolved the same family to `opencode-go/kimi-k3`. **Routes move —
  re-resolve every wave.**
</content>
</invoke>
