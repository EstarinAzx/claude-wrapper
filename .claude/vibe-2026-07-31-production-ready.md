---
target: init
idea: "improve the wrapper and make it production ready"
partner: opus
pressure: codex/gpt-5.6-sol
pressure_via: sonnet
max_defer: 12
phase: fired
halted: false
---

## Decisions

- **"Production ready" here means in-app robustness and quality, never shipping it to anyone.** Distribution is out — warrant: "No installer, no code signing, no auto-update" @ `.context/decisions/2026-07-22-dev-run-only.md` · also "One user: the app owner" @ `PRODUCT.md` · pressure: STANDS. **Partner's sharpening, recorded because it matters later:** `dev-run-only` does NOT forbid packaging on principle — its body says "electron-builder can bolt on later" and grades reversibility "easy". What puts distribution out of scope tonight is the **owner's live constraint**, not that ADR. Nobody may later cite `dev-run-only` as a prohibition.
- **What the record affirmatively makes the product is the surface itself** — warrant: "The UI is the product" @ `PRODUCT.md` · pressure: STANDS.
- **KILLED by probe — no main-process crash-handler ticket.** Hypothesis: five unhandled promises in main (`shell.openExternal` ×2, `loadURL`, `loadFile`, `void watchSession`, `void engine.runTurn`; 4 `.catch(` calls in all of `src/`) would crash the app, since Node ≥15 defaults unhandled rejections to throw. **Measured with a throwaway Electron probe mirroring the real code and installing no handlers: FALSE.** Electron 43 / Node 24 keeps `--unhandled-rejections=warn` in main — a raw `Promise.reject` prints `UnhandledPromiseRejectionWarning` and the process survives and exits 0; `shell.openExternal` on an unregistered scheme does not even reject; `loadFile` on a missing file logs `ERR_FILE_NOT_FOUND` and survives. Probe deleted.
- **KILLED — no silent-swallow ticket.** Every `catch` in `src/` is deliberate and carries a comment naming its contract. The transcript parser try/catches per line and continues. Pressure REFUTED my first pass here (auditing `catch` misses fire-and-forget promises) and the refutation was correct — it sent me to `void watchSession`, which turned out to be **already guarded**: `try { … } catch { handle = null }`, with a comment naming the bare-`void` call site. No ticket.
- **KILLED — sessions-rail noise is not a headline.** The record says the rail "admits 112 rows to surface the 37 this app wrote". Measured live instead: **132 `.jsonl` in this project, 20 matching the driver signature, 3 with no cwd** — ~15% noise project-scoped, not a majority. Pressure REFUTED even that number (two prompt signatures measure one noise source, not total irrelevance) and is right; the claim is downgraded and unfiled either way.
- **Security needs no general ticket** — `isTrustedIpc` gates every channel, `setWindowOpenHandler` denies and hands off, `will-navigate` AND `will-redirect` are blocked, and `index.html` ships a real CSP. Pressure REFUTED the "no gaps" half by challenging `sandbox: false`, and **the refutation was correct and produced ticket 2** (see below).
- **Engine-terminal-on-stream-death is SETTLED and stays settled** — warrant: "Recovery is explicit: picking a folder builds a fresh engine" @ `.context/decisions/2026-07-23-engine-terminal-on-stream-death.md` · pressure: STANDS. The ADR chose the terminal flag *over* auto-restart because a silent restart "would begin a fresh SDK session and drop the whole conversation". Ticket 1 does not touch that: it stays **user-initiated**.
- **MEASURED — the recovery that ADR endorses destroys the conversation, which is the very harm it invoked.** `chooseWorkspace` calls `switchWorkspace(null, choice.cwd)` with `resumeId` hardcoded `null`, so the rebuild starts a fresh SDK session with no `resume` and `adoptSession(null)` empties the pane. So there is **no conversation-preserving way out of `terminalError` today**, on a state reachable by routine auth expiry, network drop or CLI crash. This is recoverability, not convenience — and it is the answer to Pressure's R5.
- **MEASURED — `sandbox: false` is an unnecessary weakening.** Preload source imports only `contextBridge`/`ipcRenderer` plus type-only imports; the **built** bundle `out/preload/index.js` contains exactly one require, `require("electron")`. No Node builtin at source or after bundling · pressure: STANDS.
- **Ticket 1 ships with its premise as acceptance criterion, not as an assumption.** Pressure REFUTED ticket 1 on a real gap — nothing measured says a session id is still resumable after *abnormal* stream death, only after a normal end. Rather than argue, the objection is written into the ticket as its **first, blocking** acceptance criterion, with a specified fallback if it falsifies. That is this project's established practice, not an evasion — warrant: "carry an amendment written after a probe measured their stated premise" @ `.context/active-work.md`, and #68 is the worked example: "The probe falsified its own premise and the feature survived" / "The scope did not widen".
- **A failure-path change must be tested on the path's emptiness, not its status** — warrant: "the **emptiness** of every rejection path" @ `.context/decisions/2026-07-28-the-workspace-switch-is-one-transaction-over-ports.md` · pressure: STANDS. Carried into both tickets: an error-handling change whose point is that nothing user-visible happens is exactly where a green test proves nothing, so assertions go on the mechanism (call count, call ORDER, a read that must not happen).
- **Crash handling, unhandled rejections and error boundaries are genuinely unwritten ground** — confirmed mechanically: `uncaughtException`, `unhandledRejection`, `ErrorBoundary` and "error boundary" return **zero** matches across the whole `.context/` tree. Nothing was reversed by leaving them alone.
- **No renderer error-boundary ticket.** Real absence (zero boundaries; `main.tsx` is `createRoot(...).render(<StrictMode><App /></StrictMode>)`), but **reachability is unproven** — the transcript parser is in main and guarded, and the renderer receives typed values. Filing it would be the generic-production-readiness busywork Pressure was briefed to attack. Left unfiled deliberately, recorded here so it is not re-derived as an oversight.

