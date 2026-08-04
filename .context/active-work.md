---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 8 (`relay-leg`)_
_At commit: `0aae906` on `main`, pushed and level with `origin/main`_

## Current focus

**#105 landed and closed — a spike, `src/` untouched.** Picking a model (or
flipping permission, or flipping backend) empties **both** live read channels
until the next send: **15 → 0 models, 119 → 0 commands, 6/6 warmed runs, no
prompt sent**. The fix is filed as **#112** and is not this leg's work. Next
frontier is **#106**, a small renderer-side copy/correctness fix.

## State

- **In flight:** nothing. Ticket branch squash-merged and deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #105 as `0aae906` —
  `scripts/spike-105-model-pick-channels.mjs` + `spike-105-findings.json`.
  **No `src/` diff**, confirmed by `git diff --stat -- src/`.
- **Gate:** typecheck clean; **995 tests across 64 files** green (unchanged, as a
  spike should leave it); build clean.
- **Filed this session:** **#112** — the fix #105 recommends: rebuild lazily at
  the two READ handlers rather than eagerly in `discardEngine`.
- **Queue:** seven open, #106 through #112, all `ready-for-agent`; none
  `ready-for-human`. #106's live `blocked_by` is 0.
- **Blocked:** nothing.

## Pick up here

Take **#106** after re-running the frontier query. Small and renderer-side:
`InputBar.tsx` flattens a failed `readAsBase64` to `''`, so `judgeAttachment`
falls through to its catch-all and tells the user *"image/png can't be embedded
— only PNG, JPEG, GIF and WebP images can"*, naming PNG as both the rejected and
an accepted type.

The ticket is unusually prescriptive and its non-goals are load-bearing: resolve
to `null` at the call site and push a `{ name, reason }` rejection from the
**renderer**; do **not** widen `Candidate` or `judgeAttachment`, do **not** touch
the catch-all message (it is right for the case it was written for), and do
**not** add a retry.

**AC1 has two halves and only one of them is the real assertion.** It requires
asserting the reason **is** the could-not-read wording *and* **is not** the
embeddable-types sentence — asserting only the new string passes against a build
that shows both.

## Skills for next session

- `superpowers:test-driven-development` — #106 is a behaviour change with the
  assertions specified up front.
- `superpowers:verification-before-completion` — full test/typecheck/build gate
  before landing.

## Open questions

None for #106; the ticket resolves its own design questions in its non-goals.
`ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- **An empty list has to be attributed, not observed.** #105's whole difficulty
  was that `gui-52`'s standing red made *"the CLI has no models"* and *"the
  engine is null"* produce the same empty array. Phase A settles it at the
  source: asked directly through the app's real `cli-path.ts` /
  `backend-mode.ts`, the CLI answers **119 commands and 15 models**.
- **The witness was the process tree.** The SDK's query is a child process of
  Electron's main process, so teardown has an OS-level signature. In 2 of 6 runs
  the app answered `[]` while that CLI child was **still running** — which
  attributes the emptiness to the nulled handle without inferring it.
- **The harness was wrong first, in the direction that reads as a finding.** A
  single process sample 600ms after the write reported "engine still alive" for
  runs where the process had merely not died yet. It now polls; all 6 tear down,
  600–1456ms. #104's landmine, one ticket later.
- **The pill's label survives the empty list** (`current` comes from
  `model-mode.ts`, not the engine), which is why the UI looks correct at exactly
  the moment it stops working.
- **`gui-52`'s red is now doubtful and was deliberately not chased.** The CLI
  answers 15 models here, and `chat:target` is a fourth `discardEngine` caller.
  Recorded as a hypothesis in #112's out-of-scope; `gui-52` was **not** run.
- `gui-75` and `gui-52` still carry standing environmental reds. Reproduce solo
  on clean `main` before treating either as a regression.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-an-empty-list-is-attributed-not-observed]]
