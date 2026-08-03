---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Frontier: FOUR unblocked `ready-for-agent` tickets

All four verified `blocked_by: 0`. **The `ready-for-human` queue is empty** for the
first time since 2026-08-02 — the batch pass below took all nine parked calls.

| # | size | what |
|---|---|---|
| **#91** | **large** | background-sessions section in the sessions rail — read-only, manual refresh, workspace-scoped |
| **#95** | tiny | `.subagent-drawer-backdrop` takes `tabIndex={-1}` like its sibling |
| **#96** | small | two off-scale values conform to `DESIGN.md` (`font-weight: 500`, `subagent-slide 180ms`) |
| **#97** | medium | measure the mint budget — **measurement only, no `src/` change** |

**`ticket-loop` takes the OLDEST unblocked ticket, which is #91 — the largest of
the four, not the smallest.** That is the body's rule and it is not overridden
here. But know what you are picking up: #91 re-adds a `child_process` spawn the
codebase deliberately removed and deserves an ADR. It is scoped as a tracer bullet
(list only — no attach, no peek, no reply, no polling) and it has full acceptance
criteria and traps on the ticket. **If it genuinely does not fit one sitting, say
so on the ticket and relabel `ready-for-human` rather than half-building it** —
the loop-body contract prefers an honest stop to a partial landing. #95 is a
two-line change if you want to confirm the chain works first.

**Run the frontier query anyway** — this table is a snapshot, and this project's
standing lesson is that a leg once wrote that closing #70 would empty the queue
and was wrong, because #71 had been unblocked all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

~~#86 / #87 / #88 / #89 / #90 / #92 / #93 / #94~~ — closed.

## Done this sitting (2026-08-04) — the nine parked owner calls, taken

Owner renewed the grant: *"address all the ready for human tickets and continue
the relay"*. **#92 and #86 closed, #91 scoped and relabelled, #95/#96/#97 filed.
No `src/` change from any of the nine** — seven produced no code at all.

**The load-bearing one: a non-agent panel is a SECTION in an existing surface,
never a new dock** (#86.1). Warrant: `active-work.md:469` — *"non-agent work yes
but as its own section"* — plus #83's shipped instance. **A section needs no
toggle**, which dissolves the deadlock #86 documented (no new titlebar control
**and** every dock opens from a toggle **and** no router → a new dock is
unreachable). This had gated #91 and any MCP UI since 2026-08-02.

**Three calls died to a measurement rather than a judgement**, and every one built
less. See the landmines — each is now a trap in its own right.

The two that produced work instead of an answer: **#92.2's accent clause was not
decided, because it has never had matching evidence** (the clause states an
enumeration *and* a proportion; the audit counted *reference sites*) → #97
measures it rather than laundering drift into `DESIGN.md`. And **#92.5 retired
"professional grade" as a criterion**, replacing an unreferenced phrase with the
checkable pair #51/#72/#93 each actually shipped: `DESIGN.md` conformance, and no
Chromium-default chrome.

**No Partner/Pressure pair was available** — subagents were off for the session —
so every warrant was grep-verified inline. **That changed three answers.**

See [[2026-08-04-the-parked-owner-calls-are-taken]].

## Landed before that (2026-08-04) — #94, `e1a2c31`

**The Commands dock renders in the app's own font.** `.command-row-btn` was the
last row button without `font: inherit`. `font` is a **shorthand** — it resets
`line-height` too — so the naive join moved **all three** children (+5.6 / +4.8 /
+5.6 px, a 60px row becoming 76px), not the one the ADR predicted. The neutraliser
went on the **parent** (`line-height: normal`), plus a unitless `1.1` on
`.command-row-desc` alone. New driver `gui-94.mjs`. See
[[2026-08-04-the-font-shorthand-resets-the-line-box]].

