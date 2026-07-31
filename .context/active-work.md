---
type: active-work
project: claude-wrapper
updated: 2026-07-31
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-31 by Opus 5 (1M) (auto) — relay leg 4 of spec #64's batch: ticket **#67** landed, the batch's smallest slice_
_At commit: `e16ace6` on `main`, pushed. Gate: typecheck clean, build clean, **786 tests green across 54 files** (unchanged — this ticket adds no tests, deliberately)_
_Driver check: not re-run. #67 is a pure dedup proven byte-identical at the compiled-bundle level, so no driver's measurement can have moved. `gui-51` remains the one expected red (#71)_

## Current focus

**Spec #64's batch is nearly drained. #65, #68, #66 and #67 are closed; two tickets remain and both are unblocked.**

The owner asked for four things — a delete-sessions button, a settings surface ("you decide what to put there"), a persistent-acrylic toggle, and colour themes. The funnel turned that into:

| # | Ticket | Blocked by |
|---|---|---|
| ~~#65~~ | ~~Retire the stale `gui-45` driver~~ — **closed, `f0dfc68`** | — |
| ~~#68~~ | ~~Delete a session from the rail~~ — **closed, `70c904f`** | — |
| ~~#66~~ | ~~Appearance dock with the zoom control~~ — **closed, `a7c0470`** | — |
| ~~#67~~ | ~~Tokenise the two duplicate colour literals~~ — **closed, `e16ace6`** | — |
| **#69** | Backdrop control: Acrylic or Mica | — |
| **#70** | Four themes: Frost, Ember, Moss, Slate | — (released by #67) |

