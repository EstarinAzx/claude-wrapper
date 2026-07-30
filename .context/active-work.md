---
type: active-work
project: claude-wrapper
updated: 2026-07-31
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-31 by Opus 5 (1M) (auto) — three owner-asked UI changes, then the listing bug the first one exposed. No ticket_
_At commit: `main`. Gate: typecheck clean, build clean, **743 tests green across 53 files**, GUI driver green_
_Every behavioural claim below was mutation-verified, and the rail/composer changes were confirmed in the running window, not only in jsdom_

## Current focus

**Nothing in flight. The `ready-for-agent` queue is still empty.**

Four unticketed changes **landed**, the first three owner-asked and the fourth found by the first:

1. **Sessions rail scopes to the open project.** `groupSessions` gained an opt-in `scope`; `Sidebar` defaults it to `'project'`, persisted under `sidebar-scope`, with `This project` / `All projects` chips under the filter and a scoped-empty state that offers the way out. The filter runs **before** the 100-row cap, same contract as the query.
2. **Default zoom 1.1 → 1.25.** The bump alone was a no-op for anyone who had run the app (a stored level always beats a default), so the key is versioned to `zoom-level-v2`. Pinned by a test.
3. **The composer no longer sweeps into a lozenge.** `.input-pill` was `--r-pill` (999px), which browsers clamp to half the shorter side: 24px at the 48px resting height, but **97px** at the 8-line ceiling. Pinned to 24px — pixel-identical at rest, a rounded rectangle when grown.
4. **The app can list its own sessions.** `includeProgrammatic: false` hid every conversation the wrapper authored. See [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]].

Spec **#58 — the non-lossy tool inspector — remains delivered and closed** (#59 → #60 → #61 → #62 → #63).

## State

- **In flight:** nothing. No open branches.
- **Landed this session:** all four changes above, on main, in one commit with the ADR.
- **Queue (`ready-for-agent`):** **empty**.
- **Blocked:** nothing.
- **Open:** the unlabelled umbrella **#1**. Nothing else.

## Pick up here

There is no queued ticket and nothing half-done. The next session starts an effort rather than draining a queue: `/preset init` or grill-me → `/hp` → to-spec → to-tickets, or pick from **Deferred** below — but that list is ranked by nothing and needs a real selection pass, since the last two specs held up precisely because they were measured against a real corpus before being committed to.

The sharpest **new** candidate is the `sdk-cli` noise this session knowingly accepted (see Open questions).

Conventions unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green before merge, `.context/` commits on main only.

## Open questions

- **NEW — should the rail filter out `sdk-cli` sessions?** The listing fix admits **112** rows to surface the **37** this app wrote; the other 75 are headless automation, ~20 of them this repo's own GUI drivers titled "say OK" / "reply with exactly: PONG". Accepted deliberately, but it is worst exactly where the owner looks first. The blocker is that `SDKSessionInfo` exposes no `entrypoint` / `origin` / `sessionKind` — the deciding field is read from disk and discarded — so filtering means either re-opening ~680 JSONLs (the scan the SDK reader exists to avoid) or `tagSession` on every session this app creates, which is prospective only and would not reach the 37 already written.
- **Should Tailwind stay at all?** Nothing in the app uses a utility class — eight specs after [[2026-07-23-tailwind4-tokens]] promised "new/evolving UI uses utilities," it has never happened. Either adopt utilities deliberately for new UI, or drop two devDependencies and the vite plugin and inline `@theme` into `:root`.
- One deferred owner decision from #58's Out of Scope: whether an honest Write diff is wanted at permission time only, or also after an auto-run and in replay. Gated nothing in #59–#63; still open.

## Recent context

