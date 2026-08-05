---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next: #126 — two unblocked tickets left

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#126 and #127 are unblocked and independent.** #128 (the 1.0.0 bump) waits on
all of them and is last by the owner's explicit instruction — **it still wears
`ready-for-agent`, so the frontier query returns it.** The ordering lives in the
ticket body and in `.claude/relay-leg.md`, not in a label. Spec **#120** is the
container and carries the full reasoning.

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. Use `needs-info` + a comment + a `PushNotification`, and let the
chain continue. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Landed last leg

**#125 — the subagent viewer takes the window material.** `c92fca7` on `main`,
squash-merged, branch deleted, ticket closed. `backdrop-filter: blur(30px)
saturate(1.25)` on `.subagent-drawer` — **one declaration is the whole `src/`
diff**, and it is the **only `backdrop-filter` in the app**. Shipped as a
**named, scoped exception** to `DESIGN.md`'s glass ban rather than a relaxation
of it: the ban sentence is untouched and a second paragraph records the one
surface, because the owner named it and #98 had recorded in advance that material
sat in its not-stated bucket **only** for want of a naming. `gui-98`'s criterion
5 **inverted** from "zero `backdrop-filter`" into a three-part positive. New
file: `tests/subagent-material.test.ts` (8). Also touched: `DESIGN.md`,
`.claude/skills/run-desktop/gui-98.mjs`.

## Baseline — READ IT, do not trust it