Before that, **#93** (`07c0068`) gave every interactive control the app's focus
ring, **picked per control by what it paints**
([[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]]); **`c7cee33`**
named `createEngine`'s ports; **#90** (`c989fe5`) measured background sessions
reachable at ~893ms per look, poll-only.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. **New from the batch pass:**

- **A ticket's own framing is not evidence — grep the warrant before accepting
  it.** Three of nine calls changed answer on re-read, and **every change built
  less**. This is now the fourth documented round where an unverified figure in
  this project's own tracker was wrong.
- **The thinking block arrives EMPTY** (#87: `thinking: ""`, 0 chars, every config,
  only `signature` populated). Do not build a thinking strip — the feature is not
  blocked, it has **no content**. Any future ticket proposing one must first show
  the field is populated.
- **The sessions rail already ships its filter, on by default.**
  `Sidebar.tsx:32-33` defaults to `'project'` unless the stored string is exactly
  `'all'`; `:17` says a scoped rail *"hides ~90% of the store"*. **The
  much-quoted "112 rows to surface the 37 this app wrote" is the OPT-IN view.**
  Any ticket citing that figure as the default experience is citing it wrong.
- **The four "swallowed JSON parses" are documented recovery paths, not defects.**
  Three carry authored comments stating the recovery; the fourth is a per-line
  skip over a live append-only JSONL. **`useWindowBounds.ts` is in
  `src/renderer/src/`, not `src/main/`** as #86 filed it. Surfacing a torn last
  line of a log the CLI is actively writing would be a false error on a healthy
  app.
- **A non-agent panel is a section in an existing surface.** No new dock, no new
  titlebar control. The titlebar control count is still the owner's and #91's
  criterion 7 pins it.
- **`entrypoint` cannot separate this app's sessions from its own GUI drivers**
  (#89) — so no rail filter can be built on it, prospectively or otherwise.

**Still live from #94:** **`font: inherit` is a SHORTHAND** and resets
`line-height` (plus style/variant/weight/stretch/size) — `rails.css` has zero
line-heights, `body` sets `1.6`, UA `normal` does not inherit, so it moves **every**
child including ones that set their own family. **Enumerate the shorthand; not
enumerating is what made the tailwind ADR wrong.** The neutraliser goes on the
**parent**, not the children. **`.command-row-name` / `.command-row-hint` render on
TWO surfaces** (dock + slash popover) and agree only because `.command-option` uses
the `font-family` **longhand** — a shared-class pin reaches a surface
`font: inherit` never touches. **Every line-height in this app is unitless — all
19.** **`.command-list`'s height measures nothing** (`max-height`-bound; read 548px
even when every row was 27% taller). **`gui-94` is the only guard on the
command-row font, either direction.**

**Still live from #93:** a new control does not "join the focus group" by default —
**ask what it paints first**; `.model-pill` takes hairline-only and breaks the
rule's letter **on purpose**; `Tab` is not a way out of the composer while the
slash popover is open (`.command-option` is reachable only by `Shift+Tab`); the
sessions rail is **100 real tab stops** and must be collapsed before any
composer-bound walk; `el.focus()` does **not** reliably match `:focus-visible` —
press real keys; `.subagent-drawer-close` is static-checked, not Tab-driven;
`.session-row-btn-active`'s mint left-marker is replaced by the shared focus group
on focus (pre-existing, uncaught).

**Still live from #92 (the findings, now closed):** **`DESIGN.md`'s accent clause
is unverified in BOTH halves** — the enumeration and the ≤10% — and #97 exists to
end that; it still **governs** meanwhile. **`DESIGN.md` was not amended, and must
not be** to match current drift. **"No measurement can answer a taste call" is a
FALSE PARAPHRASE** carried in `.claude/vibe-2026-07-31-*.md`; the real line is
about **instruments, not ownership**. **Two agreeing sources are not a quorum when
a third exists.**

