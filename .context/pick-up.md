---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Queue empty

**The `ready-for-agent` queue is empty and nothing is half-done.** No branches open, nothing blocked, nothing stuck `ready-for-human`. The only open issue is the unlabelled umbrella **#1**, which is not a queued ticket.

The next effort is a choice: `/preset init` or grill-me → `/hp` → to-spec → to-tickets, or pick from **Deferred** in [[active-work]]. The sharpest new candidate is the **`sdk-cli` noise** described under Open questions — it is the one thing this session knowingly left worse.

## What landed this leg

Four unticketed changes, one commit on main. Three were owner-asked; the fourth is a bug the first one exposed.

1. **The sessions rail scopes to the open project.** `groupSessions` gained an opt-in `scope`, `Sidebar` defaults it to `'project'` (persisted, `sidebar-scope`), chips `This project` / `All projects` sit under the filter, and a scoped-empty project gets its own state with a way out. Scoping runs **before** the 100-row cap.
2. **Default zoom 1.1 → 1.25**, with the storage key versioned to `zoom-level-v2` — without that the bump is invisible to anyone who has already run the app.
3. **The composer stopped becoming a lozenge.** `.input-pill` pinned from `--r-pill` to `24px`.
4. **The app can list its own sessions at all** — the real find, below.

Gate: typecheck clean, build clean, **743 tests green across 53 files** (+18 this leg), GUI driver green, every new behaviour mutation-verified.

## The bug worth remembering

The owner opened a fresh folder, chatted, and the rail said "No sessions in this project yet". It looked like the new scope filter had eaten the live session. It had not.

`session-store.ts` passed `includeProgrammatic: false`. The SDK decides "programmatic" from the transcript's `entrypoint` field against `{sdk-cli, sdk-ts, sdk-py}`, and **this app writes `sdk-ts`** — so the wrapper had never once been able to list a conversation it authored. Measured on the owner's store: **560 rows vs 672**, delta exactly 75 `sdk-cli` + 37 `sdk-ts`.

Two days invisible, because the unscoped rail was always full of terminal sessions from 37 other projects. **Scoping the rail is what made it legible.** Rationale, the pin argument and the accepted cost: [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]].

The transferable lesson: the first two hypotheses (cwd-less session, not-yet-written file) were both wrong and both would have been "fixed" by weakening the new filter. One probe against the real data source — the SDK, with the flag both ways, on the exact session id from the screenshot — separated them in a minute.

## Landmines most likely to bite next

Full ledger in [[active-work]]. The new ones:

- **Nothing pins the `includeProgrammatic` argument, on purpose.** `true` is the SDK's default, so an argument pin would fire on a no-op call. `tests/session-store-live.test.ts` pins the behaviour instead — it mocks **nothing** and builds a real store under `CLAUDE_CONFIG_DIR` (which it must save and restore, or later suites in the worker follow it into a deleted temp dir). Setting the flag to `false` reddens that file and only that file; deleting the key reddens nothing, deliberately.
- **Listing and resolution have different filters.** `resolveSessionDir` reads real directory names with no SDK filter, so a session being resumable is not evidence it is listable.
- **The session you are in is a clickable row now** — `useChat.openSession` needs its same-id guard or a click re-adopts the live session over a still-being-written transcript.
- **`--r-pill` on anything that grows is a latent lozenge.** 999px clamps to half the shorter side, so it is invisible at rest and only wrong when tall.
- **A persisted pref outranks the default it came from.** Bump `zoom-level-v2` again on the next default change.
- **`sed -i` flips a `src/` file to LF.** Use `Edit` for mutations, or re-normalise. A script importing a project dep must also live under the project tree.
- **The `@import` order in `styles.css` IS the cascade** — `tokens` → `base` → `shared` first, in that order. Reordering restyles the app with no error and no failing test.
- **`tests/scrollbar.test.ts` scans comments too** — writing a scrollbar pseudo-element in prose reddens it.
- **`tests/multiline-composer.test.tsx` slices raw CSS** from `.bubble {` / `.message-input {` / `.input-pill {` to the next `}`. Those selectors stay ungrouped and no comment inside may contain a closing brace.
- **`src/` is CRLF, `.context/*.md` is LF.** A whole-file `Write` to a stylesheet flips it silently.
- **Pins are mutation-verified; never fix a red pin by editing its expectation.** The one legitimate shape is a ticket that reverses the contract the pin describes, named and replaced by a **stronger** pin, argued in the ADR before the edit — which is exactly what `session-store.test.ts:81` was.
- **`gui-45.mjs` is STALE and fails on `main`** (`no foreign row was disabled`). Pre-existing; do not "fix" the app for it.
- Never hardcode a model name; the app runs the HOST `claude` when PATH has one.
- Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) — keep driver temp cwds away.

## Baseline

`main` = the styles split (`3223127`) + this leg's commit. **Not pushed.** No open branches. Trust `git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/gui-scope-zoom-pill.mjs` covers all three UI changes in one run (rail scope both ways, composer resting vs grown with the radius measured, screenshots). Plus `driver.mjs [--cycle]` for the titlebar pills and `gui-42/47/48/49/51/52/54/55/61/62/63`. All need `npm run build` + `npm i --no-save playwright-core`.

Expect **100 rows / 1 group** scoped in this repo (the cap engages here now) and **16 groups** on All projects. Both numbers moved this leg because of the listing fix.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — this leg
- [[2026-07-28-session-metadata-is-the-sdks-job]] — the ADR it reverses one line of
- [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] — the pin-retirement bar it had to clear
- [[2026-07-30-the-import-order-is-the-cascade]] · [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]]
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] · [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]]
