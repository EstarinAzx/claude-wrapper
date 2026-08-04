---
type: overview
project: claude-wrapper
updated: 2026-08-04
tags: [context, overview]
---

# Overview

**Project:** claude-wrapper
**One-liner:** Electron app that wraps the Claude Code CLI — Claude Code runs under the hood, a web UI replaces the raw terminal.

## Layout
- `src/main/` — Electron main process (window creation, acrylic config, IPC handlers).
  `session-index.ts` owns store path resolution: session id → real project
  directory by enumeration. Nothing may derive a store path from `cwd`. It also
  owns the failure/absence line (#60): `unavailable` when the store will not
  enumerate, `not-found` when it enumerates fine and lacks the id — and a failed
  build is never cached. `session-store.ts` carries that outward as `null` vs
  `[]` on both `listSessions` and `readTranscript`; `?? []` at a new call site
  restores the silent-empty-state bug. Its `includeProgrammatic: true` is
  load-bearing, and #89 corrected the comment justifying it: the `entrypoint` a
  session carries is decided by the **launch env**, never by this app — `sdk-cli`
  from a terminal Claude Code session, `sdk-ts` from no session at all,
  `claude-vscode` from a VS Code one (that last being *interactive*, so the app
  CAN write a non-programmatic transcript). Two of the three are hidden by
  `false`, which is why the argument stays explicit; see
  [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]].
  Its `deleteSession(id)` (#68) is the
  app's ONE destructive call: the SDK is invoked with the id ALONE — passing
  `dir` re-enters the realpath→encode branch this codebase removed — and a
  throw is classified by re-resolving the id against the store, never by
  reading the SDK's error text (`not-found` → `ok`, `unavailable` → `failed`).
  `delete-guard.ts` (#107) is the busy refusal in front of it — `guardedDelete`
  over `isBusy` / `runningId` / `remove`, refusing **only** the id the engine is
  streaming into, because the rail's `disabled={active && busy}` compares against
  the renderer's `activeSessionId` and that is written only at `turn-end`, so
  through a fresh conversation's FIRST turn the renderer holds null and the live
  session's trash button is enabled. It is not a second busy source: main has held
  the id since `init` and the renderer has no opinion to disagree with. Its tests
  assert the store was never REACHED, never only the status — a guard answering
  `'failed'` after unlinking would pass a status-only suite while destroying the
  transcript. See [[2026-08-04-a-refusal-belongs-where-the-fact-lives]].
  `switch-workspace.ts` owns the atomic workspace transition as a function over
  injected ports (the entry module is untestable under vitest). It reads
  `isBusy()` **TWICE** on the resume path (#109), and the second read is not
  redundant: `resolveTarget` awaits, `chat:send` carries no busy guard of its
  own, and a turn beginning inside that await was torn down by `closeEngine()`
  while the switch still returned `ok`. Ordering every check before the first
  mutation — which the function's own comment promises, and always delivered —
  is necessary and **not sufficient** once an await separates the check from the
  mutation. The window is ~18ms and exists only because `session:list` calls
  `resetSessionIndex()`, so the listing that renders the row you click is what
  makes the resolve cold (18.2ms cold vs 0.0ms warm, measured). Its rejection
  tests assert **port by port** that nothing was reached, never only the status:
  a version that tore down and then reported `busy` passes a status-only suite.
  See [[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]].
  `turn-announce.ts` (#75) is the same shape for the turn-end announcement —
  `turn-announce.ts` (#75) is the same shape for the turn-end announcement —
  `announceTurn(ports, event)` over `isFocused` / `notify` / `flash`, so the
  call COUNT and ARGUMENTS are assertable without a window — and it also owns
  `isLooking`, which is `isFocused() && !isMinimized()` because a **minimised**
  window reports itself focused on Windows (measured; `win.blur()` moves
  nothing at all), so the obvious one-liner is silent in exactly the case the
  feature exists for. `index.ts` holds
  only the binding to the real engine, broker and cwd — plus the app's ONE
  `BrowserWindow`, which runs **sandboxed** (#74): `sandbox: true` costs nothing
  because the built preload requires only `electron`, and the renderer is the
  process most exposed to hostile input. Nothing in vitest can observe that flag,
  so `gui-74` is its only guard, and it measures the OS-level effect
  (`app.getAppMetrics()` joined by `getOSProcessId()`) rather than the request.
  That window is **no longer shown on `ready-to-show` alone** (#79): it is shown
  once Chromium has something to paint AND the renderer has pushed its stored
  bounds, with a 1500ms timeout so a renderer that never mounts cannot cost the
  user a window. The `bounds:set` handler therefore has two jobs that are
  deliberately separate — **apply** only if the payload validates, **release the
  gate** whatever it was, since `null` (nothing stored) is a complete answer and
  releasing only on a valid payload would make every first-ever launch wait out
  the timeout. An untrusted sender does neither. The gate's release hook is a
  module-level `let` because this app has exactly one window. Main also reports
  bounds back on `move`/`resize`, and `bounds-reporter.ts` (#110) owns that whole
  half: the 250ms debounce, the **`getNormalBounds()`** read (so maximising never
  overwrites the remembered size), and the **flush on `close`**. `index.ts` keeps
  only the wiring — `move`/`resize` → `report`, `close` → `flush`, `closed` →
  `cancel`. The flush is on `close` rather than `closed` because by `closed` the
  `webContents` is gone; the old `closed` handler CANCELLED the pending timer, so
  a move or resize inside the debounce was silently discarded and the next launch
  came back at the previous position. It sends only when a report is OWED — a
  pending timer is the sole evidence of that, which is why the timer is nulled
  inside its own callback, and a flush after the debounce has already fired must
  stay silent. `ReportableWindow` carries a `getBounds` nothing calls,
  deliberately: choosing between the two reads IS the contract, and an interface
  offering only the correct one would make the maximised-window test unable to
  fail. Sending during teardown races the renderer's destruction
  (`window-all-closed` quits the app) — measured as survivable, never assumed,
  and `gui-110` keeps main's send and the renderer's write as two separate
  numbers because only the renderer owns the second. See
  [[2026-08-04-a-scheduled-report-is-not-a-sent-one]].
  Its `warmUp` port TAKES
  the resume target (#73) — `resume` binds when the query is CONSTRUCTED and
  `ensureQuery` returns early ever after, so a bare `warmUp()` leaves the
  rebuilt engine on a fresh session while the pane, refilled from disk, looks
  correct; nothing but that argument's own pin can see it. `engine.ts` reports a
  terminal stream death through an injected `onTerminal` (#73), broadcast as
  `engine:terminal` — deliberately not an `EngineEvent`, because `emit()` only
  reaches an active turn and a stream dying BETWEEN turns emits nothing at all.
  It must never fire for `close()`, which main calls on every workspace switch,
  model pick and permission cycle. Its **third** injected port is
  `onBackgroundTasks` (#83), broadcast as `tasks:changed`, carrying the CLI's
  `background_tasks_changed` level — and it **inverts** `onTerminal`'s `close()`
  rule on purpose: firing `[]` there IS the feature, because the level is
  per-process and `close()` is the one funnel **all six** engine-discard paths in
  main pass through, so the reset is structural rather than hand-copied to each
  call site. Its branch sits **before** the fallthrough to `handleTaskMessage`,
  which is what keeps the mutation-verified `local_agent` guard untouched.
  Its **fourth** injected port is `onSubagent` (#104), broadcast as
  `subagent:changed`, and it exists for the same reason as the other three: a
  subagent's terminal edge **can** land after `result/success`, where
  `finishTurn()` has already nulled `activeOnEvent`. Measured as a **race**
  rather than a rule — three runs gave LATE 14519ms, early 1699ms, LATE 13126ms
  on one prompt and one binary, because the `Agent` tool is async and the parent
  turn and its subagent settle independently — so the finding is
  **reachability**, which one observation settles. `emitSubagent` routes
  **every** subagent edge through the port when one is supplied, never just the
  terminal ones, or one agent's lifecycle would be read off two channels. The
  success branch must still **never** call `drainSubagents()`: it emits
  `failed`, and an agent still open at `result/success` may go on to complete.
  Both failure branches keep draining and are now pinned **with the port wired**,
  because every older drain test builds the engine portless. See
  [[2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding]].
  `transcript.ts` parses the
  native JSONL to the replay list and owns `sanitizeUserText`, the one place CLI
  markup is turned into readable text — anchored on the message's leading tag,
  never matched mid-string. `model-mode.ts` holds ONLY the pick state: the model
  list comes from the CLI (`engine.listModels()` → `supportedModels()`), and
  `picked` (which becomes `options.model`) is kept apart from `reported` (what
  the CLI says it is running, display only).
- `src/preload/` — contextBridge `window.api` (+ `index.d.ts` global type, included by `tsconfig.web.json`)
- **The sessions rail carries TWO lists from two sources** (#91). Above the
  hairline, `.bg-sessions`: **live background sessions**, polled from the CLI on
  demand only — its refresh button and a workspace change, never the window
  `focus` listener the stored list uses, and never a timer. Below it: the filter,
  the scope chips and the **stored transcripts**, which are files on disk. The
  rail was already the dangerous lookalike (it has a scope control, so it *looks*
  like it lists running work); showing both, labelled, makes the difference
  visible rather than implied. The background rows are **read-only** — no attach,
  no peek, no reply — so the section adds exactly one tab stop to a rail that
  already carries ~100, and **no titlebar control**: it is a section, which needs
  no toggle, which is what let it ship without a router.
- `src/renderer/` — React UI (`src/components/` Titlebar / Chat / InputBar).
  `styles.css` is a **26-line entry file**: Tailwind layer setup plus thirteen
  `@import`s. The rules live in `src/renderer/src/styles/` — `tokens` · `themes`
  · `base` (reset + the app-wide scrollbar rule + reduced-motion, global on
  purpose and never scoped to a component) · `shared` · `titlebar` · `rails` ·
  `appearance` · `agent-map` · `chat` · `composer` · `tool-card` · `markdown` ·
  `subagent`.
  `themes` (#70) holds the four palette blocks and MUST stay immediately after
  `tokens` and before `base` — a theme block landing before the tokens it
  overrides is the silent restyle the cascade rule exists to prevent, and
  `tests/theme.test.ts` pins the position.
  `subagent` (#98) owns the transcript viewer, which is a **centred popup**, not
  the right-edge drawer its `.subagent-drawer*` class names still say — the names
  are kept deliberately, because seven files select on them. Its root centres with
  a chosen 24px gutter and its pane is **820px**, derived term-by-term
  (`760 + 48 + 2 + 10`) so the reused `.chat-column` lands at its documented 760
  in **both** scroll states. Placement was the owner's instruction; the entry is
  `DESIGN.md`'s 4px Y rise; and it adds **no `backdrop-filter`, blur or ply beyond
  `var(--surface)`**, which is what keeps the unresolved glass-ban question
  harmless. See
  [[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]].
  `appearance` (#66) sits after `rails` because the Appearance dock JOINS the
  dock-shell groups that file owns (it carries `.agents-dock`) and its one
  override — dropping the inherited resize grip — has to come after them. It
  also owns #69's Backdrop rows (`.appearance-field--stacked`, the choice
  cards); every new panel control goes here, never into a shared group.
  **The import order IS the cascade**: `tokens` → `base` → `shared` must stay
  first, because the shared groups (truncation triad, focus ring, the two hover
  washes, micro-caps label) are single-class rules that every component override
  is at least as specific as. Reordering those lines silently restyles the app.
  Tailwind's role is the `@theme` token store and nothing else — **no utility
  class is used anywhere in the app**. The accent is **four** tokens (#67):
  `--color-mint`, `-press`, `-ink` and `-wash`, the last being the 10%-alpha
  form CSS cannot derive from a `var()` reference. Sixteen colour literals
  outside `tokens.css` are deliberate — shadows are theme-neutral, danger and
  syntax colours are semantic — while `color-mix(in oklch, var(--mint) N%,
  transparent)` at six sites is already theme-correct and must not be
  tokenised — a `data-theme` block overrides the token they read, so they
  re-hue for free. **Three** tests now read the stylesheet as raw
  TEXT (two over the whole `styles/` directory), so `.bubble` and
  `.message-input` must stay ungrouped and no comment may name a scrollbar
  pseudo-element or contain a closing brace; the third (`theme.test.ts`) strips
  comments before parsing, which is why `themes.css` may carry prose the other
  two could not.
  **Keyboard focus is picked per control, not applied** (#93): the `shared.css`
  focus group paints `background: var(--tint-3)` as well as its hairline, so it
  is only for genuinely transparent menu/list rows — anything carrying a fill in
  any state, and every icon button (where a wash reads as a second hover state),
  takes the hairline **alone**, `inset 0 0 0 1px var(--tint-6)`. `titlebar.css`
  authored no `:focus-visible` rule at all until #93 and now owns the six for its
  own controls. Adding a filled control to the shared group replaces its fill at
  the moment it is selected, and only `gui-93` can see that. See
  [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]],
  [[2026-07-30-the-import-order-is-the-cascade]] and
  [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]].
  `useChat.ts` stores a tool result **complete** on both write paths
  (`toChatMessage` for replay, the `tool-result` handler for live) — #61 moved
  summarising to render time in `ToolCard`, so re-adding `resultSummary` at
  either write point restores the lossy-card bug and no rendering test can see
  it. `toolSummaries.ts` owns the render-time derivation: `resultSummary` scans
  forward with `firstLineBounds` (never `split('\n')` — it runs on the full
  result every render), `hasHiddenOutput` gates the output affordance, and
  `inputEntries` (#62) builds the key-sorted argument list — sorted because live
  and replayed objects need not share insertion order, and called only from the
  mounted branch so a collapsed card pays no stringify. `lineDiff.ts` (#63) is
  the pure replacement-hunk diff: suffix-LCS matrix in a `Uint32Array`, forward
  walk whose `>=` tie-break is what keeps removals ahead of additions (there is
  deliberately no coalescing pass — it was provably unreachable), and a hard
  `DIFF_CELL_GUARD` of 1,000,000 cells above which it returns the exact texts
  unaligned. `ToolCard` owns **three** disclosure booleans, one per region
  (output / input / change); a pending permission card renders the input
  inspector and the diff with no toggle at all, and a Write card renders a
  labelled content preview and **never** a diff.
  `useBackdrop.ts` (#69) is the same pattern for the window's backdrop
  material: renderer `localStorage` under an unversioned `backdrop` key, pushed
  to main on mount and on change. Its lazy `useState(readStored)` initialiser
  carries the same trap as `useZoom`'s, worse — set it from an effect and the
  panel still ends up correct while the window is never told the stored value,
  so the only pin that catches it is the one on what crossed IPC.
  `useZoom.ts` returns `{ level, step }` (#66): the level left the mount
  effect's closure so the Appearance panel could show a readout. The lazy
  `useState(readStored)` initialiser is what keeps the first-mount persist
  intact — storage is read ONCE, before anything observes the level, so a
  stored level still beats the default. Setting it from an effect instead
  leaves the whole `zoom-shortcuts` suite green while the panel reports the
  wrong number.
  `AgentsDock.tsx` re-reads its sidecars on **every** turn end (#82), through one
  `read(id, keepStale)` callback that both effects call. `keepStale` is the whole
  design: `false` (session changed) clears first and reports a failure as
  `unreadable`; `true` (same session, re-read) is **stale-while-revalidate** —
  it touches nothing until the new list is in hand and keeps the last good rows
  when the read fails, because `loading` before a refresh blanks the disk rows
  and nested edges are disk-only, so the tree shape would flicker out and back.
  The trigger is #80's `LastTurn` taken **whole** — the outcome decides WHETHER,
  the nonce decides WHEN — and **never `busy === false`**, which all three
  terminal outcomes clear. The seen-nonce is consumed on every outcome and
  **seeded at mount**: skip either and the dock fires late or reads twice for one
  event. `sessionId` alone cannot be the trigger — it is written inside
  `useChat`'s `turn-end` branch, so it moves once per SESSION and the effect was
  structurally incapable of firing on turns 2..N.
  It also renders #83's **background-tasks footer** — a separate section from a
  separate prop, which never joins `mergeAgents` because a `local_bash` task has
  no sidecar, no `parentToolUseId` and no usage, so a merged row would claim it
  ran as an agent and spent nothing. It renders only when non-empty (a fourth
  empty state would compete with the three above it), its rows are
  **non-interactive** because a background task has nothing to open, and the set
  lives in `useChat` rather than here because the dock unmounts on every close
  while the level only re-fires on a membership CHANGE. `local_agent` rows are
  dropped from it (`nonAgentTasks`) — the Agent tool is async, so a subagent is
  in the level beside its own agent row.
  `InputBar.tsx` owns the **read-failure vocabulary its policy does not have**
  (#106): `readAsBase64` resolves to `null`, never `''`, because an empty string
  is a value of the success type and collides with "this candidate carries no
  bytes" — which is how a file that had moved, been deleted or been locked used
  to reach `judgeAttachment`'s catch-all and get told its own media type was
  unsupported. The composer folds only readable candidates through
  `admitAttachments` and pushes `COULD_NOT_READ` rejections itself, so an
  unreadable file spends no slot from the count budget. `Candidate` must not be
  widened to carry this — a read failure is a property of the **attempt**, not
  of the candidate, and the policy's contract is *given a candidate, judge what
  it is*. See [[2026-08-04-a-failure-flattened-into-a-value-is-judged-as-one]].
  `InputBar.tsx` is **never disabled while a turn runs** (#80) — the field, the
  paperclip and the paste handler all stay live, and `useChat.send` remains the
  one place that refuses a send while busy. Enter during a turn COMMITS the
  draft: the commitment is a **boolean flag on the draft**, not a copy of it, so
  cardinality is one by construction, what fires is whatever is in the box when
  the turn ends, and the `key={cwd}` remount resets the queue along with the
  draft and the tray. A queue held in `App` would have to join the `ok` branch of
  `switchWorkspace` by hand.
  `App.tsx` owns the workspace switch: the `ok` branch is where every
  workspace-scoped App state must be cleared, and `<InputBar key={cwd}>` covers
  everything living inside the composer. Both entry points — a foreign session
  row and the sidebar's "Open project" affordance — share that one reset via a
  nullable `resumeId`.
- `src/shared/` — types + pure modules both processes import. `background-tasks.ts`
  (#83) is the CLI level's whole vocabulary: `parseBackgroundTasks` is the trust
  boundary on the payload (`task_id` is identity so a row without one is dropped;
  `task_type` and `description` are display-only so a missing one costs a label,
  never a row), and `nonAgentTasks` drops **only** `local_agent` — an unknown
  future `task_type` is KEPT, because an allow-list would make the panel lie by
  omission the first time the CLI grows a kind. `announce.ts`
  (#75) is the turn-end decision table: `shouldAnnounce({ outcome, focused })`
  over the three terminal outcomes, where `turn-aborted` is **silent by
  design** and `ANNOUNCE_COPY` excludes it BY TYPE, so a fourth outcome cannot
  ship without copy. `backdrop.ts`
  (#69) is the window material's two-string whitelist (`acrylic` | `mica`) and
  the trust boundary `backdrop:set` reuses before calling
  `setBackgroundMaterial`; it **compares, never coerces**, so an object that
  stringifies to a valid value is still a stranger. `queued-send.ts` (#80) is the
  composer's queued-send decision: `decideQueue({ outcome, queued, engineDead })`
  → `flush` | `unqueue` | `none`, stated POSITIVELY as "turn-end with a live
  engine" because all three terminal outcomes clear `busy` — a not-busy rule
  resends after **Stop** and can spend the prompt on a terminal engine (#73).
  Exactly one of its twelve rows sends; every other row **unqueues**, which
  releases the commitment and never the text, and that is what lets Stop stay
  the button under the user's cursor while a prompt is queued. It also holds
  `LastTurn`, whose **nonce** is load-bearing: two turns ending the same way must
  be two events or the second queued prompt never fires.
  `window-bounds.ts` (#79)
  holds both halves of remembering the window's geometry: `isBounds` is the
  trust boundary on `bounds:set` and on localStorage (four finite numbers,
  **positive extent but negative position allowed** — the monitor left of the
  primary has negative coordinates, so negative is a normal place to keep a
  window, and a coercing guard would admit a blob of numeric strings), while
  `clampBounds` is a **safety** property rather than a validation one: a stored
  position promises a display layout that may not exist, and restoring onto an
  unplugged monitor puts the window where it cannot be reached. Its
  load-bearing test is the **identity** case — valid bounds pass through
  byte-identical — because a clamp that nudged every launch would still satisfy
  every "it is on screen afterwards" assertion. The display list is read **when
  applying**, never cached at boot. `session-groups.ts`
  owns the sessions rail's filter/group/cap order; `cwd-key.ts` is the one
  directory fold (comparison only, never a path); `session-titles.ts` holds the
  enrichment predicate and the measured "substantive prompt" rule, with the
  renderer's promise cache beside it in `src/renderer/src/enriched-titles.ts`.
  `session-watcher.ts` owns live-tail's main half: ONE directory-level watch at
  a time, filtered to `<id>.jsonl`, debounced, epoch-fenced, behind an injected
  `WatchIo`. It emits a signal and nothing else — transcripts never travel
  through it.
- `src/main/cli-path.ts` — WHICH Claude Code binary runs. The host `claude` on
  PATH when there is one, else the SDK's bundled copy. A PATH walk, never a
  `which` shell-out.
- `src/main/agent-view.ts` (#91) — the CLI's **agent view**, read on demand:
  `claude agents --json --cwd <workspace>` behind `background-sessions:list`.
  This lists whole **live background sessions**, and is the third thing in this
  repo called "agent" — not the Agents dock (subagents inside the open session)
  and not `background-tasks.ts` (jobs inside the open session). It is the app's
  **only `child_process` spawn**, deliberately re-added: `cli-path.ts`'s rule
  against one is conditioned on *"a question `fs.existsSync` can answer"*, and
  #90 established this is not one — no SDK route exists, and the two on-disk
  stores cover 2 of 6 and 1 of 6 active rows because the CLI performs a join.
  `~/.claude/daemon/roster.json` carries attach credentials and is **never
  read**. The binary comes from `cli-path.ts` and the env from
  `backend-mode.ts`'s `getSpawnEnv`, so this listing cannot drift from the CLI
  it lists and a native-mode app does not shell out through the proxy. `null` is
  a FAILED look and `[]` an empty workspace, the same nullable contract
  `session-store.ts` speaks. `parseAgentView` keeps only `kind === 'background'`
  — which is simultaneously the background-only rule and how the app's own
  session, which registers as `kind: "interactive"` and which `cwd` cannot
  exclude, is dropped. Rows are keyed on `sessionId` (`id` is absent on
  interactive rows), `state` is carried as the RAW string because the set is
  open, and `pid`/`status` are not carried at all because no single field
  describes liveness. **Nothing polls it**, at ~893ms of CLI process per look.
- `tests/` — vitest + testing-library shell tests (jsdom, `vitest.config.ts`)
- `DESIGN.md` / `PRODUCT.md` — Frost Mono design system + product context (impeccable reads these)
- `docs/design/frost-mono-reference.png` — canonical visual reference

## How to run
- `npm run dev` — electron-vite dev (Electron window)
- `npm run typecheck` / `npm test` / `npm run build` — the merge gate
- **GUI check (agent/headless):** `run-desktop` skill —
  `node .claude/skills/run-desktop/driver.mjs [--cycle]` launches the built app,
  reads the titlebar pills, screenshots the window (needs `npm run build` +
  `npm i --no-save playwright-core`)

## Where to look first
- `.context/pick-up.md` — current frontier + landmines (currently: **#110 landed
  and closed, and THREE tickets are open — #111–#113, all `ready-for-agent`, with
  #111 the next unblocked one; the batch has no spikes left, so premise
  reproduction and mutation evidence apply to every remaining one**; run the
  frontier query anyway, it is the authority and this line has been wrong before.
  **31 `gui-*.mjs`** — 30 assertion drivers plus the observational
  `gui-scope-zoom-pill` — and **four `.cjs` probe entry points** (`gui-78-probe`,
  `gui-78-renderer-probe`, `gui-79-probe`, `gui-110-probe`), with **two standing
  environmental reds**,
  `gui-75` (focus-dependent) and `gui-52` (the CLI returning an empty model
  list); both are premise failures, not regressions, and both were reproduced on
  clean `main` before being called so)
- `scripts/spike-81-background-tasks.mjs` — the CLI-measurement harness (#81),
  the #27 pattern with the background path actually exercised. Drives SDK
  `query()` with `engine.ts`'s exact options, imports the app's **real**
  `cli-path.ts` so it cannot drift onto a different binary, dumps JSONL outside
  the repo and evaluates the ticket's three conditions mechanically. ~20s a run;
  re-run it after any CLI upgrade that makes a background-task claim doubtful
- `scripts/spike-90-agent-view.mjs` — the newest sibling (#90) and the one to
  copy for **scrubbing** and for **not trusting a name**: it answers six
  questions mechanically, records only shapes/counts/vocabularies/timings, and
  probes SDK candidates by **calling** them against a real session rather than
  matching their names (its own first run got the headline answer wrong that
  way). Re-run it after any CLI upgrade that changes `claude agents --json`
- `scripts/spike-104-late-subagent.mjs` — the newest harness (#104) and **the one
  to copy for anything INTERMITTENT**. It drives real turns through the SDK with
  `engine.ts`'s query shape, and its mechanism is repetition: a single-shot
  instrument cannot measure a race, and this one's first version printed
  `AUTHORISED TO BUILD: false` on the run after it had already proven the defect.
  It now runs several turns against one query, stops at the first late ordering,
  reports how many turns that took, and states in its own output that an
  all-early run does **not** refute the finding. Two of its review-caught bugs
  transfer to any harness: a `null` status classified as terminal (matching
  `engine.ts`, an absent status is a progress tick), and a filter on a field that
  was never recorded, which made its own predicate unconditionally true
- `scripts/spike-105-model-pick-channels.mjs` — the newest harness (#105) and
  **the one to copy when an empty result has more than one possible cause**. Its
  design is a cause-separation rather than a measurement: three phases, each
  killing one candidate explanation, because `gui-52`'s standing red made "the
  CLI has no models" and "the engine is null" produce the same empty array.
  Phase A asks the CLI directly with no Electron in the picture (the app's real
  `cli-path.ts` / `backend-mode.ts`, `engine.ts`'s option shape) and got **119
  commands / 15 models**, which kills the confound at the source; phase B asserts
  `src/main/index.ts`'s handler bodies mechanically so the harness fails loudly
  when the code moves under it; phase C drives the **built app over its own IPC**
  through playwright-core. Its independent witness is the **process tree** — the
  SDK's query is a child of Electron's main process, so engine teardown has an
  OS-level signature that knows nothing about arrays. Costs **zero CLI turns**:
  every read is `supportedModels()`/`supportedCommands()` on a warm query and no
  prompt is ever sent, which is the experiment rather than an economy. Re-run it
  after #112 lands — its phase-C AFTER counts turning non-zero is the fix's
  end-to-end evidence
- `scripts/spike-108-turn-lifecycle.mjs` — the newest harness (#108) and **the one
  to copy when a claim has a CONSEQUENCE and a REACHABILITY that can fail
  separately**. Three phases: source facts as a drift alarm (asserted, never
  cited), the SDK alone for the interrupt question, and the built app over its own
  IPC for the send question — the last split again into *can a user do this* and
  *what happens when it is done*, because fusing them can only answer the
  conjunction. It counts sends at the IPC boundary with a second
  `ipcMain.on('chat:send')` listener in main (gui-80's instrument), and its
  witness for "the turn is still live" is **main's own overlap refusal** rather
  than anything rendered. `SPIKE108_PHASES=A` re-runs the drift alarm alone in a
  second; `B` and `C` cost real CLI turns. Re-run phase C2 after #113 lands — it
  is that fix's end-to-end evidence
- `.claude/skills/run-desktop/gui-110.mjs` — the newest GUI driver (#110) and
  **the one to copy when a remedy can fail in two places that different processes
  own**. Three launches against one profile, in `gui-79`'s probe-as-entry-point
  shape, and its first launch is a **positive control** — it moves and waits past
  the debounce, so the ordinary store path is proven *before* anything is
  concluded from storage not changing, without which "the old value is still
  there" is trivially true. It reports two witnesses APART: whether main SENT
  `bounds:changed` during the close (main's own fact, seen by wrapping
  `webContents.send`) and whether the value LANDED (the next launch's `bounds:set`
  mount push — what the renderer read out of localStorage before this launch's
  own reporting could rewrite it). It also **refuses to score** a run where the
  debounce fired before the close, since that run never entered the window the
  ticket is about. Re-run it after any Electron upgrade that could change when a
  `webContents` stops accepting sends
- `scripts/spike-97-mint-budget.mjs` — the sixth harness (#97) and **the odd one
  out**: it drives the built WINDOW through playwright-core instead of the CLI,
  so it imports no app module and needs `npm run build` first. **Copy it for
  measuring anything rendered.** Its mechanism is a **token differential** —
  override a design token and diff the frame, so `A - B = a·(M - N)` and the
  ground cancels exactly, which is what makes it immune to `--disable-gpu`
  flattening acrylic and what removes any need for a colour tolerance. It
  self-calibrates in-run (a known solid-accent element must read `a = 1.0000`, a
  null control must read 0, and a band of known area must be recovered exactly
  while tripping the fail branch), so a zero from it means something
- Tracker: **spec #58 (non-lossy tool inspector) delivered and closed** with
  #59 (replay text-block joining), #60 (the store's three silent failures),
  #61 (full output disclosure), #62 (structured input inspector) and #63 (Edit
  hunk diff); **spec #55 (live-tail) delivered and closed with
  #56 (gui-55 driver, red-verified) and #57 (live-tail core)**; **#52 (model pill follows the CLI),
  #53 (CLI-sourced model list), #54 (no resume before the first turn), #50 and
  #51 closed**; **spec #64 (Appearance panel + session deletion)
  DELIVERED and CLOSED** — #65 (`f0dfc68`, driver gate restored), #68
  (`70c904f`, session deletion), #66 (`a7c0470`, Appearance dock + zoom), #67
  (`e16ace6`, accent quartet + two literals tokenised), #69 (`add4e5b`, Backdrop
  control) and #70 (`1769aa4`, four themes); **#71 (`b6e8911`, `gui-51` measured
  in device pixels) and #72 (`9fecc10`, the session title truncates instead of
  overlapping) closed standalone after it**; **#73 (`6b4a831`, a way out of a
  terminal stream death that keeps the conversation, plus the warm-up resume
  binding it exposed) and **#74 (`07544e8`, the renderer runs sandboxed) closed**; **#75
  (`9905e1d`, a turn ending while nobody is looking announces itself) closed**;
  **#76 (`c9114a5`, `gui-48` drives the busy refusal instead of printing
  `SKIPPED`) closed**; **#77 (`88c1e3f`, `gui-51` drives every surface it names
  into overflow) closed**; **#78 (`51ea6d5`, the launch artifact measured and the
  `win.show()` gate **declined** — no `src/` change; the ADR's "every launch, for
  every user" premise measured FALSE, because Chromium persists the per-origin
  zoom in `userData`) closed**; **#79 (`03ab834`, the window remembers its size
  and position, and the `win.show()` gate #78 declined was BUILT here for bounds
  only) closed**; **#80 (`1855910`, type-while-busy composer with a queued send)
  closed**; **#81 (`002e524`, `background_tasks_changed` measured on the host CLI
  2.1.220 — it **does** fire, all three authorising conditions HELD, and `src/` is
  **still unchanged** because every avenue for surfacing it is Out of scope on
  that ticket; the build is authorised for a future one) closed**;
  **#82 (`3f34737`, the Agents dock re-reads its sidecars on every turn end, and
  a re-read no longer blanks what it already has — see
  [[2026-08-01-a-refresh-must-not-blank-what-it-has]]) closed**; **#83
  (`ea780a0`, the background-tasks section fed by the CLI's level through a third
  injected port — REPLACE semantics end to end, the per-process reset carried by
  the engine's own `close()`, and the `local_agent` guard untouched; see
  [[2026-08-01-a-level-is-replaced-not-accumulated]]) closed.** Both were
  filed under the 2026-08-01 autonomy grant that took all seven parked calls, see
  [[2026-08-01-the-background-agents-seed-decided]];
  **#84 (`335df49`) and #85 (`3e24a53`) closed** — the spawner measured reachable,
  then nesting shipped as the owner's hybrid; **#87 (`75f1db9`, the
  extended-thinking block reaches the app and its `thinking` field is EMPTY —
  measurement only) and #88 (`833f969`, MCP status measured alive and `init`
  found to fire once per TURN — measurement only) closed**; **#89 (`5e41520`, the
  `entrypoint` this app writes is a fact about the LAUNCH ENV — comment-only
  `src/` diff, and it AMENDS
  [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]]) closed**;
  **#90 (`c989fe5`, the CLI's background sessions measured REACHABLE but only as
  a ~893ms subprocess per look, poll-only, with the app appearing in its own
  listing — measurement only, no `src/` diff; see
  [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]])
  closed, and it did NOT unblock #91, which still waits on #86**;
  **#93 (`07c0068`, every interactive control wears the app's focus ring instead
  of Chromium's — six CSS rules, no new token, no JSX change, and the treatment
  picked per control by what it paints rather than applied uniformly, because the
  shared focus group would have replaced authored fills; see
  [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]]) closed**;
  spec #41 (Resume anything)
  **delivered and closed** with tickets #43–#49; #42 (multiline composer) closed
  standalone; specs #25 (Agents surface), #26 (Attachments) and #36 (slash
  commands) delivered and closed with tickets #27–#40; closed specs #9 / #16 /
  #20 hold the earlier history. **#94** (`e1a2c31`), **#95** (`e9a3c28`) and
  **#96** (`93ccd7d`, the two off-scale `DESIGN.md` values conformed — the
  `.model-menu-item` weight rule deleted so the row inherits 400, and
  `subagent-slide` 180ms → 200ms — with `gui-96` the **only** guard on either,
  since jsdom sees neither a computed weight nor an animation duration) are
  **closed**. **#97** (`96fb20f`, the mint budget measured by a **token
  differential** — a declaration spends the accent iff its computed value moves
  when the token moves, and a pixel's accent alpha is recovered from `A - B =
  a·(M - N)`, in which the ground cancels; **verdict: the enumeration half of
  `DESIGN.md:7` is VIOLATED at 30 unlisted surface declarations while the ≤10%
  half is SATISFIED at a peak 1.02% ink / 1.08% coverage** — measurement only, no
  `src/` diff, and `DESIGN.md` deliberately NOT amended, so the call stays the
  owner's on #92) is **closed**. **#98** (`f1813bc`, the subagent transcript
  viewer converts from a right-edge drawer to a **centred popup** — owner-decided
  placement, `subagent.css` the only `src/` file touched, an 820px pane derived
  term-by-term so `.chat-column` measures 760 in **both** scroll states, the entry
  turned from an X slide into `DESIGN.md`'s 4px Y rise with the keyframe name
  kept, and **neither anti-modal ADR superseded** while the glass-ban question is
  recorded **unresolved**; see
  [[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]]) is
  **closed**. **#104** (`795be69`, a subagent's terminal status delivered through
  its own injected `onSubagent` port after the late ordering was measured
  **reachable but intermittent** — LATE 14519ms, early 1699ms, LATE 13126ms across
  three runs — with `drainSubagents()` still forbidden on the success branch; see
  [[2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding]])
  is **closed**. **#105** (`0aae906`, a **spike** — picking a model, flipping
  permission or flipping backend leaves **both** live read channels empty until
  the next send, measured **15 → 0 models and 119 → 0 commands across 6/6 warmed
  runs** of the built app driven over its own IPC with no prompt sent; the
  ticket's stated confound measured **FALSE** — the CLI itself answers 119
  commands and 15 models here — and the emptiness **attributed** to the nulled
  handle by an OS-level witness, the SDK's query being a child process of main,
  which was seen still alive while the app answered `[]`; remedy priced at a
  **median 1539ms per pill click** and filed as #112, **no `src/` diff**; see
  [[2026-08-04-an-empty-list-is-attributed-not-observed]]) is **closed**.
  **#106** (`88ddf19`, a clipboard image that fails to read is refused for the
  reason it actually failed instead of being blamed for its media type — the
  read resolves to `null` rather than `''`, and the composer pushes its own
  rejection because a read failure is a property of the attempt, not of the
  candidate, so `attachment-policy.ts` is untouched; premise reproduced first and
  mutation-verified twice, since the fix's two halves fail differently; see
  [[2026-08-04-a-failure-flattened-into-a-value-is-judged-as-one]]) is
  **closed**.
  **#107** (`7e62f9e`, the rail can no longer delete the session a turn is
  streaming into — the batch's only data-loss defect, whose window is a fresh
  conversation's first turn, when the renderer's `activeSessionId` is still null
  and the row is therefore not `active`; the refusal moves to main in
  `delete-guard.ts` and the pane reset asks main when the renderer has nothing,
  since `turn-aborted` and `error` clear `busy` without reading the id back; the
  rail's control is untouched and `tests/sidebar.test.tsx` needed no edit; see
  [[2026-08-04-a-refusal-belongs-where-the-fact-lives]]) is **closed**.
  **#108** (`aa8e683`, a **spike** — two claims that came apart in opposite
  directions: a second `chat:send` under a live turn really does tell the renderer
  the turn ended, measured at **518ms** with main **still holding `turnResolve`**,
  witnessed by main refusing a real composer send moments later rather than by
  anything rendered; but **no input device can produce that second send** — only a
  same-task double dispatch does, and the realistic case is refused by the
  **emptied draft** rather than by the busy flag, so the composer is held shut by
  a UI convenience while `chat:send` has no check at all, filed as **#113** on
  that warrant; the hung-interrupt half is **closed on the measurement**, 6/6
  driven interrupts answered at 4–29ms, on #78's precedent; **no `src/` diff**;
  see [[2026-08-04-the-composer-is-held-shut-by-a-draft-clear-not-a-guard]]) is
  **closed**.
  **#109** (`74cbecf`, `switchWorkspace`'s busy check was a TOCTOU rather than a
  gate — read before `await resolveTarget(...)` and acted on after it, so a turn
  starting in the gap was torn down by `closeEngine()` while the switch still
  returned `ok`; remedied by **one extra `isBusy()` read** with the pre-await
  checks byte-identical and no lock, queue or `switching` flag; the premise
  reproduced and the framing corrected — the window measures **18.2ms cold vs
  0.0ms warm** and therefore cannot be hit by two *human* actions, yet cold is
  the **ordinary** path because `session:list` drops the index and that same
  listing renders the row clicked to get here, so the rail's own refresh is what
  opens the gap; mutation-verified twice, the second mutation showing that a
  "tear down, then report busy" version **passes the status assertion** and is
  caught only by the port-by-port no-mutation checks; see
  [[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]]) is
  **closed**.
  **#110** (`86bab34`, the window's last move or resize survives a close inside
  the 250ms report debounce — the `closed` handler CANCELLED the pending push and
  main holds that rectangle until the message lands, so a cancelled report was a
  lost one; flushed on **`close` rather than `closed`**, with the debounce moved
  into `bounds-reporter.ts` because a message that is never sent leaves no trace
  any state-shaped test could read, which is how it survived #79's own driver;
  the flush races the renderer's teardown and `gui-110` reports main's send and
  the renderer's write as two separate numbers rather than assuming the race is
  safe — measured zero sends / stale rectangle before, one send at 66–69ms /
  the moved rectangle after; mutation-verified three ways; see
  [[2026-08-04-a-scheduled-report-is-not-a-sent-one]]) is **closed**.
  **As of 2026-08-04 THREE issues are open — #111–#113, all
  `ready-for-agent`**, none blocked; #111 is the next unblocked one and the batch
  has no spikes left. #111 was
  filed by #104's own review, #112 by #105's measurement and #113 by #108's.
  Run the frontier query rather than trusting this line

## Conventions
- One ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green first
- `.context/` commits ride main only

## Map

- [[stack]] — languages, frameworks, env vars
- [[active-work]] — current handoff state
- [[pick-up]] — frontier ticket + landmines
- [[decisions]] — settled questions
- [[happy-path]] — golden-path MVD
- [[flows]] — traced flows, with entry points and key files
