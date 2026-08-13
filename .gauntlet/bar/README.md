# The bar

The external standard claude-wrapper is judged against. Established 2026-08-10
by `/preset bar`, confirmed by the owner. Read this before running
`/preset gauntlet` — a critic that grades from memory is grading its own taste.

## The four fields

```yaml
bar:      .gauntlet/bar/            # linear/ = craft ceiling, identity/ = identity floor
bar_win:  Every surface of the running app survives side by side with Linear —
          none reads as the one nobody finished, every empty state is authored
          copy plus a real action rather than a placeholder mark, and one type
          scale holds across all of them — while never drifting off
          frost-mono-reference.png: near-black, one mint accent under 10% of
          surface, no decorative glass beyond the single named exception.
inspect:  SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/inspect.mjs
          # Every captured surface. Closed by #131 — see "The inspect gap".
spec:     DESIGN.md (design system, source of truth for the renderer)
          PRODUCT.md (purpose, single user, anti-references)
```

## Two references, and they pull in different directions

That tension is deliberate. A single bar either drags the app off its own
identity or lets it call its identity an excuse.

**`linear/` — the craft ceiling.** What "good enough" has to clear. Chosen
because PRODUCT.md already names it: the single user is *"fluent in dev tools
(VS Code, Linear); expects that bar of polish."* This makes a standard that was
already written down checkable, rather than inventing a new one.

**`identity/frost-mono-reference.png` — the identity floor.** The owner's own
canonical image, already the stated reference in both PRODUCT.md and DESIGN.md.
Nothing a wave produces may drift off it. Reaching Linear's craft by adopting
Linear's *look* is a failed wave, not a passed one.

`identity/current-welcome-2026-08-10.png` is the app as it stood when the bar
was set — the before-shot, not a reference. Judged against, never copied.

## Why not Warp, and why not Claude Desktop

Both were proposed and rejected, recorded here so the question is not reopened
by a later wave that thinks it found something.

- **Warp** is the sharpest *genre* match — it solved this exact problem, a
  terminal-native tool given a real GUI. It is ruled out by PRODUCT.md's own
  anti-references, which ban *"terminal emulators and TUI chrome (the thing
  being replaced)."* A Warp bar pulls the design toward the thing this product
  defines itself against.
- **Claude's desktop app** is the closest surface match for the chat column and
  beating it would be the sharpest statement available. It is silent on the
  sessions rail, the three docks, the agent map, tool cards and permission
  modes — six-plus surfaces would get no standard at all.

## What each reference judges

| File | Judges |
|---|---|
| `linear/linear-home-hero.png` | Sidebar + Chat: app shell, rail density, one type scale |
| `linear/linear-home-product.png` | InputBar: composer with attach + circular send — the direct analogue |
| `linear/linear-features.png` | Titlebar + docks: control grouping, iconography |
| `linear/linear-method.png` | Welcome + copy: authored empty space, editorial type |
| `linear/linear-changelog.png` | Chat transcript: long-form reading, date dividers |
| `identity/frost-mono-reference.png` | All surfaces: near-black wash, mint budget, restraint |

Captured by `.gauntlet/capture-bar.mjs` from public marketing pages at
1680x1050, `deviceScaleFactor: 2`, dark scheme. Re-run only when deliberately
raising the bar — `capture-bar.mjs` overwrites in place, and a bar that drifts
under a loop is not a bar.

## The inspect gap — read this before wave one

**One of the two limits below is CLOSED. The other is permanent.**

1. **~~It reaches two surfaces.~~ CLOSED by #131, 2026-08-10, and widened twice
   since.** `driver.mjs` never picked a project folder, so Welcome and Titlebar
   were all it could see. `inspect.mjs` now captures every surface in the list
   below into `SCREENSHOT_DIR`, plus `window-welcome.png`, `window-session.png`
   and `window-session-short.png` as whole-window frames for composition
   questions a clipped surface cannot answer. It seeds a conversation into the
   CLI's store and replays it, so the chat carries real message rhythm and two
   tool cards at **zero CLI turns**.

   *(The third frame was added at run 3 wave 6. It is the session frame with the
   transcript not overflowing, which is the only state holding the transcript's
   date divider — an element `linear-changelog` is assigned to judge and that no
   capture had ever shown. **This paragraph describes the instrument and is not
   part of the standard**; the surface list below, the reference table and the
   scoping sentence above are the standard and were not touched.)*

   **A missing surface is a loud failure, never a silently absent file** — every
   surface is proven present, painted and non-empty before it is photographed,
   and the run prints `CAPTURED n/12`. **If a file you expected is not in the
   directory, the run failed; read its output rather than judging the surface.**
   Three surfaces are still unreachable — AgentMap, SubagentDrawer, ToolCard —
   and are a later run's problem, as scoped.

