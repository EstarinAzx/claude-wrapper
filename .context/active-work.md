---
type: active-work
project: claude-wrapper
updated: 2026-07-30
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-30 by Opus 5 (1M) (auto) — `styles.css` token/dedupe refactor, no ticket_
_At commit: `a27ad00` on `main`; the refactor sits on branch **`refactor/styles-token-dedupe`**, unmerged and unpushed_
_Gate on that branch: typecheck clean, build clean, **725 tests green across 52 files**, 9 GUI drivers green, bundle-equivalence diff clean_

## Current focus

**Nothing in flight. The `ready-for-agent` queue is still empty.**

One unticketed refactor is finished and **awaiting a merge decision**: `src/renderer/src/styles.css` deduplicated in place — repeated literals promoted to `@theme` tokens, ~20 near-identical rule blocks collapsed into shared selector groups. Declarations **1159 → 968 (−16.5%)**, compiled bundle **40,082 → 35,262 B (−12%)**. No JSX touched, no test touched, no computed value changed. See [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]].

Spec **#58 — the non-lossy tool inspector — remains delivered and closed** (#59 → #60 → #61 → #62 → #63).

## State

- **In flight:** nothing. One branch open.
- **Awaiting merge:** `refactor/styles-token-dedupe` — one commit, `styles.css` only. Land with `git checkout main && git merge --squash refactor/styles-token-dedupe`, or drop the branch; nothing depends on it.
- **Landed on main this session:** `.context/` only.
- **Queue (`ready-for-agent`):** **empty**.
- **Blocked:** nothing.
- **Open:** the unlabelled umbrella **#1**. Nothing else.

## Pick up here

There is still no queued ticket. Two moves, in either order:

1. **Decide the refactor branch** — merge it or delete it. It is self-contained and reviewable as one CSS diff.
2. **Start a new effort** — `/preset init` or grill-me → `/hp` → to-spec → to-tickets, or pick from **Deferred** below (ranked by nothing; it needs a real selection pass — the last two specs were chosen by measuring a real corpus first, which is why they held up).

Conventions unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green before merge, `.context/` commits on main only.

## Open questions

- **Should Tailwind stay at all?** Now the sharp one. Nothing in the app uses a utility class — eight specs after [[2026-07-23-tailwind4-tokens]] promised "new/evolving UI uses utilities," it has never happened. Either adopt utilities deliberately for new UI, or drop two devDependencies and the vite plugin and inline `@theme` into `:root`. The refactor is neutral to both: the tokens it added are real `@theme` entries, so `ease-snap` / `font-mono` / `bg-well` / `bg-tint-3` generate today.
- One deferred owner decision from #58's Out of Scope: whether an honest Write diff is wanted at permission time only, or also after an auto-run and in replay. Gated nothing in #59–#63; still open.

## Recent context

- **The stated reason for a task can be a factual claim worth checking.** "Migrate the CSS to Tailwind, we already have it" rested on a premise that measurement killed: Tailwind was installed but **entirely unused**, so its presence argued for nothing. Checking the premise changed the shape of the work rather than its goal — the maintainability the request was actually after came from deduplication, which the literal ask would not have delivered.
- **jsdom loads no CSS, so this whole diff was invisible to 725 tests.** Their green was not evidence. Equivalence was proven by parsing both compiled bundles with every `var()` resolved and diffing effective declarations per selector: **304 before, 304 after, none added or removed**; the only 14 differences are minifier serialization, because `var()` is opaque to the optimizer and it can no longer reorder the `animation` shorthand, unquote font names, or fold `background-clip`.
- **The two bugs this refactor caused were both caused by its own comments**, and both were caught by the CSS-text tests — the one place vitest is *not* blind. Documented as landmines below.
- **A failing driver is not automatically your fault.** `gui-45` went red; rebuilding against the original file reproduced it exactly, so it is a stale driver asserting pre-#47 behaviour. Cheap to prove, and the alternative was "fixing" something that was never broken.
- Everything from #58's five legs is carried in the landmine list below; the notable one is that **a mutation that kills nothing may mean the code is dead** — #63's coalescing pass is the worked example.

