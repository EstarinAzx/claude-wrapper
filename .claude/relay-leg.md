# relay-leg — one ticket per leg

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides.

> **A loop body is an artefact of an earlier leg, not an instruction from the
> owner.** That lesson cost a chain a night — two legs obeyed a stale section and
> shipped zero features while warrants sat in the record. If this file disagrees
> with the tracker or with `.context/pick-up.md`, **they win**, and fix this file
> in your wrap-up.

## THE QUEUE IS EMPTY AND CHAIN 3 HAS STOPPED — read this before anything else

**Rewritten 2026-08-06 by leg 9, the final leg.** Everything the previous
version of this file said about a queue is now false: it listed spec #120 with
#129 still to come, and all of it has landed.

| chain 3 | |
|---|---|
| legs | 9 |
| tickets | **#121–#129, all closed** |
| spec | **#120 delivered and closed** on leg 8 |
| gate | green on every leg; `main` at **1277 tests / 84 files** |
| human touches | zero |

`.claude/relay/relay-leg.md` carries `stop: true` and **no leg 10 was spawned**.

**If you are reading this as a freshly spawned leg, something re-inited the
chain.** Run the frontier query FIRST:

```text
gh issue list --state open --label ready-for-agent
```

**Empty → you have no work. Stop; do not invent some.** Set `stop: true`, say so,
and spawn nothing. The queue going dry is `ticket-loop`'s designed end, not a
failure to find something.

**#130 is open and is deliberately `needs-triage`, not `ready-for-agent`.** It
was filed by leg 9 as a candidate for the owner — extending rewind to replayed
messages is a feature choice nobody asked for. **Do not relabel it to give
yourself work.** A leg promoting its own follow-up makes the stop condition
unreachable by construction, which is the failure mode this whole paragraph
exists to prevent.

## Still true if a leg ever does run again

**Never apply the `ready-for-human` label. The owner is away and banned it.**
`/preset ticket-loop` steps 4 and 6 tell you to relabel it on a branch collision
or a failed gate. Instead: label **`needs-info`**, comment with exactly where you
stopped and what a cold reader needs, `PushNotification` the ticket and the
blocker in one line, then continue. A stuck ticket must not stop the chain.

**Follow `/preset ticket-loop` exactly**, with that substitution: read
`.context/pick-up.md` → pick ONE ticket → branch `ticket/<id>-<slug>` →
`/implement` → gate → breadcrumb comment → gateless `/preset wrap-up` with
`.context/` committed on **main only**.

**Gate is the full one:** `npm run typecheck`, `npm test`, `npm run build`.
`main` is at **1277 tests / 82+2 = 84 files** after #129. Read the current number
off `main` rather than trusting this one. When a ticket's substance *is* the
gate, run it **on `main` after the merge** rather than inferring it from the
branch; #128 and #129 both did.

**Do not push on your own initiative.** Every leg of chains 2 and 3 landed
locally and pushed nothing, because pushing is outward-facing and the owner had
not asked. **On 2026-08-06 they asked, and the backlog went up** — `origin/main`
is now `041843a`, 18 commits, clean fast-forward. That authorisation covered the
accumulated backlog; it is **not** a standing grant, so a fresh unattended leg
still lands locally and says so. Read the current gap rather than any literal:
`git rev-list --count origin/main..main`.

## Landmines that bind more than one slice

- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`.** A
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117). **#127 paid this out three times** and its instrument is
  reusable verbatim and free: on one warm handle send a **bogus subtype** (which
  answers `Unsupported control request subtype: …`), then the candidate, then
  the candidate with bad arguments. A candidate that fails with a **different**
  error was recognised by the dispatcher and reached its own validator — that is
  how "no such route" is told from "route exists, switched off".
- **A CONTROL CATCHES FALSE POSITIVES TOO, and #127's two saves were both.**
  Task backgrounding first scored EFFECTIVE off a 37s speed-up whose real cause
  was that **this machine's harness blocks standalone `sleep`** — the arm was
  measuring a hook, not a route. Session detach first scored SURVIVED off a
  proof file written *before* the cut plus a witness watching **the newest
  transcript anywhere on the machine**. So: **use a node timer, never `sleep`**,
  for a long foreground command in a probe; assert the control **actually
  blocked** before scoring the treatment; check the artefact **before** the cut
  (present → UNSCORED, never a pass); scope any on-disk witness to the session
  id you are measuring; and **use absolute paths in probe prompts** — a relative
  one made the model write a file that was not the target.
- **THE CLI NEVER ECHOES THE PROMPT BACK.** The only `type: 'user'` messages on
  the stream are **tool results**. Anything needing a user-message id must
  **stamp its own `uuid`** on the outgoing message; the CLI stores it under
  exactly that id (assert with `getSessionMessages`). Scraping the stream
  silently addresses a tool_result — #127's own arm did, before it was fixed.
- **`enableFileCheckpointing` binds at query CONSTRUCTION**, like `model` and
  `effort`. A setter that only stores changes nothing. Binds **#129**.
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
- **AN SVG LENGTH IS IN VIEWBOX UNITS, NOT CSS PIXELS.** #126: the map edges had
  `stroke-width: 1`, which rendered at roughly **0.6 of a device pixel**, because
  a 240-unit viewBox scales into ~151px at the dock's clamp floor. Anything in an
  SVG authored with a CSS-pixel intuition is wrong by that scale. Related, and
  both measured on the real window rather than read off the token file: **the
  tint ladder tops out at 20% alpha of a near-white over a near-black ground and
  cannot carry a structural line**, and **a nominally lighter neutral is not
  necessarily lighter on screen** — `--bubble` (OKLCH 0.27 vs `--surface` 0.19)
  composites to roughly the panel's own value once the wash beneath it counts.
- **THE AGENTS DOCK NEEDS TWO CHANNELS AND AN ADOPTED SESSION TO FIXTURE.**
  `parentAgentId` (nesting) is **disk-only**, `status` is **live-only**, and the
  disk half never runs until `activeSessionId` is set — so a driver must click a
  `.session-row-btn` before a patched `subagents:list` is ever called. `gui-126`
  is the worked example. Reopening the dock also resets its mode to `list`.
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
- **A REFUSAL CAN BE A THROW, and #129 measured both mechanisms for one fact.**
  `rewindFiles` with an id that has no checkpoint **rejects**
  (`No file checkpoint found for this message.`), while checkpointing being off
  answers `canRewind: false` in the BODY. A handler that only reads the body
  turns the ordinary refusal into an unhandled rejection — and this one is called
  from an `ipcMain.handle`, where that becomes a modal error dialog over the app.
- **A GATE ON ONE PHASE DOES NOT PROTECT THE PHASE THAT REUSES ITS HANDLE.**
  #129's spike resumed phase B from a **fresh temp directory**; the CLI's session
  store is keyed by **project directory**, so the lookup died with `No
  conversation found with session ID`. Phase B's positive control caught it and
  scored UNSCORED. **Phase C had no gate**, read the same dead handle, and
  answered a confident "NO" that would have shipped a control withdrawing itself
  on every model pick. **A resume needs the WORKSPACE as much as the id.**
- **AN UNAPPLIED MUTATION READS EXACTLY LIKE A CAUGHT ONE.** One of #129's eight
  mutations came back `ANCHOR NOT FOUND` because a multi-line anchor missed this
  repo's CRLF. It was re-run, not counted. A mutation runner must report
  "never applied" as its own outcome, distinct from RED.
- **`model`, `effort`, `resume` AND `enableFileCheckpointing` all ride `Options`**
  — all four bind at query CONSTRUCTION. A setter that only stores changes
  nothing.
- **The tokens are `--fs-micro` and `--danger-text`.** There is no `--fs-meta`,
  no bare `--danger`. #129 wrote both wrong first and nothing but the real window
  could catch it: jsdom loads no CSS and an unknown `var()` resolves silently to
  nothing.
- **Stylesheets are read as raw TEXT by NINE tests** — #121 added
  `markdown-tables.test.tsx`, #122 added `code-copy.test.tsx`, #123 added
  `reuse-message.test.tsx`, #125 added `subagent-material.test.ts` and #129 added
  `rewind-message.test.tsx` to the earlier ones; **three of the nine scan the
  whole `styles/` directory**. No comment
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
3. What "background a session" should mean — **#127 has now delivered the
   measurement this call was waiting for, and the call stays open.** Detach
   **fails** (closing the handle kills the CLI child); `background_tasks` is
   reachable but showed **no effect**. The one genuine candidate is **Remote
   Control**, **reachable**, probed `enabled: false` **ONLY** — enabling it
   bridges a live session to an external service, which is outward-facing, and
   the owner is away. **That is the open part now**, and it is not a leg's to
   take.
4. #123 ships as **refill, not a true edit** — **now shipped that way**
   (`f649f1d`), with the record carrying why a true edit is *impossible* rather
   than merely unchosen. Still listed, because the owner asked for the edit by
   name and may want to revisit what the app should do instead.

**None of #122–#129 added any of these, and none resolved one by decision.**
#127 delivered call 3's measurement and left the call open, which is what a
spike is for; #128 was a version bump and had no calls in it; #129 hit one
genuinely new choice — whether replayed messages get the rewind control — and
took the reversible option (they do not, because their id is not in hand) and
**filed the alternative as #130 at `needs-triage`** rather than deciding it. The
count stands at four.

**One new thing that is NOT a call and needs no decision:** the repo now reads
**1.0.0** while nothing publishes — `git tag` **0**, no electron-builder config,
`npm run dev` only, and the post-bump build emitted **byte-identical asset
hashes**, so the version does not enter the bundle. If the owner ever wants that
to mean something (a tag, an installer, a version readout), each is its own
ticket with its own warrant. Do not build one off the number alone.

If you hit a genuinely new call the record cannot settle, take the most
reversible option, finish the rest of the ticket, and say so in the breadcrumb.
**Do not stop the chain over it, and do not label it `ready-for-human`.**

## Stop condition — ALREADY REACHED

Queue dry — no unblocked `ready-for-agent` tickets left — is `ticket-loop`'s
designed stop. Set `stop: true`, write `queue empty` into the baton, and spawn
no further leg.

**#129 landed as `e164d6c` on 2026-08-06 and it was the last ticket.** The
frontier query returns **empty**. Leg 9 set `stop: true`, wrote `queue empty`
into the baton, and **spawned nothing**.

The one open issue, **#130**, is `needs-triage` by design and does not match the
frontier query. **Promoting it to `ready-for-agent` to give a leg something to do
would make this stop condition unreachable by construction** — it is a candidate
for the owner, and taking it is their call, not a leg's.