2. **No driver can see the material.** The app's wash is
   `oklch(0.12 0.008 210 / 0.64)` — translucent by design, composited by Windows
   over the OS acrylic backdrop. DESIGN.md states it directly: *"no driver can
   see a DWM backdrop, nothing here is a claim about rendered pixels."* The
   flat mid-grey ground in `current-welcome-2026-08-10.png` is therefore an
   **instrument artifact, not a defect** — the acrylic is simply absent from the
   capture. A critic must judge composition, layout, type, hierarchy, spacing
   and state; it must **not** rule on colour, translucency or material.

   This repo has paid the read-an-artifact-as-a-finding bill eight times
   (`.context/active-work.md`, "UNSCORED IS NOT REFUTED"). This is the ninth
   waiting to happen.

## The captured surfaces, in wave order

**This list is the bar's own, and it is deliberately not generated from the
driver.** Making `inspect.mjs`'s `SURFACES` array the authority would invert the
contract: deleting a driver entry would silently delete the obligation to meet a
standard on that surface, and a standard that inherits omissions from the
implementation it polices has stopped being one. So the list is restated here by
hand, and `tests/inspect-published-list.test.ts` reds when it and the driver
disagree (#149). A surface leaving the code does not leave the bar until a human
takes it out of this list.

<!-- surfaces:begin - the bar's own surface list. Held equal to inspect.mjs's
     SURFACES array by tests/inspect-published-list.test.ts. Editing this list is
     a change to the standard; make it deliberately. -->

1. **Welcome** — `welcome.png`
2. **Welcome at the minimum window** — `welcome-min-window.png`; the same pane at
   the shortest permitted window, where its height budget is actually spent
3. **Titlebar** — `titlebar.png`
4. **Sidebar** — sessions rail; `sidebar.png`
5. **Chat** — message rhythm, tool cards, date divider; `chat.png`
6. **InputBar** — composer, attach, send; `input-bar.png`
7. **AgentsDock** — `agents-dock.png`
8. **CommandsDock** — `commands-dock.png`
9. **AppearanceDock** — `appearance-dock.png`

<!-- surfaces:end -->

**A run cannot take all nine at once.** `pieces` is capped at 6 and fixed at
seed, and the smoothing pass may add only one per wave, so a seed picks its
subset and the rest need their own run under a separate slug. That is a budget,
not a statement about which surfaces have a standard: every surface above has
one.

Still uncaptured, and so out of reach of any wave: AgentMap, SubagentDrawer,
ToolCard.

**No defect list is supplied, on purpose.** Naming the gaps here hands the critic
its verdict, and the critic ruling independently is the one thing this loop
exists to protect. An earlier draft of this file listed three; one was wrong,
which is the second reason the list is gone.

## THE MARK IS SOLID BY DESIGN — do not "fix" it

The identity mark renders as a **flat mint rounded square with no glyph**, in
both the titlebar and the Welcome hero. This is **intentional and is not a
missing asset.** Three independent signals, each verified rather than inferred:

- `.logo-mark` (`titlebar.css:26`) and `.welcome-mark` (`chat.css:199`) are each
  a bare `background: var(--mint)` — a fill, not a container.
- Both elements are **self-closing and `aria-hidden="true"`**
  (`Titlebar.tsx:175`, `Welcome.tsx:3`). Nobody marks a *missing* image
  decorative; you mark a *deliberate* one.
- DESIGN.md spends the accent on the mark **as** an accent: *"Mint accent ≤10% of
  surface, spent only on: logo mark, assistant avatar, send button, list markers,
  typing dots."* It prescribes size, radius and fill, never content — and
  `docs/design/frost-mono-reference.png` shows the same solid mark.

Adding a glyph would also change the painted area of a **named site** in the
≤10% mint accounting measured by
`.context/decisions/2026-08-04-the-ground-cancels-in-a-token-differential.md`:
the logo mark, the avatar, the send button and the welcome mark are four of the
five `background:` sites that instrument scans.

**This section exists because the first draft of this file got it wrong.** It
called the mark "a missing image" from a screenshot, which is the ninth instance
of the exact failure the section above warns about — an artifact read as a
finding. It was caught by the vibe Partner agent citing the record, not by
looking harder at the picture.

A wave may still find the mark lacks the **depth** the reference image gives it.
That is a fidelity question about the fill, and it is fair game. It is a
different question from "the glyph is missing", which is answered: there is no
glyph, by design.

## Next

```
/preset vibe init          # scope the work against this bar
/relay N=1 /preset gauntlet  # run the waves once tickets exist
```