## Landmines (carried forward)

- **NEW — `tests/scrollbar.test.ts` scans EVERY LINE of `styles.css` containing a scrollbar pseudo-element, comments included.** Naming `::-webkit-scrollbar` in a comment makes the scan treat that prose as a selector and the test goes red. Never group one of those selectors with a class on one line, and never write the token in a comment.
- **NEW — `tests/multiline-composer.test.tsx` slices the raw CSS from `.bubble {` / `.message-input {` to the NEXT `}`.** So those two selectors must stay **ungrouped**, and no comment inside either block may contain a closing brace — one does, and the slice ends early with the pinned declarations outside it. Both failures read as "the CSS is wrong" when the CSS is fine.
- **NEW — `styles.css` is CRLF like the rest of `src/`, while `.context/*.md` is LF.** A whole-file `Write` emits LF and silently flips the file; re-normalise after writing.
- **NEW — `.command-row-btn` is the one row button without `font: inherit`**, and it is deliberately excluded from the shared row-button group. Adding it repaints `.command-row-desc` (the only child that sets a size but no family) from the UA button font to `--font`. That is a real fix, but it is a visual change and needs its own ticket.
- **NEW — tint steps 1 and 2 differ by 0.01 alpha** (`.05` for rows and menu items, `.06` for icon buttons) for no recorded reason. Preserved as-is because a refactor may not repaint the app; collapsing them is a deliberate design call, not a cleanup.
- **A mutation that kills nothing may be telling you the CODE is dead**, not that the test is weak. An assertion that passes under both implementations freezes dead code in place and makes it permanently mutation-immune. #63's coalescing pass is the worked example.
- **Never render a Write diff.** Write supplies only path + content, no before-state. Green added lines conceal what was overwritten and manufacture confidence at the deciding moment. Labelled content preview only, and the guard is an assertion of **absence** (zero diff-line elements), because the fabricated version looks entirely correct.
- **The card carries THREE disclosure booleans**, one per region: `expanded` (output, gated on `hasHiddenOutput`), `inputOpen` (input, gated on having arguments), `changeOpen` (diff/preview, gated on the call carrying the strings). A pending card renders input and change outright with no toggle. Merging any two re-arms a control on cards that hide nothing.
- **A fourth control on the tool card must be named twice over.** A `.tool-card-toggle--<what>` modifier class, because the GUI drivers select by class and the bare `.tool-card-toggle` matches whichever button renders first; **and** an accessible name outside `tests/toolcards.test.tsx`'s `TOGGLE` regex (`/^(Show|Hide) (output|error)$/`) and distinct from `Show input` / `Show diff` / `Show content`. Both failures are silent.
- **`lineDiff`'s `>=` tie-break is load-bearing.** It keeps removals ahead of additions in a run; flipping it to `>` reorders every evenly-matched hunk and reddens three tests. There is no coalescing pass to fall back on, by design.
- **Never `split('\n')` in the diff path.** `splitLines` treats empty text as zero lines and a trailing newline as a terminator; plain `split` invents a line on both counts, and on the empty side it invents an *edit*.
- **`[]` and `null` mean different things on both store channels.** `listSessions` and `loadTranscript` answer `null` for a FAILED read and `[]` for an honest nothing. `?? []` at a new call site silently restores the exact bug #60 removed. The one deliberate `?? []` is in `titleHint`, commented as such.
- **Never cache a failed index build.** `build()` returns `null` on an unreadable root and `resolveSessionDir` must not install it.
- **Live-tail's failed-read guard is `continue`, never `break`, and never an unguarded throw.** The test that catches this is `a failed read does not swallow the re-run queued behind it`.
- **A failure notice must retire when the thing it warns about arrives.** The reload's apply branch clears it.
- **The mutation harness must normalise CRLF.** Anchors written with `\n` match **zero** times in `src/`, and a zero-match anchor reads exactly like a surviving mutation. Anchored `Edit` calls sidestep the class.
- **Never summarise a tool result on the way into state.** `toChatMessage` and the `tool-result` handler both store `result` **complete**; `ToolCard` calls `resultSummary` at render. Re-introducing the call at either write point is invisible to every rendering test.
- **The collapsed tool-card test is a mechanism check.** Detail must stay **conditionally mounted** — a CSS-hidden body or a closed `<details>` leaves the text in `textContent`.
- **`resultSummary` runs on the COMPLETE result, on every render.** Never `text.split('\n')` in it: results reach 92 KB. Skip leading whitespace **before** measuring the 120-char cap.
- **`inputEntries` sorts, and the sort is load-bearing** — live and replayed objects need not share insertion order.
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** It restores from HEAD and takes unstaged edits with it. Commit first, then mutate, and reverse with the same anchored replace that applied it.
- **`gh` infers the repo from the working directory.** `cd`-ing out of the clone makes `gh issue create` fail with `no git remotes found`.
- **#57's watcher is epoch-fenced, and the fence is the whole safety argument.** A `handle !== null` check is NOT equivalent.
- **`fs.watch` throws SYNCHRONOUSLY** on ENOENT/EPERM, and the directory comes from a *cached* index. main calls the watcher as a bare `void`, so an escaping rejection kills the main process. Never unwrap the construction.
- **A reload's staleness re-check must not orphan the queued re-run.**
- **Never read `messagesRef` inside the reload loop.** Compare against what the loop itself applied (`paneLength`).
- **Live-tail is for a session you are WATCHING, never one you are DRIVING.** Adopt sets eligibility; send and new-chat clear it.
- **Pins are mutation-verified. Never "fix" a red pin by editing its expectation.** The legitimate-retirement allowance (#42, #45, #47) is **spent**; any other red pin means the change is wrong.
- **A green test can be green for the wrong reason.** Assert the mechanism — a fetch count, a read that must not happen, a call ORDER — not a symptom with more than one cause. **A one-element fixture cannot distinguish a separator** (#59).
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
- **#51: never scope a scrollbar rule to a component**, and never add `scrollbar-width` / `scrollbar-color`. `.tool-card-output`, `.tool-card-input`, `.tool-card-diff-body` and `.tool-card-content-body` all inherit the global rule.
- **Never write a literal ESC byte or a `\u` escape into source.** `CSI` uses `String.fromCharCode(27)`.
- **A session fixture with no `cwd` is a foreign row.** An in-project row must set `cwd: FOLDER`.
- **New `window.api` channel → ALL FOUR mock sites**, and guard every IPC with `isTrustedIpc`.
- **A module-level cache needs a test reset.** The watcher's reset must bump the epoch, not only close the handle.
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, and it needs `stat` now.
- **Never add a resize effect to `InputBar`** — height is CSS (`field-sizing: content`).
- **Never hardcode a model name anywhere.** Two tests pin the **absence** of a list-building surface.
- **Never merge `picked` and `reported` in `model-mode.ts`.** A resolved id in `options.model` is the #23 hang, surfacing on the *next* engine rebuild.
- **A model report is delivered by injected callback, not an `EngineEvent`.**
- **Wisp `options.model`: the CLI shadows the FAMILIES, the bridge resolves the ALIASES.** Never run bare `wisp snapshot` — always name the family.
- **The app runs the HOST `claude` when PATH has one** (`cli-path.ts`). A host Claude Code update can break the app with no code change here.
- **`gh issue close --comment` silently drops the comment if the issue is already closed.** A standalone `gh issue comment` still lands. **`gh issue list` lags a close by seconds** — re-query before believing it.
- **The Bash tool is not PowerShell** — heredoc, never a PowerShell here-string.
- **A mutation harness must assert its anchor matched exactly once.** A bad anchor and an uncaught mutation look identical.

## Known issues / not-our-bug

- **`gui-45.mjs` is STALE and fails on `main`** with `no foreign row was disabled` — it asserts the pre-#47 rule, and #47 made foreign sessions openable. Verified pre-existing by rebuilding against the original `styles.css`. Either retire the assertion or retire the driver; do not "fix" the app to satisfy it.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Don't point a GUI driver's temp cwd there.
- **GUI driver traps:** `--disable-gpu` flattens acrylic; measure in the DOM, never off screenshots; dispatch clicks via `page.evaluate(() => el.click())`; arm a hard `setTimeout(process.exit)` before awaiting `app.close()`; never re-read an element after an action that may not have happened; **count the side effect you care about**; pass any path as an **argument** to `app.evaluate`; stub `dialog.showOpenDialog` in main before any click that opens one; and **select controls by their modifier class**, since the card carries three.
- **Driver trick (gui-63):** two seeded tool calls in one transcript give two cards in one run, so an Edit and a Write can be compared side by side — and the Write assertion is one of **absence**.
- **Driver trick (gui-62):** a seeded `tool_use` alone puts a card with a rich **input** on screen.
- **Driver trick (gui-61):** the same seed carries a **tool call**. Screenshot **at the moment under test**, not only in `finish()`.
- **Driver trick (gui-55):** a terminal-shaped session can be seeded straight into the native store. Clean up the seeded store dir on every exit path.
- **jsdom is blind to CSS, so a visual ticket needs a driver** — and a *CSS-only* change needs more than a driver, because a driver only sees the elements it happens to mount. Resolving `var()` in both compiled bundles and diffing declarations per selector is the exhaustive check.

## Deferred (still no spec)

**New, from this session:** give `.command-row-btn` its `font: inherit` (a real one-line fix with a visual consequence); decide whether tint steps 1 and 2 should collapse to one; decide Tailwind's fate (adopt utilities deliberately, or remove the two devDependencies and inline `@theme`).

**Deferred by #58, with reasons on record:** honest whole-file **Write diff** in every form (needs a pre-write baseline the event contract lacks); **per-tool rich card bodies** (TodoWrite checklist, Grep hit list, Read slice — each couples to one tool's schema); **permission-mode default or persistence** (reverses a recorded owner choice); **adopting the SDK's richer permission metadata** (`title`, `displayName`, `description`, `blockedPath`, `decisionReason`, `suggestions` — all currently dropped by the engine); a **wrapper-owned truncation cap**; a **diff dependency**; **syntax highlighting inside diffs**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a collapsed strip (`thinking_delta` is dropped, so a reasoning phase reads as a hang); **native turn-end notifications + taskbar flash**; **type-while-busy composer** then queued send; **one-click restart on `terminalError`**; **turn pulse** from the dropped `tool_progress` / `status` / rate-limit telemetry; **MCP + settings-parse health** surfacing.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the **watch-installed-after-the-read gap** (both demand-driven — a `ponytail:` comment names the fix). Plus context-pressure meter (`Query.getContextUsage()` exists but a naïve percentage lies), typed failed-turn recovery (`rewindFiles()` needs `enableFileCheckpointing`), full-text transcript search, **session rename / delete / archive**, drag-and-drop, replay thumbnails, N-concurrent engines, **fork-on-resume**, busy-switch detach (decided against), folding `Welcome`'s last `pickFolder` caller onto the chooser, agent archive / control / map pan-zoom, and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — this session; sharpens [[2026-07-23-tailwind4-tokens]]
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] — the global rule the refactor routed around
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — #63's dead coalescing pass, and the reflex it closes
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] — #63's spine
- [[2026-07-30-two-disclosures-two-booleans]] — #62's second card boolean, extended to a third by #63
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
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
