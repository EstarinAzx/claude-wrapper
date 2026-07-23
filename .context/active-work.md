---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by Opus 4.8 (interactive session)_
_At commit: c7e06d5 on main_

## Current focus

Between features. This session did the **real-SDK manual run** (long-deferred human-gated verification) and, off the back of it, landed a **Tailwind 4 + darker-palette** change. No feature currently in flight.

## State

- **In flight:** nothing.
- **Done this session:**
  - **Manual run (real CLI login).** Verified against the live SDK: auth via CLI login resolves (folder pick → cwd → turn runs), multi-turn + session context persist, tool cards render (Glob/Bash), streaming renders (long TCP answer), visual chrome matches Frost Mono. Two findings recorded as decisions: the wrapper **inherits host permissions by design** ([[2026-07-23-permission-inherits-host]] — no Allow/Deny card fires because the host runs `bypassPermissions`), and **persistent acrylic-on-blur is deferred** ([[2026-07-23-persistent-glass-deferred]]).
  - **Tailwind 4 adopted** (`c7e06d5`, fast-forwarded to main). Tokens moved into a Tailwind `@theme` block, preflight off, legacy `:root` aliases keep component CSS unchanged; palette deepened to match the reference (wash 0.16→0.12, alpha 0.6→0.64). Gate green (typecheck, 76/76, build). See [[2026-07-23-tailwind4-tokens]]. `DESIGN.md` synced.
- **Blocked:** nothing.

## Pick up here

See [[pick-up]]. No open work ticket. Two carried-forward items: interrupt (#4) is the one manual-run spine step still unverified, and persistent-glass is a documented follow-up if the owner wants to spend a dep or switch to Mica.

## Skills for next session

- impeccable — any further visual work re-runs the loader; tokens now live in Tailwind `@theme`, `DESIGN.md` is current.
- If picking up persistent-glass: it's a main-process / native Win11 task, not impeccable. Start from [[2026-07-23-persistent-glass-deferred]].

## Open questions

- **Interrupt (#4) unverified.** Stop mid-turn → real result subtype should map to `turn-aborted` ("Cancelled"), not a red error card. Not exercised in the run (owner let turns finish). Needs a human at `npm run dev`: send a long prompt, hit Stop.
- Persistent acrylic-on-blur: native-acrylic (drag lag + native dep + undocumented API) vs Mica (loses blur-behind). Undecided; deferred.

## Recent context

- Permission card + `permission-request` event + Allow/Deny renderer all still exist and are test-pinned; they fire only when the *host* permission policy would prompt. Do not isolate the wrapper from host settings (owner rejected that).
- Tailwind utilities generate on demand only (none emitted yet — nothing uses them; infra is in place for future work). `bg-wash` / `text-mint` / `rounded-bubble` are available.
- Gate remains `npm run typecheck` + `npm test` + `npm run build`. Test count is 76.
- Not pushed. Local main is ahead of `origin/main` by 3 commits (arrow-fn refactor, error-card fix, this Tailwind commit).

## Related

- [[overview]]
- [[decisions]]
- [[pick-up]]
- [[2026-07-23-tailwind4-tokens]]
- [[2026-07-23-permission-inherits-host]]
- [[2026-07-23-persistent-glass-deferred]]
