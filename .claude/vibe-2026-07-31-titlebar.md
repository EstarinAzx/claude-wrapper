---
target: init
idea: "Two candidates carried from #64's batch, both self-contained: (1) decide Tailwind's fate — nothing in the app uses a utility class, eight specs after the 2026-07-23 ADR promised they would; either adopt utilities deliberately or drop two devDependencies and the vite plugin and inline @theme into :root. (2) The titlebar is crowded — app name + session title + two pills + three dock buttons + three window controls, each button eating drag region; flagged for an impeccable pass and deferred through the whole batch."
partner: opus
pressure: codex/gpt-5.6-sol
pressure_via: sonnet
max_defer: 12
phase: fired
halted: false
---

## Decisions

- Pins are sacred; a titlebar restructure may not rename or drop a pinned class or aria-label, and no pin may be retired to fit — warrant: "across 52 test files (725 tests) and 5 `gui-*.mjs` drivers, and the pin-retirement allowance is" @ .context/decisions/2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system.md · pressure: STANDS
- MEASURED, not cited — the "each button eating drag region" clause of the crowding complaint is FALSE. Titlebar dead (no-drag) width is CONSTANT at 344.3css and does not grow; draggable share falls 73.1% -> 50% only because the window shrinks around it, and the widest uninterrupted grab strip is still 182css at a 688css page. Drag region is not the defect.
- MEASURED — the real defect is that `.session-title` cannot truncate. It is an inline `<span>` with `white-space: nowrap` and no `max-width`, no `overflow`, no `text-overflow`; `.titlebar-center` is `position:absolute; left:50%; translateX(-50%); pointer-events:none`, i.e. out of flow. A long name grows symmetrically from centre and slides UNDER the pills and dock buttons. Collision thresholds by page width: 1280css -> 111 chars · 1024css -> 72 · 819css -> 41 · **688css -> 21 chars**.
- `.session-title` is the ONLY title-ish element in the app absent from the 13-selector truncation triad in `styles/shared.css` (`.session-row-title`, `.agent-row-type`, `.command-row-name`, ... all have it). Adding truncation is therefore a consistency fix, not a design change.

- Order between the two candidates: do the titlebar work NOW, do not gate it on the Tailwind decision — warrant: "making a reversible feature wait on an irreversible cleanup is backwards" @ .context/decisions/2026-07-31-a-theme-is-a-re-hue-not-a-re-design.md · pressure: REFUTED then OVERTURNED (Pressure argued the titlebar is the natural test case for the utilities premise, so Tailwind must wait for it; the record only forbids gating the feature on the cleanup, which points the same practical way. Pressure's observation survives as a note on the deferred call, not as an ordering constraint.)
- No "measure it first" ticket for Tailwind. Both agents agree no measurement can answer a taste call — warrant: "That is eyeballed in a real window, never a driver screenshot" @ .context/decisions/2026-07-31-a-theme-is-a-re-hue-not-a-re-design.md · pressure: STANDS (this was Pressure's own objection, and it was right)
- If Tailwind is ever dropped, the theme override's guarantee degrades from order-proof to order-dependent: `:root` and `[data-theme=…]` are both unlayered and both (0,1,0), so source order alone decides. `tests/theme.test.ts` already pins the import position, so it still works — but that pin silently becomes the whole safety argument. Raised by pressure, confirmed against the record, and written back into [[active-work]] as an amendment.

## Needs you

- [ ] **Tailwind's fate — adopt utilities, drop it, or keep it as a token store?**
      took: KEEP AS-IS (no change, zero diff)
      alt: drop two devDependencies + the vite plugin and inline `@theme` into `:root`; or deliberately adopt utilities for new UI
      why: Partner DEFERred — no warrant exists. The record is explicit that you personally overrode a YAGNI push-back to install it, on the stated grounds the app "will evolve" and you wanted utilities from day one. Reversing your own override while you sleep is not a call an agent gets to make. Pressure adds a live argument: the titlebar work is the last natural test of the utilities premise, so decide this AFTER #72 lands, not before.
      reversible: yes
- [ ] **Which of the titlebar's 8 buttons should leave or move?**
      took: NONE — #72 fixes the measured defect and changes no control
      alt: relocate the two pills, drop the app name, or move a dock toggle out
      why: Partner DEFERred; pure taste. And the stated rationale for the complaint ("each button eating drag region") is now measured and false, so the remaining case for removing a control is aesthetic, which is yours.
      reversible: yes
- [ ] **Should the three dock toggles (Commands / Agents / Appearance) collapse into one control?**
      took: NO — leave all three
      alt: one menu, or one segmented switcher, given the docks are already mutually exclusive
      why: Partner DEFERred. Also constrained: #66 pins the dock to no `input`/`select`, and #69 pins every `role="radio"` in the Appearance panel as a backdrop, so a collapsed control has a narrow role budget before it reddens an existing pin.
      reversible: yes
- [ ] **#72 centres the session title in the space available, not in the window — ~15css off true centre.**
      took: in-flow flex centring (never overlaps at any width, no magic number)
      alt: keep absolute centring and cap it with `max-width: calc(100% - 2 * <side>)`
      why: the alt needs a magic number equal to the wider titlebar block, which rots the moment a control is added or removed — i.e. the moment you answer either question above. Recorded in #72 as a deliberate trade.
      reversible: yes

## Log
- [boot] Fresh file. Queue verified empty (`gh issue list --state open` -> `[]`), baseline `bbe91ee` on main, pushed, no open branches.
- [boot] Destination DETECTED as GitHub: `gh auth status` logged in as EstarinAzx, remote `origin` -> EstarinAzx/claude-wrapper.
- [boot] `.context/` present (7 files + 55 decisions) -> no /context-init offer. `docs/agents/` present -> no /setup-matt-pocock-skills offer.
- [boot] Pressure resolved by rule 3 (first non-Claude family in live `wisp routing`): sonnet -> codex/gpt-5.6-sol. No slot rebind owed.
- [round 1] Partner answered 3 of 7 and DEFERred 4 — including both headline questions (Tailwind's fate, what leaves the titlebar). All 3 warrants grepped clean; nothing invented.
- [round 1] Pressure refuted 3 of 4. Two refutations were CORRECT and changed the plan: the cascade guarantee really does degrade if Tailwind goes, and a "measure it first" ticket really would have been theatre for a taste question. Dropped the Tailwind-measurement ticket on Pressure's objection.
- [probe] Measured the titlebar rather than trusting the complaint. Falsified its stated rationale (drag region is fine) and surfaced an unrelated real defect (the session title cannot truncate). Probe was throwaway and is deleted; #72 specifies a permanent `gui-72.mjs` in its place.
- [round 2] One rebuttal round only, per protocol. All 4 warrants grepped clean. Partner conceded R3 to Pressure and overturned R2 with a citation.
- [tickets] Deviated from the target's steps 6-7 deliberately: skipped `/hp` and `/to-spec`. The funnel converged on a single 6-line CSS defect fix; a golden-path MVD and a PRD for that is the ceremony ponytail exists to prevent. Went straight to one ticket. Recorded here rather than done silently.
- [fired] #72 filed `ready-for-agent`. 4 deferrals, all reversible, none touching schema/API/money/deletion/auth/publishing -> no halt. `/relay N=1 /preset ticket-loop` fired as the last act.
