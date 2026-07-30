---
type: active-work
project: claude-wrapper
updated: 2026-07-30
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-30 by Opus 5 (1M) (auto) — relay leg 5: #63 landed, spec #58 closed_
_At commit: `e2e848c` + this `.context` commit; `main` is **pushed** and in sync with `origin/main`_
_Gate at #63: typecheck clean, build clean, **725 tests green across 52 files** (698 + 27 new), `gui-63.mjs` verified red-then-green_

## Current focus

**Nothing in flight. The `ready-for-agent` queue is empty.**

Spec **#58 — the non-lossy tool inspector — is delivered and closed**, drained one ticket per relay leg: #59 (replay text-block joining), #60 (the store's three silent failures), #61 (output disclosure), #62 (input inspector), #63 (Edit hunk diff). A tool card no longer destroys its own evidence in any direction — the complete result is retained in state, every argument the call was made with is reachable, and an Edit shows what it actually changed.

The next session picks new work rather than continuing a queue. **Deferred** below is the standing menu.

## State

- **In flight:** nothing. Branch merged and deleted; `main` pushed.
- **Landed this leg:** **#63** (`e2e848c`) — new pure module `src/renderer/src/lineDiff.ts` (suffix-LCS matrix in a `Uint32Array`, forward walk, hard guard at `DIFF_CELL_GUARD = 1_000_000` cells falling back to `{ kind: 'unaligned', before, after }`), plus the card's **third** disclosure region and third boolean (`changeOpen`). Pending renders the diff outright; the result state hides it behind `.tool-card-toggle--change` ("Show diff" / "Show content"). Write gets a **labelled content preview and never a diff**. 27 new tests; the named mutation (remove the guard) kills 2, dropping the conditional mount kills 4 including #62's existing collapsed-inspector pin, and flipping the walk's `>=` tie-break kills 3.
- **Also this leg:** the coalescing pass the spec sketched was **deleted** — mutating it killed nothing, and it turned out to be provably unreachable. See [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]].
- **Queue (`ready-for-agent`):** **empty**, verified after both closes settled.
- **Blocked:** nothing.
- **Open:** the unlabelled umbrella **#1**. Nothing else.

## Pick up here

There is no queued ticket. Start a new effort:

- `/preset init` or grill-me → `/hp` → to-spec → to-tickets for a fresh idea, or
- pick from **Deferred** below — it is ranked by nothing, so it needs a real selection pass (the last two specs were chosen by measuring a real corpus first, which is why they held up).

Whatever is chosen, the conventions are unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green before merge, `.context/` commits on main only.

## Skills for next session

- superpowers:brainstorming — the queue is empty, so the next move is a choice, not an implementation
- `/preset init` / grill-me — the last two specs earned their scope by being grilled and measured before any code

## Open questions

None blocking. One deferred owner decision is recorded in #58's Out of Scope: whether an honest Write diff is wanted at permission time only, or also after an auto-run and in replay. It gated nothing in #59–#63 and is still open.

## Recent context

- **#63's real find was a dead code path, not a feature.** The spec and the ticket both described "coalescing of adjacent runs" as part of the ~45-line utility. It was implemented, and mutating it away killed **zero** tests. The rule says a mutation that kills nothing means the mutated code may not be what makes the tests pass — and applied honestly that cuts both ways. Here the code was decoration: the walk provably cannot interleave, and an exhaustive 212,162-pair search agreed. The wrong response would have been to add a test covering the surviving mutant; that test passes under both implementations and would have frozen ~12 dead lines in place forever.
- **The diff renders lines as blocks inside a `<pre>`, and the sigil is part of the text.** `+`/`-` live in the line's own text content rather than in a `::before`, so the side a line is on survives a screenshot, a copy-paste, and a reader that announces text without style. Colour is the second signal, never the only one — `gui-63.mjs` asserts add, delete and context resolve to three *different* computed colours, which is the one thing jsdom cannot answer at all.
- **The Write card's danger is that its failure looks correct.** A fabricated Write diff renders as clean green added lines and reads as authoritative; nothing about it looks wrong in a screenshot. So the driver asserts the Write card mounts **zero** diff-line elements, and the vitest suite asserts the same — the honest answer here is provable absence, not a plausible-looking presence.
- **Detection is by argument shape, not by tool name.** `old_string` + `new_string` → a diff; `content` → a preview. The two strings *are* what makes an honest diff possible, so the shape is the real contract and a tool rename cannot silently disable the feature.
- **#62's real cost was a selector shadow, not the feature.** Adding a second control broke nothing in vitest — the suite queries by role and accessible name — but `gui-61.mjs` selected the bare `.tool-card-toggle`, which then matched the input button first. #63's control was named twice over from the start (`--change` modifier class plus an accessible name outside the `TOGGLE` regex) precisely because of that.
- **#61's collapsed/expanded pair is the mechanism check for all three regions now.** The original `tool-result fills the card with a one-line summary` test has passed unchanged through #61, #62 and #63 — every diff on `tests/toolcards.test.tsx` across the three is additions only. Nothing was ever retired.
- **Retention had to be asserted at STATE level, not through the DOM.** A collapsed card can only ever show what it chose to show, so a summarise-on-write regression is invisible to a rendering test until someone expands.
- **jsdom is blind to CSS, so every visual ticket in this spec needed a driver**, and each was run red-first against a build without its feature. A green driver that has never been seen red proves nothing.
- Two independent brainstorms (different models, no shared context) ranked the tool inspector **first** out of nine and ten candidates. Convergence chose it; **measurement** justified it — the corpus figures were gathered before committing, precisely because two models agreeing can mean two models sharing a blind spot.
- The design was adversarially reviewed and the reviewer **reversed itself twice**: it dropped a `diff` dependency it had recommended once its own scoping removed the justification, and withdrew a claimed test-pin retirement once the conditional-mount mechanism made the retirement unnecessary.
- The safety framing was **downgraded deliberately**. See [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]].

