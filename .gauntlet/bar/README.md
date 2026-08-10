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
inspect:  SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/driver.mjs
          # PARTIAL — reaches Welcome + Titlebar only. See "The inspect gap".
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

**`inspect:` is partial, and a wave that forgets this will invent findings.**

1. **It reaches two surfaces.** `driver.mjs` waits for the two titlebar pills,
   screenshots, and exits. It never picks a project folder, so **Welcome and
   Titlebar are all it can see** — nine of the eleven surfaces are unreachable.
   About twenty ticket-specific `gui-*.mjs` drivers in the same directory *do*
   open workspaces and drive live sessions, so the machinery exists; it has
   never been consolidated into one reusable command. **Building that is ticket
   one of any run against this bar** — a task, not a guess.

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

## The five core surfaces, in wave order

Confirmed scope: core first, widen on plateau.

1. **Welcome** — the blank mint rounded square reads as a missing image, the
   composition floats in dead space, the copy is a label rather than an invitation
2. **Titlebar** — two mode pills crowd the identity mark with no separation
3. **Sidebar** — sessions rail
4. **Chat** — message rhythm, tool cards, date divider
5. **InputBar** — composer, attach, send

On plateau, widen to AgentsDock, AppearanceDock, CommandsDock, AgentMap,
SubagentDrawer, ToolCard.

## Next

```
/preset vibe init          # scope the work against this bar
/relay N=1 /preset gauntlet  # run the waves once tickets exist
```
