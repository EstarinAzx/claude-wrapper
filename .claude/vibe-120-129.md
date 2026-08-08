---
target: init
idea: >
  render tables in output; code blocks with a copy button; edit message +
  resend; /rewind UI ("idk if /rewind works there but it's gotta have its
  UI"); /effort slider UI; the subagent chat view should be acrylic too;
  a user message input inside the subagent view; improve the subagent graph
  view ("it looks ass"); a keybind to background sessions ("/bg doesn't
  work"); bump the Electron app version to 1.0.0 towards the end.
  Operating: "i will be away from home so never tag any issue with ready for
  human"; opus is Partner, kimi (bound to sonnet) is Pressure; then wrap up
  and summon relays.
partner: opus              # anthropic/claude-opus-5 — vibe's default shape
pressure: opencode-go/kimi-k3
pressure_via: sonnet       # already bound; NO slot rebind, NO restore owed
pressure_actual: xai/grok-4.5 via the `haiku` family route — the owner-named
  kimi-k3 died three times on gateway 502/503 and judged nothing. Cross-model
  separation from Partner preserved. No `slot` rebind was used on either route,
  so NO route restore is owed on this or any halt path.
max_defer: 12
phase: fired
halted: false
filed: spec #120 (needs-triage) + slices #121–#128 (all ready-for-agent).
  **Zero issues tagged `ready-for-human`** — owner ban honoured and audited.
---

## The seed, split into what it authorises

Ten asks and three operating instructions. The asks are **not** one feature —
they span markdown rendering, composer history, two new CLI-surface controls,
the subagent viewer, the agent map, a global keybind, and a version bump.

1. **Tables render** — see the boot recon below. Already parses; unstyled.
2. **Code blocks get a copy button.**
3. **Edit a sent message and resend it.**
4. **`/rewind` UI** — the ask is explicitly conditional on the route existing
   (*"idk if /rewind works there"*). That is a spike shape, not a build shape.
5. **`/effort` slider UI** — same conditionality: a slider over what values?
6. **Subagent chat view goes acrylic.** This **answers a parked owner call** —
   pick-up's "Do not decide these" carries *whether the glass ban reaches a
   `var(--surface)` pane*, and #98 kept the viewer at `var(--surface)` with no
   `backdrop-filter` precisely to leave that question harmless.
7. **A user message input inside the subagent view.** The subagent viewer is a
   read-only transcript today. An input implies a send path into a subagent,
   which may have no route at all.
8. **Improve the subagent graph view** — aesthetic, `AgentMap.tsx` +
   `agent-map.css`. The only ask with no mechanism question in it.
9. **A keybind to background the session** (*"/bg doesn't work"*). #91's
   background rows are **read-only by construction**; this is a new write path.
10. **Version 0.1.0 → 1.0.0**, explicitly *"towards the end"* — i.e. last.

Operating instructions:

- **"away from home"** → the AFK autonomy grant (`afk-autonomy-grant` memory):
  removes ownership as a ground for deferring, **not** the need for a warrant.
- **"never tag any issue with ready for human"** — binding, and it is a
  *labelling* ban, not a ban on recording defers. Defers still land in
  `## Needs you` here.
- **Partner `opus`, Pressure `sonnet`→kimi-k3** — this run takes vibe's DEFAULT
  shape (Partner-is-Claude, Pressure-is-cross-model), unlike the #115 run which
  inverted it. Cross-model separation holds.

## Decisions

- Destination is **GitHub** — detected, not asked: `gh auth status` reports
  `Logged in to github.com account EstarinAzx`, `origin` is
  `https://github.com/EstarinAzx/claude-wrapper.git`. pressure: n/a (detection)
- `.context/` and `docs/agents/` both exist → init steps 3 and 4 are no-ops.
- Grill fork is **`/grill-me`**: no `CONTEXT.md`, no `docs/adr/` (both checked,
  both absent — same as the #115 run). Domain model lives in
  `.context/decisions/` + `DESIGN.md` + `PRODUCT.md`. pressure: n/a (detection)

### Round 1 — 12 warrants, all grep-verified byte-for-byte

- **A1** — `markdown.css` can carry ONLY descendant rules; react-markdown and
  highlight.js own the markup. Tables are stylable from here; a copy button is not.
  warrant: `"Both own their own markup, so these can only ever be descendant rules."` @ `src/renderer/src/styles/markdown.css`
- **A2** — the raw-text stylesheet pins: every scrollbar rule must stay global.
  warrant: `"test('every scrollbar rule is global, never scoped to one component', () => {"` @ `tests/scrollbar.test.ts`
- **A3** — the `@import` order IS the cascade; `markdown.css` sits after
  tokens/themes/base/shared, so adding rules there is safe.
  warrant: `"import order is the cascade, and the entry file says so"` @ `.context/decisions/2026-07-30-the-import-order-is-the-cascade.md`
- **A7 / A9** — the dumb-pipe rule: the renderer never parses, validates or holds
  a command list; the wrapper's job is to render results and help type the name.
  warrant: ``"the renderer never parses the leading `/`, never validates the name, and never"`` @ `.context/decisions/2026-07-27-slash-commands-are-a-dumb-pipe.md`
- **A8** — only a COUNT of CLI commands was ever recorded, never the names.
  warrant: `"\"supportedCommandsCount\": 121"` @ `scripts/spike-116-findings.json`
- **A10** — the glass ban, and its scope is DESIGN.md's renderer-wide "Bans in force".
  warrant: `"no decorative extra glass layers inside the window (the OS acrylic is the one glass)"` @ `DESIGN.md`
- **A11** — the parked question, verbatim, still under "Do not decide these".
  warrant: ``"Whether `DESIGN.md`'s glass ban reaches a `var(--surface)` pane at all."`` @ `.context/decisions/2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved.md`
- **A14** — the map's encoding is pinned: shape = kind, colour = status.
  warrant: `"Visual encoding: shape = kind, colour = status."` @ `.context/decisions/2026-07-25-map-geometry-is-a-pure-slot-layout.md`
- **A15** — no rule on window-level keybindings exists; nearest is the titlebar's
  control count, pinned at 8.
  warrant: `"The titlebar control count is still 8,"` @ `.context/decisions/2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it.md`
- **A16** — #91 put attach, peek, reply and dispatch explicitly out of scope; no
  write route to the background-session surface is recorded.
  warrant: `"Out of scope, explicitly: attach, peek, reply, dispatch."` @ `.context/decisions/2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it.md`
- **A18** — the standing rule is *build only if measured*.
  warrant: `"The record's own rule is *build only if measured*"` @ `.context/decisions/2026-08-05-a-declared-wire-type-is-not-a-callable-route.md`

Deferred at round 1: **Q4, Q5, Q6, Q12, Q13, Q17** — asked at product grain,
re-asked at mechanism grain in round 2.

### Round 2 — 10 more warrants, all grep-verified

- **A4b** — nothing in `src/` WRITES to the clipboard (the one use is a paste
  READ); a preload-surface change needs an ADR with a measured reason.
  warrant: `"**If a future preload genuinely needs Node,** the honest move is an ADR"` @ `.context/decisions/2026-07-31-the-renderer-is-sandboxed-and-the-driver-must-not-undo-it.md`
- **A5b** — model output is on record as hostile input, through this exact
  `react-markdown` + `rehype-highlight` pipeline.
  warrant: ``"renders arbitrary model output through `react-markdown` + `rehype-highlight`"`` @ same file
- **A6b** — **the decisive one for edit/resend.** The renderer's message array is
  a PROJECTION of the disk transcript, replaced wholesale on adopt and on every
  live-tail reload. A renderer-side edit is erased by the next reload.
  warrant: `"setMessages(transcript.map(toChatMessage))"` @ `src/renderer/src/useChat.ts`
- **A12b** — zero `backdrop-filter` in the app's CSS; no cost measurement and no
  DWM-interaction measurement exists anywhere.
  warrant: ``"No `backdrop-filter`, no blur, no"`` @ `.context/decisions/2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved.md`
- **A13b** — `subagent:changed` is a **leaf channel**, one-way by construction;
  no inbound route to a running subagent is recorded anywhere.
  warrant: ``"`subagent:changed` is a leaf channel: main broadcasts, preload subscribes,"`` @ `.context/decisions/2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding.md`
- **A17b** — nothing reads the version at runtime, no About surface, `git tag`
  empty, the string exists in exactly one place.
  warrant: `"\"version\": \"0.1.0\","` @ `package.json`
- **A19** — an autonomy grant removes ownership as a ground for deferring without
  lowering the evidence bar; where the record already ARGUED a call, the record
  wins. The glass-ban question is recorded as **unargued**, which is the
  condition this rule distinguishes.
  warrant: `"The grant removes *ownership* as a ground for deferring. It does not lower the"` @ `.context/decisions/2026-08-01-the-background-agents-seed-decided.md`
- **A20** — `Chat.tsx` passes no `components` prop, and `grep -rn "components=" src/`
  is empty repo-wide. No in-repo precedent for overriding a markdown renderer.
  warrant: `"remarkPlugins={[remarkGfm]}"` @ `src/renderer/src/components/Chat.tsx`
- **A21** — the map ADR pins the layout, not only the encoding.
  warrant: `"The layout is a **tidy slot layout, not a physics solver and not a plain band**:"` @ `.context/decisions/2026-07-25-map-geometry-is-a-pure-slot-layout.md`
- **A22** — **the false premise under ask 9.** `/bg` is one of three ways to OPEN
  the CLI's agent view — a whole-terminal takeover — not a backgrounding command.
  That is the likeliest reason it "doesn't work" here.
  warrant: ``"empty prompt, `claude agents`, or `/bg`. The names collide and the scopes are"`` @ `.context/flows.md`

**Partner fabricated nothing: 22 of 22 quoted lines passed `grep -qF`.**

### Main's own SDK finding — it decides the slider's shape

- `sdk.d.ts:553` — `export declare type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';`
- `sdk.d.ts:1664` — `effort?: EffortLevel`, sitting on the **`Options`** type
  declared at `:1322` — the same object `model` and `resume` live on.

So the slider's five positions are not a taste call: they are the SDK's own type.
`ultracode` and `auto` appear in the COMMAND's `argumentHint` but in neither
`EffortLevel` nor any model's `supportedEffortLevels`. And because `effort` is on
`Options`, it binds at query CONSTRUCTION (#73's rule), which means changing it
must discard and rebuild the engine exactly as `model:set` already does.

### Main's own reading of the map ADR — Partner over-generalised

Partner's A21 argued the nearest precedent is an aesthetic ask already refused.
Read directly, the ADR's **Reversibility** section says the opposite:

> **Easy.** The geometry is one pure exported function with no callers besides
> `AgentMap.tsx`; a different layout is a rewrite of that function and its tests,
> with no change to the tree, the dock, or the merge.

What the ADR actually refuses is four NAMED alternatives — a graph library or
force simulation, a plain per-depth band, grid wrapping, and per-node captions —
plus baked text at any size. It does not refuse visual quality work, and it
declares layout change cheap and reversible.

## Boot recon — main's own, verified directly, NOT a Partner claim

Run before casting so the grill is grounded rather than speculative.

- **Tables already parse.** `remark-gfm` is wired on BOTH markdown render paths
  (`Chat.tsx:132` assistant, `:146` command) alongside `rehype-highlight`
  (`:133`, `:147`). `markdown.css` is 116 lines and contains **zero** table
  rules — no `table`, `thead`, `tbody`, `th`, `td`. So GFM tables produce real
  `<table>` DOM today and render unstyled. **The stated cause is CSS, not
  parsing** — which is A10's rule (*measure the stated cause before speccing*)
  applying before the grill even starts.
- **`rewind`, `effort`, edit-message and resend do not exist in `src/` at all.**
  Case-insensitive grep across `.ts`/`.tsx`: the only hits are two comments
  about `queued-send`'s resend-after-Stop rule. All four are new surfaces.
- **There is no global command-keybind registry.** The only `window`-level
  keydown listeners are `useZoom.ts:72` (zoom shortcuts) and
  `SubagentDrawer.tsx:95` (Escape/focus trap). A tenth ask needing a global
  binding has nowhere established to put it.
- **Version is `0.1.0`** in `package.json`.
- Components: `AgentMap.tsx`, `AgentsDock.tsx`, `AppearanceDock.tsx`,
  `Chat.tsx`, `CommandsDock.tsx`, `InputBar.tsx`, `Sidebar.tsx`,
  `SubagentDrawer.tsx`, `Titlebar.tsx`, `ToolCard.tsx`, `Welcome.tsx`.

## Recon #120 — the CLI's own command surface, measured

`scripts/recon-120-command-surface.mjs`, zero CLI turns (no prompt ever sent),
the app's real `cli-path.ts` + `backend-mode.ts` so the binary cannot drift.
This is a **call**, not a bundle grep — `supportedCommands()` is the CLI
enumerating itself, which is the evidence kind #116 accepted.

- **121 commands**, entry shape `object{argumentHint, description, name}`.
  A8 recorded only a COUNT; the shape and names are now measured.
- **`/rewind` — NOT advertised.**
- **`/effort` — ADVERTISED.** `description: "Set effort level for model usage"`,
  `argumentHint: "<low|medium|high|xhigh|max|ultracode|auto>"`.
- **`/bg` — NOT advertised.** Consistent with the owner's *"/bg doesn't work"*.
- **15 models**, entry shape carries `supportsEffort`, `supportedEffortLevels`,
  `supportsAdaptiveThinking`, `supportsAutoMode`, `supportsFastMode`.
  **14 of 15** set `supportsEffort: true`.
  `supportedEffortLevels` union = **`["low","medium","high","xhigh","max"]`** — 5.

**The mismatch that shapes the slider ticket:** the command advertises **seven**
argument values; the model metadata carries **five** ordered levels. `ultracode`
and `auto` are NOT members of `supportedEffortLevels` — they are modes, not
points on a scale. A linear slider can represent the five; it cannot represent
the other two without inventing a position for them.

**What this probe cannot settle** (#117, stated before it is over-read): it
measures ADVERTISEMENT, never effectiveness. A name present here authorises a
build ticket to be *written*; it does not prove invocation through this app's
send path does anything. A name ABSENT is the stronger result — it kills the
"wrap the CLI command" shape outright.

### Main's own clipboard finding — the copy button can ship dead

`src/main/index.ts:376-379`: dev loads `ELECTRON_RENDERER_URL` (http://localhost),
**production loads `win.loadFile(rendererFile)` — a `file://` URL**. The two do
not agree on secure-context or on Electron's default clipboard permission, and
**no `setPermissionRequestHandler` is registered anywhere** in main, so the
defaults apply unexamined.

A copy button written against `navigator.clipboard.writeText` can therefore pass
jsdom, pass `npm run dev`, and be **inert in the built app** — the exact
dev-works/prod-breaks shape #117 named as *a callable route is not an effective
one*. The ticket carries this as a requirement rather than a note: verify in the
BUILT app through a `run-desktop` driver, and carry a fallback that needs no new
preload surface (a hidden textarea + `document.execCommand('copy')`), because an
IPC route to main's `clipboard` module WOULD be a preload change and A4b makes
that an ADR.

### Round 3 — Pressure's verdicts, and what it killed

Adversary: **`xai/grok-4.5` via the `haiku` family route** — the fallback, after
the owner-named `kimi-k3` died three times (see Log). Cross-model separation
from Partner (`anthropic/claude-opus-5`) is preserved, which is the property
that matters.

**STANDS (7):** D1 tables-are-CSS · D3 no-message-mutation · D4 no-`/rewind`-build
· D5 five-position-slider · D6 effort-rebuilds-the-engine · D9 map-may-be-improved
· D10 `/bg`-false-premise.

**REFUTED (4), and three of the four are correct:**

- **D2 → REFUTED, and right.** Objection: *"warrant only requires an ADR when
  preload needs Node; an IPC clipboard bridge needs none, and file:// clipboard
  write is unmeasured."* I had read A4b as "any preload addition needs an ADR";
  it says preload needing **Node** needs one. An `ipcRenderer.invoke` bridge
  needs no Node. **Consequence: the copy button's clipboard route is UNDECIDED
  between `navigator.clipboard` and an IPC bridge, and the choice is a
  MEASUREMENT in the built app, not a design preference.** This converges with
  main's own `file://` finding above rather than contradicting it.
- **D8 → REFUTED, and right — the sharpest catch of the run.** Objection:
  *"warrant proves only that `subagent:changed` is outbound; a negative 'no
  inbound route anywhere' does not follow."* This is #90 and #116's lesson
  applied exactly: one channel's ADR saying it is outbound is not evidence that
  no inbound route exists anywhere. **Consequence: ask 7 is not "cannot build" —
  it is UNMEASURED, and must be probed by CALLING.**
- **D11 → REFUTED on the warrant, claim SURVIVES on measurement.** Objection:
  *"warrant only states the current version string; it does not support 'unread
  at runtime / no consequence.'"* Correct — `"version": "0.1.0",` proves the
  string exists, nothing more. Main then measured it directly: no `getVersion`,
  no `package.json` read, no `__APP_VERSION__` in `src/` or
  `electron.vite.config.ts`; the only `version` hits in `src/` are three
  unrelated comments; `git tag` count is **0**; there is **no electron-builder
  config**. The claim holds on observation instead of provenance — the same
  repair the #115 run made to its own F1 finding.
- **D7 → contested, sent back to Partner for the single permitted rebuttal
  round.** Objection: *"grant keeps the evidence bar and forbids overturning the
  record; #98 left the glass ban unresolved and banned backdrop-filter on that
  pane."* The load-bearing question is whether #98's no-`backdrop-filter` was a
  standing prohibition or that ticket's own scope boundary.

### Round 4 — the single permitted rebuttal, and D7 resolved

Pressure's D7 objection had two limbs. Partner answered both with warrants, and
all three passed `grep -qF`. **Running total: 25 of 25.**

- **A23 — the "banned" limb overstates the record.** #98's no-`backdrop-filter`
  is a **non-goal**, whose stated purpose is to keep the unresolved question
  harmless rather than to answer it. But it IS mechanically pinned: `gui-98`
  criterion 5 greps `subagent.css` for zero `backdrop-filter`, so acrylic reds
  that driver and the criterion must be retired explicitly.
  warrant: `"note: 'the non-goal that keeps the unresolved glass-ban question harmless'"` @ `.claude/skills/run-desktop/gui-98.mjs`
- **A24 — the decisive one.** #98 split the owner's instruction into what the
  owner STATED (executed) and what the owner did not state (settled against the
  record). **Material sat in the second bucket only because the owner had not
  named it.** The owner has now named it, which moves it into the first by #98's
  own division — distinct from A19's rule, which governs overturning a call the
  record *argued*.
  warrant: `"instruction did not state — size, motion, material, focus — was settled against"` @ `.context/decisions/2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved.md`
- **A25 — a deviation without a positive pin gets conformed away later.**
  Conformance passes recur and have already targeted this app's own accepted
  deviations; #96's countermeasure was a POSITIVE pin so a later tidy-up reds
  rather than passing quietly.
  warrant: `"A previous audit round proposed conforming them and was refuted."` @ `.context/decisions/2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit.md`

**D7 STANDS**, with its true cost now known: `subagent.css` + retiring `gui-98`
criterion 5 in favour of a **positive** pin + a `DESIGN.md` "Bans in force"
amendment + an ADR. Reversible in full.

## Needs you

- [ ] **Does the acrylic exception reach any pane other than the subagent
      viewer?** The owner named one surface; nothing authorises generalising.
      took: excepted **that pane only**, recorded as an exception in DESIGN.md
      alt: lift the glass ban generally, or extend it to the model menu and
      command popover, which already share the viewer's treatment
      why: A24's reasoning is surface-specific by construction — it works
      because the owner named *this* surface
      reversible: yes
- [ ] **Should `ultracode` and `auto` be reachable at all?** They are in the
      `/effort` command's argument hint but in neither the SDK's `EffortLevel`
      nor any model's `supportedEffortLevels`, so they are not points on the
      slider's scale.
      took: a five-position slider only; neither mode is exposed
      alt: slider plus a separate two-state control for `auto` / `ultracode`
      why: no warrant, and inventing a slider position for a non-ordinal mode
      is the kind of guess A18 forbids
      reversible: yes
- [ ] **What should "background a session" MEAN in this app?** The premise under
      the ask is false — `/bg` opens the CLI's agent view, a terminal takeover,
      and #91's background rows are read-only with no write route recorded.
      took: a spike that measures whether ANY route exists; built nothing
      alt: define it app-side (detach the UI while the CLI session keeps
      running) and build that regardless of what the CLI offers
      why: the desired behaviour is a product call, and the spike's answer
      changes what is even possible
      reversible: yes (nothing built)
      measured (#127, 2026-08-06): the spike this call asked for has run.
      **Detach does NOT work** — closing the SDK handle kills the CLI child, so
      in-flight work stops and the session transcript does not grow. The
      `background_tasks` control route (the CLI's Ctrl+B) is REACHABLE but
      showed no measurable effect. The one genuine candidate is **Remote
      Control** (`remote_control` subtype, REACHABLE): it bridges a live session
      to an external service so the CLI keeps working with this UI detached.
      It was probed with `enabled: false` ONLY and deliberately never enabled —
      turning it on is OUTWARD-FACING and the owner is away. **This is the part
      that still needs you**: whether the app may offer Remote Control at all.
      The call stays open and the reversible default (nothing enabled, nothing
      built) is unchanged.
- [ ] **"Edit message, resend" ships as REFILL, not as a true edit.** The
      transcript on disk is the source of truth and the renderer's list is
      replaced wholesale from it, so a renderer-side edit cannot rewrite what
      was already sent — the superseded turn stays in the conversation.
      took: refill the composer from a past user message; send as a NEW turn
      alt: nothing available — a true edit would need the CLI to support
      rewriting history, which is unmeasured and `/rewind` is not advertised
      why: A6b makes the mutation impossible to persist, not merely unwise
      reversible: yes

Four entries, all reversible, none touching schema, migrations, public API,
money, deletion, auth, secrets, or anything published outward. The 1.0.0 bump
was checked against that list specifically and does **not** publish: `git tag`
is empty, there is no electron-builder config, and the standing decision is
`npm run dev` only, no installer. `max_defer: 12` → **no halt**.

## Log
- [pressure] **The `sonnet`→kimi-k3 route is flaky and this is recorded, not
  hidden.** Three calls, two `502 provider request failed: Error: 500 status
  code (no body)` from the gateway at `127.0.0.1:41184`. The initial spawn died,
  the retry hydrated fine, then the 11-decision attack round died mid-answer.
  Retried a second time with the SAME agent (resumed from transcript, so
  hydration was not re-paid) and a terser output contract, on the theory that
  long generations are what trips it. If it fails again the fallback is another
  **cross-model** Target — the property that matters is model separation, not
  the specific vendor — and every decision from that point is stamped with which
  adversary judged it.
- [boot] Previous `.claude/vibe.md` was `phase: fired` (the completed #115–#119
  run), not a crash. Archived to `.claude/vibe-115-119.md` and re-seeded, on
  that file's own precedent for the #98–#110 run before it.
- [boot] Tracker frontier confirmed live: `gh issue list --state open` returns
  **zero** open issues. The pick-up note's claim held this time.
- [boot] Pressure Target resolved from the prose override (`kimi`), which is
  already on the `sonnet` family route. No `slot` rebind, so no restore owed on
  any path including halts.
- [round 1] 18 questions → 12 warrants (all grep-clean), 6 defers.
- [round 2] Re-asked the 6 at mechanism grain → 10 more warrants, all grep-clean.
  The re-ask converted **every** product-grain defer into a cited mechanism fact,
  the same result the #115 run got from the same technique.
- [round 3] Pressure returned 7 STANDS / 4 REFUTED. **Three refutations were
  correct and changed the batch** — the copy button's clipboard route became a
  measurement, the "no inbound subagent route" claim was withdrawn as an
  unsupported negative, and the 1.0.0 warrant was replaced by measurement.
- [round 4] The one permitted rebuttal round on D7. Partner answered all three
  limbs with warrants; **D7 stands**, with its true four-part cost now known.
- [grill] **25 of 25 quoted lines passed `grep -qF` across four rounds.** The
  guard caught nothing, which is the good outcome, not a reason to drop it.
- [recon] Main ran its own zero-turn probe rather than asking either agent what
  the CLI supports. It killed two asks outright (`/rewind`, `/bg` — both absent
  from 121 advertised commands) and authorised a third with its exact domain
  (`/effort`, five ordered levels). **That measurement is the single largest
  reason this batch ships six build slices where #115 shipped none.**
- [deviation] `/hp` (init step 6) was **skipped deliberately**. `.context/happy-path.md`
  holds the project's golden path — one chat turn, folder to answer — which ten
  UI asks do not change. Regenerating it would have overwritten project context
  with a batch artefact. Stated rather than silently dropped.
- [fired] Halt check passed: 4 defer entries against `max_defer: 12`, **zero**
  flagged `reversible: NO`, grill fork taken (not wayfind), `to-tickets`
  produced spec #120 + eight slices #121–#128.
