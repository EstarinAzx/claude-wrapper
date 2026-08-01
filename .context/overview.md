---
type: overview
project: claude-wrapper
updated: 2026-08-01
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
  restores the silent-empty-state bug. Its `deleteSession(id)` (#68) is the
  app's ONE destructive call: the SDK is invoked with the id ALONE — passing
  `dir` re-enters the realpath→encode branch this codebase removed — and a
  throw is classified by re-resolving the id against the store, never by
  reading the SDK's error text (`not-found` → `ok`, `unavailable` → `failed`).
  `switch-workspace.ts` owns the atomic workspace transition as a function over
  injected ports (the entry module is untestable under vitest);
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
  bounds back on `move`/`resize`, debounced 250ms, using
  **`getNormalBounds()`** so maximising never overwrites the remembered size.
  Its `warmUp` port TAKES
  the resume target (#73) — `resume` binds when the query is CONSTRUCTED and
  `ensureQuery` returns early ever after, so a bare `warmUp()` leaves the
  rebuilt engine on a fresh session while the pane, refilled from disk, looks
  correct; nothing but that argument's own pin can see it. `engine.ts` reports a
  terminal stream death through an injected `onTerminal` (#73), broadcast as
  `engine:terminal` — deliberately not an `EngineEvent`, because `emit()` only
  reaches an active turn and a stream dying BETWEEN turns emits nothing at all.
  It must never fire for `close()`, which main calls on every workspace switch,
  model pick and permission cycle. `transcript.ts` parses the
  native JSONL to the replay list and owns `sanitizeUserText`, the one place CLI
  markup is turned into readable text — anchored on the message's leading tag,
  never matched mid-string. `model-mode.ts` holds ONLY the pick state: the model
  list comes from the CLI (`engine.listModels()` → `supportedModels()`), and
  `picked` (which becomes `options.model`) is kept apart from `reported` (what
  the CLI says it is running, display only).
- `src/preload/` — contextBridge `window.api` (+ `index.d.ts` global type, included by `tsconfig.web.json`)
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
  two could not. See
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
- `src/shared/` — types + pure modules both processes import. `announce.ts`
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
- `.context/pick-up.md` — current frontier + landmines (currently: **#83 is the
  frontier and the only open ticket** — #82 landed, which unblocked it; run the
  frontier query anyway, it is the authority. No expected driver failure anywhere in the set,
  **22** assertion drivers plus the observational `gui-scope-zoom-pill` —
  `gui-75` is focus-dependent and its batch reds are premise failures, green on
  re-run in the last three batches, see `active-work.md`'s Known issues)
- `scripts/spike-81-background-tasks.mjs` — the CLI-measurement harness (#81),
  the #27 pattern with the background path actually exercised. Drives SDK
  `query()` with `engine.ts`'s exact options, imports the app's **real**
  `cli-path.ts` so it cannot drift onto a different binary, dumps JSONL outside
  the repo and evaluates the ticket's three conditions mechanically. ~20s a run;
  re-run it after any CLI upgrade that makes a background-task claim doubtful
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
  (background-tasks section fed by the level signal, through an injected port)
  OPEN and now UNBLOCKED — the frontier, and the only open ticket.** Both were
  filed under the 2026-08-01 autonomy grant that took all seven parked calls, see
  [[2026-08-01-the-background-agents-seed-decided]];
  spec #41 (Resume anything)
  **delivered and closed** with tickets #43–#49; #42 (multiline composer) closed
  standalone; specs #25 (Agents surface), #26 (Attachments) and #36 (slash
  commands) delivered and closed with tickets #27–#40; closed specs #9 / #16 /
  #20 hold the earlier history. **One ticket open — #83** as of 2026-08-01.
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