## Needs you

**Carried from the 2026-07-31 titlebar run — still parked, still the owner's.**
Full original entries in `.claude/vibe-2026-07-31-titlebar.md`; kept here verbatim
so every `.context/` pointer at "`.claude/vibe.md` under `## Needs you`" stays true.

- [ ] **Tailwind's fate — adopt utilities, drop it, or keep it as a token store?**
      took: KEEP AS-IS (no change, zero diff)
      alt: drop two devDependencies + the vite plugin and inline `@theme` into `:root`; or deliberately adopt utilities for new UI
      why: Partner DEFERred — no warrant exists. The record is explicit that you personally overrode a YAGNI push-back to install it, on the stated grounds the app "will evolve" and you wanted utilities from day one. Reversing your own override while you sleep is not a call an agent gets to make.
      reversible: yes
- [ ] **Which of the titlebar's 8 buttons should leave or move?**
      took: NONE — #72 fixed the measured defect and changed no control
      alt: relocate the two pills, drop the app name, or move a dock toggle out
      why: Partner DEFERred; pure taste. The stated rationale ("each button eating drag region") is measured and false, so the remaining case is aesthetic, which is yours.
      reversible: yes
- [ ] **Should the three dock toggles (Commands / Agents / Appearance) collapse into one control?**
      took: NO — leave all three
      alt: one menu, or one segmented switcher, given the docks are already mutually exclusive
      why: Partner DEFERred. Constrained: #66 pins the dock to no `input`/`select`, #69 pins every `role="radio"` in the Appearance panel as a backdrop.
      reversible: yes
- [ ] **#72 centres the session title in the space available, not in the window — ~15css off true centre.**
      took: in-flow flex centring (never overlaps at any width, no magic number)
      alt: keep absolute centring and cap it with `max-width: calc(100% - 2 * <side>)`
      why: the alt needs a magic number equal to the wider titlebar block, which rots the moment a control is added or removed.
      reversible: yes

**This run (3 new, all reversible):**

- [ ] **Should the window remember its size and position across launches?**
      took: NOT FILED — no ticket
      alt: the ADR-sanctioned shape, which is **not** a store: renderer `localStorage` + push on mount, main calls `setBounds` before `show()`, gating `win.show()` on the first preference push with a timeout fallback. That also fixes the zoom reflow the ADR already names.
      why: Partner DEFERred. Measured: `BrowserWindow` is constructed with hardcoded `width: 1100, height: 780` and `src/main/` contains no `getBounds`/`setBounds`/`userData` and no `writeFile` at all — main persists nothing, so the window forgets its geometry every launch. But **a window that remembers its geometry is a feature, not a defect against any recorded criterion**, and the governing ADR gates its own escape hatch on evidence — "Build it only if measured." I measured that nothing persists, **not** that the loss is objectionable. Those are different findings, and the second one is yours.
      **Trap for whoever picks this up:** `2026-07-31-a-preference-lives-where-it-is-read` forbids the obvious implementation **in those words** — "No preferences file, no main-side store" — and the rejection was not about cost, it was that a second store makes every later preference open with a store-selection argument. A `userData` JSON is a **reversal**, not a gap-fill, and must say so out loud per the ADR-conflict rule. Note also that window bounds **falsifies that ADR's stated premise**: its argument runs through `setBackgroundMaterial` being runtime-settable, and `BrowserWindow` takes width/height in its **constructor** — the first preference in this app that genuinely needs an answer before the window exists. Amend, do not reverse.
      reversible: yes
- [ ] **Which daily-driver polish item do you want next, if any?**
      took: NONE FILED
      alt: native turn-end notification + taskbar flash · type-while-busy composer with queued send · extended thinking as a collapsed strip · context-pressure meter · typed failed-turn recovery · MCP + settings-parse health surfacing · turn pulse
      why: Partner DEFERred and was right to. These sit in two **flat, unranked** lists under `## Deferred (still no spec)` in [[active-work]], and the record argues comparatively when it wants to (`#68 is explicitly not the answer`) — so the flatness here is silence, not omission. Picking among them is taste, and taste is yours. The one *fact* rather than preference, carried but not acted on: one-click restart was the only item with a live ADR already costing it and a user-facing dead end in shipped copy — which is why it became **#73** and the rest did not.
      reversible: yes
