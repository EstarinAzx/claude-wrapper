---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5, relay chain 3 leg 6, owner away_
_At commit: `0628745` on `main`_

## Current focus

**Spec #120's batch is draining. #121-#126 have landed; ONE unblocked slice
remains.** Nothing is in flight — the leg that delivered #126 closed it and
handed off.

## State

- **In flight:** nothing. No ticket branch exists;
  `ticket/126-agent-map-visual-pass` was squash-merged and deleted.
- **Closed 2026-08-05:** **#121** — markdown tables render (`ef6ef22`) ·
  **#122** — code blocks carry a copy button (`a359f9f`) · **#123** — reuse a
  past user message (`f649f1d`) · **#124** — a five-position effort control
  (`39c2896`) · **#125** — the subagent viewer takes the window material
  (`c92fca7`) · **#126** — the subagent map reads as objects (`0628745`).
- **Queue:** **#127 is the only unblocked slice left.** **#128 (the 1.0.0 bump)
  is last by the owner's own instruction** and waits on the other seven, so the
  leg after #127 is the one that closes the batch and the spec. It still wears `ready-for-agent`, so the frontier
  query returns it — the ordering constraint lives in the ticket body and in
  `.claude/relay-leg.md`, not in a label.
- **Gate on `main`:** typecheck clean, build clean, **1246 tests / 82 files**.
  This replaces the `1234 / 81` line. Every remaining slice adds tests —
  **read the number off `main`, never off this file.**

## The slices

| # | Slice | Shape | State |
|---|---|---|---|
| #121 | Markdown tables render | CSS only — GFM already emits `<table>` | **closed `ef6ef22`** |
| #122 | Code blocks carry a copy button | `components` override + a **measured** clipboard route | **closed `a359f9f`** |
| #123 | Reuse a past user message in the composer | Refill through the existing `pendingInsert` channel | **closed `f649f1d`** |
| #124 | A five-position effort control | CLI-sourced levels, engine rebuild | **closed `39c2896`** |
| #125 | The subagent viewer takes the window material | CSS + pin + DESIGN.md + ADR | **closed `c92fca7`** |
| #126 | The subagent map earns its place | Visual pass inside the pinned encoding | **closed `0628745`** |
| #127 | spike — three routes nobody has called | Probe by calling, build nothing | open |
| #128 | Version 1.0.0 | Blocked by #121–#127 | open, blocked |

## Pick up here

**#127**, the only unblocked slice left. It is a **spike: it measures and builds
nothing**, so it ships no `src/` diff. When it closes, the leg after it does
#128 and closes spec #120.

## Skills for next session

