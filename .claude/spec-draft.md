Filed by an autonomous `/preset vibe init` run while the owner was away from home. Ten asks arrived in one message:

> make the output yknow be able to render tables and also like yknow like code blocks with a copy button. redit message, resend, also idk if / rewind works tehre but yeah its gotta have its ui, when i do / effort there sould be a slider ui, and also the subagent chat view should be acrylic too yeah i know lol and also there should be a user message input in thsi too. teh graph view of subagents improve on that it looks ass. and also tehre should be a keybind that you can backgrund sessions like the / bg doesnt work yknow i mean. and yeah and also bump up the version of this electron app to 1.0.0 towards the end.

Unlike spec #115 — which shipped two spikes and no features — **most of this batch is buildable today**, because a zero-turn measurement settled the three asks that would otherwise have been guesses.

## How this was decided

A Partner agent (`anthropic/claude-opus-5`) answered only with an exact quoted line plus its file, or the token `DEFER`. **Every quoted line was re-grepped as a fixed string against the named file before it was accepted — 22 of 22 passed across two rounds.** A cross-model Pressure agent then attacked every surviving decision, defaulting to refuted when uncertain. **The owner-named adversary (`opencode-go/kimi-k3`, via the `sonnet` route) died three times on gateway 502/503s and did not judge anything**; the verdicts below come from the cross-model fallback `xai/grok-4.5` (the `haiku` route). Model separation from Partner is preserved, which is the property that matters, but the substitution is recorded rather than hidden.

Round 1 asked at product grain and got 12 warrants / 6 defers. Round 2 re-asked the six at **mechanism** grain and converted all six — the same technique that worked on #115.

## The measurement that shaped the batch

`scripts/recon-120-command-surface.mjs` — zero CLI turns, no prompt ever sent, the app's real `cli-path.ts` and `backend-mode.ts` so the binary cannot drift from what the app spawns. `supportedCommands()` is the CLI enumerating **itself**, which is the evidence kind #116 accepted (and is not the bundle grep #116 refuted).

| measured | result |
|---|---|
| CLI commands | **121**, shape `{argumentHint, description, name}` — A8 had recorded only a count |
| `/effort` | **ADVERTISED** — `"Set effort level for model usage"`, hint `<low\|medium\|high\|xhigh\|max\|ultracode\|auto>` |
| `/rewind` | **ABSENT** |
| `/bg` | **ABSENT** — consistent with the owner's "it doesn't work" |
| models | **15**, **14/15** `supportsEffort: true` |
| `supportedEffortLevels` | union = `["low","medium","high","xhigh","max"]` — **five** |

Plus, from the SDK's own typings:

- `sdk.d.ts:553` — `export declare type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';`
- `sdk.d.ts:1664` — `effort?: EffortLevel`, on the **`Options`** type at `:1322` — the same object `model` and `resume` live on.

**The slider's five positions are therefore not a taste call.** `ultracode` and `auto` appear in the command's argument hint but in neither `EffortLevel` nor any model's `supportedEffortLevels`. And because `effort` rides `Options`, it binds at query **construction** (#73), so changing it must discard and rebuild the engine exactly as `model:set` already does.

