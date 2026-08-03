---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# The parked owner calls are taken, and three of them resolve to "build nothing"

**#92, #86 and #91, decided together under one grant.** Owner instruction, verbatim:
*"address all the ready for human tickets and continue the relay"* — a renewal of
the 2026-08-04 grant, which the AFK rule reads as removing **ownership** as a
ground for deferring while leaving the need for a warrant intact, and licensing
nothing irreversible. Batch-ADR precedent:
[[2026-08-01-the-background-agents-seed-decided]].

Nine live calls. **No `src/` change from any of them.** #92 and #86 closed; #91
scoped, retitled and relabelled `ready-for-agent`; three new tickets filed (#95,
#96, #97). The `ready-for-human` queue is empty for the first time since
2026-08-02.

**No Partner/Pressure pair was available** — subagents were off for the session —
so every warrant was grep-verified inline instead. That was not ceremony: **it
changed three answers**, and each change was in the direction of building less.

## Decision

| call | taken |
|---|---|
| **#86.1** where does a non-agent panel live? | **An existing surface, as its own labelled section. No new dock, no new titlebar control.** |
| **#86.2** thinking strip's DOM-exclusion contract? | **Moot** — #87 measured the block arrives empty |
| **#86.3+4** the noisy rail rows | **No filter, no tag, no badge.** The rail already ships the working filter, on by default |
| **#86.5** settings-parse health | **Dropped, and NOT re-scoped** — the re-scope target is not a defect |
| **#92.2** the accent clause | **Neither amend nor restyle — measure it first** → #97 |
| **#92.3** motion deviations | **Two pulses are accepted exceptions; one entry is off-spec** → #96 |
| **#92.4** `font-weight: 500` | **Conform by deletion** → #96 |
| **#92.5** "professional grade" | **Retired as a criterion**, replaced by the checkable pair the project already ships against |
| **#91.2/3** how much agent view | **List only, manual refresh, workspace-scoped** |

## Why — the load-bearing one first

**A non-agent panel is a SECTION, not a dock.** This is the call that had gated
#91 and any MCP UI since 2026-08-02, and the record already answered it.
`active-work.md:469`, verified verbatim: *"non-agent work **yes but as its own
section**"*, and in the same line the reason — *"#83 was deliberately routed into
the existing Agents dock so it does not pre-empt that second one"* (the titlebar
control-count call). `active-work.md:941` confirms #83 shipped in exactly that
shape.

The deadlock #86 described — no new titlebar control, **and** every dock opens
from a toggle, **and** no router, therefore a new dock is unreachable — is real,
and it **dissolves the moment a panel is a section rather than a dock.** A
section needs no toggle. #86's framing of the precedent as "one instance each
way" is corrected: `2026-07-31-appearance-is-a-dock-not-a-settings-modal.md` was
decided on anti-*modal* grounds, and #83 is the later and far closer precedent.

Most reversible by a wide margin: a section is deletable in one component file; a
titlebar control spends a call that is still the owner's.

## Why — the three that a measurement killed

Each of these was set up by its ticket as a design question. Re-reading the code
turned all three into factual ones, answered against building.

1. **The thinking strip has no content.** #86 asked whether a collapsed thinking
   strip owes the tool card's DOM-exclusion contract — arguably a privacy call.
   But [[2026-08-02-the-thinking-block-arrives-empty]] already measured the
   `thinking` field as **an empty string in every config**, across five fresh
   `query()` constructions, with only `signature` populated. A DOM-exclusion
   contract protects content. There is none. **Feature A is not blocked; it is
   empty.**

2. **The rail already ships the filter, on by default.** #86 and `active-work.md`
   both carry *"112 rows to surface the 37 this app wrote"*, glossed as *"worst
   exactly where the owner looks first"*. Verified in source, that is the
   **opt-in** view — `Sidebar.tsx:32-33` defaults to `'project'` unless the
   stored string is exactly `'all'`, and the authored comment says *"Scoped by
   default: the rail opens showing the workspace the user is actually in"* with
   `:17` adding that a scoped rail *"hides ~90% of the store"*. The 112 figure is
   what a user sees **after asking to see everything**. Adding a second filtering
   axis — built on `entrypoint`, which #89 measured as *not* separating this
   app's sessions from its own GUI drivers — to a view whose purpose is to be
   unfiltered, is cost with no benefit.