## Landmines (carried forward)

- **NEW — a mutation that kills nothing may be telling you the CODE is dead**, not that the test is weak. Ask why before writing an assertion to cover it: an assertion that passes under both implementations freezes dead code in place and makes it permanently mutation-immune. #63's coalescing pass is the worked example.
- **NEW — never render a Write diff.** Write supplies only path + content, no before-state. Green added lines conceal what was overwritten and manufacture confidence at the deciding moment. Labelled content preview only, and the guard is an assertion of **absence** (zero diff-line elements), because the fabricated version looks entirely correct.
- **NEW — the card now carries THREE disclosure booleans**, one per region: `expanded` (output, gated on `hasHiddenOutput`), `inputOpen` (input, gated on having arguments), `changeOpen` (diff/preview, gated on the call carrying the strings). A pending card renders input and change outright with no toggle. Merging any two re-arms a control on cards that hide nothing, which is the whole basis of the affordances being trustworthy.
- **NEW — a fourth control on the tool card must be named twice over.** A `.tool-card-toggle--<what>` modifier class, because the GUI drivers select by class and the bare `.tool-card-toggle` matches whichever button renders first; **and** an accessible name outside `tests/toolcards.test.tsx`'s `TOGGLE` regex (`/^(Show|Hide) (output|error)$/`) and distinct from `Show input` / `Show diff` / `Show content`. Both failures are silent — the suite passes either way.
- **NEW — `lineDiff`'s `>=` tie-break is load-bearing.** It is what keeps removals ahead of additions in a run; flipping it to `>` reorders every evenly-matched hunk and reddens three tests. There is no coalescing pass to fall back on, by design.
- **NEW — never `split('\n')` in the diff path either.** `splitLines` treats empty text as zero lines and a trailing newline as a terminator; plain `split` invents a line on both counts, and on the empty side it invents an *edit*.
- **`[]` and `null` mean different things on both store channels.** `listSessions` and `loadTranscript` answer `null` for a FAILED read and `[]` for an honest nothing. `?? []` at a new call site silently restores the exact bug #60 removed. The one deliberate `?? []` is in `titleHint`, commented as such.
- **Never cache a failed index build.** `build()` returns `null` on an unreadable root and `resolveSessionDir` must not install it — an empty index is indistinguishable from an empty store.
- **Live-tail's failed-read guard is `continue`, never `break`, and never an unguarded throw.** The test that can catch this is `a failed read does not swallow the re-run queued behind it`; the "keeps the pane" assertion cannot.
- **A failure notice must retire when the thing it warns about arrives.** The reload's apply branch clears it.
- **The mutation harness must normalise CRLF.** Source files are CRLF; anchors written with `\n` match **zero** times, and a zero-match anchor reads exactly like a surviving mutation. Anchored `Edit` calls sidestep the whole class and are what the last three legs used.
- **Never summarise a tool result on the way into state.** `toChatMessage` and the `tool-result` handler both store `result` **complete**; `ToolCard` calls `resultSummary` at render. Re-introducing the call at either write point is invisible to every rendering test.
- **The collapsed tool-card test is a mechanism check and is now half of a pair.** Detail must stay **conditionally mounted** — a CSS-hidden body or a closed `<details>` leaves the text in `textContent` and turns the collapsed half red, correctly.
- **`resultSummary` runs on the COMPLETE result, on every render.** Never `text.split('\n')` in it: results reach 92 KB. Skip leading whitespace **before** measuring the 120-char cap.
- **`inputEntries` sorts, and the sort is load-bearing** — live and replayed objects need not share insertion order.
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** It restores from HEAD and takes your unstaged edits with it. Commit the ticket work first, then mutate, and reverse the mutation with the same anchored replace that applied it.
- **`gh` infers the repo from the working directory.** `cd`-ing out of the clone makes `gh issue create` fail with `no git remotes found`.
- **#57's watcher is epoch-fenced, and the fence is the whole safety argument.** A `handle !== null` check is NOT equivalent.
- **`fs.watch` throws SYNCHRONOUSLY** on ENOENT/EPERM, and the directory comes from a *cached* index. main calls the watcher as a bare `void`, so an escaping rejection kills the main process. The construction is wrapped; never unwrap it.
- **A reload's staleness re-check must not orphan the queued re-run.**
- **Never read `messagesRef` inside the reload loop.** Compare against what the loop itself applied (`paneLength`).
- **Live-tail is for a session you are WATCHING, never one you are DRIVING.** Adopt sets eligibility; send and new-chat clear it.
- **Pins are mutation-verified. Never "fix" a red pin by editing its expectation.** The legitimate-retirement allowance (#42, #45, #47) is **spent**; any other red pin means the change is wrong.
- **A green test can be green for the wrong reason.** Assert the mechanism — a fetch count, a read that must not happen, a call ORDER — not a symptom with more than one cause. **A one-element fixture cannot distinguish a separator** (#59); when a test is about how N things combine, N must be ≥ 2. For a diff that means a hunk with more than one changed line.
- **A session id is only resumable once a turn has run** (#54).
- **Never re-derive a store path from `cwd`.** Location is `resolveSessionDir`; `cwdKey()` is comparison and grouping only.
- **Never call `window.api.pickFolder` outside `Welcome`.** The chooser is `chooseFolder`; the transition is `switchWorkspace`.
- **Never clear the pane with `newChat()` on a switch path.** Use `adoptSession(id)` — it is also what arms live-tail.
- **Do not add a second busy flag,** and do not disable a foreign row or "Open project" while busy.
- **Never un-key the composer.** `<InputBar key={cwd}>` is the entire draft / tray / autocomplete reset.
- **`pendingInsert` must be cleared in the same commit as the cwd change.**
- **Anything workspace-scoped added to App state must join the `ok` branch** of `switchWorkspace`.
- **Do not rebuild the storage index inside `listSessions`,** and do not restore `messageCount`.
- **Never re-add `customTitle ?? summary`.**
- **#49 specifics:** never enrich a row that has not rendered, never derive a label during filtering, never fold enrichment onto `session:transcript`.
- **#50: never match CLI markup mid-string.** `sanitizeUserText` dispatches on the **leading tag of the trimmed message**. Do not strip ANSI from typed text — a real recorded argument is `fable[1m]`.
- **#51: never scope a scrollbar rule to a component**, and never add `scrollbar-width` / `scrollbar-color`. `.tool-card-output`, `.tool-card-input`, `.tool-card-diff-body` and `.tool-card-content-body` all inherit the global rule — do not give any of them their own.
- **Never write a literal ESC byte or a `\u` escape into source.** `CSI` uses `String.fromCharCode(27)`.
- **A session fixture with no `cwd` is a foreign row.** An in-project row must set `cwd: FOLDER`.
- **New `window.api` channel → ALL FOUR mock sites**, and guard every IPC with `isTrustedIpc`. **#59–#63 added none.**
- **A module-level cache needs a test reset.** The watcher's reset must bump the epoch, not only close the handle.
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, and it needs `stat` now.
- **Never add a resize effect to `InputBar`** — height is CSS (`field-sizing: content`).
- **Never hardcode a model name anywhere.** Two tests pin the **absence** of a list-building surface.
- **Never merge `picked` and `reported` in `model-mode.ts`.** A resolved id in `options.model` is the #23 hang, surfacing on the *next* engine rebuild.
- **A model report is delivered by injected callback, not an `EngineEvent`.**
- **Wisp `options.model`: the CLI shadows the FAMILIES, the bridge resolves the ALIASES.** Never run bare `wisp snapshot` — always name the family.
- **The app runs the HOST `claude` when PATH has one** (`cli-path.ts`), falling back to the bundled copy. A host Claude Code update can break the app with no code change here.
- **`gh issue close --comment` silently drops the comment if the issue is already closed** — a pushed `Closes #N` auto-closes it first. A standalone `gh issue comment` still lands on a closed issue. **`gh issue list` lags a close by seconds**, and so does `issue_dependencies_summary` — re-query before believing either.
- **The Bash tool is not PowerShell** — heredoc, never a PowerShell here-string. **Source files are CRLF** while `.context/*.md` are LF.
- **A mutation harness must assert its anchor matched exactly once.** A bad anchor and an uncaught mutation look identical.

## Known issues / not-our-bug

- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Not our bug — don't point a GUI driver's temp cwd there.
- **GUI driver traps:** `--disable-gpu` flattens acrylic; measure in the DOM, never off screenshots; dispatch clicks via `page.evaluate(() => el.click())`; arm a hard `setTimeout(process.exit)` before awaiting `app.close()`; never re-read an element after an action that may not have happened; **count the side effect you care about**; pass any path as an **argument** to `app.evaluate`; stub `dialog.showOpenDialog` in main before any click that opens one; and **select controls by their modifier class**, since the card now carries three.
- **Driver trick (gui-63):** two seeded tool calls in one transcript give two cards in one run, so an Edit and a Write can be compared side by side — and the Write assertion is one of **absence** (zero diff-line elements), because the failure it guards against looks correct.
- **Driver trick (gui-62):** a seeded `tool_use` alone is enough to put a card with a rich **input** on screen. Assert the argument count the driver *expected* against the labels actually rendered.
- **Driver trick (gui-61):** the same seed carries a **tool call** — an `assistant` line with a `tool_use` block plus a `user` line with a matching `tool_result`. Screenshot **at the moment under test**, not only in `finish()`.
- **Driver trick (gui-55):** a terminal-shaped session can be seeded straight into the native store and the SDK lists it. Clean up the seeded store dir on every exit path.
- **jsdom is blind to CSS, so a visual ticket needs a driver.** Nothing in vitest can see whether a control is visible, whether a region is height-capped and scrolling, or whether two class names resolve to different colours. Run the driver against a build **without** the feature first, or its green proves nothing.

## Deferred (still no spec)

**Deferred by #58, with reasons on record:** honest whole-file **Write diff** in every form (needs a pre-write baseline the event contract lacks; checkpoint records point at backup files, not before-content); **per-tool rich card bodies** (TodoWrite checklist, Grep hit list, Read slice — each couples to one tool's schema); **permission-mode default or persistence** (would make approval reachable by default, but reverses a recorded owner choice); **adopting the SDK's richer permission metadata** (`title`, `displayName`, `description`, `blockedPath`, `decisionReason`, `suggestions` — all currently dropped by the engine, and a real reason permission cards read as generic); a **wrapper-owned truncation cap**; a **diff dependency**; **syntax highlighting inside diffs**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a collapsed strip (`thinking_delta` is dropped; only `text_delta` is forwarded, so a reasoning phase reads as a hang); **native turn-end notifications + taskbar flash** (zero `Notification`/`flashFrame` in `src/`); **type-while-busy composer** then queued send (the textarea is `disabled={busy}` for the whole turn); **one-click restart on `terminalError`**; **turn pulse** from the dropped `tool_progress` / `status` / rate-limit telemetry; **MCP + settings-parse health** surfacing.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the **watch-installed-after-the-read gap** (both demand-driven — a `ponytail:` comment names the fix; do not start on principle). Plus context-pressure meter (`Query.getContextUsage()` exists but a naïve percentage lies — it must separate the raw window from the auto-compaction threshold), typed failed-turn recovery (`rewindFiles()` needs `enableFileCheckpointing`, which our options do not set), full-text transcript search, **session rename / delete / archive** (the SDK exports `renameSession`, `deleteSession` and `forkSession`), drag-and-drop, replay thumbnails, N-concurrent engines, **fork-on-resume**, busy-switch detach (decided against — block is the behaviour), folding `Welcome`'s last `pickFolder` caller onto the chooser, agent archive / control / map pan-zoom, and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — #63's dead coalescing pass, and the reflex it closes
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] — #63's spine
- [[2026-07-30-two-disclosures-two-booleans]] — #62's second card boolean, extended to a third by #63
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]] ·
  [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] ·
  [[2026-07-28-sanitizing-replay-markup-is-an-anchor-not-a-strip]] ·
  [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] ·
  [[2026-07-28-choosing-a-folder-is-not-changing-workspace]] ·
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]] ·
  [[2026-07-28-composer-height-is-css-not-state]] ·
  [[2026-07-27-slash-commands-are-a-dumb-pipe]] ·
  [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-in-app-permission-mode-toggle]] ·
  [[2026-07-23-busy-switch-block-not-detach]]