- [ ] **Do you want a renderer error boundary?**
      took: NOT FILED
      alt: wrap `<App />` so a render throw shows a recoverable surface instead of blanking the window
      why: the absence is real and measured — **zero** error boundaries in the renderer, `main.tsx` is `createRoot(...).render(<StrictMode><App /></StrictMode>)`, and `uncaughtException` / `unhandledRejection` / `ErrorBoundary` return **zero** matches across the entire `.context/` tree, so this is genuinely unwritten ground. But **reachability is unproven**: the transcript parser lives in main and try/catches per line, and the renderer receives typed values. Filing it on "blast radius" with no measured crash is exactly the generic production-readiness busywork Pressure was briefed to attack, so I left it unfiled deliberately rather than by oversight. If you want belt-and-braces on a daily driver, that is a legitimate owner call and this is the entry for it.
      reversible: yes

## Log
- [boot] Fresh file for a new idea. Prior run (`phase: fired`, titlebar batch) was terminal — its relay chain closed at leg 2 with the queue drained — so this is a boot, not a resume. Prior run archived to `.claude/vibe-2026-07-31-titlebar.md`; its four parked owner calls carried above unchanged.
- [boot] Frontier verified live, not trusted from prose: `gh issue list --state open --limit 100` → empty, `gh pr list --state open` → empty, `git branch -a` → `main` only, `git log origin/main..main` → empty. Baseline `56b11b4` on `main`, pushed, tree clean.
- [boot] Destination DETECTED as GitHub: `gh auth status` logged in as EstarinAzx (scopes `gist, read:org, repo, workflow`), remote `origin` → EstarinAzx/claude-wrapper. No AskUserQuestion fired.
- [boot] `.context/` present (7 files + decisions dir) → no `/context-init` offer. `docs/agents/` present → no `/setup-matt-pocock-skills` offer.
- [boot] Pressure resolved by rule 3 against live `wisp routing` (first non-Claude family): sonnet → codex/gpt-5.6-sol. No slot rebind owed, so no restore debt.
- [boot] Pressure's first spawn died `Prompt is too long` — the `general-purpose` agent type carries every MCP tool schema, which overflows that Target. Retried once per the preset's failure-mode rule with a lean-toolset agent type and an explicit format override. Up and READY. **Cross-model scrutiny is intact; no `SAME-MODEL (degraded)` stamp is owed.**
- [scope] **OWNER CONSTRAINT, given live mid-run (real input, not proxied): "im not planning for ci yet just production ready quality of the wrapper."** CI is OUT of scope — no workflow ticket, no release automation. The idea is scoped to the quality of the wrapper itself. This outranks any warrant.
- [baseline] Gate measured green before anything was filed: typecheck clean, **823 tests across 56 files**, at `56b11b4` on `main`.
- [round 1] Partner answered 5 of 5 with warrants, **all grepped clean**, and corrected my framing twice — it split "production readiness" into a settled half and an unwritten half rather than answering the question I asked, and it refused to let `dev-run-only` be cited as a prohibition it is not.
- [round 1] Pressure **REFUTED 4 of 6**. Three refutations changed the outcome: `sandbox: false` is not required by a preload (→ became **#74**), auditing `catch` blocks does not cover fire-and-forget promises (→ sent me to `void watchSession`, which turned out already guarded), and my session-noise number measures one signature rather than total irrelevance (→ claim downgraded and unfiled).
- [probe] **Four hypotheses tested against the real tree; three died.** Main-process crash handlers (Electron probe: unhandled rejections are non-fatal), silent swallows (every `catch` deliberate and commented), `void watchSession` (already try/catch'd, comment names the bare-`void` call site). Only the `terminalError` recovery survived — and it survived *harder* than it started, because measuring it showed the endorsed recovery discards the conversation.
- [round 2] Pressure REFUTED #73's premise on a real gap — nothing measured says a session is resumable after *abnormal* stream death. **Not argued away:** written into #73 as its first, blocking acceptance criterion with a specified fallback, per the #68 precedent.
- [round 2] Partner **killed the window-bounds ticket** by citing a live 8-day-old ADR that forbids a main-side store in those words, and DEFERred whether the forgetting should be fixed at all. That is the cite-or-defer discipline paying for itself: without it this run would have filed a ticket that reversed a standing decision without saying so.
- [tickets] Deviated from the target's steps 6–7 deliberately, as the previous vibe run did: **skipped `/hp` and `/to-spec`.** The funnel converged on two independent, self-contained defects with no shared golden path; an MVD and a PRD over them would be ceremony. Went straight to two tickets. Recorded here rather than done silently.
- [tickets] **#73** (terminal-death recovery discards the conversation) and **#74** (run the renderer sandboxed) filed `ready-for-agent`. No blocking edge between them — they touch different processes and different files.
