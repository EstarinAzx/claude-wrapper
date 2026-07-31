---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decisions, security, drivers, electron]
---

# The renderer is sandboxed, and the driver must not undo it

**Decision:** The app's one `BrowserWindow` is constructed with
`sandbox: true` (#74). The evidence is `gui-74.mjs`, which launches the app
**without `--no-sandbox`** — unlike every other driver in the set — and asserts
the OS-level *effect* rather than the flag, plus a real turn through the
contextBridge.

**Why the flag went:** `sandbox: false` is the price of a preload that needs
Node, and this preload does not. Measured on the **built** bundle rather than
the source, because the source is not what runs: `out/preload/index.js`
contains exactly one require, `require("electron")`, and no `process.` or
`node:` reference at all. The flag bought nothing.

Meanwhile the renderer is the process most exposed to hostile input here — it
renders arbitrary model output through `react-markdown` + `rehype-highlight`
and displays tool results read from arbitrary files on disk. It was the one
process not sandboxed.

**This reversed nothing.** `grep -rniE "sandbox|webPreferences|contextIsolation|nodeIntegration"`
over every `.md` in the repo returns only this ticket's own paper trail — no
ADR, no `.context/` entry, no `CLAUDE.md` line ever argued it. A default that
was never revisited, not a decision to overturn. The IPC gate is untouched:
`isTrustedIpc` still guards every channel. **The process boundary moved; the
trust boundary did not.**

## The measurement, and why the obvious driver would have been green and empty

vitest never constructs a `BrowserWindow`, so it cannot observe `sandbox` at
all. That much the ticket said. What it could not know is the trap waiting in
the driver set's own launch line.

**Every existing driver launches with `['--no-sandbox', '--disable-gpu', '.']`.**
`--no-sandbox` disables OS sandboxing for the whole app. A `gui-74` written by
copying the house launch line would have read
`getLastWebPreferences().sandbox === true` off a renderer Chromium had already
been told not to sandbox, and passed. Correct assertion, correct value, nothing
proven.

So the driver asserts the flag **and** the effect:

- `webContents.getLastWebPreferences().sandbox` — what the window was
  constructed with. The request.
- `app.getAppMetrics()`, joined to our renderer by
  `webContents.getOSProcessId()` — whether the OS granted it. Joining on the
  pid is what stops a sandboxed *utility* process answering for the renderer.
- a real turn end to end, because `sandbox: true` changes how the preload is
  loaded and a window that merely opens proves nothing about the bridge.

Measured, same driver, red then green:

| | flag | renderer pid sandboxed | bridge keys | turn |
|---|---|---|---|---|
| before | false | **false** | 34 | echoed |
| after | true | **true** | 34 | echoed |

The bridge width and the completed turn are **identical on both sides**, so the
only thing that moved is the process boundary — and flipping the flag back
reddens exactly the two sandbox findings and nothing else, which is what says
the driver's red has one cause.

**A control observation worth keeping:** the GPU process reads
`sandboxed: true` in *every* run, red ones included. Without it, a
`sandboxed: false` on the renderer could equally have meant "Electron does not
report this field on Windows". A boolean that is false everywhere is not
evidence; one that is false *here* and true *next to it* is.

## The reusable part

[[2026-07-31-a-driver-establishes-its-premise]] says a driver must establish
the state it asserts rather than inherit it. #74 extends it one step:

**The launch line is part of that state.** A command-line flag can erase the
property under test while every assertion still runs, still reads the value it
expected, and still passes. When a driver measures a process-level property,
read the *effect* from the OS and check what the launch line does to it first.

`gui-74` is therefore the second driver that deliberately diverges from the
house launch args, after `gui-69` keeps the GPU on because `--disable-gpu`
photographs neither backdrop material. Do not "standardise" either of them.

**Limit, recorded so a future red is diagnosed correctly:**
`ProcessMetric.sandboxed` is documented for macOS and Windows, and this driver
set is win32-verified. On Linux the field may be absent and read as
`undefined`, which is a driver limit rather than an unsandboxed renderer — the
flag assertion above it tells the two apart.

**If a future preload genuinely needs Node,** the honest move is an ADR
recording the measured reason, not a quiet `sandbox: false`. An unmeasured
revert puts the app back where it started with an extra commit.

**Reversibility:** easy — one line, and the driver that reddens for it is in
the set.

## Related

- [[decisions]] — index
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule this extends
  from app state to the launch line
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the freshest
  worked example of a green suite proving nothing an engine-level driver caught
- [[active-work]] · [[pick-up]]
