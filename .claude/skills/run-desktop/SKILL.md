---
name: run-desktop
description: Build, launch, and drive the claude-wrapper Electron app to see it running. Use when asked to start the desktop app, screenshot it, check the titlebar pills (backend / permission mode), or confirm a UI change works in the real window rather than only in tests.
---

claude-wrapper is an Electron GUI — a future agent (or a headless run) can't see
the window, so the deliverable is a **Playwright `_electron` driver** that
launches the built app, reads the DOM, and screenshots it. All paths are
relative to the project root.

## Prerequisites (once per checkout)

```bash
npm run build                    # electron-vite build → out/ (the app the driver launches)
npm i --no-save playwright-core  # driver dep; --no-save keeps it out of package.json
```

`--no-save` is deliberate: playwright-core is a one-off run tool, not a shipped
dependency (matches the `dev-run-only` decision). It lands in node_modules
(gitignored) without touching package.json / lock.

## Run

```bash
node .claude/skills/run-desktop/driver.mjs           # read both pills + screenshot
node .claude/skills/run-desktop/driver.mjs --cycle   # also click each pill once, re-read

SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/inspect.mjs   # every surface, one run
```

Output (stdout): `BACKEND {…}` / `PERMISSION {…}` JSON with each pill's
`text` / `className` / `disabled` / `title`, and `SHOT <path>` per screenshot.
Screenshots land in `%TEMP%/claude-wrapper-shots/` (override `SCREENSHOT_DIR`).
**Open the screenshot** — a blank frame means the launch failed.

Expected on a wisp-routed launch shell, fresh state:
- backend pill → `Wisped`, class `backend-pill backend-pill--wisped`
- permission pill → `Bypass`, class `perm-pill perm-pill--bypass` (danger tint)

`--cycle` then shows `Native` and `Accept Edits` (both neutral classes).

## `inspect.mjs` — every surface in one run (#131, #133, #137)

`driver.mjs` never picks a project folder, so it sees **Welcome and Titlebar
only**. `inspect.mjs` is the consolidated command: it seeds a conversation
straight into the CLI's store, opens a workspace, replays it, and captures each
surface into its own file.

<!-- surfaces:begin - the list `inspect.mjs` captures. Held equal to its SURFACES
     array by tests/inspect-published-list.test.ts; edit both together, and edit
     .gauntlet/bar/README.md too, which keeps its own independent copy. -->

```
welcome.png       welcome-min-window.png   titlebar.png    sidebar.png
chat.png          input-bar.png
agents-dock.png   commands-dock.png        appearance-dock.png
```

<!-- surfaces:end -->

Plus two whole-window frames, `window-welcome.png` and `window-session.png`.
They are **not surfaces**: a surface clipped to its own bounding box cannot
answer a composition question ("does this float in dead space"), and every
reference in `.gauntlet/bar/linear/` is a whole-page frame, so a critic
comparing composition needs a comparable unit.

- **The three docks are #133**, and they exist because a mirror with one side
  unwatched drifts. `DESIGN.md` defines the Agents dock as the sessions rail's
  mirror; through five gauntlet waves the rail was photographed every time and
  the dock never was. They are captured **last**, after the window frames,
  because a dock is an in-flow aside and opening one narrows `main.chat`.
- **`welcome-min-window.png` is #137**, and is the one surface photographed
  twice — the same `.welcome` pane as `welcome.png`, at the window's enforced
  minimum, because that pane's height budget is arithmetic about that size and
  nothing had ever photographed it.
