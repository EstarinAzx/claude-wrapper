---
type: decision
project: claude-wrapper
date: 2026-08-05
updated: 2026-08-05
tags: [context, decision]
---

# The owner named the surface, so the glass ban takes one exception

**#125.** The subagent transcript viewer carries the window material:
`backdrop-filter: blur(30px) saturate(1.25)` on `.subagent-drawer`. **One
declaration is the whole `src/` diff.** Around it: `gui-98`'s criterion 5
inverted from a negative to a positive, `DESIGN.md`'s bans line amended to record
the exception and its scope, and a new gate-run pin
(`tests/subagent-material.test.ts`, 8 tests). Gate green: typecheck clean,
**1234 tests / 81 files** (from `1226 / 80`), build clean, `gui-98` ALL GREEN and
red-verified.

## Decision

**1 — The ban stands; this is an exception to it, named and scoped.**

`DESIGN.md`'s "Bans in force" reads *"no decorative extra glass layers inside the
window (the OS acrylic is the one glass)"*. That sentence is not deleted and not
weakened. A second paragraph now records that **one** surface is exempt, names
it, and says extending it is an open owner call rather than a precedent this line
grants.

**2 — What made this decidable is that the owner named the surface, and
[[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]] said so
in advance.**

#98 split the owner's instruction into what was **stated** (executed as given)
and what was **not stated** — *"size, motion, material, focus"* — which was
*"settled against the record"*. **Material sat in the second bucket only because
the owner had not named it.** It is now named, which moves it into the first by
#98's own division. This is not overturning a call the record argued; it is
supplying the input the record explicitly recorded itself as lacking.

The question #98 left open was *"whether the glass ban reaches a `var(--surface)`
pane at all"*. **This closes it for this pane and leaves it open everywhere
else** — the general question is untouched, because a single named surface does
not answer it and pretending otherwise would be the quiet settling #98 refused.

**3 — The pane was already translucent. The blur finishes that ply rather than
adding one.**

`var(--surface)` is `oklch(0.19 0.008 210 / 0.58)` — 58% alpha — so the scrimmed
chat behind the pane already showed through, sharply. `.subagent-drawer-backdrop`
paints before `.subagent-drawer` in DOM order (`SubagentDrawer.tsx:118` before
`:123`), both positioned, so the pane's backdrop samples the scrim **and** the
live chat beneath it. This is a real visible change rather than a cosmetic null,
and the honest description of it is *the existing ply gains a blur*, not *a new
layer is added*. `tests/subagent-material.test.ts` pins the translucent fill for
that reason: an opaque fill would make the exception buy nothing, and the honest
move then would be to remove it.

**4 — 30px / 1.25 is Fluent's own acrylic recipe, CITED and not measured.**

Stated plainly rather than dressed up. Windows acrylic is blur + saturation lift
+ tint + noise; `--surface` is already the tint, so blur and saturation are what
was missing, and the saturation is what separates acrylic from flat frosting.
Nothing here measured those numbers against the real DWM material, because
nothing can — see below. Changing them is a one-declaration edit.

## Scope, and how it is enforced rather than promised

**This pane only.** The model menu, the command popover, the file popover and the
Appearance dock all share the viewer's `var(--surface)` treatment and all stay
flat. Extending acrylic to them is an **open owner call** recorded in
`.claude/vibe.md`; #125 did not take it.

That is enforced in two places rather than asserted once: `gui-98`'s **criterion
5c** and the suite's *"no other stylesheet declares a backdrop filter"* both scan
every sheet in `styles/` and red on the first leak. Mutation-verified by adding
one to `.model-menu` — the suite reds, and so does the driver, naming
`composer.css`.

## The two ADRs that reasoned against a centred modal are NOT superseded