- **#127 is a SPIKE and needs no design skill — it needs discipline.** Its whole
  content is the rule this batch keeps paying for: **probe by CALLING, never by
  grepping a bundle or reading a `.d.ts`.** A declared wire type is not a
  callable route (#115); a callable route is not an effective one (#117). And
  **a negative claim needs negative-shaped evidence** — "channel X is outbound"
  does not prove no inbound route exists, which is the error that created #127.
- `run-desktop` if a probe needs the real app. There are **37 `gui-*.mjs`
  drivers**; #126 added `gui-126.mjs`, whose reusable parts are the two channels
  that feed the Agents dock a synthetic fixture (`subagents:list` re-registered
  on `ipcMain`, plus `subagent:changed` pushed from main) and the fact that
  **the dock's disk half is gated on a session id** — without adopting a session
  first, a patched `subagents:list` is never called at all.
- **Every probe still needs its controls.** #126's driver reported UNSCORED
  rather than a false pass under mutation, because a discrimination control
  caught that its reader had stopped discriminating. Copy that shape.

## Open questions

Four, all recorded in `.claude/vibe.md` under `## Needs you`, all reversible,
none blocking. **#125 added none and resolved none by decision** — it shipped
the surface named in call 1 without touching the generalisation that call is
actually about. The count stands at four:

1. Whether the acrylic exception reaches any pane beyond the subagent viewer.
   **Now a live question rather than a hypothetical one**, since #125 made the
   exception exist. The answer taken is still the reversible one — **that pane
   only** — and it is enforced by two pins rather than left to good intentions,
   so a later leg that generalises it will red rather than drift.
2. Whether `ultracode` / `auto` should be reachable at all.
3. What "background a session" should mean in this app.
4. ~~That #123 ships as **refill rather than a true edit**~~ — **taken, shipped
   and warranted.** The default was the reversible one and the record now
   carries why a true edit is impossible rather than merely unchosen. Left in
   the list as answered rather than deleted, since the owner asked for the edit
   by name and may want to revisit what the app should do instead.

## Recent context

- **A VERIFICATION HARNESS IS A THING THAT CAN FAIL, AND IT FAILS IN THE
  DIRECTION THAT LOOKS LIKE SUCCESS.** #125's mutation runner passed
  `--reporter=basic`, which vitest 4 does not have; the run died with
  `ERR_LOAD_URL` **before a single test executed** and the script read the
  resulting `exit 1` as "the mutation was caught" — **three confident false
  REDs**. The rule that generalises: **take the verdict from the parsed result,
  never from the exit code**, because an exit code conflates *the thing under
  test failed* with *the harness failed*, which are the two outcomes a mutation
  run exists to distinguish; an **unparseable result is UNSCORED, not RED**; and
  a runner needs a `control` mode that runs the suite **unmutated** and demands
  green. Same family as #124's three traps and #122's clipboard, reached from the
  verification side rather than the product probe.
- **A mutation that comes back GREEN is ambiguous, and only reading it settles
  which.** One of #125's six was a *bad mutation* rather than a passing test — it
  mangled only the opening words of the `DESIGN.md` amendment while all three
  pinned tokens survived further down. Re-run as an actual deletion, it reds. A
  runner should also refuse a replacement that changes no bytes.
- **A COMPUTED-STYLE READ IS STRICTLY STRONGER THAN A SOURCE GREP, and it is
  available where a pixel read is not.** A grep is green on a rule the cascade
  drops or whose selector no longer matches the element. `getComputedStyle`
  resolves **without rasterising**, so `--disable-gpu` cannot reach it — which
  makes it the right instrument for exactly the case #125 was in: a declaration
  that must be proven to arrive at an element whose *rendered* effect no
  instrument here can see. **Binds #126.**
- **A control that must not move is as informative as one that must.** #125's
  criterion 5b reads `backdrop-filter` off a child of the glassed pane and
  expects `none` (the property does not inherit). Under the red run it stayed
  green while 5a went red — which is the evidence that the reader discriminates
  rather than answering the same string for everything.
- **`/^## Heading$/m` matches NOTHING in this repo.** The working tree is CRLF
  and `$` under `/m` matches before `\n` with the `\r` in the way, so an anchored
  heading match reads as an **empty section** and every assertion over it fails
  for a reason unrelated to content. Cost a red run. Use a plain split, or
  normalise first.
- **AND THE STANDING CRLF NOTE WAS HALF WRONG — the actionable half.**
  `core.autocrlf` is **`true`** here, so **every blob in the repo is LF** and
  checkout is what makes the working tree CRLF. Hand-converting a new file before
  committing, which `pick-up.md` has been instructing for several legs, is
  **unnecessary** — git normalises either way. The rule worth keeping is that
  **anything READING a file from disk must expect `\r\n`**. Corrected in
  [[pick-up]]; verify with `git config core.autocrlf`, since there is no
  `.gitattributes` and this rests on local config.
- **The app now has exactly one `backdrop-filter`, and its scope is pinned in two
  places.** `gui-98`'s criterion 5c and `tests/subagent-material.test.ts` both
  scan every sheet in `styles/`. Adding one to `.model-menu` reds both. This is
  deliberate: the exception's whole risk is a later leg generalising it quietly.
- **#123's shape was forced by one line, not chosen.**
  `setMessages(transcript.map(toChatMessage))` runs on adopt AND on every
  live-tail reload, so the pane is a projection of the disk transcript the CLI
  owns. Full reasoning in
  [[2026-08-05-the-pane-is-a-projection-so-the-edit-is-a-refill]].
- **The refill routes through `pendingInsert`, the commands dock's channel.**
  That is what makes the queued-send constraint hold with no new logic — #80's
  commitment is a flag on the draft, not a copy of it. Anything that lifts
  composer state or snapshots text at click time breaks it silently.
- **A value read behind a transition is not a settled one.** `gui-123`'s first
  run reported an invisible control off `opacity: 0.585`, which was the 150ms
  reveal mid-flight. Both readings are now taken. The hover phase had a settle
  wait and passed while the keyboard phase did not — two phases of one driver
  disagreeing for no product reason.
- **A driver can cost zero CLI turns.** `gui-123` removes main's `chat:send`
  listener before typing, so the renderer still appends the user bubble and no
  engine turn runs — and it **reads the listener count back**, because a send
  that quietly still fired would have emptied the composer under the assertion
  and reported a product failure.
- **`chat.css` now has a raw-text reader.** Six test files read a stylesheet as
  text. The new suite also pins that `.bubble {` is still the **first** literal
  match in that file, because `multiline-composer` slices from exactly that
  string.
- **#121's rules were measured, not chosen.** The parser writes column alignment
  as an **inline style** on every cell and emits **no wrapper** around the
  table, so no rule may mark `text-align` important and the table scrolls via
  `display: block` on itself. #122's `components` override wraps `<pre>` only —
  it was **not** extended to `<table>` and should not be.
- **The copy button did NOT ship dead.** `file://` reports
  `isSecureContext: true`, so `navigator.clipboard.writeText` is present and
  measured effective in the built app. Blink rewrites LF → CRLF inside
  `writeText` on Windows; a main-side control proved the OS clipboard innocent.
- **`capturePage`'s rect is window DIP; `getBoundingClientRect()` is the ZOOMED
  page's CSS pixels.** Scale by `getZoomFactor()` or the shot lands up and left.
  Binds #125 and #126.
- **The effort slider's five positions are the SDK's own type**, not a taste
  call — `EffortLevel = 'low'|'medium'|'high'|'xhigh'|'max'`, and `effort` rides
  `Options`, so it binds at query CONSTRUCTION and changing it must rebuild the
  engine exactly as `model:set` does.

- **#124's control is CLI-sourced and the proof is the CLI's own argv.**
  `gui-124.mjs` reads `--effort <level>` off the command line of the child
  process the rebuilt engine spawned. Both JS seams are dead ends: the SDK is
  ESM, so `require()` hands back a **frozen namespace** (`sdk.query = fn`
  silently no-ops), and `child_process.spawn` is bound by an ESM import at link
  time. Full reasoning in
  [[2026-08-05-esm-freezes-every-js-seam-so-measure-the-process]].
- **The effort scale has SIX stops for FIVE levels.** Stop 0 is `Default` — the
  absence of a level, not a sixth level. Five bare stops left `low` unreachable
  by one gesture, because an unset pick parks the thumb at position 0 and a
  range fires no change event when the thumb is already there.
- **The ticket's own count was wrong and the code follows the measurement.** No
  CLI row reports `supportsEffort: false`; 14 of 15 carry the fields and all say
  true, while `haiku` **omits** them. Absent means "the CLI did not say" → the
  full scale; `false` → no control at all.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[happy-path]]