**Still live from #90:** `sessionId` is the only universal key in the agent-view
payload; **no single field describes a row's liveness**; `state` is four values and
**open**, `status` was caught opening inside one sitting; an SDK-spawned CLI
registers as `kind: "interactive"` so **the app is in its own listing** and `cwd`
cannot exclude it; **`~/.claude/daemon/roster.json` holds attach credentials** —
never log, never commit, never surface; the listing is a **join** the CLI performs,
and the two on-disk stores cover only 2 of 6 and 1 of 6 active rows; **a name-level
scan for "agent" here returns SUBAGENT APIs**; an empty return measures nothing.

**Still live from #89:** `entrypoint` is decided by the **launch env**, never by
this app; **one record decides a whole session** (64KB head/tail windows);
`sessionKind: daemon|daemon-worker` is a second programmatic path; the value set is
**five**; `session-index.ts` cannot be imported by a spike.

**Still live from #88:** a lever whose own effect is unverifiable cannot test
anything; **`init` fires per TURN, not per session**; `McpServerStatus.config`
carries `env`; `disabled` is a status and the common one; cwd selects the project
MCP scope.

**Still live from #87:** `result.subtype` is `'success'` on a failed turn —
`is_error` says so; unsetting `ANTHROPIC_BASE_URL` by hand is **not** native mode
(import `backend-mode.ts`'s `resolveSpawnEnv`); a type census answers what shapes
exist, never what belongs to what.

**Still true from the 2026-08-03 trace:** **"the agents view" is AMBIGUOUS** — this
app's Agents dock lists subagents inside one session; the CLI's agent view lists
whole background sessions. Say which one, every time. The **sessions rail is the
dangerous lookalike**: it lists stored transcripts, not live processes — and #91
will put live ones beside them, so the labelling is load-bearing. A driver that
resizes the window revokes what it measures; element screenshots clip to the
viewport.

**Still true from #85/#84/#83/#82/#81:** a mutant can kill a **bad test** before it
kills the code; reproduce a red on clean `main` with the work stashed before calling
it a regression; **judge drivers by exit code**; a field's absence is only a
measurement if a differently-named field could have been seen; `parent_tool_use_id`
is on the `assistant` envelope; check whether every path reaches your candidate
**eagerly**; two ports on one lifecycle hook can want opposite things; a value
written once per session cannot trigger something that happens once per turn; **an
assertion that something SURVIVED is vacuous unless the thing it survives is shown
to have happened**; a level event can land **after** `result`; the `Agent` tool is
**async**; a negative is only a measurement if the path was exercised.

**Still true:** the composer is never `disabled`; `lastTurn`'s nonce is
load-bearing; `unqueue` releases the commitment, never the text; a double flush is
invisible to jsdom; an edge between two samples is not observable by sampling;
`resume` binds at query **construction** and `warmUp` takes the target; a stream
dying **between** turns emits nothing; `win.isFocused()` alone is not "someone is
looking"; **opening a past session CLOSES the engine** (so `listModels()` /
`listCommands()` answer `[]` — reach them first); a test asserting an **absence** is
the one most likely to be vacuous — **mutation-verify it**, this project has been
bitten four times (#76, #82, #93, #94); **no expected driver failure**; pins are
mutation-verified and no pin retirement is authorised; do not add a second busy
flag; never un-key the composer; anything workspace-scoped must join the `ok`
branch; main reports `getNormalBounds()`; `tests/scrollbar.test.ts` scans every line
naming a scrollbar pseudo-element (comments included);
`tests/multiline-composer.test.tsx` slices raw CSS between literal braces, so
`.bubble` and `.message-input` stay ungrouped and no CSS comment may contain a
closing brace; `gui-51` compares in **device** pixels; measure with
`getBoundingClientRect`; `.titlebar-center` must stay **in flow**; **`src/` is CRLF**
(and so is `scripts/` and `.claude/skills/run-desktop/*.mjs`) while `.context/*.md`
is LF; a new `window.api` channel needs **all four** mock sites plus
`preload/index.d.ts`; never hardcode a model name; **`gh issue close --comment`
silently drops the comment if the issue is already closed — comment first, then
close**; a squash merge leaves the branch "not fully merged", so `git branch -D` is
correct there.

From #78: **Playwright cannot measure a launch**; `NODE_OPTIONS=--require` never
reaches Electron; `--disable-gpu` is load-bearing in a background session (and
flattens acrylic); Chromium persists the zoom factor per origin inside `userData`.

## Baseline

`main` = `e1a2c31` (#94) plus the `.context` commits. **Unpushed, several commits
ahead of origin** — `c7cee33`, `09ca8fe`, `07c0068`, `485a814`, `e1a2c31` and the
`.context` commits. No open branches. Test baseline **953 across 63 files**,
re-verified green at `e1a2c31` with typecheck clean.

**Untracked and deliberately left alone:** `.context/2026-07-23.md` and
`.context/Untitled.canvas`, both **0 bytes** — Obsidian stubs. Not committed, not
deleted; the owner's to clear. They are also the only two `.context` lint issues
(`no-frontmatter`, `orphan`), both pre-existing. `.claude/settings.json` carries an
uncommitted modification that predates all of this and was not touched.

**24** assertion drivers plus the observational `gui-scope-zoom-pill` — `gui-94` is
newest. Last full batch run at `3e24a53`: **22 green, `gui-75` red**, and that red
is **environmental, NOT a regression** — reproduced identically on clean `main`
with the work stashed. **Judge drivers by exit code.**

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`. All five import the app's real `cli-path.ts` /
`backend-mode.ts` rather than copying them. **#90 is the one to copy for
scrubbing** — it records a temp dir's basename rather than the absolute path,
keeping the OS username out of the repo. **#97 will need a sixth.**

## Do not decide these

**Both 2026-08-04 grants are spent.** The first produced #93 and #94; the renewal
took all nine parked calls and produced #95/#96/#97 plus #91's scope. A new
**reason** reopens a call; a re-read does not.

**Only THREE owner calls still stand,** down from seven:

1. **Tailwind's adopt-utilities half.** Tailwind is not dropped; a *drop* has a
   measured cascade risk — today the defaults compile into `@layer theme` while
   `[data-theme=…]` blocks are unlayered, so unlayered-beats-layered decides the
   override regardless of import order. Drop it and source order becomes the only
   thing deciding, which silently promotes `tests/theme.test.ts`'s import-position
   pin from a tidiness check to the whole safety argument.
2. **The titlebar's control count.** #86.1 was decided specifically so nothing
   pre-empts it; #91's criterion 7 pins the count at its current value.
3. **Whether 12px is the right line box for 11px muted description text** (#94).
   The preserved geometry is *Arial's* metric, an artifact of the bug it fixed;
   Segoe's own 14.4px sits closer to the app's other micro text (1.3–1.45).
   Nothing blocks on it.

**Two scoping choices were made under the grant and are cheap to overrule** — both
flagged reversible on their tickets: **which surface #91's section joins** (decided:
the **sessions rail**, because it is a list of *sessions* while the Agents dock's
scope is *inside* the open session, and `flows.md` exists to document that exact
collision), and **the accent clause itself** — #97 produces the evidence but
deliberately does **not** spend it.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows.** First entry is the Agents dock and carries the
  agent-view name-collision table. **Read it before starting #91.**
- [[2026-08-04-the-parked-owner-calls-are-taken]] — **this sitting; the nine calls,
  why three died to a measurement, and why a non-agent panel is a section**
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — #94
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — **AMENDED by #94**
- [[2026-08-03-the-engine-ports-are-named-not-counted]] — the architecture pass (`c7cee33`)
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — **#90, the cost model behind #91**
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — **#87, which made #86.2 moot**
- [[2026-08-01-the-background-agents-seed-decided]] — the batch-ADR precedent and the "own section" warrant
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — #85
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81, #93, #94
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
