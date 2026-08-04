# Spike #117 — every win32 route to a backdrop that does not flatten on blur, priced

**This is a spike. It adopts nothing, installs nothing, and reverses no ADR.**
`git diff --stat -- src/` is empty and `package.json` is untouched, both by design.

- Harness: `scripts/spike-117-backdrop-routes.mjs` (`node scripts/spike-117-backdrop-routes.mjs`)
- Machine record: `scripts/spike-117-findings.json`
- Captures: `scripts/spike-117-shots/` — read [S4](#s4--pictures-and-what-they-are-not) before opening them
- Measured on: Electron **43.2.0**, Windows 11 Pro build **26200**, Node **22.17.0**
- Published-metadata reads: **2026-08-05**

## What this spike may not conclude, stated first

1. **Nothing about what Mica does on blur.** That claim was refuted twice during
   #115's grill and is an owner call parked on #115. No line here asserts it —
   including the pixel deltas in S4, which are reported precisely so they are not
   silently inferred from something weaker.
2. **Nothing about whether the flip is worth paying for.** The 2026-07-23 ADR
   names the *owner* as the judge of exactly that. This document prices; it does
   not spend.

## The answer in one paragraph

On win32 there is **no supported route to a backdrop that survives losing
focus**. Electron 43.2.0 has exactly one member that couples material appearance
to window activity, and it is `@platform darwin`. Upstream fixed this ask — for
macOS only, in 2025. The three unsupported routes are: one **archived** package,
one **maintained FFI toolkit wrapped around an undocumented Win32 call you would
then own**, and one **newer package that literally implements the feature** but
replaces `BrowserWindow`, declares no Electron compatibility at all, and carries
an open bug against an Electron 16 majors older than this app's.
**Recommendation: adopt nothing.** Reasoning and the live alternatives are in
[the recommendation](#recommendation).

---

## S1 — Electron's own surface

Two halves, because neither is sufficient alone. The **static** sweep of
`node_modules/electron/electron.d.ts` owns the search space and the `@platform`
scope — the runtime carries no platform metadata at all. The **runtime** probe
owns every load-bearing claim, because A11 says a platform claim cited from a
type declaration is not enough, and because #115's grill twice concluded from
names and was twice refuted.

### The search space (static)

Every declaration in five blocks was read and classified. Counts are member
*declarations*, inflated by event-listener overloads (`on`/`off`/`once`/
`addListener`/`removeListener` per event) and by `BrowserWindow` re-declaring
what it inherits from `BaseWindow`. That is the point: a null result is only
meaningful if the space it was drawn from is stated.

| Surface | Declarations read | Classified as material and/or activity |
|---|---:|---:|
| `class BaseWindow` (d.ts 2113–3765) | 334 | 32 |
| `class BrowserWindow` (4140–6585) | 565 | 44 |
| `interface App` (48–1997) | 436 | 26 |
| `interface BaseWindowConstructorOptions` (3767–4062) | 50 | 8 |
| `interface BrowserWindowConstructorOptions` (6587–6602) | 2 | 1 |
| **Total** | **1387** | **111** |

Plus the runtime surface, enumerated independently of the declarations: **189**
own members across `BrowserWindow.prototype` (28) → `BaseWindow.prototype` (142)
→ `EventEmitter.prototype` (19), and **72** on `app`.

### Everything material-shaped, with its platform scope

| Member | Platform | What it is |
|---|---|---|
| `setBackgroundMaterial` / `backgroundMaterial` | **win32** | The material itself: `'auto' \| 'none' \| 'mica' \| 'acrylic' \| 'tabbed'`. No activity-state member. |
| `setOpacity` / `getOpacity` / `opacity` | win32, darwin | Whole-window alpha. Not a backdrop. |
| `setBackgroundColor` / `getBackgroundColor` / `backgroundColor` | all | The colour behind the page. Not a backdrop. |
| `transparent` | all | Constructor-only. Already set by this app. |
| `vibrancy` / `setVibrancy` | **darwin** | The macOS material system. |
| `visualEffectState` | **darwin** | The literal stay-active flag. |
| `addTabbedWindow` | darwin | Window tabbing — unrelated to the `tabbed` material. |
| `invalidateShadow` | darwin | — |

**The headline, and it is platform-scoped rather than an absence claim: of 1387
declarations, exactly ONE is classified as both material and activity —
`BaseWindowConstructorOptions.visualEffectState`, `@platform darwin`.** macOS has
a stay-active flag. win32 has none. This is the same shape #115's grill got wrong
by narrowing to a single union; it is stated here over the whole enumerated space.

Named absence checks over the whole file (case-insensitive, whole-file counts):

| Symbol | Occurrences in `electron.d.ts` |
|---|---:|
| `SetWindowCompositionAttribute` | 0 |
| `stayActive` | 0 |
| `acrylicOpacity` | 0 |
| `ACCENT_ENABLE_ACRYLICBLURBEHIND` | 0 |
| `DwmEnableBlurBehindWindow` | 0 |
| `persistent` | 17 — **all** about sessions, cookies and `persist:` partitions; none about window materials |

A zero means Electron does not surface the symbol. It does **not** mean the
underlying Win32 API is unreachable — that is what S2's FFI route is.

### What the runtime says (measured by calling, each with a negative control)

Five facts, none of which were previously on this record.

**1. `setBackgroundMaterial` has no runtime whitelist.** The union in the
declarations is a TypeScript fiction at the boundary. Every one of these was
*accepted without throwing*:

| Argument | Result |
|---|---|
| `'auto'`, `'none'`, `'mica'`, `'acrylic'`, `'tabbed'` | accepted |
| `'definitely-not-a-material'` | **accepted** |
| `''` | **accepted** |
| `'persistent'` | **accepted** |
| `7` | threw — `Error processing argument at index 0, conversion failure from ` |

So the only value check that exists is a string-type check. **`src/shared/backdrop.ts`'s
compare-never-coerce whitelist is not belt-and-braces; it is the only whitelist
in the system.** The ADR asserted this as a design principle. It is now measured.
Nothing needs building — the existing guard is correct — but a future refactor
that "simplifies" it removes the app's only defence.

**2. There is no read-back of any kind.** `getBackgroundMaterial` is `undefined`,
`getVibrancy` is `undefined`, and `'backgroundMaterial' in win` is `false`. Any
workaround shaped as *"re-assert the material when the window blurs"* must carry
its own copy of the value; it cannot ask the window.

**3. `setVibrancy` exists and is callable on win32 — and is inert.** It accepted
`'under-window'`, a bogus string, and `null`, all without throwing and without
effect. A darwin API, present on this platform, silently doing nothing.

**4. `visualEffectState` is silently accepted by the constructor on win32** —
including `visualEffectState: 'definitely-not-a-state'`. The window is created
either way. **This is the dangerous one:** a diff adding `visualEffectState: 'active'`
to `src/main/index.ts` produces no error, no warning and no effect. It reads
alive in review and is dead at runtime.

**5. Focus mechanics — a correction to #75.** #75 recorded that `win.blur()` moves
`isFocused()` not at all, that a minimised window still reports itself focused,
and that only `hide()` moved both — which removes the window being photographed.
Re-measured here on the app's real window:

| Step | `isFocused` | `isVisible` | `isMinimized` | blur events |
|---|---|---|---|---|
| `show()` + `focus()` | **true** | true | false | 0 |
| `target.blur()` | **true** | true | false | **0** — confirms #75 exactly |
| a **second window** takes focus | **false** | **true** | **false** | **1** |

**A second window taking focus produces the combination #75 could not: honestly
unfocused, still visible, still un-minimised, with a real blur event.** That is
what a user does when they alt-tab, and it is what made S4 possible at all.

---

## S2 — the two native routes the ADR named, re-priced

Priced from published registry and API metadata on **2026-08-05**. Nothing was
installed. Every row's exact query is recorded in
`spike-117-findings.json` → `s2_s3_published.queries`.

### `electron-acrylic-window` — **worse than the ADR priced it**

| | |
|---|---|
| Latest version | **0.5.11**, published **2021-12-09** — 4 years 8 months ago |
| Repository | **ARCHIVED** (read-only). Last push 2024-02-09. 284★ |
| Open issues | 13, permanently — an archived repo accepts no fixes |
| Build shape | `gypfile: true`, deps `node-gyp ^8.4.1`, `node-addon-api ^4.2.0`, `bindings ^1.5.0` |
| Declared Electron compat | **none** (`engines: { node: '>=8.0.0' }` only) |

Its open issues are the ADR's own risk list, itemised and now unfixable upstream:

- **#70** *"Regarding bugs related to window drag delay"* — the drag/resize lag the ADR priced, open since 2021-09-18
- **#86** *"Window gets shrunk to the minimum size when dragging."*
- **#85** *"Error when Compiling (Windows 11)"*
- **#92** *"yarn add electron-acrylic-window fails"*
- **#47** *"Hanging on `electron .`"*

**Verdict vs 2026-07-23:** the ADR called this *undocumented API, drag/resize lag,
fragile across Electron upgrades*. All three still hold, and one has hardened:
"fragile" has become **archived**. A source-built native addon with 2021-era
node-gyp pins, compiled against Electron 43's ABI, with nobody able to merge a fix.

### koffi FFI to `SetWindowCompositionAttribute` — **healthier dependency, same route**

| | |
|---|---|
| Latest version | **3.1.4**, published **2026-07-30** — six days before this spike |
| Repository | active, 411★, 28 open issues, last push 2026-05-20 |
| Release cadence | 277 versions since 2022-02-23 |
| Entry point exists | **yes** — `getNativeWindowHandle` is present at runtime (confirmed in the 189-member enumeration) |

**Verdict vs 2026-07-23: the dependency improved; the route did not.** koffi is a
well-maintained general-purpose FFI, so "fragile dependency" is no longer the
right objection to it. But koffi is only the *syringe*. The undocumented
`SetWindowCompositionAttribute` call — its struct layout, its accent-policy
constants, its behaviour across Windows updates — would be written here and owned
here forever, and that is precisely what the ADR rejected.

One integration cost specific to this app, from koffi's own tracker: koffi ships
a native module and this app builds through electron-vite. Closed issues **#224**
(*"Cannot find the native Koffi module; did you bundle it correctly?"*), **#233**
(*"I need help using it with electron-forge and Vite"*) and **#203** (*"Failed to
load share library on a windows 10 electron app"*) show the bundler wiring is a
known, non-zero, solvable cost. It is not free and it is not hard.

---

## S3 — anything newer

### 1. A route the ADR never priced: `mica-electron` — and it literally implements the ask

| | |
|---|---|
| Latest version | **1.5.17**, published **2026-02-23** |
| Repository | active, not archived, 155★, 14 open issues, Apache-2.0 |
| Declared compat | **none whatsoever** — no `engines`, no `peerDependencies`, no `os`, no `gypfile` |

Its README documents this API:

```js
win.alwaysFocused(true); // -> allows you to keep the mica effects even if the window is no focus (decrease performance)
```

That is the closest thing to the owner's ask that exists anywhere in this sweep,
and it also ships `setMicaAcrylicEffect()` for Windows 11 acrylic. **It is a
genuine finding and the ADR could not have priced it — it is the reason S3 was
worth running.** Its costs, all from published metadata:

- **It replaces `BrowserWindow` with `MicaBrowserWindow`.** That is a constructor
  swap in `src/main/index.ts`, not a method call — the most invasive integration
  of the three routes, in the one file that owns the window.
- **It declares no Electron or Node compatibility at all**, and ships a prebuilt
  `micaElectron.node`. Its own README documents the failure mode:
  *"Error: '...\micaElectron.node' was compiled against a different Node.js version"*,
  with the remedy being a rebuild. That is the ADR's *"fragile across Electron
  upgrades"* written down by the package itself.
- **Open #29** *"Mica is not working properly on Electron v27.0.0"* (2023-10-11),
  unresolved. This app runs Electron **43**.
- **Open #28** *"[BUG] Rendering lags badly while resizing Acrylic window"*
  (2023-09-30) — the same drag/resize lag class as the archived package.
- The README's own parenthetical for the flag is *"(decrease performance)"* — the
  ADR's *"small always-on GPU cost"*, confirmed by the vendor rather than by us.
- Publishing gap 2024-08-28 → 2026-02-23 (18 months) before the current release.

### 2. There is no newer Electron to upgrade into

Installed **43.2.0** is the **latest published** version (2026-07-21). The
2026-07-23 ADR spoke about this same major. It has not aged out — now confirmed
two independent ways.

### 3. Upstream fixed this exact ask — for macOS only

- **electron/electron #46164** — *"Maintain vibrancy effect in inactive Electron
  windows (Safari-style)"* — **closed as completed 2025-04-01**, labelled
  **`platform/macOS`**, `status/confirmed`. The behaviour the owner is asking for
  was implemented upstream on the other platform.
- **electron/electron #25513** — *"change the `visualEffectState` option at
  runtime"* — **open since 2020-09-17**. Even on darwin the stay-active flag is
  constructor-only.
- 16 issues mention `backgroundMaterial` in their title; they are bugs about
  maximise, first draw and frameless windows. **None** is about activity state.
  There is no upstream work in flight on a win32 stay-active flag.

### 4. No OS-side change

This machine is Windows 11 Pro build **26200**, far past `backgroundMaterial`'s
documented floor of *"Windows 11 22H2 and up"*. The material path is fully
available; nothing in the OS has added a way to hold it through a blur. Windows
removed always-on blur-behind deliberately, which the 2026-07-23 ADR already
recorded and nothing here contradicts.

---

## S4 — pictures, and what they are not

Four captures, in `scripts/spike-117-shots/`:

| File | Material | Focus state (**measured at capture**) | Occlusion control |
|---|---|---|---|
| `spike-117-acrylic-focused.png` | acrylic | focused | 4/4 corners |
| `spike-117-acrylic-unfocused.png` | acrylic | unfocused | 4/4 corners |
| `spike-117-mica-focused.png` | mica | focused | 4/4 corners |
| `spike-117-mica-unfocused.png` | mica | unfocused | 4/4 corners |

**These are desktop captures of the window rectangle, not `page.screenshot()`
captures.** That distinction is the whole reason they exist: this window is
`backgroundColor: '#00000000'` with a transparent `html`/`body`, so the backdrop
is drawn by DWM *behind* the web contents. A web-contents capture photographs the
transparent layer — it cannot show acrylic or mica **at all**. Every screenshot
under `.claude/skills/run-desktop/` is that kind, which is exactly why `gui-69`
says in its own header that it cannot judge appearance.

**Two controls, and the second exists because the first run failed.** The first
attempt produced four rectangles scoring 595–1256 distinct colours that passed a
blankness check and were **photographs of a terminal window sitting on top of the
app**; `moveTop()` did not raise the app above it, and nothing in the output
showed the problem. So each capture now has:

- a **focus control** — the state recorded is the one *measured* at capture time,
  not the one requested, and a mismatch marks the row unusable;
- an **occlusion control** — the renderer paints magenta squares into its four
  corners for a throwaway pass, and all four must be found in the grabbed
  rectangle. The marked pass is deleted; the delivered image is a clean second
  pass taken under the same conditions.

All four delivered captures scored `usable: true`. The window was pinned
always-on-top for the captures and released afterwards.

### The focused-vs-unfocused delta, and why it settles nothing

Sampled on an 8px grid over 12,240 pixels per pair, repeated over three rounds:

| Round | Material | Mean channel delta (/255) | Pixels moving >8/255 |
|---:|---|---:|---:|
| 1 | acrylic | 0 | 0% |
| 2 | acrylic | 6.425 | 37.8% |
| 3 | acrylic | 6.425 | 37.8% |
| 1 | mica | 0.165 | 0% |
| 2 | mica | 0 | 0% |
| 3 | mica | 0.165 | 0% |

This is reported so it is not silently inferred from the colour counts that were
already in the output. **It does not settle whether Mica survives blur, and the
strongest reason is in the table itself: the instrument's own control arm is
unstable.** Round 1's acrylic pair showed *zero* difference, and its focused
capture scored 97 distinct colours against 434 in rounds 2 and 3 — the same
window, the same material, the same code path, a different answer. A plausible
explanation is that DWM engages the material on a *change* rather than on a focus
regain, and that a 1.4-second settle is not always enough; that is a hypothesis
this spike did not test. A measurement whose acrylic arm disagrees with itself
across rounds is not one to hang a twice-refuted claim about mica on.

Other confounds, all live: n=1 machine, one wallpaper, one theme, one window
position, one settle time; DWM animates material transitions; what sits *behind*
the window is what acrylic blurs, and it was whatever the desktop happened to
hold; always-on-top is not the z-order a user has.

**For the owner:** open the four PNGs. They are honest captures of the real
window in genuinely measured focus states. What they show at a glance is that
under this app's near-black wash the backdrop has very little room to speak — the
mica captures carry a faint wallpaper tint, the acrylic ones are close to flat.
Whether that difference is worth a dependency is your call, and it is the call
the 2026-07-23 ADR reserved for you.

---

## Recommendation

Addressed to the ADR's revisit condition — *"Revisit as its own ticket if/when
the unfocused-opaque flip becomes worth a dependency or an aesthetic change."*

### Option A — adopt nothing *(recommended)*

**Cost: zero. Reversibility: n/a.** Acrylic keeps flipping on blur; Mica stays
available as the opt-out it already is.

The grounds are evidence, not taste:

1. **There is no supported route.** One member in 1387 declarations couples
   material to activity and it is darwin-only. Upstream implemented this ask for
   macOS in 2025 and has nothing in flight for win32.
2. **The route the ADR priced is now worse, not merely unchanged** —
   `electron-acrylic-window` is archived, four years and eight months stale, with
   its drag-lag bug open and unfixable.
3. **The route that literally implements the ask is the most invasive and the
   least warranted.** `mica-electron` would replace `BrowserWindow` in
   `src/main/index.ts` while declaring no Electron compatibility at all, against
   an open bug filed at Electron 27 for an app running Electron 43.
4. **The visible stake looks small**, per S4 — though that is explicitly the
   owner's eyeball call and the pictures are there to make it in one place.

### Option B — `mica-electron`, for `alwaysFocused(true)`

**Cost:** a new native dependency with no declared compatibility; a
`BrowserWindow` → `MicaBrowserWindow` swap in the app's main entry; a vendor-stated
performance cost; exposure to an unresolved Electron-version bug; a rebuild
obligation on every Electron upgrade. **Reversibility: moderate** — the
constructor swap touches the one file that owns the window, plus `package.json`.
**Take it if** the flip is genuinely bothering you daily and you accept owning the
upgrade risk.

### Option C — koffi + `SetWindowCompositionAttribute`

**Cost:** a healthy dependency wrapped around an undocumented Win32 call this repo
would own permanently — struct layout, accent constants, and behaviour across
Windows updates; plus electron-vite bundler wiring for koffi's native module (a
known, solved, non-zero cost). **Reversibility: good** — it is additive code
behind a flag, deletable in one commit. **Take it if** you want the exact original
acrylic blur and are willing to maintain a Win32 binding.

### Option D — an aesthetic change instead of a dependency

The ADR named this as an equal alternative and nothing here rules it out.
**Out of scope for this ticket** — `DESIGN.md` says the neutrals are *not*
re-tuned per backdrop, and S4 suggests the near-black wash is what leaves the
backdrop so little room. That would be a theme ticket, not a backdrop one.

## No build ticket is filed

Following #78, which ran its measurement and built nothing. A build ticket needs a
decided shape, and every shape available here rests on an owner call this leg is
forbidden to make — *is the flip worth a dependency* is the ADR's own revisit
question and names the owner as judge. **If the answer is Option B or C, that is
the moment to file the build ticket, and this document is its pricing.**

The one finding that touches shipped code needs no change:
`setBackgroundMaterial` has no runtime whitelist, so `src/shared/backdrop.ts`'s
compare-never-coerce guard is load-bearing rather than defensive. It is already
correct. It should not be "simplified".

## Also worth carrying forward

- **A second window taking focus** is how you produce an honestly-unfocused,
  still-visible window under automation. `blur()` remains inert (#75 confirmed);
  this is the missing rung.
- **A richness score is not an occlusion control.** Four convincing photographs of
  someone else's window passed one.
- **`visualEffectState` and `setVibrancy` are accepted and inert on win32.** Both
  read alive in a diff. Neither does anything.
