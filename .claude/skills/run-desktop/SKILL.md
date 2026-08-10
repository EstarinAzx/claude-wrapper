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

SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/inspect.mjs   # all five core surfaces
```

Output (stdout): `BACKEND {…}` / `PERMISSION {…}` JSON with each pill's
`text` / `className` / `disabled` / `title`, and `SHOT <path>` per screenshot.
Screenshots land in `%TEMP%/claude-wrapper-shots/` (override `SCREENSHOT_DIR`).
**Open the screenshot** — a blank frame means the launch failed.

Expected on a wisp-routed launch shell, fresh state:
- backend pill → `Wisped`, class `backend-pill backend-pill--wisped`
- permission pill → `Bypass`, class `perm-pill perm-pill--bypass` (danger tint)

`--cycle` then shows `Native` and `Accept Edits` (both neutral classes).

## `inspect.mjs` — the five core surfaces in one run (#131)

`driver.mjs` never picks a project folder, so it sees **Welcome and Titlebar
only**. `inspect.mjs` is the consolidated command: it seeds a conversation
straight into the CLI's store, opens a workspace, replays it, and captures each
surface into its own file.

```
welcome.png  titlebar.png  sidebar.png  chat.png  input-bar.png
window-welcome.png  window-session.png     ← whole-window frames, for composition
```

- **Zero CLI turns, no engine, no API key.** The transcript is a fixture on
  disk (gui-63's mechanism), so the same command gives the same five surfaces on
  any machine.
- **Deterministic.** Window forced to 1440x900 and `setZoomFactor(1)` — both are
  otherwise remembered across launches and would silently change the scale.
- **A capture failure is loud.** Each surface is proven present, painted, on
  screen and carrying the content that makes it that surface *before* it is
  photographed; anything missing exits non-zero naming the surface, and prints
  `CAPTURED n/7` so a half-empty output directory cannot pass for a complete one.
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

## Gotchas

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
