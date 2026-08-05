---
type: decision
project: claude-wrapper
updated: 2026-08-05
tags: [context, decision]
---

# `file://` is a secure context, and unscored is not refuted

**Decision:** #122 (`a359f9f`) copies code blocks with
**`navigator.clipboard.writeText`** — no IPC bridge, no preload change, no
`execCommand` fallback, no ADR. The button itself comes from the repo's **first
`components` override** on `ReactMarkdown`, replacing the `pre` renderer.

Spec #120 framed the route as genuinely undecided and named the reason: the
built app loads `file://` (`win.loadFile`), dev loads `http://localhost`, and
**no `setPermissionRequestHandler` is registered anywhere in main**. So a button
written against `navigator.clipboard` could pass jsdom, pass `npm run dev`, and
be inert in the shipped app — #117's *a callable route is not an effective one*,
sitting where review does not look.

It was measured rather than argued. `scripts/spike-122-clipboard.mjs` drives the
**built** app and reads the verdict from **main's own `clipboard` module**, never
from the renderer that just wrote it:

| | |
|---|---|
| origin | `file:` |
| `isSecureContext` | **`true`** |
| route 1 (`navigator.clipboard`), real click | **effective** |
| route 3 (`execCommand`), real click | effective — the standing fallback |
| route 2 (IPC bridge) | available, unnecessary |

**`file://` is a potentially-trustworthy origin in Chromium**, which is the whole
answer: the API is present and permitted, and the absent permission handler never
mattered because no permission is requested on this path.

## The finding that outranks the feature

**Run 1 of that spike scored route 1 as DEAD.** It was the instrument. Both probe
buttons were injected at the same fixed position, so the second covered the
first, Playwright's actionability hit-test refused the click, and the handler
never ran — with the error swallowed by a bare `.catch(() => {})`. The trial
recorded `rendererReported: null` and the verdict printed *"execCommand fallback
— navigator.clipboard is NOT effective in the built app"*.

Believed, that would have built an IPC bridge this app does not need, and written
a false constraint into the record for every later slice to inherit.

**A trial whose gesture never landed is unscored, not refuted.** The spike now
records `gestureError` and scores `scored` (did the trial run?) separately from
`effective` (did the thing work?), and a verdict computed over an unscored trial
says so instead of picking a route.

## Two platform facts the drivers had to learn

1. **Blink rewrites LF → CRLF inside `writeText` on Windows.** The clipboard came
   back CRLF where the renderer wrote LF, and the tempting reading is that the
   button mangles the payload. A control refuted it: the same LF string written
   **from main** reads back unchanged, so the OS clipboard is innocent and the
   rewrite sits below this repo's code and above the OS. Nothing was done about
   it — on a Windows paste target it is the desired behaviour — but a driver
   comparing clipboard content must prove the rewrite with a main-side control
   before allowing for it.
2. **`capturePage` takes window DIP; `getBoundingClientRect()` gives the ZOOMED
   page's CSS pixels.** This app carries its own zoom (#94), so the two differ by
   `webContents.getZoomFactor()`. Three runs of `gui-122.mjs` photographed the
   region above and left of the control they existed to show.
   `page.screenshot({clip})` has the same defect with no clean fix; `capturePage`
   with a scaled rect is the route. This binds **#125 and #126**, both visual.

Related: hover states cannot be eyeballed here — `--tint-2` is 6% alpha, a real
change that is invisible in a PNG. Assert them with `getComputedStyle`.

## Why a `components` override at all

`markdown.css` **cannot** deliver a button. react-markdown owns the markup, so a
stylesheet there can only ever author descendant rules and there is no element to
hang a control on. Replacing the `pre` renderer is the only route, and there was
no in-repo precedent — `grep -rn "components=" src/` was empty.

Shape, and the parts that bind future work:

- The override emits **`div.code-block > (button.code-copy + pre)`**. The wrapper
  exists to give the button a positioning context that does not scroll: `pre` is
  the scrolling element, so a control inside it leaves the corner on a wide
  block. The wrapper also carries the block margin, because a margin left on the
  `pre` collapses through and puts the button in the gap above the code.
- **One exported map serves both `ReactMarkdown` call sites.** A map applied to
  only one is invisible until a slash command emits a fence, so the driver checks
  `.msg-assistant` and `.msg-command` separately.
- **Do not extend the wrapper to `<table>`.** #121 measured tables scrolling via
  `display: block` on themselves; a wrapper adds a second scroll container for no
  gain.
- The payload is the rendered DOM's `textContent` — model output is hostile input,
  and `textContent` flattens highlight.js's token spans back to exactly the
  characters the model wrote, with no `innerHTML` on the path.

## Evidence

Gate: typecheck clean, build clean, **1145 tests / 76 files** (was `1130 / 75`).
`gui-122.mjs` PASS, covering what jsdom structurally cannot — the write reaching
the OS clipboard, the hairline focus ring computed off the **built** stylesheet
under a real Tab focus, the control staying anchored when the block scrolls, and
its geometry sitting inside `.chat-column`.

**Verified red** by stashing the two source files and rebuilding: it stops at the
missing wrapper and reports `{"pres":1,"wrappers":0}`. Its red path was itself
fixed — the first red run threw an uncaught `TimeoutError`, which skipped the
summary and leaked the Electron process. A driver's red path has to report as
cleanly as its green one or nobody reads it.

## Related

- [[2026-08-05-the-parser-writes-the-alignment-and-emits-no-wrapper]]
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]]
- [[decisions]] · [[active-work]] · [[pick-up]]
