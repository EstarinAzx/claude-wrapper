---
type: decision
project: claude-wrapper
updated: 2026-08-05
tags: [context, decision]
---

# A declared wire type is not a callable route, and both of the day's asks ship as spikes

**Decision:** The two asks that arrived on 2026-08-05 — `@` file references in
the composer, and "permanent acrylic or something that doesn't flatten when
unfocused" — are filed as spec #115 with **two spike tickets, #116 and #117, and
no build ticket for either**. Neither spike may touch `src/`. Each ends by filing
its own build ticket with a decided shape, or by declining it and saying why.

**Why:** The record's own rule is *build only if measured* — #78 ran its
measurement and built nothing — and in both cases the fact that decides the
build's shape is currently unmeasured.

For `@`, the shape of the build turns on whether the app can obtain a file list
at all, and that question was answered wrongly twice in one session before the
runtime settled it:

- `SDKControlFileSuggestionsRequest` is declared at `sdk.d.ts:3041`, documented
  as *"Requests at-mention file autocomplete suggestions for a partial path
  prefix"*, and sits in the `SDKControlRequestInner` union at `:3729`. **None of
  that means the app can send it.** That union is **direction-agnostic** — it
  also holds `SDKControlPermissionRequest`, which travels CLI→SDK.
- The second attempt reasoned from the **absence of a `fileSuggestions()` method**
  on the `Query` interface. Also wrong as an argument: #88 records
  `mcpServerStatus()` implemented as
  `(await this.request({subtype:"mcp_status"})).response.mcpServers`, i.e. a
  generic subtype dispatcher sits behind the declared methods, so an absent
  method name is not an absent route.
- What actually settled it was the **runtime bundle**. `package.json`'s `.`
  export — the one `src/main/engine.ts` imports — is `sdk.mjs`, which contains
  **zero** occurrences of `file_suggestions`. The only implementation in the
  package is `bridge.mjs` (the separate `./bridge` export, not loaded here), and
  it handles the request **inbound**, erroring *"file_suggestions is not
  supported in this context (onFileSuggestions callback not registered)"*. The
  SDK **answers** this request; it does not send it.

This is #90's lesson a second time — that leg probed 29 SDK exports **by calling
them** after name-matching gave the wrong headline answer — and it is now the
binding instruction on #116: **probe by calling, never by matching names.**

The related structural fact, verified directly: **nothing in `src/main/`
enumerates the open workspace.** `session:pick-folder` and `attachments:pick`
open native dialogs; the only `readdir` is `session-index.ts` walking the session
store under `~/.claude/projects`. So `@` is a new main-side surface with a new
trust boundary, not a reskin of the `/` popover — whose trigger fires only at
index 0 and whose accept replaces the whole value, both *because a slash command
only expands as the first token*, a reason that does not transfer to a mid-string
token.

For the backdrop, the ask is its **third** asking and the two prior ADRs are not
reversed. `2026-07-23-persistent-glass-deferred` ends *"Revisit as its own ticket
if/when the unfocused-opaque flip becomes worth a dependency or an aesthetic
change"*, and names the owner as the judge of "worth". #117 therefore **prices
the routes and adopts nothing**. Two facts narrow it:

- Installed Electron is **`43.2.0`** — the same major that ADR spoke about, so it
  has not aged out.
- `visualEffectState?: ('followWindow' | 'active' | 'inactive')` **does** exist at
  `node_modules/electron/electron.d.ts:4037` — a literal stay-active flag, but
  `@platform darwin` and *"Must be used with the `vibrancy` property"*. The
  honest claim is **platform-scoped**: macOS has one, win32 has none. An earlier
  attempt in this session to call the question "settled" off a single union was
  refuted by exactly the wider sweep that turned this up.

**Two things are recorded as NOT established, so they are not re-derived:**

1. **"Mica doesn't flatten" is unproven.** The app's own copy says it and the ADR
   the copy was derived from says *"always-on, stable"* — but the word the claim
   rests on is absent from the warrant, and moving an assertion from copy to its
   source adds provenance, not observation. Four legs on this record (#78, #89,
   #94, #111) are decision-document platform claims that measurement later
   contradicted. It is parked as an owner call on #115.
2. **`--disable-gpu` is not why drivers cannot judge acrylic.** `gui-69.mjs:9-11`
   launches **without** that flag precisely because it would flatten acrylic; the
   real reason a capture proves nothing is **DWM compositing over a wallpaper**.
   Compounding it, producing an honestly-unfocused window under automation is
   itself unsolved here — #75 measured that `win.blur()` moves `isFocused()` not
   at all and that a minimised window still reports itself focused.

**Reversibility:** Fully reversible. No `src/` change, no dependency, no ADR
reversed or amended, no third `Backdrop` value. If the owner would rather have a
build attempt than a measurement, both spikes can be closed unworked and the
build specced directly from #115's decision table — the six owner calls parked
there are the inputs that would need answering first.

## Related

- [[decisions]]
- [[2026-07-23-persistent-glass-deferred]]
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]]
- [[2026-07-27-slash-commands-are-a-dumb-pipe]]
- [[2026-07-31-a-preference-lives-where-it-is-read]]
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]]
