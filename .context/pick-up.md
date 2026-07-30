---
type: pick-up
project: claude-wrapper
updated: 2026-07-30
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Queue empty

**The `ready-for-agent` queue is empty.** Verified against the tracker after both closes settled (`gh issue list` lags a close by seconds — this was re-queried).

- **#63 — Edit hunk diff — closed**, landed on main as `e2e848c`, pushed.
- **Spec #58 — non-lossy tool inspector — closed.** All five tickets delivered: #59 → #60 → #61 → #62 → #63, one per relay leg, every leg gate-green.

Nothing is blocked, nothing is stuck `ready-for-human`, nothing is in flight. The only other open issue is the **unlabelled umbrella #1**, which is not a queued ticket.

## What #63 landed

`src/renderer/src/lineDiff.ts` — a new pure module, no dependency. Suffix-LCS matrix in a `Uint32Array`, forward walk, and a hard guard at `DIFF_CELL_GUARD = 1_000_000` cells: past it the module returns `{ kind: 'unaligned', before, after }` and the card renders the exact texts rather than attempting alignment.

`ToolCard` gained its **third** disclosure region and third boolean (`changeOpen`). A pending card renders the diff outright; the result state hides it behind `.tool-card-toggle--change` ("Show diff" / "Show content"). Write gets a labelled content preview and never a diff.

**The coalescing pass the spec sketched was deleted** — mutating it killed nothing, and it turned out to be provably unreachable. See [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]].

27 new tests. Mutations verified: removing the guard kills 2, dropping the conditional mount kills 4 (including #62's existing collapsed-inspector pin), flipping the walk's `>=` tie-break kills 3, and the coalescing buffer killed 0 — which is why it is gone.

Gate at that commit: typecheck clean, build clean, **725 tests green across 51+1 files**.

## Next: choose, don't continue

There is no frontier ticket. The next session starts an effort rather than draining a queue:

- `/preset init` → grill-me → `/hp` MVD → to-spec → to-tickets for something new, or
- pick from **Deferred** in [[active-work]] — but note it is an unranked menu. The last two specs earned their scope by **measuring a real corpus before committing**, which is why they held up; a pick straight off the list has not had that.

The standing conventions are unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green before merge, `.context/` commits on main only.

## Landmines most likely to bite next

Full ledger in [[active-work]].

- **A mutation that kills nothing may mean the CODE is dead**, not that the test is weak. Ask why before adding an assertion to cover it — one that passes under both implementations freezes dead code in place permanently.
- **A fourth control on the tool card must be named twice over:** a `.tool-card-toggle--<what>` modifier class (the GUI drivers select by class, and the bare `.tool-card-toggle` matches whichever renders first) **and** an accessible name outside `tests/toolcards.test.tsx`'s `TOGGLE` regex and distinct from `Show input` / `Show diff` / `Show content`. Both failures are silent.
- **Never render a Write diff.** Write carries no before-state; the guard is an assertion of **absence**, because the fabricated version looks entirely correct.
- **Never re-summarise a tool result on the way into state.** Both write paths store it whole; `ToolCard` summarises at render. A regression there is invisible to every rendering test — assert at state level.
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** Commit the ticket work first, then mutate, and reverse it with the same anchored replace that applied it.
- Pins are mutation-verified; never "fix" a red pin by editing its expectation. The legitimate-retirement allowance is **spent**.
- Expanded regions inherit the **global** scrollbar rule. Never scope one to a component.
- Never hardcode a model name; the app runs the HOST `claude` when PATH has one.
- **The Bash tool is not PowerShell, and `src/` files are CRLF** while `.context/*.md` are LF. An anchor written with `\n` matches nothing in `src/` and reports success, which reads exactly like a passing mutation test. Anchored `Edit` calls sidestep the whole class.
- `gh issue close --comment` drops the comment on an already-closed issue, but a standalone `gh issue comment` lands fine. `gh issue list` lags a close by seconds. **`gh` infers the repo from cwd** — stay in the clone or pass `-R`.
- A long `gh issue comment --body` full of backticks dies in the shell — write it to a file and use `--body-file`.
- Fable-5 refuses turns in sensitive-looking cwds (`Downloads/*`) — keep driver temp cwds away from there.

## Baseline

`main` = `e2e848c` + this leg's `.context` commit, **pushed** to `origin/main`. Trust `git log origin/main..main` over any note.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` for the titlebar pills.

**`gui-63.mjs` is the new regression harness for the Edit diff** — it seeds one session holding an Edit with a 30-for-30 replacement and a Write, then asserts add/delete/context resolve to three *different* computed colours, the region caps at 464×320 and scrolls a 1,072px hunk, the other two disclosures do not move, and the Write card mounts **zero** diff-line elements. Verified red first against a build with the region disabled.

`gui-62.mjs` covers the input inspector, `gui-61.mjs` output disclosure, `gui-55.mjs` the live tail. Other templates: `gui-52.mjs`, `gui-54.mjs` (red-first discipline), `gui-49.mjs`, `gui-48.mjs`. All need `npm run build` + `npm i --no-save playwright-core` (currently present).

Carried driver gotchas: stub `dialog.showOpenDialog` before any click that opens one; `createRequire` for playwright-core outside the project; **pass paths as arguments to `app.evaluate`, never inside string literals**; DOM-dispatched clicks; measure in the DOM, never off screenshots; screenshot **at the moment under test**, not only at the end; never re-read an element after an action that may not have happened; clean up temp cwd and any seeded store dir after `app.close()`; **log what the driver could not drive** — silence reads as a pass; **select controls by their modifier class**, since the card now carries three; and **run it red first**, or its green proves nothing.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — #63's deleted coalescing pass
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] — #63's spine, as implemented
- [[2026-07-30-two-disclosures-two-booleans]] — extended to a third boolean by #63
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]]
