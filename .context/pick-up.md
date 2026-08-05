---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## One open issue, and it is an eyeball call

`gh issue list --state open` should return **one**: **#115**, `ready-for-human`,
holding the two backdrop calls. Everything else in the batch is closed.

Run the query anyway — it is the authority over this file, and this line has been
wrong before (leg 5 of a previous chain wrote that the queue would be empty while
#71 was unblocked the whole time).

```text
gh issue list --state open
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

## Landed 2026-08-05

| # | what | commit |
|---|---|---|
| 116 | spike — `@` reachability. `@path` already resolves; the CLI's suggester is reachable but not a picker | `bd0fed5` |
| 117 | spike — every win32 backdrop route, priced. **Adopted nothing**, filed no build ticket | `50b6a8d` |
| **118** | **feature — `@` file references in the composer** | **`8a58686`** |

Gate at `8a58686`: typecheck clean, **1109 tests / 73 files** (from 1044/70),
build clean, `gui-118.mjs` PASS in a real window.

## What the owner still has waiting

Both on **#115**, both now priced rather than open-ended:

1. **Does Mica actually survive losing focus?** Open the app, pick Mica, click
   away, look. #117 deliberately asserts nothing about it and explains why its
   own measurement does not settle it.
2. **Is the unfocused flip worth a dependency or an aesthetic change?** Read
   `scripts/spike-117-findings.md` and open the four PNGs in
   `scripts/spike-117-shots/`. Recommendation is **adopt nothing**, with
   `mica-electron`'s `alwaysFocused(true)`, koffi + `SetWindowCompositionAttribute`,
   and an aesthetic change priced as live alternatives. "Adopt something" is when
   a build ticket gets filed, and that report is its pricing.

The four `@` calls that used to sit beside these were **taken on 2026-08-05**
with warrants recorded on #115, and are shipped in #118.

## New landmines from #118

- **The caret is a trigger, and jsdom models it differently from a browser.**
  The composer read the caret off React's synthetic `onSelect` **event target**
  with a `?? 0` fallback: 21 composer tests green in jsdom, popover shut in
  Chromium. Read caret state **off the ref**, and **never fall back to `0`** —
  `0` is a valid caret position, so the fallback cannot be told from a real
  answer. `onSelect` also does not fire at all for an **unfocused** element,
  which is why `gui-118.mjs` focuses before typing.
- **A control keyed on caret position needs a driver**, not more jsdom tests.
  That class of behaviour is structurally unreachable from the suite.
- **`@` is typing assistance only.** `@path` in prompt text is already resolved
  by the CLI (#116 measured it). Never add renderer-side expansion — the pin in
  `tests/at-mentions.test.tsx` reddens three tests if you do.
- **The only text normalization on the send path** is `useChat.ts:407`'s
  `raw.trim()`, which predates #118 and applies to `/`'s accept too. Anything
  else touching sent text is a bug.
- **`src/main/workspace-files.ts` is a trust boundary.** Escaping entries are
  dropped at discovery; the tests assert the walk port was never *reached*.
  Containment uses `relative`, never `startsWith` — the latter says yes to
  `/work/project-evil` for root `/work/project`.

## New landmines from #117

- **A callable route is not an effective one.** `setVibrancy` and the
  `visualEffectState` constructor option are both *accepted* on win32 — bogus
  values included — and both do **nothing**. "It did not throw" is not a
  measurement of effect.
- **`setBackgroundMaterial` has NO runtime whitelist** — any string is accepted.
  `src/shared/backdrop.ts`'s compare-never-coerce guard is the **only** whitelist
  in the system. Do not "simplify" it.
- **There is no backdrop read-back.** Anything reasserting a material must carry
  its own copy.
- **A second window taking focus** produces an honestly-unfocused, still-visible
  window with a real blur event. `blur()` is inert exactly as #75 recorded.
- **`page.screenshot()` cannot show a DWM backdrop at all**, and **a richness
  score is not an occlusion control** — #117's first capture run scored 595–1256
  colours on four photographs of a *terminal*.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`, CVE-2024-27980 mitigation).

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — `permissions.defaultMode` is
  `bypassPermissions` here. Deny with `disallowedTools`; count `tool_use` blocks
  as a second witness.
- **A bundle grep is still reading names** (#116). Probe by CALLING, paired with
  a bogus negative control.
- **An out-of-workspace suggestion leak was observed once and NOT reproduced**
  (#116). Unexplained, not refuted — #118 generates its own list because of it.
- **A lost target is not a dead process** (#114) — write the exit code into
  committed findings, never only to the console.
- **This CLI emits no `init` during warm-up** (#114). Gate "the engine is live"
  on `listModels()`/`supportedCommands()` answering non-empty.
- **An instrument that fails its own setup reports that as the phenomenon**
  unless the verdict requires a scored observation first.
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first.
- **A spike harness must be taught the fix**, or it reports the fix as its own
  failure (#112).
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need
  `node --experimental-strip-types` on this Node (22.17). Use `fileURLToPath`,
  never `URL.pathname` — this repo's path contains a space.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- Test baseline on `main` is now **1109/73** — read it from `main`.
- Squash-merged ticket branches need `git branch -D`.

## Process note worth keeping

Both relay legs obeyed a `.claude/relay-leg.md` section headed *"Six owner calls
that must NOT be decided in a leg"*, and the night produced two closed spikes and
zero shipped features — while **four of those six had warrants sitting in the
record**. A loop body is an artefact of an earlier leg, not an instruction from
the owner, and it ranks below a standing autonomy grant. **A queue containing
only spikes has no shippable work in it**; say so at boot.

## Do not decide these

The two backdrop calls on **#115**. The five standing calls from the previous
batch also remain closed: the Tailwind adopt-utilities half · titlebar control
count · the 12px line box for 11px muted descriptions · the accent clause
enumeration after #97 · whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `8a58686`, level with `origin/main` before this leg's `.context/`
commit; no ticket branch.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-05-the-caret-is-the-trigger-and-jsdom-cannot-see-it]]
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]]
- `.claude/vibe.md` — the run that filed #115–#117