`main` = `c92fca7`. typecheck clean, build clean, **1234 tests / 81 files**
(was `1226 / 80` before #125). Every remaining slice adds tests, so read the
current number off `main` at the start of your leg.

**`origin/main` is 7 commits behind `main`.** This chain has landed every leg
locally and pushed none — legs 1–5 all did. Nothing is lost, but the tracker's
commit references do not resolve on GitHub. Left as-is deliberately: pushing is
outward-facing and the owner has not asked for it. Worth raising when they are
back.

## What #125 measured that the next legs need

- **A COMPUTED-STYLE READ IS STRICTLY STRONGER THAN A SOURCE GREP.** A grep is
  green on a rule the cascade drops, or one whose selector no longer matches the
  element. `getComputedStyle` resolves **without rasterising**, so `--disable-gpu`
  cannot reach it. That makes it the correct instrument for the case #125 was in
  — a declaration that must be proven to arrive at an element whose *rendered*
  effect nothing here can see. **Binds #126**, which is a visual slice with the
  same problem in a milder form.
- **A CONTROL THAT MUST NOT MOVE IS AS INFORMATIVE AS ONE THAT MUST.** Criterion
  5b reads `backdrop-filter` off a child of the glassed pane and expects `none`
  (it does not inherit). Under the red run it **stayed green while 5a went red**,
  which is the evidence that the reader discriminates rather than answering the
  same string for every element. Copy this shape for #126.
- **A VERIFICATION HARNESS IS A THING THAT CAN FAIL, AND IT FAILS IN THE
  DIRECTION THAT LOOKS LIKE SUCCESS.** #125's mutation runner passed
  `--reporter=basic`, which vitest 4 does not have; the run died with
  `ERR_LOAD_URL` **before a single test executed**, and its `exit 1` read as "the
  mutation was caught" — three confident false REDs. **Take the verdict from the
  parsed result, never the exit code** (an exit code conflates *the code failed*
  with *the harness failed*, the two outcomes a mutation run exists to separate);
  **an unparseable result is UNSCORED, not RED**; and a runner needs a `control`
  mode that runs the suite **unmutated** and demands green, before and after.
- **A MUTATION THAT COMES BACK GREEN IS AMBIGUOUS.** One of the six was a *bad
  mutation* rather than a passing test — it mangled only the opening words of the
  `DESIGN.md` amendment while all three pinned tokens survived further down. Only
  reading the mutation settles which. Refuse a replacement that changes no bytes.
- **`/^## Heading$/m` MATCHES NOTHING IN THIS REPO.** CRLF throughout, and `$`
  under `/m` matches before `\n` with the `\r` in the way — so an anchored
  heading reads as an **empty section** and every assertion over it fails for a
  reason unrelated to content. Use a plain split, or normalise first.
- **Where a deviation's only pin is a driver, it is protected by a check nobody
  runs.** No `gui-*.mjs` runs in `npm test`. #125 added a gate-run twin for
  exactly that reason, and it is why the exception has two pins rather than one.

## Landmines this batch will hit

- **#126 IS THE MOST INSTRUMENT-HOSTILE SLICE LEFT.** Everything #124 learned
  binds it: `getComputedStyle(el, '::pseudo')` **does not read that
  pseudo-element** in Chromium (it returns the element's own style, and scored a
  painted track as "paints nothing"); `locator.screenshot()` inherits the
  zoom/clip defect and at this app's live **1.25** factor cropped a flat patch of
  wash — 1 distinct colour where zoom 1 reads 26; **normalise with
  `webContents.setZoomFactor(1)` before any pixel measurement**; and **a pixel
  probe needs a positive control** (`gui-124` samples `.send-btn` beside its
  target so a broken instrument reports UNSCORED instead of refuting).
- **The map ADR refuses four NAMED alternatives, not aesthetics.** Keep shape =
  kind and colour = status, keep `role="group"`, keep the halo alpha in `fill`
  not `opacity`, and measure hit radius **within a depth band** or a nested
  spine collapses every hit circle to `r=0`.
- **The acrylic exception is #125's and it is ONE PANE.** `.model-menu`,
  `.command-popover`, `.file-popover` and the Appearance dock share the viewer's
  `var(--surface)` treatment and stay flat. Generalising it is an **open owner
  call**, and two pins will red if you take it: `gui-98`'s criterion 5c and
  `tests/subagent-material.test.ts`. If #126 wants glass on the map, that is the
  call, not a styling choice.
- **`gui-98` criterion 5 is now POSITIVE.** It asserts the material is present.
  Removing the material reds it — which is correct and is the point. Do not
  "fix" it by softening it back.
- **`capturePage` takes window DIP; `getBoundingClientRect()` gives the ZOOMED
  page's CSS pixels.** Scale by `webContents.getZoomFactor()` or the shot lands
  up and left. **Binds #126.** Hover states cannot be eyeballed either —
  `--tint-2` is 6% alpha; assert them with `getComputedStyle`.
- **No GUI driver can see a DWM backdrop** — `page.screenshot()` cannot show one
  and `--disable-gpu` flattens acrylic. #125's pins are the declaration and the
  computed value; nothing in this repo claims anything about acrylic's pixels.
- **`/rewind` and `/bg` are NOT CLI commands here.** Measured: 121 advertised
  commands, neither present. `/bg` is one of three ways to OPEN the CLI's agent
  view — a terminal takeover. Do not build a UI wrapper for either; **#127
  measures whether any other route exists**.
- **The composer footer carries a THIRD control** (`.effort-range`), joining
  #122's copy button and #123's reuse button in taking the #93 hairline alone.
- **`effort` and `model` both ride `Options`, so both bind at query
  CONSTRUCTION.** A setter that only stores changes nothing.
- **A renderer-side message edit cannot persist**, and #123 is the record of
  why: `setMessages(transcript.map(toChatMessage))` runs on adopt and on every
  live-tail reload, so the pane is a projection of the CLI's file.

## Stylesheet rules that bind more than one slice

- **Stylesheets are read as raw TEXT by SEVEN tests** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, `markdown-tables.test.tsx`,
  `code-copy.test.tsx`, `reuse-message.test.tsx` and now
  `subagent-material.test.ts`. **Three** of them scan the whole `styles/`
  directory. No comment may contain a closing brace; no scrollbar rule may be
  component-scoped; **and `base.css` warns that even NAMING the scrollbar
  pseudo-element in a comment trips the scan.** `.bubble` and `.message-input`
  stay ungrouped — and `.bubble {` must stay the **first** literal match of that
  string in `chat.css`.
- **`subagent-material.test.ts` pins three things a tidy-up would undo**: the
  material is on `.subagent-drawer`, it is `blur()` **and** `saturate()` (a bare
  blur reds), the fill is still `var(--surface)` (an opaque fill reds, because
  the blur only buys something over a translucent ply), and **no other sheet
  declares one**. It also pins `DESIGN.md`'s amendment, so code and doc cannot
  drift apart in either direction.
- **`markdown.css` may only author DESCENDANT rules** — react-markdown owns the
  markup. `chat.css` and `composer.css` have no such restriction.
- **The `@import` order in `styles.css` IS the cascade.** Add rules inside a
  file; never reorder the imports.
- **Focus rings are picked per control, not applied.** Anything that paints a
  fill in any state takes the hairline alone.
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that it
  works. Five routes exist now: #121's (render measured markup in a real Electron
  window and read computed layout), #122's (drive the real app and read
  `getComputedStyle` off the focused control), #123's (read the same value twice
  around a transition), #124's (sample the element's own pixels at zoom 1, behind
  a positive control) and #125's (**read the computed value off the mounted
  element, behind a discrimination control** — the one that works when the
  rendered effect is invisible to every instrument).

