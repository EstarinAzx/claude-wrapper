---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5 (auto), autonomous `/preset vibe init` run_
_At commit: uncommitted — `.context/` + `.claude/` only, no `src/` change_

## Current focus

**A fresh two-ticket queue, both spikes.** The owner filed two asks in one
sentence before going to sleep — `@` file references in the composer, and "an
option to enable permanent acrylic or something that doesn't flatten when
unfocused" — and an autonomous grill turned them into **spec #115** with
**#116** and **#117** under it. Neither is a build ticket, deliberately: in both
cases the fact that decides the build's shape is unmeasured, and *build only if
measured* forbids speccing past that.

## State

- **In flight:** nothing. No `src/` file was touched this session.
- **Done this session:** filed #115 (spec), #116 (`@` reachability spike), #117
  (win32 backdrop route sweep). Rewrote `.claude/relay-leg.md` for the new
  queue. Archived the previous run to `.claude/vibe-98-110.md` and wrote a fresh
  `.claude/vibe.md`. Appended two MVD sections to `happy-path.md`.
- **Gate:** not re-run — nothing under `src/`, `tests/` or `package.json` moved.
  Baseline on `main` remains **1044 tests / 70 files**; read it from `main`.
- **Queue:** #116 and #117, both `ready-for-agent`, neither blocked.
- **Blocked:** nothing. Six owner calls are parked on #115 but block no ticket.

## Pick up here

Take **#116** (lower number, and neither blocks the other). Read the ticket, its
parent **#115**, and `.claude/vibe.md` — that file holds every question, the
grepped warrant behind each answer, and the refutations that changed the work.

**#116 and #117 are SPIKES and must stay spikes**: harness/sweep, findings,
recommendation, `git diff --stat -- src/` empty. Each ends by filing its own
build ticket with a decided shape, or declining it and saying why. Killing its
own premise is a successful outcome.

## Skills for next session

- `superpowers:verification-before-completion` — both tickets are spikes; every
  claim must name the run it came from.

## Open questions

Six, all parked on **#115**, all reversible, none blocking a ticket: whether Mica
actually survives blur · whether the flip is now worth a dependency · the `@`
trigger-window rule · cursor-insert vs replace · what the `@` list excludes and
whether it is capped · whether an accepted `@` reference joins the 10-slot
attachment tray. **A leg that needs one of these should say so on the ticket and
stop, not guess.**

`ready-for-human` is **allowed** this queue — the owner is asleep, not away, so a
ticket parked overnight is answered in hours. This differs from the 2026-08-04
batch on purpose.

## Recent context

- **A declared wire type is not a callable route.** `file_suggestions` is
  declared in `sdk.d.ts` and sits in the `SDKControlRequestInner` union, but that
  union is **direction-agnostic**. The bundle this app imports (`sdk.mjs`) has
  **zero** occurrences of it; only `bridge.mjs` implements it, **inbound**. The
  SDK answers that request, it does not send it.
- **An absent method name is not an absent route** — #88 records
  `mcpServerStatus()` implemented over a generic subtype dispatcher. Both spikes
  must **probe by calling** (#90's lesson).
- **Nothing in `src/main/` enumerates the open workspace.** `@` is a new
  main-side surface with a new trust boundary, not a reskin of the `/` popover.
- **`--disable-gpu` is not why a driver cannot judge acrylic** — `gui-69.mjs`
  launches *without* it; the reason is DWM compositing. And producing an
  honestly-unfocused window under automation is itself unsolved (#75).
- **"Mica doesn't flatten" is not established by the record** — only by the app's
  own copy and the ADR it came from. Do not assert it.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[happy-path]]
- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]]
