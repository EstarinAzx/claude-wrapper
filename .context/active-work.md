---
type: active-work
project: claude-wrapper
updated: 2026-07-31
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-31 by Opus 5 (1M) (auto) — relay leg 3 of spec #64's batch: ticket **#66** landed, the batch's hinge_
_At commit: `a7c0470` on `main`, pushed. Gate: typecheck clean, build clean, **786 tests green across 54 files** (+16)_
_Driver check: **`gui-66` red-verified then green**. `gui-51` re-run — still the one expected red (#71), byte-identical signature_

## Current focus

**Spec #64's batch is draining. #65, #68 and #66 are closed; three tickets remain, two unblocked.**

The owner asked for four things — a delete-sessions button, a settings surface ("you decide what to put there"), a persistent-acrylic toggle, and colour themes. The funnel turned that into:

| # | Ticket | Blocked by |
|---|---|---|
| ~~#65~~ | ~~Retire the stale `gui-45` driver~~ — **closed, `f0dfc68`** | — |
| ~~#68~~ | ~~Delete a session from the rail~~ — **closed, `70c904f`** | — |
| ~~#66~~ | ~~Appearance dock with the zoom control~~ — **closed, `a7c0470`** | — |
| **#67** | Tokenise the two duplicate colour literals | — |
| **#69** | Backdrop control: Acrylic or Mica | — (unblocked by #66) |
| **#70** | Four themes: Frost, Ember, Moss, Slate | #67 |

Five ADRs carry the reasoning and were written **before** the spec. Read them before touching any ticket — the spec summarises, the ADRs argue.

**The reversal still ahead**, counter-intuitive and already written into the tickets. (The delete reversal below is now spent and in code: `dir` is omitted, pinned by value *and* by arity.)

- **Preferences stay in `localStorage`.** The plan opened wanting a main-side store for the backdrop value, on the premise that main must know it before the window is constructed. **False** — `setBackgroundMaterial` is runtime-settable on our Electron (`electron.d.ts:3236`, `^43.2.0`). What was left is a one-frame launch artifact, which does not earn a persistence layer, especially as `useZoom`'s mount effect already ships a *larger* version of it for every user.
- ~~**The delete call omits its project-directory argument.**~~ **Shipped in #68** — and confirmed against the shipped `sdk.mjs` rather than the docs: the no-`dir` branch enumerates, the `dir` branch realpaths and **encodes** (the operation [[2026-07-28-storage-location-is-an-index-not-an-encoding]] removed, measured failing on 45 of 494 sessions). The same read settled the subagent question: after unlinking `<id>.jsonl` the SDK recursively removes `<projectDir>/<id>/`, so one call covers both halves.

## State

- **In flight:** nothing. No open branches.
- **Landed this leg:** #66 as `a7c0470` — a third right-hand dock (`AppearanceDock.tsx`), joining the existing `openDock` union rather than adding a boolean, gated on an open project, fixed width with no grip and no persisted width, no Save/Apply/Reset and no dirty state. One control: zoom as minus / readout / plus, stepping through `nextZoom` verbatim, each stepper disabled at its bound. `useZoom` now returns `{ level, step }`; new `styles/appearance.css` is the twelfth import. Four mutations applied and reverted; all four turned a test red.
- **Queue (`ready-for-agent`):** **four open** — #67 and #69 unblocked; #70 blocked by one (#67); **#71** unblocked. Verified via `issue_dependencies_summary.blocked_by`.
- **Blocked:** #70 (by #67, by design).
- **Open:** #64 (the spec, stays open until its tickets close), #67, #69, #70, #71.

## Pick up here

**Take #67 (tokenise the two duplicate colour literals) next.** It is the last thing #70 waits on, and it is small. Then #69 → #70 — or #69 first if you prefer, since #66 unblocked it and it depends on nothing else.

**#71 is not in that chain** — it blocks no feature work. Note its premise has now been overtaken: it was filed expecting #66 to move the default zoom, and **#66 did not** (the default is still `1.25`; the panel only exposes stepping). `gui-51`'s tolerance is still calibrated to the old `1.1` default, so the ticket is still valid — just for the pre-existing reason alone, not for anything #66 did.

Conventions unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green before merge, `.context/` commits on main only.

## Open questions

- **Should the rail filter out `sdk-cli` sessions?** The listing fix admits **112** rows to surface the **37** this app wrote; the other 75 are headless automation, ~20 of them this repo's own GUI drivers titled "say OK" / "reply with exactly: PONG". Accepted deliberately, but it is worst exactly where the owner looks first. The blocker is that `SDKSessionInfo` exposes no `entrypoint` / `origin` / `sessionKind` — the deciding field is read from disk and discarded — so filtering means either re-opening ~680 JSONLs (the scan the SDK reader exists to avoid) or `tagSession` on every session this app creates, which is prospective only and would not reach the 37 already written. **#68 was explicitly NOT the answer to this**, and shipped saying so — the non-goal is written into the closed ticket so it stops being re-proposed as bulk delete. Single-row deletion existing does not make "delete the automation rows" a plan.
- **Should Tailwind stay at all?** Nothing in the app uses a utility class — eight specs after [[2026-07-23-tailwind4-tokens]] promised "new/evolving UI uses utilities," it has never happened. Either adopt utilities deliberately for new UI, or drop two devDependencies and the vite plugin and inline `@theme` into `:root`. **#70 deliberately does not bundle this** — the theme override mechanism is indifferent to where the defaults come from, and making a reversible feature wait on an irreversible cleanup is backwards.
- **The titlebar is crowded and #66 has now made it worse** — app name + session title + two pills + **three** dock buttons + window controls, each button eating drag region. The third button shipped as specified; the crowding is real and now actual rather than predicted. Flagged for an impeccable pass, deliberately out of scope for the batch, but do not let it silently become a seventh control nobody costed.
- One deferred owner decision from #58's Out of Scope: whether an honest Write diff is wanted at permission time only, or also after an auto-run and in replay. Gated nothing in #59–#63; still open.

## Recent context

- **The mutation that matters was the one the existing suite could not feel.** Initialising the zoom level from an effect instead of `useState`'s lazy initialiser leaves the **entire** `zoom-shortcuts` suite green — main is still told the stored level, so every assertion there still passes — while the panel reports the default. Only the new readout pins catch it. That is the shape to look for when adding a display of state that already existed: the old tests pin the *effect*, and the new surface is the *report*, and they can disagree silently.
- **A driver assertion can fail because the baseline was wrong, not the code.** `gui-66` first compared the Appearance dock's width to the sessions rail's and failed at 248 vs 283 — the rail is drag-resizable and had a restored width. Both sibling docks carry a restored inline width, so **neither is a valid baseline** for "did this join the shell". Reading the width the shared `.agents-dock` group *declares* out of `document.styleSheets` is, and it is a stronger claim: a private copy of the shell would drift from the declaration the moment either was edited.
- **A screenshot is not a measurement, and here it is not even a picture.** The window composites `windowWidth` DEVICE pixels while the page lays out `windowWidth` CSS pixels at zoom 1.25, so the rightmost ~20% of the layout is never painted into a capture — at any window size, because the shortfall is the zoom factor. Every right-hand dock is affected, the Agents dock included; it is not new. It cost time because the rect measurements and the image disagreed and the image looked like the layout was broken. **Trust `getBoundingClientRect`; treat a capture as evidence only after checking it contains the element.**
- **The probe falsified its own premise and the feature survived.** #68 was written around "on Windows an open handle without `FILE_SHARE_DELETE` fails the unlink outright", with the busy gate widening to "the active row, always" if the handle outlived the turn. Measured against a real store, driving the SDK the way `engine.ts` does (one streaming query, cached, so the CLI child outlives the turn): the unlink **succeeds** mid-turn, after `result` with the child still alive, and after `close()`. No delete-blocking handle exists. The scope did not widen and the ticket's shape was untouched — the probe's value was in what it cost, which was one measurement instead of a re-litigated feature at the end of the batch.
- **The real hazard was the opposite of the one predicted.** A mid-turn delete does not fail — it succeeds and is then **undone**. The still-running turn recreates the transcript on its next append: same path, same id, back at 1,109 bytes where the completed file was 61,317. A refused unlink at least reports failure; this one reports success, removes the row, and the row returns as a stub. The gate stayed, its comment now says why, and the ADR was amended rather than left stating a false premise.
- **The falsified premise also sharpened the predicate.** Because only the *active* session's transcript is being appended to, the gate is `active && busy` — not the row button's neighbouring `!foreign && busy`. A local non-active row is exactly as safe as a foreign one. The test asserts all three rows in one go, because "align these two conditions" is the obvious future tidy-up and it would be wrong.
- **A test that reads CSS by substring can match a longer selector.** The keyboard-reachability pin started as `toContain('.session-row:focus-within .session-delete')` and **survived** deleting the reveal rule — that string is also a prefix of the `:disabled` variant further down the file. It now finds the reveal rule by what it *does* (`opacity: 1`) and inspects its selector list. Found only because the mutation was actually run; it looked like a perfectly good assertion.
- **Classify by asking the store, not by reading the error.** The SDK throws prose to signal not-found, and that prose differs between its two branches. So `deleteSession` catches, drops the index and re-resolves the id: `not-found` → `ok`, anything else (including #60's `unavailable`) → `failed`. The two status tests are driven by the **same** error object with different store contents, which turns "no string-matching" from a comment into a mechanism.
- **A proxy grill is only worth running if you verify what it tells you.** The owner asked for the funnel to run unattended against a rehydrated subagent standing in for them. It pushed back hard four times out of five, and **twice it was right and the opening position was wrong** — but in both cases the correction rested on a factual claim (`setBackgroundMaterial` being runtime-settable; the SDK's two delete branches doing genuinely different things) that was checked in `electron.d.ts` and `sdk.mjs` before being accepted. A confident subagent asserting an implementation detail is a hypothesis, not a finding. Every reversal in #64 has its evidence recorded in the ADR.
- **The strongest argument against a documented promise was that the document was wrong.** DESIGN.md:47 said the neutrals were provisional "until the persistent-glass follow-up lands", which read as a commitment that this work would re-tune them. It describes a mechanism that does not exist — acrylic *always* shows the desktop, blur-behind is what acrylic **is**, and the follow-up was only ever about the unfocused flip to flat. The clause is rewritten rather than deleted, because deleting it loses why the neutrals were chosen and invites a future "restore" against a reference nobody re-checked.
- **Naming is a design decision that survives without being remembered.** The panel is **Appearance**, not Settings, for the same reason the scrollbar rule went global: a name that has to be *remembered* as appearance-only is the failure with an extra step. A heading is what makes the next person adding "reset all preferences" argue before adding it. Same trick as the structural lightness assertion in #70's test — make the rule enforceable rather than memorable.
- **Scope creep is sometimes debt paydown.** Zoom was not one of the four requests, and it is in #66 anyway: it is the one persisted preference with no control at all, and the app has already paid for that once in a source change, a versioned key, a pinning test and a standing landmine telling the next agent to bump the key again.
- **A feature can be a diagnostic.** Scoping the rail to the open project did not cause the "No sessions in this project yet" report the owner hit — it *revealed* a two-day-old listing bug that an unscoped rail had been hiding behind 37 other projects' worth of terminal sessions. The first instinct (and the first two hypotheses written down) were that the new filter had dropped a cwd-less or not-yet-written session; both were wrong, and both would have been "fixed" by weakening the new filter. **Probing the actual data source is what separated them** — one call to the SDK with the flag flipped both ways, on the exact session id from the screenshot.
- **A default is only a default until something has been stored.** Raising `DEFAULT_ZOOM` would have shipped as a visible no-op for the only user, because `useZoom` persists on first mount. Versioning the key is the whole change; the constant is the decoration.
- **A clamped value hides a bug until the box grows.** `border-radius: 999px` and `24px` are byte-for-byte indistinguishable on a 48px pill and nothing in jsdom or a screenshot at rest can tell them apart. It only separates at the 8-line ceiling, which is why the pin is on the CSS source rather than on any rendered output.
- **The scope filter's own tests are the model for how the 20 foreign-row tests were kept.** They seed the persisted pref rather than having their expectations edited, so each still asserts the transition it is named for; the toggle itself got its own describe. No pin was retired to make the change pass.
- Everything from #58's five legs is carried in the landmine list below; the notable one is that **a mutation that kills nothing may mean the code is dead** — #63's coalescing pass is the worked example.

## Landmines (carried forward)

**From #65 — now true of the driver set itself:**

- **A driver must ESTABLISH the app state it asserts, never inherit it.** The rail ships scoped to the open project; `gui-45` and `gui-47` widen it through the real **All projects** chip before measuring. Clicked, not seeded into `localStorage` — seeding only works if the rail mounts after the write. Any new driver that depends on a persisted preference needs the same step, and drivers write each other's state (`gui-scope-zoom-pill` clicks back to "This project" on exit).
- **A `SKIPPED` line is a hole in the gate, not an environment note.** `gui-47` skipped three of its four sections while printing one failure, and read as "mostly fine". Treat a driver that skipped most of itself as unverified.
- **Never assert a fact about this machine's disk.** The retired `>= 2 groups match "playground"` pinned six sibling directories that no longer exist. Compare filters against *each other* (a partial narrows the store; it matches at least what the full path it contains matched), and compare **totals**, since every survey below the 100-row cap reads as exactly 100.

**From #64's design pass — traps that exist in the tickets, not yet in the code:**

- **`themes.css` will be the THIRD raw-text CSS reader in the suite.** It joins `tests/scrollbar.test.ts` (scans every line naming a scrollbar pseudo-element, comments included) and `tests/multiline-composer.test.tsx` (slices between literal braces). Both have already gone red on prose. The theme file will *want* comments explaining each hue, and a naive `--color-\w+:` regex counts a commented-out declaration happily. **Strip comments before parsing.**
- *(#68's two delete traps have moved into the code and are pinned — see the `From #68` block below. #66's three have moved into the `From #66` block.)*
- **Backdrop must not touch any neutral.** Coupling it to the palette makes it a second theme axis writing the same custom properties as #70, from two independent controls — invisible by construction.
- **The accent is FOUR tokens, not three.** `rails.css:324` paints mint at 10% alpha and CSS cannot apply an alpha to `var(--color-mint)`, so a `--color-mint-wash` token is required. A three-key expectation in the theme test greens while a theme silently inherits Frost's wash.
- **`--color-mint-ink` follows the hue but keeps its lightness AND its chroma**, and the neutrals move by hue angle only — their chroma is fixed. Only `--color-mint` / `--color-mint-press` may move chroma, within `0.05`–`0.09`.
- ~~**Lifting the zoom level out of its `useEffect` closure must not disturb the first-mount persist.**~~ **Done in #66** and pinned four ways — see the `From #66` block.
- **One new IPC channel left in this batch** (backdrop, one-way) — the four-mock-sites rule plus `preload/index.d.ts` fires once more, needing `isTrustedIpc` plus a value whitelist at the boundary. #68's `session:delete` already spent the other. Theme and zoom are renderer-only and fire it zero times. Note the mock-site count is really "the harness plus the three suites that build their own `api` object"; the ~22 other files inherit `chat-harness.ts` and go red only because of it.
- **A driver screenshot cannot judge the backdrop.** `--disable-gpu` flattens acrylic, so Acrylic and Mica look identical to it. Real window or nothing — same for whether a theme looks good.

**From #66 — now true of the Appearance dock in code:**

- **`useZoom`'s lazy `useState(readStored)` initialiser is load-bearing, and breaking it is invisible to the old suite.** Storage must be read ONCE, before anything observes the level. Set the initial state from an effect and `tests/zoom-shortcuts.test.tsx` stays **entirely green** — main is told the stored level — while the panel reports the default. Mutation-verified: only `tests/appearance-dock.test.tsx`'s readout pins die. `zoom-level-v2` stays versioned for the same reason as ever; bump it on the next default change.
- **The keydown listener reads `levelRef`, not `level`.** It binds once, so React state alone would freeze it at the mount value. Both paths must go through `apply` — routing the keyboard around it (writing storage and calling `setZoom` directly) moves the window while the readout stalls, which is exactly the "panel disagrees with the window" bug.
- **The Appearance dock JOINS the dock-shell groups — it carries `.agents-dock`** — and `styles/appearance.css` owns only its control rows. Do NOT widen a shared group in `rails.css` / `shared.css` to accommodate it: that repaints the sessions rail and the agents dock silently, with a suite that loads no CSS. The one override in the new file drops the inherited resize grip, which is why the file imports **after** `rails.css`.
- **The panel must stay draft-free.** `switchWorkspace` clears `openDock` (`App.tsx:106`), so it closes itself on an unrelated action; a Save button behind a self-closing panel is silent data loss. Pinned by asserting no button in the dock matches `/save|apply|reset|revert/i`, which also catches a Reset-zoom control being re-proposed.
- **A third dock member must go in the `openDock` UNION, never a fourth boolean.** Mutual exclusion is structural because of the union; a boolean satisfies "it opens" while stacking two panels in the one right slot. Pinned against **both** siblings in **both** directions.
- **`@testing-library/jest-dom` is NOT installed.** `toBeDisabled` / `toBeInTheDocument` fail as `Invalid Chai property`. Assert DOM properties directly (`el.disabled`), the way the existing titlebar suite reads `className` and `textContent`.

**From #68 — now true of the delete path in code:**

- **`deleteSession` takes ONE argument, and the pin is on the arity as well as the value.** Adding an options object of any shape re-enters the SDK's realpath→encode branch (the ~9%-no-op operation this codebase removed). `toHaveBeenCalledWith(id)` alone reads like an ordinary happy-path assertion and invites widening, so `tests/session-store.test.ts` also asserts `mock.calls[0]` has length 1.
- **The delete's outcome is a claim about the STORE, never about the error text.** On a throw the index is dropped and the id re-resolved: `not-found` → `ok`, everything else → `failed`. **`unavailable` must stay `failed`** — a store that will not enumerate cannot demonstrate the session is gone, and reporting success there is the "row that looks deleted" bug in the one branch where folding it into not-found is easiest.
- **The busy gate is `active && busy`, NOT `!foreign && busy`.** It sits one line from the row button's own `!foreign && busy` and looks like an inconsistency to be tidied. It is not: the running turn appends only to the ACTIVE session's transcript. Pinned by asserting an active, a local non-active and a foreign row in the same test.
- **Windows holds no delete-blocking handle on a transcript** — measured, all three states. Do not re-derive a lock-based argument for anything here. The real hazard is that a mid-turn delete **succeeds and is then undone** by the turn's next append.
- **The delete control's hidden state must stay `opacity`, and the reveal must keep `:focus-within`.** `display: none` or `visibility: hidden` looks identical and takes it out of the tab order — the keyboard-inaccessible failure the hover-reveal + confirm pairing exists to prevent. jsdom sees none of this, so it is pinned by reading `rails.css` as text.
- **The SAME button arms and commits.** Swapping in a separate confirm button unmounts the focused element, drops focus to the body, and the blur-reverts rule disarms the row the instant it arms.
- **Escape is stopped at the row.** `SubagentDrawer` listens for Escape on `window`; without `stopPropagation` one press would disarm the row *and* close the drawer. It only fires when the key passed through an armed row, so an Escape anywhere else still closes the drawer.
- **`session-index.ts` resolves the store as `homedir()/.claude/projects` and ignores `CLAUDE_CONFIG_DIR`, while the SDK honours it.** Pre-existing and app-wide (every read path shares it), but it now also means a *failed* delete would be classified against the wrong store if that variable were ever set. Recorded on #68 rather than fixed — widening it touches #60's module.

**Carried from earlier legs:**

- **NEW — `includeProgrammatic` must stay `true`, and nothing pins the argument.** `true` is the SDK's own default, so a pin on the call would fire on a behaviourally identical `sdkListSessions()`. The behaviour is pinned instead by `tests/session-store-live.test.ts`, which mocks **nothing** and builds a real store under `CLAUDE_CONFIG_DIR`. Dropping the key is a deliberate surviving mutant; setting it to `false` reddens exactly that one file.
- **NEW — a test that mocks the SDK module cannot pin what the SDK does.** `tests/session-store.test.ts` mocks both `@anthropic-ai/claude-agent-sdk` and `node:fs/promises`, so the strongest thing expressible there is the *argument*. Any future contract about which sessions are listed belongs in the live-store file, and that file must keep saving/restoring `CLAUDE_CONFIG_DIR` — a leak points every later suite in the worker at a deleted temp dir.
- **NEW — the store's session listing and the store's session *resolution* have different filters.** `resolveSessionDir` enumerates real directory names with no SDK filter, so `readTranscript` / `titleHint` / the watcher / `resolveResumeTarget` all work on sessions the listing cannot see. A session being resumable is therefore **not** evidence that it is listable, and vice versa.
- **NEW — the conversation you are in is a clickable row now.** `useChat.openSession` carries a same-id guard; removing it lets a click re-adopt the live session and stomp the pane with a disk read of a transcript still being written. Before the listing fix this path was unreachable, so nothing older guards it.
- **NEW — `scope: 'project'` drops cwd-less sessions too** (their key is `''`, which never equals a real one), and it runs **before** the cap, deliberately: scoping a capped page would let foreign rows eat the 100 slots. With no open cwd it degrades to `'all'` rather than emptying the rail.
- **NEW — `--r-pill` on a growable box is a bug waiting for the box to grow.** 999px is clamped to half the shorter side, so it is invisible until the element gets tall. `.input-pill` is pinned to a literal `24px` (the resting height's half) by `tests/multiline-composer.test.tsx`; re-tokenising it silently restores the lozenge.
- **NEW — a persisted preference silently outranks the default it was seeded from.** Raising `DEFAULT_ZOOM` does nothing for an install that already stored a level. The key carries a version (`zoom-level-v2`) for exactly this; bump it again on the next default change.
- **NEW — `sed -i` rewrites a whole file to LF.** Mutation-testing `src/` with `sed` silently flips CRLF on the file it touches. Use the `Edit` tool for mutations, or re-normalise afterwards.
- **NEW — a script importing a project dependency must live under the project tree.** ESM resolves a bare specifier by walking up to `node_modules`; a probe in `$TEMP` fails with `ERR_MODULE_NOT_FOUND`. Same trap the GUI drivers document.
- **NEW — the `@import` order in `styles.css` IS the cascade, and breaking it is silent.** `tokens` → `base` → `shared` must stay first and in that order: the shared groups are single-class rules that every component override is at least as specific as, so they only work while they come earlier. Reordering those **twelve** lines restyles the app with no error and no failing test. A component file that OVERRIDES another component's group (as `appearance.css` does to `rails.css`) must import after it.
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

- **`gui-51.mjs` FAILS on `main`** with `model menu gutter 9.4px | .session-groups gutter 9px` — a **standing, characterised red**, tracked as **#71**. Its ±0.5px tolerance around a 10px gutter is calibrated to `DEFAULT_ZOOM = 1.1` (its own comment computes `~0.909px` = 1/1.1) and `ece7b9c` raised the default to `1.25`. Verified pre-existing by stashing #65's work and re-running on clean `main` for a byte-identical failure, and **re-confirmed byte-identical after #66** — #66 exposes zoom stepping but does not move the default, so #71's premise ("#66 moves the zoom its measurement depends on") is spent while the ticket itself stands on the pre-existing miscalibration. **This is the one expected driver failure — a second signature is a real regression.** Do not widen the tolerance until the numbers fit.
- **A capture cannot see the right ~20% of the layout.** The window composites `windowWidth` DEVICE pixels while the page lays out `windowWidth` CSS pixels at zoom 1.25, so anything past `windowWidth / zoom` CSS px is never painted into a screenshot — at any window size, because the shortfall IS the zoom factor. Every right-hand dock is affected, the Agents dock included. `gui-66` works around it by calling `window.api.setZoom(1)` for a final presentational-only shot, after every assertion has run. **Measure with `getBoundingClientRect`; check a capture actually contains the element before reading anything off it.**
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Don't point a GUI driver's temp cwd there.
- **GUI driver traps:** `--disable-gpu` flattens acrylic; measure in the DOM, never off screenshots; dispatch clicks via `page.evaluate(() => el.click())`; arm a hard `setTimeout(process.exit)` before awaiting `app.close()`; never re-read an element after an action that may not have happened; **count the side effect you care about**; pass any path as an **argument** to `app.evaluate`; stub `dialog.showOpenDialog` in main before any click that opens one; and **select controls by their modifier class**, since the card carries three.
- **Driver trick (gui-scope-zoom-pill):** clearing `sidebar-scope` / `zoom-level-v2` from `localStorage` **after mount but before the folder click** makes the driver show shipped defaults rather than whatever the dev machine has stored. Reading the pref back in the same probe then reports `0`, which is the probe's own ordering, not the applied zoom.
- **Driver trick (gui-66):** a webContents zoom change is measurable **in the DOM** as `window.innerWidth` moving inversely (880 CSS px at 1.25 → 815 at 1.35), which is how a driver proves a zoom control reaches the window rather than only a state variable. Also: read a shared group's DECLARED value out of `document.styleSheets` when the live siblings carry user-resized inline widths.
- **Driver trick (gui-63):** two seeded tool calls in one transcript give two cards in one run, so an Edit and a Write can be compared side by side — and the Write assertion is one of **absence**.
- **Driver trick (gui-62):** a seeded `tool_use` alone puts a card with a rich **input** on screen.
- **Driver trick (gui-61):** the same seed carries a **tool call**. Screenshot **at the moment under test**, not only in `finish()`.
- **Driver trick (gui-55):** a terminal-shaped session can be seeded straight into the native store. Clean up the seeded store dir on every exit path.
- **jsdom is blind to CSS, so a visual ticket needs a driver** — and a *CSS-only* change needs more than a driver, because a driver only sees the elements it happens to mount. Resolving `var()` in both compiled bundles and diffing declarations per selector is the exhaustive check.

## Deferred (still no spec)

**Newly deferred by #64, with reasons on record:** literal **persistent acrylic** via a native window-composition dependency (rejection unchanged — [[2026-07-23-persistent-glass-deferred]] stays live for it); a **light theme** (a re-derivation of the app's translucency and contrast rules, not a token swap); **re-hueing the danger shades or the three syntax-highlight colours** (semantic, not brand); **bulk delete / clear-all / archive / rename / undo / trash** for sessions; **gating `win.show()` on the first preference push** (only if a driver measures the launch artifact as objectionable — it also fixes the zoom reflow); a **resize grip or persisted width** for the Appearance dock; **refactoring the titlebar's four dock props** into a generic pair (touches every titlebar test for no behavioural gain); **reducing the titlebar's control count**, which #66 makes worse and which needs an impeccable pass; **re-tuning the neutral palette per backdrop** (deliberately decoupled); **migrating the four existing preference keys** to any new storage.

**Carried, still unspec'd:** filter or de-noise the `sdk-cli` rows the listing fix admits (see Open questions — needs a signal `SDKSessionInfo` does not carry, and **#68 is explicitly not the answer**); revisit the scope-chip control for contrast and whether two `aria-pressed` buttons in a `role="group"` is the right pattern; give `.command-row-btn` its `font: inherit` (a real one-line fix with a visual consequence); decide whether tint steps 1 and 2 should collapse to one; decide Tailwind's fate (adopt utilities deliberately, or remove the two devDependencies and inline `@theme`).

**Deferred by #58, with reasons on record:** honest whole-file **Write diff** in every form (needs a pre-write baseline the event contract lacks); **per-tool rich card bodies** (TodoWrite checklist, Grep hit list, Read slice — each couples to one tool's schema); **permission-mode default or persistence** (reverses a recorded owner choice); **adopting the SDK's richer permission metadata** (`title`, `displayName`, `description`, `blockedPath`, `decisionReason`, `suggestions` — all currently dropped by the engine); a **wrapper-owned truncation cap**; a **diff dependency**; **syntax highlighting inside diffs**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a collapsed strip (`thinking_delta` is dropped, so a reasoning phase reads as a hang); **native turn-end notifications + taskbar flash**; **type-while-busy composer** then queued send; **one-click restart on `terminalError`**; **turn pulse** from the dropped `tool_progress` / `status` / rate-limit telemetry; **MCP + settings-parse health** surfacing.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the **watch-installed-after-the-read gap** (both demand-driven — a `ponytail:` comment names the fix). Plus context-pressure meter (`Query.getContextUsage()` exists but a naïve percentage lies), typed failed-turn recovery (`rewindFiles()` needs `enableFileCheckpointing`), full-text transcript search, **session rename / archive** (delete **landed** in #68; rename and archive stay deferred), drag-and-drop, replay thumbnails, N-concurrent engines, **fork-on-resume**, busy-switch detach (decided against), folding `Welcome`'s last `pickFolder` caller onto the chooser, agent archive / control / map pan-zoom, and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — **#66, this leg; shipped as argued, nothing reversed**
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68, previous leg; amended with the probe result
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, two legs back
- [[2026-07-31-a-preference-lives-where-it-is-read]] · [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] · [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] · [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] · [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — spec #64's five, this leg
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