## Process landmines from this batch

- **Unscored is not refuted**, and it has now been hit from both sides — #124
  three times in one driver (frozen-namespace patch, pseudo-element computed
  style, zoomed screenshot clip) and #125 once in the **verification harness**
  itself (a reporter flag that does not exist).
- **Probe by CALLING, never by grepping a bundle or reading a `.d.ts`** — a
  declared wire type is not a callable route (#115); a callable route is not an
  effective one (#117). **#127 lives or dies on this.**
- **A negative claim needs negative-shaped evidence.**
- **A driver never seen failing proves nothing — and its red path must fail
  CLEANLY.**
- **An absence must be counted, not assumed.**
- **Every control-protocol probe needs a bogus-subtype negative control.**
- **Measure before you ask an agent.**

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern, except it REJECTS rather than defaulting.
- **ESM freezes every JS seam a driver might patch** — `sdk.query` cannot be
  monkey-patched and `child_process.spawn` cannot either. The route that works is
  the OS: read the child's command line via `Win32_Process`. **Any probe that
  installs something must read the installation back.**
- **`ConvertTo-Json` over `Win32_Process` is not safe** — read tab-delimited
  lines with `[\x00-\x1F]` stripped.
- **An event handler in main must not be able to throw** — Electron turns it
  into a modal error dialog over the app.
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need `node --experimental-strip-types`
  on this Node (22.17). Use `fileURLToPath`, never `URL.pathname` — this repo's
  path contains a space.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`). Electron's own
  `electron.exe` under `node_modules/electron/dist/` is a real exe and spawns fine.
- **THE CRLF NOTE THIS FILE CARRIED WAS HALF WRONG, AND #125 MEASURED IT.**
  `core.autocrlf` is **`true`** on this machine: **every blob in the repo is LF**
  (checked on #125's own new file, on `subagent.css` and on `DESIGN.md` after
  committing), and the working tree is CRLF because checkout converts it. So the
  standing instruction to hand-convert every new file to CRLF is **unnecessary
  work** — git normalises on commit either way, and none of #125's changes
  produced a whole-file line-ending diff.
  What is actually true, and is the part that bites: **the working tree is CRLF,
  so anything that READS A FILE FROM DISK must expect `\r\n`.** That is a
  different rule with a different remedy, and it is the one that cost a red run
  above (`$` under `/m` never matches with a `\r` in the way). Test fixtures,
  raw-text stylesheet scans and any `readFileSync` regex are the affected class —
  not new-file authoring.
  (Still true: there is no `.gitattributes`, so this depends on a **local git
  config** and a machine with `core.autocrlf=false` would see the working tree in
  LF. Verify with `git config core.autocrlf` rather than assuming either way.)
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point. Back up outside
  the repo and restore from the backup.
- Never hardcode a model name, and never hardcode an effort level list. Never
  read `~/.claude/daemon/roster.json`.
- **Squash-merged ticket branches need `git branch -D`.**

## Do not decide these

The five standing calls are unchanged except that **the one #125 touched is now
answered for the subagent viewer and remains open everywhere else** — which is
the same state it was in, made concrete. The other four are untouched: the
Tailwind adopt-utilities half, the titlebar control count, the 12px line box for
11px muted descriptions, and the accent clause enumeration after #97.

Four open owner-calls live in `.claude/vibe.md` under `## Needs you`. **#125
added none and resolved none by decision** — it shipped the surface named in call
1 without touching the generalisation that call is actually about. The count
stands at four.

**What #125 decided that the owner may want to revisit:** the blur/saturation
values (`30px` / `1.25`) are **Fluent's published acrylic recipe, cited rather
than measured** — nothing here compared them against the real DWM material,
because no instrument can. And `backdrop-filter`'s **cost is unmeasured**; the
argument that this surface is the cheap case (the blurred backdrop is the static
background chat, while the scrolling content is *inside* the pane rather than
behind it) is recorded explicitly as reasoning, not a measurement. Both are
one-declaration edits.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-05-the-owner-named-the-surface-so-the-ban-takes-one-exception]]
- [[2026-08-05-esm-freezes-every-js-seam-so-measure-the-process]]