3. **The four "swallowed parses" are documented recovery paths.** #86 offered
   re-scoping settings-parse health onto *"four JSON-parse failures the app
   already swallows in silence… None logged, none surfaced."* All four were
   re-read. Three carry an authored comment stating the recovery
   (`useWindowBounds` — which is in `src/renderer/src/`, not `src/main/` as filed
   — *"Opening at the constructed default is the correct recovery"*;
   `session-index.ts:126` *"A truncated or non-JSON line is not fatal — keep
   scanning"*; `subagent-store.ts` *"a subagent we cannot correlate is not
   surfaced"*), and `transcript.ts:141` is the same per-line skip over a live
   append-only JSONL. **Surfacing a torn last line of a log the CLI is actively
   writing would be a false error on a healthy app.** Declined on evidence, which
   is the one ground the grant does not remove.

## Why — the two that produced work instead of an answer

**The accent clause has never had matching evidence, so the call was not made.**
`DESIGN.md:7` states two things: an enumeration (*"spent only on"* five sites) and
a proportion (*"≤10% of surface"*), the latter bound by `DESIGN.md:9` to all four
palettes. #92 measured **neither** — its ~45 figure counts *reference sites*, and
Pressure's accepted refutation says it plainly: *"Reference counts do not prove
intended accent spend."* Both offered remedies asked the owner to decide without
matching evidence, and amending the governing doc to match current drift
**launders** that drift. #97 produces the evidence instead: measurement only, no
`src/` change, the #87/#88/#89/#90 shape.

**"Professional grade" was retired rather than answered.** As posed it has no
referent — `PRODUCT.md` names peer products (VS Code, Linear), and naming a peer
is not a checkable condition. But the project has shipped three times under that
banner and every time delivered the same concrete pair: **conformance to
`DESIGN.md`**, and **no Chromium-default chrome anywhere** — #51 (scrollbars),
#72 (titlebar geometry), #93 (the focus ring). That pair is what an agent can be
held to. Taste stays the owner's, in a real window, per the record; this only
stops an unmeasurable phrase being used as a ticket criterion.

## The consistency argument that decided #92.4

`.model-menu-item`'s `font-weight: 500` is the app's only one against
`DESIGN.md:54`'s two documented weights. The alternative on offer was *"widen the
documented scale"* — **precisely the laundering-drift move that was correctly
killed for the accent clause in the same audit.** It cannot be wrong there and
right here. Conform the code; leave the standard alone. Deleted rather than moved
to 600, which the doc reserves for "app name and bubble-less emphasis".

The same separation resolved the motion call: the clause governs *transitions and
entries*, so an **infinite ambient pulse is neither** and the two
`subagent-pulse 1.4s` sites are exceptions — while `subagent-slide 180ms` **is**
an entry and the doc names exactly one entry duration, 200ms. One value conforms;
two are left alone. (`rails.css`'s pulse is at `:573`, not `:550` as #92 filed.)

## Reversibility

**Everything here is cheap to reverse and nothing is outward-facing.** Seven of
nine calls produced no code at all. The two that did produced #96 (two
declarations the doc already names) and #97 (a measurement harness, no `src/`
change). #91's section is one component file.

The one genuinely taste-laden choice is **which surface #91's section joins** —
decided as the **sessions rail** rather than the Agents dock, because it is a
list of *sessions* while the Agents dock's scope is *inside the open session*,
and `flows.md` exists to document that exact collision. Stated on the ticket as
reversible, and an eyeball in a real window may well overrule it.

## Left standing, deliberately

- **The titlebar's control count.** #86.1 was decided specifically so nothing
  pre-empts it; #91's criterion 7 pins the count.
- **Tailwind's adopt-utilities half** — untouched here.
- **Attach / peek / reply** for #91, unmeasured and unfiled.
- **The accent clause itself** — #97 produces evidence, it does not spend it.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-08-01-the-background-agents-seed-decided]] — the batch-ADR precedent, and
  the source of the "own section" warrant
- [[2026-08-02-the-thinking-block-arrives-empty]] — #87, which made #86.2 moot
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89, which made
  #86.3/4 unbuildable
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — #90,
  the cost model behind #91's manual-refresh scope
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — #94, the last call of
  the previous grant
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93