**What the probe cannot settle**, stated so it is not over-read: it measures *advertisement*, never *effectiveness* (#117 — a callable route is not an effective one). A present name authorises a build ticket to be written; an absent name is the stronger result, because it kills the "wrap the CLI command" shape outright.

## Settled, with warrants

| # | Decision | Warrant |
|---|---|---|
| A1 | `markdown.css` can carry **only descendant rules** — react-markdown and highlight.js own the markup | `src/renderer/src/styles/markdown.css` |
| A2 | Every scrollbar rule must stay global; the stylesheet is read as raw text by a pin | `tests/scrollbar.test.ts` |
| A3 | The `@import` order **is** the cascade | `.context/decisions/2026-07-30-the-import-order-is-the-cascade.md` |
| A4b | Nothing in `src/` **writes** to the clipboard today; a preload-surface change needs an ADR with a measured reason | `.context/decisions/2026-07-31-the-renderer-is-sandboxed-and-the-driver-must-not-undo-it.md` |
| A5b | Model output is on record as **hostile input**, through this exact markdown pipeline | same file |
| A6b | **The message array is a projection of the disk transcript**, replaced wholesale on adopt and on every live-tail reload | `src/renderer/src/useChat.ts` |
| A7/A9 | The **dumb-pipe rule**: the renderer never parses or validates a command; the wrapper renders results and helps type the name | `.context/decisions/2026-07-27-slash-commands-are-a-dumb-pipe.md` |
| A10 | The glass ban, scoped to DESIGN.md's renderer-wide "Bans in force" | `DESIGN.md` |
| A11 | The parked question, verbatim: whether the ban reaches a `var(--surface)` pane | `.context/decisions/2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved.md` |
| A12b | **Zero `backdrop-filter` in the app's CSS**; no cost and no DWM-interaction measurement exists | same file |
| A13b | `subagent:changed` is a **leaf channel** — main broadcasts, preload subscribes. No inbound route to a running subagent is recorded | `.context/decisions/2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding.md` |
| A14 | The map's encoding is pinned: **shape = kind, colour = status** | `.context/decisions/2026-07-25-map-geometry-is-a-pure-slot-layout.md` |
| A16 | #91 put attach, peek, reply and dispatch **explicitly out of scope**; no write route is recorded | `.context/decisions/2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it.md` |
| A17b | Nothing reads the version at runtime; no About surface; `git tag` empty | `package.json` |
| A18 | The standing rule is **build only if measured** | `.context/decisions/2026-08-05-a-declared-wire-type-is-not-a-callable-route.md` |
| A19 | An autonomy grant removes **ownership** as a ground for deferring without lowering the evidence bar; where the record already *argued* a call, the record wins | `.context/decisions/2026-08-01-the-background-agents-seed-decided.md` |
| A22 | **`/bg` is one of three ways to OPEN the CLI's agent view** — a whole-terminal takeover, not a backgrounding command | `.context/flows.md` |

## Attacked, and what the attack changed

Pressure returned 7 STANDS and 4 REFUTED. Three refutations were correct and changed the batch:

- **The copy button's clipboard route is now a MEASUREMENT, not a design pick.** I had read the sandbox ADR as "any preload addition needs an ADR"; it says preload needing **Node** needs one. An `ipcRenderer.invoke` bridge needs no Node, so both routes are open — and which one *works* is unmeasured. See the `file://` finding below.
- **"There is no inbound route to a running subagent" was withdrawn.** The warrant proved only that `subagent:changed` is outbound. A negative claim resting on one channel's ADR is exactly what #90 and #116 each got wrong. Ask 7 is therefore **unmeasured**, not impossible, and moves into the spike.
- **The 1.0.0 warrant was decoration.** `"version": "0.1.0",` proves a string exists, nothing more. Re-established by direct measurement instead: no `getVersion`, no `package.json` read, no `__APP_VERSION__` in `src/` or `electron.vite.config.ts`; `git tag` count **0**; no electron-builder config.

The fourth refutation (the acrylic pane) was contested through the single permitted rebuttal round and **did not survive** — see below.

## The acrylic pane, and why it is the owner's call to have made

Pressure objected that the autonomy grant "forbids overturning the record". Partner's rebuttal held, on #98's own reasoning:

> \#98 split the owner's placement instruction into what the owner **stated** (executed as given) and what the owner **did not state** (settled against the record). **Material sat in the second bucket only because the owner had not named it.**

The owner has now named it. That moves material into the first bucket by #98's own division — which is different from overturning a call the record *argued*. `.context/decisions/2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved.md`

Two consequences the slice must carry, neither optional:

1. **`gui-98` criterion 5 greps `subagent.css` for zero `backdrop-filter`.** Acrylic reds that driver. The criterion is retired *explicitly*, and replaced with a **positive** pin — because #96 records a conformance pass that already proposed conforming this app's accepted deviations, and a positive pin is what makes a later tidy-up red instead of passing quietly.
2. **`DESIGN.md`'s "Bans in force" line is amended** to record the exception. Left untouched, an undocumented deviation is precisely the shape a conformance pass removes.

## The clipboard trap

`src/main/index.ts:376-379` — dev loads `ELECTRON_RENDERER_URL` (http://localhost), **production loads `win.loadFile()`, a `file://` URL**. No `setPermissionRequestHandler` is registered anywhere, so Electron's defaults apply unexamined.

A copy button written against `navigator.clipboard.writeText` can pass jsdom, pass `npm run dev`, and be **inert in the built app**. That is #117's *a callable route is not an effective one*, in the one place a reviewer would not look. The slice carries built-app verification as an acceptance criterion, not a note.

## Slices

| # | Slice | Shape |
|---|---|---|
| 1 | Markdown tables render | CSS only — GFM already emits `<table>` |
| 2 | Code blocks carry a copy button | `components` override + a **measured** clipboard route |
| 3 | Reuse a past user message in the composer | Refill, never mutate |
| 4 | The `/effort` control | Five-position slider, CLI-sourced, engine rebuild |
| 5 | The subagent viewer takes the window's material | CSS + pin + DESIGN.md + ADR |
| 6 | The subagent map earns its place | Visual pass inside the pinned encoding |
| 7 | Spike — three routes nobody has called | Probe by calling, build nothing |
| 8 | 1.0.0 | Last; blocked by 1–7 |

## Not in this spec

- **A `/rewind` UI.** The command is absent from the CLI's own 121-entry enumeration, so there is nothing to wrap. Slice 7 asks whether any rewind-shaped route exists at all; if it finds one, it files the build.
- **A user message input inside the subagent view.** Moved into slice 7 as a measurement.
- **A backgrounding keybind.** The ask rests on a false premise — `/bg` opens the agent view rather than backgrounding anything. Slice 7 measures whether a route exists.

## Owner calls recorded, none taken

Four, all reversible, none blocking. They are in `.claude/vibe.md` under `## Needs you`: whether the acrylic exception reaches panes beyond the viewer; whether `ultracode`/`auto` should be reachable at all; what "background a session" should mean here; and that ask 3 ships as **refill rather than a true edit**, because the disk transcript is the source of truth and the superseded turn stays in the conversation.

**No issue in this batch is tagged `ready-for-human`** — the owner is away and banned that label for this run.

## Filed

| # | Slice | Blocked by |
|---|---|---|
| #121 | Markdown tables render | — |
| #122 | Code blocks carry a copy button | — |
| #123 | Reuse a past user message in the composer | — |
| #124 | A five-position effort control | — |
| #125 | The subagent viewer takes the window material | — |
| #126 | The subagent map earns its place | — |
| #127 | spike — three routes nobody has called | — |
| #128 | Version 1.0.0 | #121–#127 |

Seven are independent and can be taken in any order. #128 is last by the owner's own instruction.