- **Zero CLI turns, no engine, no API key.** The transcript is a fixture on
  disk (gui-63's mechanism), so the same command gives the same surfaces on
  any machine.
- **The sessions rail is a fixture too, since #148.** Both of its lists are
  replaced in main: the stored transcripts (`session:list`) and the CLI's live
  agent view (`background-sessions:list`). Before #148 the rail listed this
  machine's real store, which is why `sidebar.png` and `window-session.png` were
  the only two captures that could not be byte-compared — the footer's "N
  sessions outside this project" is a real count, and it reads 950, 951, 952 and
  953 across the four committed waves that render it. The rail is read back and
  compared to the fixture before capture, because a stub that failed to install
  would photograph real session data with every other check still green.
- **Deterministic.** Window forced to 1440x900 and `setZoomFactor(1)` — both are
  otherwise remembered across launches and would silently change the scale.
- **A capture failure is loud.** Each surface is proven present, painted, on
  screen and carrying the content that makes it that surface *before* it is
  photographed; anything missing exits non-zero naming the surface, and prints
  `CAPTURED n/11` so a half-empty output directory cannot pass for a complete one.
- Cleans up its fixture and its Electron process on both the pass and fail path.

`SCREENSHOT_DIR` is required in practice — it defaults to
`%TEMP%/claude-wrapper-shots/`, which `driver.mjs` also writes to.

**This is the `inspect:` command in `.gauntlet/bar/README.md`.** A critic grading
the UI reads these files. Note what they cannot show: no driver can see the DWM
acrylic backdrop, so every capture has a flat ground where the running app is
translucent — colour, translucency and material are out of scope for any verdict
taken from them.

## What it checks

The two titlebar toggles this repo added:
- **Backend pill** (`[aria-label="Backend mode"]`) — Native ⇄ Wisped. Reads
  `Wisped` only when the launch env carries `ANTHROPIC_BASE_URL` (run from a
  wisp shell); a plain shell shows a native-locked `Native`.
- **Permission pill** (`[aria-label="Permission mode"]`) — cycles Bypass →
  Accept Edits → Ask. Default `Bypass` wears the red danger tint.

## Source-level assertions run in `npm test` (#132)

A driver's assertions used to run only when a human remembered to run the
driver. `npm test` executed none of them, and during the `core-surfaces`
gauntlet run one edit turned two driver assertions red while the three gate runs
that followed all reported green.

The subset that needs no browser now runs in the gate.

**The one convention.** A driver `gui-<n>.mjs` contributes its source-level
assertions by shipping a sibling **`gui-<n>.source.mjs`** with a named export
`checks`:

```js
export const checks = [
  {
    name: 'criterion 2: zero `font-weight: 500` in src/renderer/src/styles/ (SOURCE grep)',
    run() {
      /* … */
      return { ok: hits.length === 0, detail: { hits } }
    }
  }
]
```

`run()` must be **pure**: no browser, no Electron, no `out/` build artifact, no
network, no clock. It returns `{ ok, detail }`; `detail` is printed on failure,
so put the offending value in it.

Nothing else needs wiring. `tests/gui-source-assertions.test.ts` globs for
`*.source.mjs` and turns every entry into a real gate test named
`<driver> › <criterion>`. The driver imports the same array and feeds it to its
own `check()`, so each assertion has exactly one definition and the gated copy
cannot drift from the driven one.

**Drivers without a sidecar are reported, not omitted** — each appears in the
vitest run as a named skip with its reason, so `npm test` states which contracts
it is *not* checking. Two reasons exist: browser-level (needs a live window —
that is #135) and build-artifact (`gui-75`, `gui-93` read `out/`, and the gate
does not build).

Live today: `gui-96.source.mjs` (criteria 2 and 6), `gui-98.source.mjs`
(criterion 5c).

## DOM-level assertions run in a named phase (#135)

The other half. `npm test` runs the pure checks in milliseconds; the checks that
need a real window run here, one Electron launch per driver:

```bash
npm run build                             # the phase launches out/
npm run test:dom                          # every driver that can run unattended
npm run test:dom -- --only gui-91.mjs     # one driver — use this to prove a red is real
npm run test:dom -- --list                # what runs, what does not, and why
```

**The split, and neither half covers the other:**

| | `npm test` | `npm run test:dom` |
|---|---|---|
| what runs | `*.source.mjs` checks — pure, no browser | the drivers themselves |
| cost | milliseconds | ~10 minutes, one app launch per driver |
| sees CSS | **no** — jsdom loads none, and an unknown `var()` resolves to nothing | yes |
| sees the real IPC, the real spawn, real layout | no | yes |

**Do not read a green `npm test` as "the drivers pass."** It means the pure
subset passes and the browser half was not attempted. The fast gate says so in
its own output: every driver without a sidecar appears as a named skip that
points here.

**Joining the phase costs nothing.** Every driver already ends in
`process.exit(fails.length === 0 ? 0 : 1)` — the verdict protocol was there from
the first driver and had simply never been read. A new driver is picked up by
existing in the directory; there is no list to add it to.

**A printed FAIL under a zero exit is reported as `LIED`, not trusted.**
`gui-42.mjs` computed its verdict, printed it, and ended on an unconditional
`process.exit(0)`, so an exit-code harness would have called it green forever.
That is fixed, and the shape is now caught by the phase, because the next driver
to do it will not announce itself either. Exit `2` reports as `UNSCORED` — a
driver that could not measure what it came to measure is not a pass.

**What the phase does NOT launch is a list with reasons**, in
`drivers.manifest.mjs`, and the fast gate asserts that list covers the whole
driver set — so a driver that is neither launched nor skipped reds `npm test` in
milliseconds, naming itself. Two reasons exist and they are genuinely different:

- **`api-cost`** — the driver drives one or more **real CLI turns**. Needs a key,
  network and credits, and its result depends on a model's output. A phase that
  spends money per run is a phase that gets switched off.
- **`no-verdict`** — the driver computes no pass/fail at all, so its exit code
  carries no information. Running it would add a green that measured nothing,
  which is worse than a skip because a skip is legible.
- **`desktop-exclusive`** — the driver's witness *is* the desktop foreground: a
  genuine focus loss, and a screen capture of the window rectangle. A batch
  cannot hand it that while other apps are opening and closing. Run these alone
  on an idle desktop: `npm run test:dom -- --only gui-119.mjs`.

  This is the category that could quietly become "reds we gave up on", so it
  carries the highest bar: an entry needs the driver **passing alone and failing
  in the batch**, measured. `gui-119` earned its entry that way — standalone it
  records all three re-asserts and keeps the blur in 8/8 stress trials, twice;
  in the full run, straight after two other Electron apps had launched and
  closed, it records none and keeps 7/8. The keeper is wired. What the batch
  takes away is the foreground.

A driver that merely **spawns** the CLI without starting a turn (`gui-91`'s
`claude agents --json`, `gui-124`'s `model:list`) is not skipped: that costs
nothing, and on a machine with no `claude` on PATH the driver's own assertion
reds saying exactly that. A real failure, not a skip.

**The gap, stated rather than papered over: nothing runs this phase for you.**
This repo has no `.github/` and no CI of any kind, so "runs on every push" has
nowhere to run. Tracked separately — the phase being cheap to invoke and honest
about its own coverage is what this ticket could actually deliver.

## Gotchas

- **The phase no longer dirties the working tree** (#146), and the workaround it
  used to need is gone. Every driver honours `SCREENSHOT_DIR`, so a phase run
  writes only under `%TEMP%/claude-wrapper-dom-phase/<driver>/` and leaves the
  repo untouched. `git checkout -- scripts/` before committing is no longer
  required. `tests/driver-screenshot-dir.test.ts` reds if a new driver hardcodes
  its output or defaults it back inside the repo, so this is a checked property
  rather than a convention.
- **Every driver gets its own Electron profile** (#147), so pinning window
  bounds or a zoom factor no longer leaks into whatever runs next. Both outlive
  a process, and `gui-136` pinning them for a good reason is what made `gui-69`
  and `gui-70` fail in the batch while passing alone — three phase runs went into
  attributing that, because the contaminating driver passes and only its
  neighbours red. Spread `...profileArgs()` from `driver-profile.mjs` into a new
  driver's `electron.launch({ args })`; `tests/driver-profile.test.ts` reds one
  that does not. **There is no opt-out list, and that is measured rather than
  assumed**: `gui-78`, `gui-79` and `gui-110` mint their own profile inside their
  probe, and `app.setPath('userData', …)` beats the switch
  (`scripts/spike-147-driver-profile-isolation.mjs`, gap C), so the three drivers
  whose subject is profile persistence keep working untouched. A run by hand is
  isolated too — the helper mints a throwaway when the phase has not handed one
  over, so a manual driver run never writes into the profile your own app uses.
  The phase also fingerprints the real profile around each driver and **names any
  driver that wrote to it**; that line is a report, not a failure, because your
  app being open writes there as well.
- **Driver must stay under the project tree.** ESM resolves the bare
  `playwright-core` import by walking up to the project's `node_modules`; run it
  from `$TEMP` and the import fails (`ERR_MODULE_NOT_FOUND`).
- **Backend pill = launch-env, not app state.** `Wisped` requires the wisp vars
  present when Electron starts; the app snapshots `process.env` once at boot.
  Launch from your `claude-wisp` shell to exercise Wisped.
- **Read the DOM, not just pixels.** The driver reads pill text/class via
  `page.evaluate` so it's deterministic even if the window renders offscreen; the
  screenshot is the human eyeball on top.
- **win32 vs Linux.** Verified on win32 (`electron.exe`, no xvfb). On headless
  Linux, wrap in `xvfb-run -a` and `apt-get install -y xvfb libnss3 libgbm1
  libasound2t64 libgtk-3-0 libxss1 libxkbcommon0 libatk-bridge2.0-0 libcups2
  libdrm2`; the bin path branch already handles the executable name.

## Troubleshooting

- **Launch timeout (30s):** `out/` missing → re-run `npm run build`.
- **`ERR_MODULE_NOT_FOUND playwright-core`:** run `npm i --no-save playwright-core`, and run the driver from inside the project tree.
- **Blank screenshot:** the renderer didn't load — check the main process didn't error (bad `out/` build, or a preload throw).
