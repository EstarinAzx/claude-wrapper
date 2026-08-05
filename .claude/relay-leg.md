# relay-leg — one ticket per leg, spec #120 batch

Loop body for:

```
/relay N=1 read and follow .claude/relay-leg.md
```

Each leg = exactly ONE ticket end to end, then the relay machinery hands off to
a fresh session. Legs run **unattended**: never call AskUserQuestion; every gate
below auto-decides.

**Rewritten 2026-08-05 for the #120 batch.** Everything this file said before is
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
| #123 | reuse a past user message | refill, never mutate the transcript |
| #124 | five-position effort control | CLI-sourced levels; must rebuild the engine |
| #125 | subagent viewer takes the window material | + positive pin + DESIGN.md + ADR |
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
baseline was **1122 / 74** before this batch and is **1145 tests / 76 files**
after #122 — read the current number off `main` rather than trusting any of
these, because every slice adds tests.

## Landmines that bind more than one slice

- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`.** A
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117). #127 lives or dies on this.
- **UNSCORED IS NOT REFUTED, and #122 nearly paid for it.** Its clipboard spike
  scored the preferred route DEAD on run 1 because two probe buttons overlapped,
  the hit-test refused the click, and the handler never ran — with the error
  swallowed by a bare `.catch(() => {})`. Believing it would have built an IPC
  bridge the app does not need. Any probe must record its gesture errors and
  score "did the trial run" separately from "did the thing work".
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
- **Stylesheets are read as raw TEXT by five tests** — #121 added
  `markdown-tables.test.tsx` and #122 added `code-copy.test.tsx` to the three. No comment may contain a closing
  brace; no scrollbar rule may be component-scoped; **and `base.css` warns that
  even NAMING the scrollbar pseudo-element in a comment trips the scan**;
  `.bubble` and `.message-input` stay ungrouped. Binds #122, #123.
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

## Owner calls — recorded, and none of them block you

Four open calls live in `.claude/vibe.md` under `## Needs you`. **Every one
already has a reversible default taken, and every affected ticket states it.**
They are there for the owner to revisit, not for a leg to resolve and not for a
leg to stall on:

1. Whether the acrylic exception reaches panes beyond the subagent viewer —
   #125 says **that pane only**. Do not generalise it.
2. Whether `ultracode` / `auto` should be reachable — #124 ships **five
   positions**. Do not invent a sixth.
3. What "background a session" should mean — #127 **measures, builds nothing**.
4. #123 ships as **refill, not a true edit**.

**#122 added none of these**, and resolved none. The count stands at four.

If you hit a genuinely new call the record cannot settle, take the most
reversible option, finish the rest of the ticket, and say so in the breadcrumb.
**Do not stop the chain over it, and do not label it `ready-for-human`.**

## Stop condition

Queue dry — no unblocked `ready-for-agent` tickets left — is `ticket-loop`'s
designed stop. Set `stop: true`, write `queue empty` into the baton, and spawn
no further leg. When #128 lands, close spec **#120** as delivered in that same
leg.
