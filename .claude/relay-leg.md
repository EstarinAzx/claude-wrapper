# relay-leg — one ticket per leg, spec #120 batch

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides.

**Rewritten 2026-08-05 for the #120 batch; queue table refreshed by leg 5.** Everything this file said before is
gone: it described the completed #115–#119 chain, announced an empty queue, and
told legs that `ready-for-human` was allowed. All three are now false.

> **A loop body is an artefact of an earlier leg, not an instruction from the
> owner.** That lesson cost the previous chain a night — two legs obeyed a stale
> section and shipped zero features while warrants sat in the record. If this
> file disagrees with the tracker or with `.context/pick-up.md`, **they win**,
> and fix this file in your wrap-up.

## THE ONE HARD RULE THIS BATCH

**Never apply the `ready-for-human` label. The owner is away and banned it.**

`/preset ticket-loop` steps 4 and 6 tell you to relabel `ready-for-human` on a
branch collision or a failed gate. **Do not.** Instead:

1. Label the ticket **`needs-info`**.
2. Comment on it: exactly where you stopped, what you tried, what evidence you
   have, and what a cold reader needs to continue.
3. `PushNotification` naming the ticket and the blocker in one line.
4. Continue to wrap-up and let the chain move to the next ticket.

A stuck ticket must not stop the chain — the others are independent.

## The queue

Spec **#120** is the container and carries the full reasoning, 25 grep-verified
warrants, and the measurement that shaped the batch. The slice bodies are
self-contained; read #120 only if you want the why.

| # | slice | note |
|---|---|---|
| ~~#121~~ | ~~markdown tables render~~ | **CLOSED** `ef6ef22` — leg 1 |
| ~~#122~~ | ~~code-block copy button~~ | **CLOSED** `a359f9f` — leg 2. Route measured: `navigator.clipboard`, effective on `file://`. Established the repo's first `components` override; the wrapper was **not** extended to `<table>` |
| ~~#123~~ | ~~reuse a past user message~~ | **CLOSED** `f649f1d` — leg 3. Refill through the **existing `pendingInsert` channel**, text only; `pendingInsert` now has two callers and its nonce is load-bearing for both |
| ~~#124~~ | ~~five-position effort control~~ | **CLOSED** `39c2896` — leg 4. Levels measured off the REAL CLI; the range carries **six stops for five levels** (stop 0 = Default, the absence of a level) because five bare stops left `low` unreachable by one gesture |
| ~~#125~~ | ~~subagent viewer takes the window material~~ | **CLOSED** `c92fca7` — leg 5. **One declaration** of `backdrop-filter`, the only one in the app, shipped as a **named, scoped exception** rather than a relaxation; `gui-98` criterion 5 **inverted** to a three-part positive; gate-run twin added because no driver runs in `npm test` |
| #126 | subagent map visual pass | inside the pinned encoding |
| #127 | spike — three routes nobody has called | **no `src/` diff** |
| #128 | version 1.0.0 | **blocked by #121–#127** — skip until all seven are closed |

Pick the **oldest unblocked `ready-for-agent`** ticket. Run the frontier query;
never trust this table:

```text
gh issue list --state open --label ready-for-agent
```

Seven of the eight are independent, so order barely matters — except that #128
is last, by the owner's own instruction.

## Per-leg contract

Follow `/preset ticket-loop` exactly, with the `ready-for-human` substitution
above. In short: read `.context/pick-up.md` → pick ONE ticket → branch
`ticket/<id>-<slug>` → `/implement` → gate → breadcrumb comment → gateless
`/preset wrap-up` with `.context/` committed on **main only**.

**Gate is the full one:** `npm run typecheck`, `npm test`, `npm run build`. The
baseline was **1122 / 74** before this batch and is **1234 tests / 81 files**
after #125 — read the current number off `main` rather than trusting any of
these, because every slice adds tests.

## Landmines that bind more than one slice

- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`.** A
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117). #127 lives or dies on this.
- **A VERIFICATION HARNESS IS A THING THAT CAN FAIL, and #125 caught its own
  doing it.** Its mutation runner passed `--reporter=basic`, which vitest 4 does
  not have; the run died with `ERR_LOAD_URL` **before a single test executed**,
  and the script read the resulting `exit 1` as "the mutation was caught" —
  **three confident false REDs**. Take the verdict from the **parsed result**,
  never from the exit code (an exit code conflates *the code failed* with *the
  harness failed*, the two outcomes a mutation run exists to separate); an
  **unparseable result is UNSCORED, not RED**; and give any runner a `control`
  mode that runs the suite **unmutated** and demands green, before and after.
  Also: **a mutation coming back GREEN is ambiguous** between a gap in the test
  and a mutation that did not mutate the thing the test is about — one of #125's
  six was the latter, and only reading it settled which.
- **A COMPUTED-STYLE READ BEATS A SOURCE GREP and works where pixels do not.** A
  grep is green on a rule the cascade drops. `getComputedStyle` resolves without
  rasterising, so `--disable-gpu` cannot reach it — which is how #125 pinned a
  material whose rendered effect no instrument can see. Pair it with a
  **discrimination control** (a sibling that must read the default) so a
  non-discriminating reader reports UNSCORED rather than passing. **Binds #126.**
- **THE ACRYLIC EXCEPTION IS ONE PANE AND TWO PINS WILL RED IF YOU GENERALISE
  IT.** `gui-98` criterion 5c and `tests/subagent-material.test.ts` both scan
  every sheet in `styles/`. Extending glass to the model menu, the popovers, the
  Appearance dock or the map is an **open owner call**, not a styling choice.
  `gui-98` criterion 5 is now **positive** — it asserts the material is present.
  Do not "fix" a red there by softening it back.
- **UNSCORED IS NOT REFUTED, and #122 nearly paid for it.** Its clipboard spike
  scored the preferred route DEAD on run 1 because two probe buttons overlapped,
  the hit-test refused the click, and the handler never ran — with the error
  swallowed by a bare `.catch(() => {})`. Believing it would have built an IPC
  bridge the app does not need. Any probe must record its gesture errors and
  score "did the trial run" separately from "did the thing work".
- **A VALUE READ BEHIND A TRANSITION IS NOT A SETTLED ONE.** Same family, caught
  by #123. `gui-123`'s first run reported "tabbing lands on an invisible
  control" off a computed `opacity: 0.585` — the 150ms reveal mid-flight, not a
  defect. It now records the value **on landing** beside the settled one, so an
  animating rule (`0.17 → 1`) is distinguishable from one that never applies
  (`0 → 0`). Its hover phase had a settle wait and passed while its keyboard
  phase did not. **Binds #125 and #126**, both visual.
- **A GUI driver can cost ZERO CLI turns.** `gui-123` removes main's `chat:send`
  listener with `ipcMain.removeAllListeners` before typing — the renderer still
  appends the user bubble, no engine turn starts — and **reads the count back**,
  because a send that quietly still fired would empty the composer under its own
  assertions and read as a product failure.
- **A driver's RED path must fail cleanly.** `gui-122.mjs` was verified red by
  stashing its source files and rebuilding; the first red run threw an uncaught
  `TimeoutError`, skipping the summary and leaking the Electron process.
- **A negative claim needs negative-shaped evidence.** "Channel X is outbound"
  does not prove no inbound route exists. That error was caught during this
  batch's own grill and is why #127 exists at all.
- **jsdom and `npm run dev` are not the built app.** Verify with a `run-desktop`
  driver. #122 settled the clipboard case: **`file://` is a SECURE CONTEXT**, so
  `navigator.clipboard` is present and effective there, and no permission is
  requested on that path. Do not generalise past the API you measured.
- **Screenshots in this app need the zoom factor.** `capturePage` takes window
  DIP while `getBoundingClientRect()` gives the ZOOMED page's CSS pixels; scale
  by `webContents.getZoomFactor()` or the shot lands up and left of the target.
  `page.screenshot({clip})` has the same defect with no clean fix. **Binds #125
  and #126.** Hover states cannot be eyeballed either — `--tint-2` is 6% alpha;
  assert them with `getComputedStyle`.
- **No GUI driver can see a DWM backdrop** — `--disable-gpu` flattens acrylic
  and `page.screenshot()` cannot show it. #125 pins the declaration as text.
- **Stylesheets are read as raw TEXT by SEVEN tests** — #121 added
  `markdown-tables.test.tsx`, #122 added `code-copy.test.tsx`, #123 added
  `reuse-message.test.tsx` and #125 added `subagent-material.test.ts` to the
  three; **three of the seven scan the whole `styles/` directory**. No comment
  may contain a closing
  brace; no scrollbar rule may be component-scoped; **and `base.css` warns that
  even NAMING the scrollbar pseudo-element in a comment trips the scan**;
  `.bubble` and `.message-input` stay ungrouped, **and `.bubble {` must stay the
  FIRST literal match of that string in `chat.css`** — `multiline-composer`
  slices from exactly it, which `reuse-message.test.tsx` now pins.
