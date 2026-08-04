---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 9 (`relay-leg`)_
_At commit: `88ddf19` on `main`, pushed and level with `origin/main`_

## Current focus

**#106 landed and closed — a real `src/` fix, unlike the two legs before it.** A
clipboard image whose file has moved, been deleted or been locked between the
copy and the paste fails to read; the composer flattened that to `data: ''`, and
the policy — having no vocabulary for a failed read — judged it as a wrong media
type, printing *"image/png can't be embedded — only PNG, JPEG, GIF and WebP
images can"*. The read now resolves to `null` and the composer pushes its own
rejection. Next frontier is **#107**, the batch's only data-loss defect.

## State

- **In flight:** nothing. Ticket branch squash-merged and deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #106 as `88ddf19` — `InputBar.tsx` the only `src/` file
  touched, three tests added.
- **Gate:** typecheck clean; **998 tests across 64 files** green (995 + 3);
  build clean.
- **Queue:** six open, #107 through #112, all `ready-for-agent`; none
  `ready-for-human`. #107's live `blocked_by` is 0.
- **Blocked:** nothing.

## Pick up here

Take **#107** after re-running the frontier query. It is the batch's **only
data-loss ticket**: the rail can delete the session a turn is streaming into,
during that session's first turn, destroying a transcript as it is written.

The rail refuses the delete with `disabled={active && busy}` (`Sidebar.tsx:215`),
where `active` is `s.id === activeId` and `activeId` is `useChat`'s
`activeSessionId` — **written only at `turn-end`** (`useChat.ts:241`) and on
engine-terminal (`:283`). During the first turn of a fresh conversation the
renderer does not yet know the id it is streaming into, so the row is **not
active** and its trash button is enabled. Main declines to re-decide it
(`index.ts:449-452`), and `session-store.ts:70` passes `includeProgrammatic:
true`, so the live session really is listed.

Remedy per the ticket: make the busy refusal **authoritative in main** — refuse
`'failed'` in the `session:delete` handler when `engine?.isBusy()` and
`engine.sessionId() === id`. Update `index.ts`'s "second busy source" comment to
say why this is not the thing it rejects, or the next reader re-derives the old
conclusion.

## Skills for next session

- `superpowers:test-driven-development` — #107 specifies its assertions up front,
  including two that must both hold.
- `superpowers:verification-before-completion` — full test/typecheck/build gate
  before landing.

## Open questions

None for #107; the ticket states its remedy and its landmines.
`ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- **A failure flattened into a value gets judged as one.** #106's `''` was a
  value of the *success* type, so it collided with a legitimate meaning ("this
  candidate carries no bytes") and fell out of the embed branch into a catch-all
  that was never wrong for the case it was written for — **the wrong case
  reached it**. The error path belongs to whoever observed the error.
- **The instrument had to fail selectively.** jsdom's `FileReader` always
  succeeds, so the failure was installed by name. A stub that fails everything
  cannot show that an unreadable sibling costs a readable one nothing.
- **Two halves of a fix fail differently, so both were mutated.** Restoring
  `.catch(() => '')` reds with the contradictory sentence; dropping the pushed
  rejection reds on the `waitFor` with nothing rendering. One mutation proves one
  half.
- **The premise was reproduced before it was fixed** — fourth consecutive leg.
  #107's premise is a code-path claim, so read `Sidebar.tsx`, `useChat.ts` and
  `index.ts` at the cited lines before writing anything.
- `gui-75` and `gui-52` still carry standing environmental reds; `gui-52`'s is
  additionally **doubtful** since #105 measured the CLI returning 15 models.
  Reproduce solo on clean `main` before treating either as a regression.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-a-failure-flattened-into-a-value-is-judged-as-one]]