- **A feature can be a diagnostic.** Scoping the rail to the open project did not cause the "No sessions in this project yet" report the owner hit — it *revealed* a two-day-old listing bug that an unscoped rail had been hiding behind 37 other projects' worth of terminal sessions. The first instinct (and the first two hypotheses written down) were that the new filter had dropped a cwd-less or not-yet-written session; both were wrong, and both would have been "fixed" by weakening the new filter. **Probing the actual data source is what separated them** — one call to the SDK with the flag flipped both ways, on the exact session id from the screenshot.
- **A default is only a default until something has been stored.** Raising `DEFAULT_ZOOM` would have shipped as a visible no-op for the only user, because `useZoom` persists on first mount. Versioning the key is the whole change; the constant is the decoration.
- **A clamped value hides a bug until the box grows.** `border-radius: 999px` and `24px` are byte-for-byte indistinguishable on a 48px pill and nothing in jsdom or a screenshot at rest can tell them apart. It only separates at the 8-line ceiling, which is why the pin is on the CSS source rather than on any rendered output.
- **The scope filter's own tests are the model for how the 20 foreign-row tests were kept.** They seed the persisted pref rather than having their expectations edited, so each still asserts the transition it is named for; the toggle itself got its own describe. No pin was retired to make the change pass.
- Everything from #58's five legs is carried in the landmine list below; the notable one is that **a mutation that kills nothing may mean the code is dead** — #63's coalescing pass is the worked example.

## Landmines (carried forward)

