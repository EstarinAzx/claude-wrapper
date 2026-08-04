---
target: init
idea: "able to reference files in the text input by @ and also an option for the
  user to enable permanant acrylic or somthing that doesnt flatten when
  unfocused. i will be sleeping now and note: gpt 5.6 sol binded to sonnet is
  quota exhausted so use haiku thats grok as the grill partner and opus for
  pressure. and yeah after youve finished with it wrap up and start the relay"
partner: haiku            # xai/grok-4.5 — owner override, inverts vibe's default
pressure: anthropic/claude-opus-5
pressure_via: opus        # direct family route, no slot rebind, no restore owed
excluded: sonnet (codex/gpt-5.6-sol) — quota exhausted, owner-stated
max_defer: 12
phase: fired
halted: false
relay: FIRED — 2 `ready-for-agent` spikes (#116, #117) under spec #115, body
  `.claude/relay-leg.md`, rewritten first because its previous text announced a
  thirteen-ticket queue and forbade `ready-for-human` under an AFK grant that
  does not apply tonight (asleep, not away).
---

## The seed, split into what it authorises

Two feature asks and three operating instructions arrived in one sentence.

1. **`@` file references in the composer.** A product ask with no recorded
   decision behind it. Closest sibling on the record is the `/` slash-command
   autocomplete (#40), a *near* twin that differs in at least four structural
   ways (trigger position, accept semantics, where the list comes from, what
   happens on send). Grillable.
2. **"permanent acrylic or something that doesn't flatten when unfocused."**
   This one is **already on the record twice, and rejected twice**. The seed is
   the owner asking a third time. The grill's job is to establish *which* of the
   two clauses is being asked for, because the second clause ("something that
   doesn't flatten") already ships as Mica.
3. **Model lineup**, owner-stated and binding: `sonnet` (codex/gpt-5.6-sol) is
   quota exhausted and must not be used. Partner is `haiku` (xai/grok-4.5),
   Pressure is `opus` (anthropic/claude-opus-5). This **inverts** vibe's default
   (Partner-is-Claude, Pressure-is-cross-model). Cross-model separation is
   preserved, which is the property that matters, and the grep guard on every
   warrant is model-independent by construction.
4. **"i will be sleeping now"** — the AFK autonomy grant. Per the
   `afk-autonomy-grant` memory, this removes ownership as a ground for deferring
   but not the need for a warrant. It does **not** license reversing a standing
   ADR without one.
5. **"wrap up and start the relay"** — the exit condition, not a licence to skip
   the halt check.

## Decisions

- Destination is **GitHub** — detected, not asked: `gh auth status` reports
  `Logged in to github.com account EstarinAzx` and `origin` is
  `https://github.com/EstarinAzx/claude-wrapper.git`. pressure: n/a (detection)
- `.context/` and `docs/agents/` both exist → init steps 3 and 4 are no-ops.
- Grill fork is **`/grill-me`**, not `/grill-with-docs`: this repo has no
  `CONTEXT.md` and no `docs/adr/` (both checked, both absent). The domain model
  lives in `.context/decisions.md` + `DESIGN.md` + `PRODUCT.md` instead, which
  Partner is hydrated on. pressure: n/a (detection)

### Round 1 — six warrants, all grep-verified byte-for-byte

- **A6** — #112's no-cache contract is **scoped** to `commands:list` / `model:list`
  via `ensureListEngine`, not a general rule binding every future list channel.
  warrant: `"// NOT A CACHE. Both read handlers carry an explicit no-cache contract — the"` @ `src/main/list-engine.ts`
- **B1** — the acrylic-that-does-not-flatten ask **has been decided twice**: first
  deferred, then #69 shipped Mica instead. The native route stays rejected.
  warrant: `"Literal persistent acrylic is not what ships. Blur-behind that survives losing focus needs …has not changed."` @ `.context/decisions/2026-07-31-backdrop-offers-mica-not-persistent-acrylic.md`
- **B2** — the app **already ships** something that does not flatten: Mica, whose
  own copy reads *"doesn't blur, doesn't flatten."*
  warrant: `"    description: 'A steady tint from your wallpaper; doesn’t blur, doesn’t flatten.'"` @ `src/renderer/src/components/AppearanceDock.tsx`
- **B3** — Backdrop is two values for three separately recorded reasons; two keeps
  the IPC boundary a two-string whitelist. No authorisation for a third.
  warrant: `"// offers TWO of them. \`none\` is an unspecified rendering state rather than a"` @ `src/shared/backdrop.ts`
- **B4** — no GUI driver here can observe acrylic: `--disable-gpu` flattens it.
  warrant: `"**Concession on record:** …This one gets eyeballed in a real window or not at all."` @ `.context/decisions/2026-07-31-backdrop-offers-mica-not-persistent-acrylic.md`
- **B5** — neutrals are **not** re-tuned per backdrop; a third value would not
  change that, on pain of two controls writing the same three properties.
  warrant: the `Never \`#000\`/\`#fff\`…not a coupling to build.` paragraph @ `DESIGN.md`

Deferred at round 1: **A1, A2, A3, A4, A5, A7** — asked at product grain.
Re-asked narrower in round 2.

### Main-thread recon (not a Partner claim — verified directly)

**Nothing in `src/main/` enumerates the open workspace.** `session-index.ts`
walks `~/.claude/projects` (the session store); `subagent-store.ts` walks sidecar
directories; `session:pick-folder` opens a native dialog and performs an engine
transition. There is no directory-walking code pointed at the project directory
anywhere. So `@`-mentions are a **new main-side surface with a new trust
boundary**, not a reskin of the `/` popover. `MAX_ATTACHMENTS = 10`.

### Round 2 — seven more warrants, all grep-verified

- **A2b** — no main-side module or IPC channel enumerates the open workspace.
  `session:pick-folder` opens a dialog; `attachments:pick` opens a dialog; the
  only `readdir` in `src/main/` is the session store. *(Partner's warrant is a
  positive line supporting a negative claim — weak on its own. Held because
  main independently grepped `src/main/` and `src/shared/` for
  `readdir|opendir|glob|walk` and found nothing pointed at the project tree.)*
- **A4b** — the `pendingInsert` bug class: workspace-scoped composer state must
  not be cleared by hand from `App`; `key={cwd}` remount is the mechanism.
  warrant: ``"  // join the `ok` branch of the workspace switch by hand — the `pendingInsert`"`` @ `src/renderer/src/components/InputBar.tsx`
- **A5b** — a list-surface cap contract exists but is the **sessions rail's**:
  filter → sort/group → cap, in that order. Not a file-list rule.
  warrant: `"// Filter, then sort and group, then cap — in that order, which is a contract and"` @ `src/shared/session-groups.ts`
- **A7b** — only candidates that pass `admitAttachments`/`judgeAttachment` spend
  a slot; `MAX_ATTACHMENTS = 10`.
  warrant: `"An unreadable file never reaches the policy, so it also **spends no slot from"` @ `.context/decisions/2026-08-04-a-failure-flattened-into-a-value-is-judged-as-one.md`
- **A8** — the **dumb-pipe rule**: the wrapper adds no notion of "slash command",
  never parses or validates, lets the CLI own resolution, and only helps the user
  type the name.
  warrant: `'**Decision:** PRD C (#36) adds no notion of "slash command" to the wrapper. A'` @ `.context/decisions/2026-07-27-slash-commands-are-a-dumb-pipe.md`
- **A9** — a new IPC channel **compares, never coerces**.
  warrant: ``"// Compared, never coerced. `String(value)` here would admit anything with a"`` @ `src/shared/backdrop.ts`
- **A10** — measure the stated cause before speccing a fix; **build only if
  measured**. #78 ran the measurement and built nothing.
  warrant: `` "`gui-78.mjs` ran the measurement this ADR made the fix conditional on. **The" `` @ `.context/decisions/2026-07-31-a-preference-lives-where-it-is-read.md`
- **A11** — a load-bearing Electron/OS claim cited from a type declaration is
  **not enough**; it has to be measured.
  warrant: `"Unlike this batch's other two probes, this one held. The ADR's load-bearing fact was cited from a type declaration; it is now measured. …"` @ `.context/decisions/2026-07-31-backdrop-offers-mica-not-persistent-acrylic.md`

### The SDK finding — main's own, and it decides Feature A's shape

Installed SDK is `@anthropic-ai/claude-agent-sdk@0.3.220`.

- `SDKControlFileSuggestionsRequest` **exists** (`sdk.d.ts:3041`), documented as
  *"Requests at-mention file autocomplete suggestions for a partial path prefix.
  Returns the same fuzzy-matched results the TUI shows."*, and it **is** a member
  of the `SDKControlRequestInner` wire union (`:3729`) — so the CLI handles it.
- Settings carry `respectGitignore` (*"Whether file picker should respect
  .gitignore files (default: true)"*) and a `fileSuggestion` command hook
  (`:4983`, `:4990`).
- **But there is NO caller on `Query`.** Enumerated every method on the interface:
  `supportedCommands` / `supportedModels` / `supportedAgents` / `mcpServerStatus`
  / `backgroundTasks` / `getContextUsage` … and **no `fileSuggestions()`**. Every
  other control request this app uses has a callable; this one does not.

This is **#90's shape verbatim** — a route that looks reachable by name and is
not — and #90's answer was the app's ONE `child_process` spawn at ~893ms/look. A
second one is an architectural call, not a detail. It also splits the feature in
two, which no question above had separated: **resolution** (does `@path` in sent
text reach the file? plausibly free under the dumb-pipe rule) and **autocomplete**
(the file list — where the entire cost lives). A11 and A10 together say this gets
measured before anything is built.

### Round 3 — Pressure's verdicts, and what it killed

Survived: **A6, B1, B5, B3, B4, F2**. Killed: **B2, F1, F3, and my own narrowing**.

- **B2 → DEFER.** Twice refuted, so terminal. Partner's second warrant said Mica
  is *"native, no dep, always-on, stable"*; Pressure's kill: the word the claim
  rests on — *doesn't flatten* — is absent from it, and moving an assertion from
  the UI copy to the ADR the copy was derived from *"adds provenance, not
  observation"*. It named four legs (#78, #89, #94, #111) where a
  decision-document platform claim was later contradicted by measurement.
  **Consequence: the record does NOT establish that Mica survives blur.**
- **F1 (my SDK finding) → REFUTED on the argument, conclusion intact.** I looked
  in the wrong place. Verified directly afterwards:
  - `package.json` `exports`: the app imports `.` → **`sdk.mjs`**, which contains
    **zero** occurrences of `file_suggestions`.
  - `bridge.mjs` (the `./bridge` export, **not** loaded here) is the only
    implementation, and it is **inbound** — an `onFileSuggestions` callback that
    errors `"file_suggestions is not supported in this context (onFileSuggestions
    callback not registered)"`. The SDK **answers** this request; it does not send it.
  - Pressure also caught that `SDKControlRequestInner` is direction-agnostic (it
    contains `SDKControlPermissionRequest`, which travels CLI→SDK), so union
    membership proved nothing, and that `Query`'s declared methods sit on a
    generic subtype dispatcher (#88), so "no method named X" is not "no route".
  **Standing conclusion, now on runtime evidence rather than typings: there is no
  SDK route for this app to ASK for file suggestions.** Per #90, the spike must
  probe by **calling**, never by matching names.
- **F3 → REFUTED, and correctly.** My Feature B default booked a measurement no
  instrument here can make: B4 (which both agents accept) says a capture under
  automation *"is not evidence either way"* and the ADR says it *"gets eyeballed
  in a real window or not at all"* — with the owner asleep. A spike whose
  load-bearing half can only return "unresolved" answers the third ask with a
  fourth deferral. **Mica-on-blur moves to the owner's queue; it is not a spike
  deliverable.**
- **My narrowing → REFUTED, with a find I had missed.** I claimed *"Electron
  exposes no stay-active flag"* was settled off one union. Pressure swept wider
  and found `visualEffectState?: ('followWindow' | 'active' | 'inactive')` at
  `node_modules/electron/electron.d.ts:4037` — a literal stay-active flag,
  `@platform darwin`, *"Must be used with the `vibrancy` property"*. **Verified.**
  The honest statement is **platform-scoped**, not absence: macOS has one, win32
  has none (grepped `electron.d.ts` for `SetWindowCompositionAttribute`,
  `stayActive`, `acrylicOpacity` — no hits). That sweep is also the only half of
  Feature B an agent can actually execute.

### Settled shape

- Installed **Electron `43.2.0`** — the same major the 2026-07-23 ADR spoke about,
  so that ADR has not aged out.
- **Feature A ships as a spike first.** F2 STANDS. Grounded on A10 (*build only if
  measured*; #78 measured and built nothing), A11, A8.
- **Feature B ships as a route sweep, not an adoption.** No ADR reversed, no third
  Backdrop value, no dependency added.
- **No build ticket is pre-written for either.** Writing ACs for a build whose
  shape the spike has not yet decided is the thing A10 forbids; each spike files
  its own follow-up, which is how #112 was filed from #105 and #114 from #112.

## Needs you

- [ ] **Does Mica actually survive losing focus?** Open the app, pick Mica in
      Appearance, click away, and look.
      took: nothing — the spec asserts nothing about Mica's blur behaviour
      alt: assert it from the ADR's "always-on, stable"
      why: twice refuted; the record has provenance but no observation, and B4
      says a driver capture is not evidence either way
      reversible: yes
- [ ] **Is the unfocused flip NOW worth a dependency or an aesthetic change?**
      This is the revisit condition the ADR itself names, and it names the owner
      as the judge (*"the owner judged neither worth it right now"*).
      took: filed the sweep that prices the routes; adopted nothing
      alt: adopt `electron-acrylic-window` / koffi FFI on the third asking
      why: reversing two live ADRs needs a warrant, and the AFK grant explicitly
      does not supply one
      reversible: yes (nothing was adopted)
- [ ] **`@` trigger window rule** — `/` fires only at index 0 and dies on any
      whitespace; `@` must fire mid-string.
      took: left unspecified in the spec; the spike reports what the CLI's own
      fuzzy matcher expects and the build ticket picks from that
      alt: pick a rule now (e.g. `@` at a word boundary, closed by whitespace)
      why: no warrant; and picking before the spike would bind the build to a
      guess
      reversible: yes
- [ ] **Does an accepted `@` reference insert at the cursor, or replace?**
      took: nothing specified
      alt: mirror `/`'s replace-the-whole-value
      why: A4b explains `/`'s replace as *"a slash command only expands as the
      first token"* — a reason that does not transfer to a mid-string token
      reversible: yes
- [ ] **What the `@` list excludes, and whether it is capped.**
      took: nothing specified; the spike records that the CLI carries its own
      `respectGitignore` (default true) and a `fileSuggestion` command hook
      alt: reuse the sessions rail's filter→sort→cap contract (A5b)
      why: A5b's cap is a rule about *sessions*, and generalising it is the
      scoped-fact error Pressure flagged elsewhere
      reversible: yes
- [ ] **Does an accepted `@` reference join the attachment tray (10-slot budget)
      or is it a separate surface?**
      took: nothing specified
      alt: fold it into `admitAttachments`
      why: no warrant either way; A7b settles only what *spends* a slot
      reversible: yes

Six entries, all reversible, none touching schema, public API, money, deletion,
auth, secrets or anything published outward. `max_defer: 12` — **no halt**.

## Log
- [boot] Old `.claude/vibe.md` was `phase: fired` (the completed #98-#110 run),
  not a crash. Archived to `.claude/vibe-98-110.md` rather than resumed — the
  resume rule exists for crashes, and a fired run has nothing left to resume.
- [round 1] 12 questions → 6 warrants (all grep-clean), 6 defers.
- [round 2] Re-asked the 6 at mechanism grain → 7 more warrants, all grep-clean.
  The re-ask converted A2/A4/A5/A7 from product defers into cited mechanism facts.
- [round 3] Pressure killed B2, B3, B4 → one rebuttal round → B3 and B4 recovered
  with new warrants, **B2 stayed refuted and became a defer**.
- [round 3] Pressure also killed **my own** F1 argument and my narrowing, both
  verified and both right. Net: the conclusions held, the reasoning was replaced
  with runtime evidence.
- [grill] Partner never fabricated a warrant: **20 of 20 quoted lines passed
  `grep -qF`**. The guard caught nothing, which is the good outcome, not a
  reason to drop it.
- [boot] Pre-grill recon found the acrylic ask twice-rejected on the record
  (`.context/decisions.md:58` and `:105`) and `AppearanceDock.tsx:84-88` naming
  the exact request. Handed to Partner as a hydration pointer, not as an answer.
- [fired] Halt check passed: 6 defer entries against `max_defer: 12`, **zero**
  flagged `reversible: NO`, grill fork taken (not wayfind), `to-tickets`
  produced spec #115 + slices #116/#117. No slot rebind was used
  (`pressure_via: opus` is a direct family route), so no route restore was owed
  on this or any halt path.