[[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — *"it is a new overlay
pattern, a new focus trap, and it paints a decorative glass layer inside the
window"* — and
[[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — *"No modal,
no `window.confirm`: the first paints a glass layer DESIGN.md bans"*.

**NEITHER IS SUPERSEDED. NEITHER GETS A BANNER.** This is #98's finding held to
one turn further, and it survives the extra turn. One ADR decides *where
Appearance lives*; the other decides *how deletion confirms*. Both conclusions
stay active and correct, and glass on a transcript viewer overturns neither
**decision**.

What #98 departed from was *"the rationale they happened to share"*. #125 goes
further and weakens that shared rationale **for one named surface** — so it is
worth being exact about what is left standing. Read as a general rule, *"a
centred overlay would paint a decorative glass layer"* is now false in one place.
Read as those ADRs use it — an argument against **introducing a new overlay** to
host a settings panel or a delete confirmation — it is untouched, because neither
of those surfaces exists as an overlay, and the objection each ADR actually spent
was *"a new overlay pattern"*. The viewer has been a scrimmed full-inset overlay
since it was built; #98 moved it and #125 restyled it. **Neither ticket
introduced an overlay, which is the thing both ADRs refused.** `docs/agents/domain.md`
obliges surfacing a real conflict, not manufacturing one out of shared reasoning
— and equally, not hiding one. The honest statement is: the shared rationale is
now scoped rather than absolute, and both decisions rest on grounds that survive
the scoping.

## What is NOT claimed, stated so a green run is not read as more

**No driver can see a DWM backdrop.** `page.screenshot()` cannot show one, this
window is transparent over a material drawn behind it, and `--disable-gpu`
flattens acrylic (#117, #119, #69). **Nothing in this ticket is a claim about
rendered pixels.** The ticket forbade a driver that "verifies" the blur visually
and the prohibition is correct — such a driver would lie.

**`backdrop-filter` has no cost measurement here, and this ticket adds none.**
Reasoning, offered as reasoning: the blurred backdrop is the *background* chat,
which is static while the viewer is open, and the content that scrolls is
**inside** the pane rather than behind it — so the expensive case (re-rasterising
a filter over moving content) is not the case this surface is in. That is an
argument, not a measurement, and it is written down as one. If the viewer visibly
degrades, this paragraph is the thing to disbelieve first.

**Whether acrylic and Mica look different is still unobserved by any instrument**
— unchanged from [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]].

## Criterion 5 was inverted, and the replacement is stronger than what it replaced

#98's criterion 5 asserted **zero** `backdrop-filter` in `subagent.css` — *"the
non-goal that keeps the unresolved glass-ban question harmless"*. Acrylic reds
it. The ticket's instruction was to **replace the negative with a positive**, not
to delete or soften it, on
[[2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit]]'s grounds:
a deviation with no positive pin is what a later conformance pass removes quietly
— #96 shipped as literally `style: two off-scale values conform to DESIGN.md`.

The replacement is three parts, and **only one of them is still a grep**:

- **5a — a COMPUTED read off the mounted pane** (`blur(30px) saturate(1.25)`).
  Strictly stronger than the source grep it replaced, which is green on a rule
  the cascade drops or whose selector no longer matches the element. Computed
  style resolves without rasterising, so `--disable-gpu` cannot reach it — this
  is a claim about **the rule arriving at the element**, never about pixels.
- **5b — a discrimination control.** `backdrop-filter` does not inherit, so a
  child of the glassed pane must still read `none`. Without it, a reader that
  answered the same string for every element would pass 5a while measuring
  nothing. Under the red run it correctly **stayed green** while 5a went red,
  which is what a control is for.
- **5c — the scope**, the only remaining source-level part.

**Red-verified in one build cycle**, both mutations at once: material dropped
from `subagent.css` and one added to `composer.css`. 5a RED reporting
`"backdropFilter":"none"`, 5b GREEN, 5c RED naming `composer.css`, exit 1. Files
restored byte-identical and rebuilt.

## The instrument lesson, which is the part that transfers

**The mutation runner built to verify this ticket was itself broken, and its
first three runs were confident false REDs.**

It invoked `npx vitest run <file> --reporter=basic`. Vitest 4 has no `basic`
reporter; the run died with `ERR_LOAD_URL` **before a single test executed**, and
the script read the resulting `exit 1` as *"the mutation was caught"*. Three
mutations "passed" that way. Had it been believed, this ticket would have shipped
with a suite whose ability to catch anything was never established — and the
failure is invisible in the summary line, because there is no summary line.

The fix is the one this repo keeps re-deriving from a new direction, and it is
worth stating in the form that generalises: **a runner's verdict must come from
the parsed result, never from the exit code, and an unparseable result is
UNSCORED rather than RED.** Exit codes conflate *the thing under test failed*
with *the harness failed*, which are the two outcomes a mutation run exists to
distinguish. The runner now takes its verdict from vitest's `Tests N failed | M
passed (T)` line, reports UNSCORED when that line is absent, and has a `control`
mode that runs the suite **unmutated** and requires full green — run before and
after the mutation set, both green.

Direct sibling of [[2026-08-05-file-is-a-secure-context-and-unscored-is-not-refuted]]
(a probe scored the preferred route dead because the click never landed) and of
[[2026-08-04-a-green-suite-does-not-prove-a-sound-toolchain]]. #124 hit this
family three times in one driver. This is the same lemma reached from the
**verification harness** rather than the product probe: the thing checking your
work is a thing that can fail, and it fails silently in the direction that looks
like success.

**A second, smaller one from the same set:** one mutation came back GREEN and was
**a bad mutation, not a passing test**. `revert-design-doc` mangled only the
amendment's opening words, leaving all three pinned tokens intact further down —
so the suite was right to stay green. Re-run as an actual deletion of the whole
paragraph, it reds. Recorded rather than dropped, because *"a mutation came back
green"* is ambiguous between **a gap in the test** and **a mutation that did not
mutate the thing the test is about**, and only reading the mutation settles which.
The runner now also refuses a replacement that changes no bytes.

**And one line-ending trap, cheap but real — which also corrected a standing note
that was half wrong.** `/^## Bans in force$/m` matches nothing here: the working
tree is CRLF and `$` under `/m` matches before `\n` with the `\r` in the way, so
an anchored heading match reads as an **empty section** and every assertion over
it fails for a reason unrelated to the content. Cost one red run; the extraction
is a plain split now.

Chasing it turned up that `.context/`'s standing landmine — *"the repo is CRLF
throughout … all five of #124's new files were written LF and needed
converting"* — is **half wrong, and the wrong half is the actionable one**.
`core.autocrlf` is **`true`** on this machine, so **every blob in the repo is
LF** (verified after committing, on this ticket's new test file, on
`subagent.css` and on `DESIGN.md`) and checkout is what makes the working tree
CRLF. Hand-converting a new file before committing is therefore **unnecessary** —
git normalises either way, and none of #125's changes produced a whole-file
line-ending diff. The rule worth keeping is the other one: **the working tree is
CRLF, so anything that reads a file from disk must expect `\r\n`** — raw-text
stylesheet scans, fixtures, any `readFileSync` regex. Different rule, different
remedy, and it is the one that actually costs runs. Corrected in [[pick-up]],
with the caveat that there is no `.gitattributes`, so this rests on a **local git
config** and is worth re-checking with `git config core.autocrlf` rather than
assuming.

## Reversibility

**Easy, and deliberately so.** Deleting one declaration, reverting one
`DESIGN.md` paragraph and re-inverting criterion 5 returns the pane to #98's
state. The gate-run pin makes a partial revert loud: dropping the CSS while
leaving the doc reds, and dropping the doc while leaving the CSS reds.

## Related

- [[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]] — #98,
  which left this question open and named the condition under which it could be
  closed. **Amended by this entry, not superseded**: its decision 4 non-goal is
  spent, its decisions 1-3 stand untouched.
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — **not superseded**
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — **not superseded**
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — the window's own
  material, and the source of the rule that neutrals are not re-tuned per backdrop
- [[2026-08-05-a-probe-that-hides-the-race-cannot-justify-the-code-that-runs-into-it]]
  — #119, the acrylic that survives a focus loss; this pane's blur is CSS and
  independent of that keeper
- [[2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit]] — #96,
  the positive-pin countermeasure this ticket applies
- [[2026-08-05-file-is-a-secure-context-and-unscored-is-not-refuted]] — the
  instrument lemma, reached here from the verification harness
- [[overview]] · [[pick-up]] · [[decisions]]