- **NEW — `includeProgrammatic` must stay `true`, and nothing pins the argument.** `true` is the SDK's own default, so a pin on the call would fire on a behaviourally identical `sdkListSessions()`. The behaviour is pinned instead by `tests/session-store-live.test.ts`, which mocks **nothing** and builds a real store under `CLAUDE_CONFIG_DIR`. Dropping the key is a deliberate surviving mutant; setting it to `false` reddens exactly that one file.
- **NEW — a test that mocks the SDK module cannot pin what the SDK does.** `tests/session-store.test.ts` mocks both `@anthropic-ai/claude-agent-sdk` and `node:fs/promises`, so the strongest thing expressible there is the *argument*. Any future contract about which sessions are listed belongs in the live-store file, and that file must keep saving/restoring `CLAUDE_CONFIG_DIR` — a leak points every later suite in the worker at a deleted temp dir.
- **NEW — the store's session listing and the store's session *resolution* have different filters.** `resolveSessionDir` enumerates real directory names with no SDK filter, so `readTranscript` / `titleHint` / the watcher / `resolveResumeTarget` all work on sessions the listing cannot see. A session being resumable is therefore **not** evidence that it is listable, and vice versa.
- **NEW — the conversation you are in is a clickable row now.** `useChat.openSession` carries a same-id guard; removing it lets a click re-adopt the live session and stomp the pane with a disk read of a transcript still being written. Before the listing fix this path was unreachable, so nothing older guards it.
- **NEW — `scope: 'project'` drops cwd-less sessions too** (their key is `''`, which never equals a real one), and it runs **before** the cap, deliberately: scoping a capped page would let foreign rows eat the 100 slots. With no open cwd it degrades to `'all'` rather than emptying the rail.
- **NEW — `--r-pill` on a growable box is a bug waiting for the box to grow.** 999px is clamped to half the shorter side, so it is invisible until the element gets tall. `.input-pill` is pinned to a literal `24px` (the resting height's half) by `tests/multiline-composer.test.tsx`; re-tokenising it silently restores the lozenge.
- **NEW — a persisted preference silently outranks the default it was seeded from.** Raising `DEFAULT_ZOOM` does nothing for an install that already stored a level. The key carries a version (`zoom-level-v2`) for exactly this; bump it again on the next default change.
- **NEW — `sed -i` rewrites a whole file to LF.** Mutation-testing `src/` with `sed` silently flips CRLF on the file it touches. Use the `Edit` tool for mutations, or re-normalise afterwards.
- **NEW — a script importing a project dependency must live under the project tree.** ESM resolves a bare specifier by walking up to `node_modules`; a probe in `$TEMP` fails with `ERR_MODULE_NOT_FOUND`. Same trap the GUI drivers document.
- **NEW — the `@import` order in `styles.css` IS the cascade, and breaking it is silent.** `tokens` → `base` → `shared` must stay first and in that order: the shared groups are single-class rules that every component override is at least as specific as, so they only work while they come earlier. Reordering those eleven lines restyles the app with no error and no failing test.
- **NEW — a new rule goes in the file that owns its surface, never in the entry.** The entry holds imports only. A scoped scrollbar copy dropped into any component file is the exact drift `tests/scrollbar.test.ts` exists to catch — which is why that test reads the whole `styles/` **directory**, not just `base.css`.
- **NEW — `tests/scrollbar.test.ts` scans EVERY LINE of the stylesheet containing a scrollbar pseudo-element, comments included.** Naming `::-webkit-scrollbar` in a comment makes the scan treat that prose as a selector and the test goes red. Never group one of those selectors with a class on one line, and never write the token in a comment.
- **NEW — `tests/multiline-composer.test.tsx` slices the raw CSS from `.bubble {` / `.message-input {` to the NEXT `}`.** So those two selectors must stay **ungrouped** (`.bubble` in `chat.css`, `.message-input` in `composer.css`), and no comment inside either block may contain a closing brace — one did, and the slice ended early with the pinned declarations outside it. Both failures read as "the CSS is wrong" when the CSS is fine.
- **NEW — split a file by LINE RANGE, never by retyping it.** Both stylesheet passes were verified by comparing rule sequences and compiled bundles; that only means anything because the rule bodies were carried across mechanically and could not have drifted in transcription.
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
- **Driver trick (gui-scope-zoom-pill):** clearing `sidebar-scope` / `zoom-level-v2` from `localStorage` **after mount but before the folder click** makes the driver show shipped defaults rather than whatever the dev machine has stored. Reading the pref back in the same probe then reports `0`, which is the probe's own ordering, not the applied zoom.
- **Driver trick (gui-63):** two seeded tool calls in one transcript give two cards in one run, so an Edit and a Write can be compared side by side — and the Write assertion is one of **absence**.
- **Driver trick (gui-62):** a seeded `tool_use` alone puts a card with a rich **input** on screen.
- **Driver trick (gui-61):** the same seed carries a **tool call**. Screenshot **at the moment under test**, not only in `finish()`.
- **Driver trick (gui-55):** a terminal-shaped session can be seeded straight into the native store. Clean up the seeded store dir on every exit path.
- **jsdom is blind to CSS, so a visual ticket needs a driver** — and a *CSS-only* change needs more than a driver, because a driver only sees the elements it happens to mount. Resolving `var()` in both compiled bundles and diffing declarations per selector is the exhaustive check.

## Deferred (still no spec)

**New, from this session:** filter or de-noise the `sdk-cli` rows the listing fix admits (see Open questions — needs a signal `SDKSessionInfo` does not carry); revisit the scope-chip control for contrast and whether two `aria-pressed` buttons in a `role="group"` is the right pattern; give `.command-row-btn` its `font: inherit` (a real one-line fix with a visual consequence); decide whether tint steps 1 and 2 should collapse to one; decide Tailwind's fate (adopt utilities deliberately, or remove the two devDependencies and inline `@theme`).

**Deferred by #58, with reasons on record:** honest whole-file **Write diff** in every form (needs a pre-write baseline the event contract lacks); **per-tool rich card bodies** (TodoWrite checklist, Grep hit list, Read slice — each couples to one tool's schema); **permission-mode default or persistence** (reverses a recorded owner choice); **adopting the SDK's richer permission metadata** (`title`, `displayName`, `description`, `blockedPath`, `decisionReason`, `suggestions` — all currently dropped by the engine); a **wrapper-owned truncation cap**; a **diff dependency**; **syntax highlighting inside diffs**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a collapsed strip (`thinking_delta` is dropped, so a reasoning phase reads as a hang); **native turn-end notifications + taskbar flash**; **type-while-busy composer** then queued send; **one-click restart on `terminalError`**; **turn pulse** from the dropped `tool_progress` / `status` / rate-limit telemetry; **MCP + settings-parse health** surfacing.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the **watch-installed-after-the-read gap** (both demand-driven — a `ponytail:` comment names the fix). Plus context-pressure meter (`Query.getContextUsage()` exists but a naïve percentage lies), typed failed-turn recovery (`rewindFiles()` needs `enableFileCheckpointing`), full-text transcript search, **session rename / delete / archive**, drag-and-drop, replay thumbnails, N-concurrent engines, **fork-on-resume**, busy-switch detach (decided against), folding `Welcome`'s last `pickFolder` caller onto the chooser, agent archive / control / map pan-zoom, and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-30-the-import-order-is-the-cascade]] — this session, second pass
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — this session, first pass; sharpens [[2026-07-23-tailwind4-tokens]]
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