Five ADRs carry the reasoning and were written **before** the spec. Read them before touching either remaining ticket — the spec summarises, the ADRs argue. **Two of the five now carry amendments** (#68's and #70's); read the amendment before citing either.

**The reversal still ahead**, counter-intuitive and already written into the tickets:

- **Preferences stay in `localStorage`.** The plan opened wanting a main-side store for the backdrop value, on the premise that main must know it before the window is constructed. **False** — `setBackgroundMaterial` is runtime-settable on our Electron (`electron.d.ts:3236`, `^43.2.0`). What was left is a one-frame launch artifact, which does not earn a persistence layer, especially as `useZoom`'s mount effect already ships a *larger* version of it for every user. **#69 is the ticket that consumes this.**

Both earlier reversals are now spent and in code: the delete call omits `dir` (pinned by value *and* by arity), and the two duplicate colour literals are tokenised.

## State

- **In flight:** nothing. No open branches.
- **Landed this leg:** #67 as `e16ace6` — `--color-mint-wash` added beside the three existing accent tokens (plus the `--mint-wash` short alias), referenced from `rails.css:324`; `titlebar.css:209` now references `--text`. Colour literals outside `tokens.css`: **18 → 16**. Zero visual change, proven by resolving every `var()` in the compiled bundle before and after and diffing effective declarations per selector; the checker itself was mutation-verified in both directions.
- **Queue (`ready-for-agent`):** **three open** — #69 and #70 both unblocked, plus **#71** unblocked and standalone. Verified via `issue_dependencies_summary.blocked_by`.
- **Blocked:** nothing.
- **Open:** #64 (the spec, stays open until its tickets close), #69, #70, #71.

## Pick up here

**Take #69 (Backdrop: Acrylic or Mica) next** — it is the older of the two and the batch ordering has always been #67 → #69 → #70. #70 is equally takeable now; nothing sequences them against each other any more.

**#71 is not in that chain** — it blocks no feature work. Its premise has been overtaken: it was filed expecting #66 to move the default zoom, and **#66 did not** (the default is still `1.25`; the panel only exposes stepping). `gui-51`'s tolerance is still calibrated to the old `1.1` default, so the ticket is still valid — just for the pre-existing reason alone.

Conventions unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green before merge, `.context/` commits on main only.

## Open questions

- **Should the rail filter out `sdk-cli` sessions?** The listing fix admits **112** rows to surface the **37** this app wrote; the other 75 are headless automation, ~20 of them this repo's own GUI drivers titled "say OK" / "reply with exactly: PONG". Accepted deliberately, but it is worst exactly where the owner looks first. The blocker is that `SDKSessionInfo` exposes no `entrypoint` / `origin` / `sessionKind` — the deciding field is read from disk and discarded — so filtering means either re-opening ~680 JSONLs (the scan the SDK reader exists to avoid) or `tagSession` on every session this app creates, which is prospective only and would not reach the 37 already written. **#68 was explicitly NOT the answer to this**, and shipped saying so — the non-goal is written into the closed ticket so it stops being re-proposed as bulk delete. Single-row deletion existing does not make "delete the automation rows" a plan.
- **Should Tailwind stay at all?** Nothing in the app uses a utility class — eight specs after [[2026-07-23-tailwind4-tokens]] promised "new/evolving UI uses utilities," it has never happened. Either adopt utilities deliberately for new UI, or drop two devDependencies and the vite plugin and inline `@theme` into `:root`. **#70 deliberately does not bundle this** — the theme override mechanism is indifferent to where the defaults come from, and making a reversible feature wait on an irreversible cleanup is backwards.
- **The titlebar is crowded and #66 has now made it worse** — app name + session title + two pills + **three** dock buttons + window controls, each button eating drag region. The third button shipped as specified; the crowding is real and now actual rather than predicted. Flagged for an impeccable pass, deliberately out of scope for the batch, but do not let it silently become a seventh control nobody costed.
- **Should `rails.css:325` read `var(--mint)` like every other component site?** It reads `var(--color-mint)` — the one long-name reference in component CSS, sitting directly beside the line #67 changed. It themes correctly either way, so it is a naming inconsistency and not a bug; #67 left it rather than widen a dedup ticket into a rename. Trivial, unspec'd, and genuinely optional.
- One deferred owner decision from #58's Out of Scope: whether an honest Write diff is wanted at permission time only, or also after an auto-run and in replay. Gated nothing in #59–#63; still open.

## Recent context

- **An ADR's conclusion can be right while its stated reason is measurably false, and the fix is to amend rather than to reverse.** [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] justified the fourth accent token by calling `color-mix()` "a new mechanism in an app that expresses everything as flat tokens". One grep settles it: `color-mix(in oklch, var(--mint) N%, transparent)` was already in the stylesheet **six times** at six strengths — `subagent.css:13` (6%), `subagent.css:24` (12%), `titlebar.css:172` (14%), `titlebar.css:177` (20%), `agent-map.css:64` (22%) and `rails.css:68` (**50%, 256 lines above the very literal the section is about**). The token shipped anyway, because it stands on two other things: it is an authored per-theme override point the key-set test can pin, and it kept #67's resolved value byte-identical, which is what let that ticket's proof stay strong. **The ticket's shape was untouched and the ADR was corrected** — the same discipline #68's probe set.
- **The correction is load-bearing for #70, and in its favour.** Those six sites read `var(--mint)` → `var(--color-mint)`, which a theme block overrides, and `color-mix` resolves at substitution time — so **they re-hue for free**. #70 must not tokenise them, must not expect them in the key set (still exactly four), and must not read them as literals #67 missed. Recorded on the ticket as well as here.
- **A proof method constrains which implementations are acceptable, not just which are correct.** `color-mix(in oklch, var(--mint) 10%, transparent)` is *computationally* identical to `oklch(0.87 0.07 180 / 0.1)` but not textually. #67's acceptance criteria asked for equivalence proven by resolving `var()` in the compiled bundle and diffing declarations per selector; the token form satisfies that byte-for-byte, the `color-mix` form would have forced the proof down to a claim about computed values that nothing in this suite can evaluate. A dedup ticket that cannot cheaply prove it changed nothing is a worse dedup ticket.
- **A diff harness that silently matches nothing reports a clean PASS.** #67's checker was mutation-verified in both directions before its result was believed: re-hueing `--color-mint-wash` 180 → 70 reddened it **at the call site** (`.session-row-btn-active { background: … }`), which is what proves the resolver actually follows the `--mint-wash` → `--color-mint-wash` → value chain rather than just comparing token blocks; deleting `color: var(--text)` from `.win-btn-close:hover` reddened it showing the resolved value as `oklch(94% .008 190)`, which proves the second substitution is real. Both anchors asserted matched. Same rule as the mutation harness: a bad anchor and a genuinely clean diff look identical.
- **The mutation that matters was the one the existing suite could not feel.** Initialising the zoom level from an effect instead of `useState`'s lazy initialiser leaves the **entire** `zoom-shortcuts` suite green — main is still told the stored level, so every assertion there still passes — while the panel reports the default. Only the new readout pins catch it. That is the shape to look for when adding a display of state that already existed: the old tests pin the *effect*, and the new surface is the *report*, and they can disagree silently.
- **A driver assertion can fail because the baseline was wrong, not the code.** `gui-66` first compared the Appearance dock's width to the sessions rail's and failed at 248 vs 283 — the rail is drag-resizable and had a restored width. Both sibling docks carry a restored inline width, so **neither is a valid baseline** for "did this join the shell". Reading the width the shared `.agents-dock` group *declares* out of `document.styleSheets` is, and it is a stronger claim: a private copy of the shell would drift from the declaration the moment either was edited.
- **A screenshot is not a measurement, and here it is not even a picture.** The window composites `windowWidth` DEVICE pixels while the page lays out `windowWidth` CSS pixels at zoom 1.25, so the rightmost ~20% of the layout is never painted into a capture — at any window size, because the shortfall is the zoom factor. Every right-hand dock is affected, the Agents dock included; it is not new. It cost time because the rect measurements and the image disagreed and the image looked like the layout was broken. **Trust `getBoundingClientRect`; treat a capture as evidence only after checking it contains the element.**
- **The probe falsified its own premise and the feature survived.** #68 was written around "on Windows an open handle without `FILE_SHARE_DELETE` fails the unlink outright", with the busy gate widening to "the active row, always" if the handle outlived the turn. Measured against a real store, driving the SDK the way `engine.ts` does: the unlink **succeeds** mid-turn, after `result` with the child still alive, and after `close()`. No delete-blocking handle exists. The scope did not widen and the ticket's shape was untouched — the probe's value was in what it cost, which was one measurement instead of a re-litigated feature at the end of the batch.
- **The real hazard was the opposite of the one predicted.** A mid-turn delete does not fail — it succeeds and is then **undone**. The still-running turn recreates the transcript on its next append: same path, same id, back at 1,109 bytes where the completed file was 61,317. A refused unlink at least reports failure; this one reports success, removes the row, and the row returns as a stub.
- **A test that reads CSS by substring can match a longer selector.** The keyboard-reachability pin started as `toContain('.session-row:focus-within .session-delete')` and **survived** deleting the reveal rule — that string is also a prefix of the `:disabled` variant further down the file. It now finds the reveal rule by what it *does* (`opacity: 1`) and inspects its selector list. Found only because the mutation was actually run; it looked like a perfectly good assertion.
- **Classify by asking the store, not by reading the error.** The SDK throws prose to signal not-found, and that prose differs between its two branches. So `deleteSession` catches, drops the index and re-resolves the id: `not-found` → `ok`, anything else (including #60's `unavailable`) → `failed`. The two status tests are driven by the **same** error object with different store contents, which turns "no string-matching" from a comment into a mechanism.
- **A proxy grill is only worth running if you verify what it tells you.** The owner asked for the funnel to run unattended against a rehydrated subagent standing in for them. It pushed back hard four times out of five, and **twice it was right and the opening position was wrong** — but in both cases the correction rested on a factual claim that was checked in source before being accepted. A confident subagent asserting an implementation detail is a hypothesis, not a finding. **#67 is the same lesson pointing the other way**: a *recorded* claim in our own ADR was equally a hypothesis, and it was wrong.
- **Naming is a design decision that survives without being remembered.** The panel is **Appearance**, not Settings, for the same reason the scrollbar rule went global: a name that has to be *remembered* as appearance-only is the failure with an extra step. Same trick as the structural key-set assertion planned for #70 — make the rule enforceable rather than memorable.
- **Scope creep is sometimes debt paydown.** Zoom was not one of the four requests, and it is in #66 anyway: it is the one persisted preference with no control at all, and the app has already paid for that once in a source change, a versioned key, a pinning test and a standing landmine.
- **A feature can be a diagnostic.** Scoping the rail to the open project did not cause the "No sessions in this project yet" report the owner hit — it *revealed* a two-day-old listing bug that an unscoped rail had been hiding behind 37 other projects' worth of terminal sessions. **Probing the actual data source is what separated the hypotheses.**
- **A default is only a default until something has been stored.** Raising `DEFAULT_ZOOM` would have shipped as a visible no-op for the only user, because `useZoom` persists on first mount. Versioning the key is the whole change; the constant is the decoration.
- **A clamped value hides a bug until the box grows.** `border-radius: 999px` and `24px` are byte-for-byte indistinguishable on a 48px pill and nothing in jsdom or a screenshot at rest can tell them apart. It only separates at the 8-line ceiling, which is why the pin is on the CSS source rather than on any rendered output.
- Everything from #58's five legs is carried in the landmine list below; the notable one is that **a mutation that kills nothing may mean the code is dead** — #63's coalescing pass is the worked example.

## Landmines (carried forward)

**From #67 — now true of the token store:**

- **`color-mix(in oklch, var(--mint) N%, transparent)` is established idiom, six sites, and those sites theme themselves.** 6% / 12% / 14% / 20% / 22% / 50%. They resolve through `var(--mint)`, so a `:root[data-theme]` override reaches them for free. **Do not tokenise them, do not expect them in #70's key set, and do not read them as literals #67 missed.** The ADR calling `color-mix()` "a new mechanism" is amended.
- **The accent is FOUR tokens and `--color-mint-wash` now exists** (`oklch(0.87 0.07 180 / 0.1)`, plus the `--mint-wash` alias). It has exactly one caller, which `tokens.css`'s own danger-shade note says normally means indirection rather than a system — it is exempt because the rule is about *repetition* and this token's job is to be an **override point**. That reasoning is in a comment at the definition; do not "clean it up" as a one-caller token.
- **Sixteen colour literals outside `tokens.css` are deliberate.** Shadows are pure black and theme-neutral; the danger shades and the three markdown syntax colours are semantic rather than brand. A future "finish the tokenisation" pass is wrong, not incomplete.
- **Proving a CSS refactor changed nothing means resolving `var()` and diffing per selector — and then mutating the checker.** The bundle is not comparable by byte count or by `diff`, because the minifier reorders declarations within a rule. Resolve the alias chains, key by `context|selector|property`, and separate custom-property definitions from painting declarations: adding a token legitimately adds definitions while moving no painted value.

**From #66 — now true of the Appearance dock in code:**

- **`useZoom`'s lazy `useState(readStored)` initialiser is load-bearing, and breaking it is invisible to the old suite.** Storage must be read ONCE, before anything observes the level. Set the initial state from an effect and `tests/zoom-shortcuts.test.tsx` stays **entirely green** — main is told the stored level — while the panel reports the default. Mutation-verified: only `tests/appearance-dock.test.tsx`'s readout pins die. `zoom-level-v2` stays versioned; bump it on the next default change.
- **The keydown listener reads `levelRef`, not `level`.** It binds once, so React state alone would freeze it at the mount value. Both paths must go through `apply` — routing the keyboard around it moves the window while the readout stalls.
- **The Appearance dock JOINS the dock-shell groups — it carries `.agents-dock`** — and `styles/appearance.css` owns only its control rows. Do NOT widen a shared group in `rails.css` / `shared.css` to accommodate it: that repaints the sessions rail and the agents dock silently, with a suite that loads no CSS. **New controls for #69 go in `styles/appearance.css`, beside the zoom row.**
- **The panel must stay draft-free.** `switchWorkspace` clears `openDock` (`App.tsx:106`), so it closes itself on an unrelated action; a Save button behind a self-closing panel is silent data loss. Pinned by asserting no button in the dock matches `/save|apply|reset|revert/i`.
- **A third dock member must go in the `openDock` UNION, never a fourth boolean.** Pinned against **both** siblings in **both** directions.
- **`@testing-library/jest-dom` is NOT installed.** `toBeDisabled` / `toBeInTheDocument` fail as `Invalid Chai property`. Assert DOM properties directly (`el.disabled`).

**From #64's design pass — traps that exist in the remaining tickets, not yet in the code:**

- **`themes.css` will be the THIRD raw-text CSS reader in the suite.** It joins `tests/scrollbar.test.ts` (scans every line naming a scrollbar pseudo-element, comments included) and `tests/multiline-composer.test.tsx` (slices between literal braces). Both have already gone red on prose. The theme file will *want* comments explaining each hue, and a naive `--color-\w+:` regex counts a commented-out declaration happily. **Strip comments before parsing.** #67 deliberately did not add a fourth one.
- **Backdrop must not touch any neutral.** Coupling it to the palette makes it a second theme axis writing the same custom properties as #70, from two independent controls — invisible by construction.
- **`--color-mint-ink` follows the hue but keeps its lightness AND its chroma**, and the neutrals move by hue angle only — their chroma is fixed. Only `--color-mint` / `--color-mint-press` may move chroma, within `0.05`–`0.09`.
- **One new IPC channel left in this batch** (backdrop, one-way, **#69**) — the four-mock-sites rule plus `preload/index.d.ts` fires once more, needing `isTrustedIpc` plus a two-string value whitelist at the boundary. #68's `session:delete` already spent the other. Theme and zoom are renderer-only and fire it zero times. Note the mock-site count is really "the harness plus the three suites that build their own `api` object"; the ~22 other files inherit `chat-harness.ts`.
- **A driver screenshot cannot judge the backdrop.** `--disable-gpu` flattens acrylic, so Acrylic and Mica look identical to it. Real window or nothing — same for whether a theme looks good.

**From #68 — now true of the delete path in code:**

- **`deleteSession` takes ONE argument, and the pin is on the arity as well as the value.** Adding an options object of any shape re-enters the SDK's realpath→encode branch. `tests/session-store.test.ts` also asserts `mock.calls[0]` has length 1.
- **The delete's outcome is a claim about the STORE, never about the error text.** `not-found` → `ok`, everything else → `failed`. **`unavailable` must stay `failed`.**
- **The busy gate is `active && busy`, NOT `!foreign && busy`.** It sits one line from the row button's own `!foreign && busy` and looks like an inconsistency to be tidied. It is not.
- **Windows holds no delete-blocking handle on a transcript** — measured, all three states. Do not re-derive a lock-based argument for anything here.
- **The delete control's hidden state must stay `opacity`, and the reveal must keep `:focus-within`.** `display: none` or `visibility: hidden` looks identical and takes it out of the tab order. jsdom sees none of this, so it is pinned by reading `rails.css` as text.
- **The SAME button arms and commits**, and **Escape is stopped at the row** (`SubagentDrawer` listens on `window`).
- **`session-index.ts` resolves the store as `homedir()/.claude/projects` and ignores `CLAUDE_CONFIG_DIR`, while the SDK honours it.** Pre-existing and app-wide. Recorded on #68 rather than fixed.

**From #65 — true of the driver set itself:**

- **A driver must ESTABLISH the app state it asserts, never inherit it.** The rail ships scoped to the open project; any new driver depending on a persisted preference must click the real control, not seed `localStorage` (seeding only works if the rail mounts after the write). Drivers write each other's state.
- **A `SKIPPED` line is a hole in the gate, not an environment note.** Treat a driver that skipped most of itself as unverified.
- **Never assert a fact about this machine's disk.** Compare filters against *each other*, and compare **totals**, since every survey below the 100-row cap reads as exactly 100.

**Carried from earlier legs:**

- **`includeProgrammatic` must stay `true`, and nothing pins the argument.** `true` is the SDK's own default, so a pin on the call would fire on a behaviourally identical `sdkListSessions()`. The behaviour is pinned by `tests/session-store-live.test.ts`, which mocks **nothing** and builds a real store under `CLAUDE_CONFIG_DIR`. That file must keep saving/restoring the variable — a leak points every later suite in the worker at a deleted temp dir.
- **A test that mocks the SDK module cannot pin what the SDK does.** Any future contract about which sessions are listed belongs in the live-store file.
- **The store's session listing and the store's session *resolution* have different filters.** A session being resumable is **not** evidence that it is listable, and vice versa.
- **The conversation you are in is a clickable row now.** `useChat.openSession` carries a same-id guard; removing it lets a click re-adopt the live session and stomp the pane.
- **`scope: 'project'` drops cwd-less sessions too**, and it runs **before** the cap, deliberately. With no open cwd it degrades to `'all'` rather than emptying the rail.
- **`--r-pill` on a growable box is a bug waiting for the box to grow.** `.input-pill` is pinned to a literal `24px` by `tests/multiline-composer.test.tsx`; re-tokenising it silently restores the lozenge.
- **A persisted preference silently outranks the default it was seeded from.**
- **`sed -i` rewrites a whole file to LF.** Use the `Edit` tool for mutations, or re-normalise afterwards.
- **A script importing a project dependency must live under the project tree.** ESM resolves a bare specifier by walking up to `node_modules`; a probe in `$TEMP` fails with `ERR_MODULE_NOT_FOUND`.
- **The `@import` order in `styles.css` IS the cascade, and breaking it is silent.** `tokens` → `base` → `shared` must stay first and in that order. Reordering those **twelve** lines restyles the app with no error and no failing test. A component file that OVERRIDES another component's group (as `appearance.css` does to `rails.css`) must import after it. **`themes.css` (#70) goes immediately after `tokens.css` and before `base.css`** — thirteenth import.
- **A new rule goes in the file that owns its surface, never in the entry.** The entry holds imports only.
- **`tests/scrollbar.test.ts` scans EVERY LINE of the stylesheet containing a scrollbar pseudo-element, comments included.** Never group one of those selectors with a class on one line, and never write the token in a comment.
- **`tests/multiline-composer.test.tsx` slices the raw CSS from `.bubble {` / `.message-input {` to the NEXT `}`.** Those two selectors must stay **ungrouped**, and no comment inside either block may contain a closing brace.
- **Split a file by LINE RANGE, never by retyping it.**
- **`styles.css` and all of `src/` is CRLF, while `.context/*.md` is LF.** A whole-file `Write` emits LF and silently flips the file; re-normalise after writing. (#67 verified all three edited stylesheets stayed 100% CRLF.)
- **`.command-row-btn` is the one row button without `font: inherit`**, deliberately excluded from the shared row-button group. Adding it repaints `.command-row-desc`. A real fix, but a visual change needing its own ticket.
- **Tint steps 1 and 2 differ by 0.01 alpha** for no recorded reason. Preserved as-is; collapsing them is a design call, not a cleanup.
- **A mutation that kills nothing may be telling you the CODE is dead**, not that the test is weak. #63's coalescing pass is the worked example.
- **Never render a Write diff.** Labelled content preview only, and the guard is an assertion of **absence**.
- **The card carries THREE disclosure booleans**, one per region. Merging any two re-arms a control on cards that hide nothing.
- **A fourth control on the tool card must be named twice over** — a `.tool-card-toggle--<what>` modifier class **and** an accessible name outside `tests/toolcards.test.tsx`'s `TOGGLE` regex. Both failures are silent.
- **`lineDiff`'s `>=` tie-break is load-bearing**, and **never `split('\n')` in the diff path.**
- **`[]` and `null` mean different things on both store channels.** `?? []` at a new call site silently restores the exact bug #60 removed.
- **Never cache a failed index build.**
- **Live-tail's failed-read guard is `continue`, never `break`.**
- **A failure notice must retire when the thing it warns about arrives.**
- **The mutation harness must normalise CRLF.** Anchors written with `\n` match **zero** times in `src/`, and a zero-match anchor reads exactly like a surviving mutation. Anchored `Edit` calls sidestep the class.
- **Never summarise a tool result on the way into state.**
- **The collapsed tool-card test is a mechanism check.** Detail must stay **conditionally mounted**.
- **`resultSummary` runs on the COMPLETE result, on every render.** Never `text.split('\n')` in it.
- **`inputEntries` sorts, and the sort is load-bearing.**
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** Commit first, then mutate, and reverse with the same anchored replace that applied it.
- **`gh` infers the repo from the working directory.**
- **#57's watcher is epoch-fenced, and the fence is the whole safety argument.**
- **`fs.watch` throws SYNCHRONOUSLY** on ENOENT/EPERM, and main calls the watcher as a bare `void`. Never unwrap the construction.
- **A reload's staleness re-check must not orphan the queued re-run**, and **never read `messagesRef` inside the reload loop.**
- **Live-tail is for a session you are WATCHING, never one you are DRIVING.**
- **Pins are mutation-verified. Never "fix" a red pin by editing its expectation.** The legitimate-retirement allowance is **spent**; any red pin means the change is wrong.
- **A green test can be green for the wrong reason.** Assert the mechanism — a fetch count, a read that must not happen, a call ORDER.
- **A session id is only resumable once a turn has run** (#54).
- **Never re-derive a store path from `cwd`.**
- **Never call `window.api.pickFolder` outside `Welcome`.**
- **Never clear the pane with `newChat()` on a switch path.** Use `adoptSession(id)`.
- **Do not add a second busy flag**, and do not disable a foreign row or "Open project" while busy.
- **Never un-key the composer.** `<InputBar key={cwd}>` is the entire draft / tray / autocomplete reset.
- **`pendingInsert` must be cleared in the same commit as the cwd change.**
- **Anything workspace-scoped added to App state must join the `ok` branch** of `switchWorkspace`.
- **Do not rebuild the storage index inside `listSessions`**, and never re-add `customTitle ?? summary`.
- **#50: never match CLI markup mid-string.** `sanitizeUserText` dispatches on the **leading tag of the trimmed message**. A real recorded argument is `fable[1m]`.
- **#51: never scope a scrollbar rule to a component**, and never add `scrollbar-width` / `scrollbar-color`.
- **Never write a literal ESC byte or a `\u` escape into source.** `CSI` uses `String.fromCharCode(27)`.
- **A session fixture with no `cwd` is a foreign row.**
- **New `window.api` channel → ALL FOUR mock sites**, and guard every IPC with `isTrustedIpc`.
- **A module-level cache needs a test reset.**
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, and it needs `stat` now.
- **Never add a resize effect to `InputBar`** — height is CSS (`field-sizing: content`).
- **Never hardcode a model name anywhere.** Two tests pin the **absence** of a list-building surface.
- **Never merge `picked` and `reported` in `model-mode.ts`.**
- **Wisp `options.model`: the CLI shadows the FAMILIES, the bridge resolves the ALIASES.** Never run bare `wisp snapshot` — always name the family.
- **The app runs the HOST `claude` when PATH has one** (`cli-path.ts`).
- **`gh issue close --comment` silently drops the comment if the issue is already closed** — and a commit trailer (`Closes #n`) closes the issue the moment main is pushed, so **comment first, then close**. **`gh issue list` lags a close by seconds.**
- **The Bash tool is not PowerShell** — heredoc, never a PowerShell here-string.
- **A mutation harness must assert its anchor matched exactly once.** A bad anchor and an uncaught mutation look identical.

## Known issues / not-our-bug

- **`gui-51.mjs` FAILS on `main`** with `model menu gutter 9.4px | .session-groups gutter 9px` — a **standing, characterised red**, tracked as **#71**. Its ±0.5px tolerance around a 10px gutter is calibrated to `DEFAULT_ZOOM = 1.1` and `ece7b9c` raised the default to `1.25`. Verified pre-existing and **re-confirmed byte-identical after #66**; #67 is a proven-byte-identical CSS dedup and cannot have moved it. **This is the one expected driver failure — a second signature is a real regression.** Do not widen the tolerance until the numbers fit.
- **A capture cannot see the right ~20% of the layout.** Every right-hand dock is affected, the Agents dock included. `gui-66` works around it by calling `window.api.setZoom(1)` for a final presentational-only shot, after every assertion has run. **Measure with `getBoundingClientRect`.**
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Don't point a GUI driver's temp cwd there.
- **GUI driver traps:** `--disable-gpu` flattens acrylic; measure in the DOM, never off screenshots; dispatch clicks via `page.evaluate(() => el.click())`; arm a hard `setTimeout(process.exit)` before awaiting `app.close()`; never re-read an element after an action that may not have happened; **count the side effect you care about**; pass any path as an **argument** to `app.evaluate`; stub `dialog.showOpenDialog` in main before any click that opens one; and **select controls by their modifier class**.
- **Driver trick (gui-scope-zoom-pill):** clearing `sidebar-scope` / `zoom-level-v2` from `localStorage` **after mount but before the folder click** shows shipped defaults rather than the dev machine's stored values.
- **Driver trick (gui-66):** a webContents zoom change is measurable **in the DOM** as `window.innerWidth` moving inversely (880 CSS px at 1.25 → 815 at 1.35). Also: read a shared group's DECLARED value out of `document.styleSheets` when live siblings carry user-resized inline widths.
- **Driver trick (gui-63):** two seeded tool calls in one transcript give two cards in one run, and the Write assertion is one of **absence**.
- **Driver trick (gui-62):** a seeded `tool_use` alone puts a card with a rich **input** on screen.
- **Driver trick (gui-61):** the same seed carries a **tool call**. Screenshot **at the moment under test**.
- **Driver trick (gui-55):** a terminal-shaped session can be seeded straight into the native store. Clean up on every exit path.
- **jsdom is blind to CSS, so a visual ticket needs a driver** — and a *CSS-only* change needs more than a driver, because a driver only sees the elements it happens to mount. **Resolving `var()` in both compiled bundles and diffing declarations per selector is the exhaustive check**, and #67 is the second time it has carried a whole ticket.

## Deferred (still no spec)

**Deferred by #64, with reasons on record:** literal **persistent acrylic** via a native window-composition dependency ([[2026-07-23-persistent-glass-deferred]] stays live for it); a **light theme**; **re-hueing the danger shades or the three syntax-highlight colours**; **bulk delete / clear-all / archive / rename / undo / trash** for sessions; **gating `win.show()` on the first preference push** (only if a driver measures the launch artifact as objectionable); a **resize grip or persisted width** for the Appearance dock; **refactoring the titlebar's four dock props** into a generic pair; **reducing the titlebar's control count**, which #66 makes worse; **re-tuning the neutral palette per backdrop**; **migrating the four existing preference keys** to any new storage.

**Newly noted by #67:** renaming `rails.css:325`'s `var(--color-mint)` to the short alias every other component site uses — cosmetic, themes correctly either way, deliberately not bundled into a dedup ticket.

**Carried, still unspec'd:** filter or de-noise the `sdk-cli` rows (see Open questions — **#68 is explicitly not the answer**); revisit the scope-chip control for contrast; give `.command-row-btn` its `font: inherit`; decide whether tint steps 1 and 2 should collapse; decide Tailwind's fate.

**Deferred by #58, with reasons on record:** honest whole-file **Write diff**; **per-tool rich card bodies**; **permission-mode default or persistence**; **adopting the SDK's richer permission metadata**; a **wrapper-owned truncation cap**; a **diff dependency**; **syntax highlighting inside diffs**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a collapsed strip; **native turn-end notifications + taskbar flash**; **type-while-busy composer** then queued send; **one-click restart on `terminalError`**; **turn pulse** from the dropped telemetry; **MCP + settings-parse health** surfacing.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the **watch-installed-after-the-read gap**; context-pressure meter; typed failed-turn recovery; full-text transcript search; **session rename / archive**; drag-and-drop; replay thumbnails; N-concurrent engines; **fork-on-resume**; busy-switch detach (decided against); folding `Welcome`'s last `pickFolder` caller onto the chooser; agent archive / control / map pan-zoom; and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — **#67 delivered its two-literal section and AMENDED its `color-mix()` premise; #70 is the rest**
- [[2026-07-31-a-preference-lives-where-it-is-read]] — **#69's storage answer, the reversal still ahead**
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — **#69, the next ticket**
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66, shipped as argued
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68, amended with the probe result
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, and the rule the driver set now follows
- [[2026-07-30-the-import-order-is-the-cascade]] — where `themes.css` and `appearance.css` sit
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] · [[2026-07-23-tailwind4-tokens]] — the token store #70 overrides
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — the reflex behind mutation-verifying #67's checker
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] ·
  [[2026-07-30-two-disclosures-two-booleans]] ·
  [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]] ·
  [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
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