- **jsdom loads no CSS**, so a raw-text pin proves a rule was written, never
  that it works. #121's route: render the measured markup against the **built**
  stylesheet in a real Electron window (`node_modules/electron/dist/electron.exe`
  is a real exe and spawns fine, unlike a `.cmd`) and read computed layout.
- **The `@import` order in `styles.css` IS the cascade.** Add rules inside a
  file; never reorder the imports.
- **Focus rings are picked per control, not applied.** Anything that paints a
  fill in any state takes the hairline alone.
- Harness scripts importing `.ts` from `src/` need
  `node --experimental-strip-types` (Node 22.17). Use `fileURLToPath`, never
  `URL.pathname` — this repo's path contains a space.
- **An event handler in main must not be able to throw** — Electron turns it
  into a modal error dialog over the app.
- Squash-merged ticket branches need `git branch -D`.
- **ESM FREEZES EVERY JS SEAM A DRIVER MIGHT PATCH.** #124: `sdk.query` cannot
  be monkey-patched (the SDK ships as ESM; `require()` yields a **frozen
  namespace** and the assignment silently no-ops) and `child_process.spawn`
  cannot either (bound by an ESM import at link time). The route that works is
  the OS: read the child process's command line via `Win32_Process`, walking
  descendants of the Electron main pid. `--effort` is a real CLI flag, so the
  value is visible in argv. **Any probe that installs something must read the
  installation back** — the silent no-op otherwise reads as a product failure.
- **THREE MORE INSTRUMENT TRAPS, all from #124, all producing confident false
  REDS before their controls went in.**
  `getComputedStyle(el, '::-webkit-slider-runnable-track')` does **not** read
  that pseudo-element in Chromium — it returns the element's own style.
  `locator.screenshot()` inherits the zoom/clip defect, and at this app's live
  **1.25** factor it cropped a flat patch of the wash (1 distinct colour vs 26
  at zoom 1). And `ConvertTo-Json` over `Win32_Process` dies on a raw control
  character in a live command line. **A pixel probe needs a positive control** —
  `gui-124` samples `.send-btn` beside its target so a broken instrument reports
  UNSCORED instead of refuting. **Binds #125 and #126.**
- **A control with a null state and an ordered scale needs a STOP for the null.**
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point.

## Owner calls — recorded, and none of them block you

Four open calls live in `.claude/vibe.md` under `## Needs you`. **Every one
already has a reversible default taken, and every affected ticket states it.**
They are there for the owner to revisit, not for a leg to resolve and not for a
leg to stall on:

1. Whether the acrylic exception reaches panes beyond the subagent viewer —
   **#125 shipped it** (`c92fca7`) as **that pane only**, and the scope is now
   enforced by two pins rather than by good intentions. The call is unchanged and
   still the owner's: it was always about the GENERALISATION, not about the
   viewer. Do not take it.
2. Whether `ultracode` / `auto` should be reachable — **now shipped** as five
   positions (`39c2896`), with the SDK citation that makes it a measurement
   rather than a taste call: `ultracode` is a session settings FLAG
   (`sdk.d.ts:6319`), not a point on the scale. Still listed, because the owner
   may want a separate affordance for it. **NOTE:** the range has six STOPS for
   those five levels — stop 0 is `Default`, the absence of a level, added
   because five bare stops left `low` unreachable by one gesture. That is not
   the invented sixth position this call forbids.
3. What "background a session" should mean — #127 **measures, builds nothing**.
4. #123 ships as **refill, not a true edit** — **now shipped that way**
   (`f649f1d`), with the record carrying why a true edit is *impossible* rather
   than merely unchosen. Still listed, because the owner asked for the edit by
   name and may want to revisit what the app should do instead.

**None of #122, #123, #124 or #125 added any of these, and none resolved one by
decision.** The count stands at four.

If you hit a genuinely new call the record cannot settle, take the most
reversible option, finish the rest of the ticket, and say so in the breadcrumb.
**Do not stop the chain over it, and do not label it `ready-for-human`.**

## Stop condition

Queue dry — no unblocked `ready-for-agent` tickets left — is `ticket-loop`'s
designed stop. Set `stop: true`, write `queue empty` into the baton, and spawn
no further leg. When #128 lands, close spec **#120** as delivered in that same
leg.
