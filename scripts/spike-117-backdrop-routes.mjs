// Spike #117 — every win32 route to a backdrop that does not flatten on blur,
// priced. Sibling of spike-81/87/88/89/90/104/105/108/114/116.
//
//   node scripts/spike-117-backdrop-routes.mjs
//   SPIKE117_PHASES=0        # static sweep only, launches no Electron
//   SPIKE117_PHASES=0,1      # + the runtime probe (S1's measurement half)
//   SPIKE117_PHASES=2        # S4 capture attempt only
//
// This spike BUILDS NOTHING. `git diff --stat -- src/` is part of its gate, and
// so is "no new entry in package.json" — S2 is priced from published metadata,
// never from a working tree.
//
// ---------------------------------------------------------------------------
// WHY THIS FILE HAS TWO HALVES, AND WHY NEITHER IS SUFFICIENT ALONE
// ---------------------------------------------------------------------------
//
// PHASE 0 is a STATIC sweep of `node_modules/electron/electron.d.ts`. It is the
// only place `@platform` scope is written down at all — the runtime carries no
// platform metadata, so a purely-runtime probe cannot answer "is this route
// win32 or darwin?", which is the question the whole ticket turns on. Phase 0
// therefore owns the SEARCH SPACE and the PLATFORM SCOPE.
//
// PHASE 1 is a RUNTIME probe inside a real Electron main process. It exists
// because this record's A11 says a load-bearing Electron/OS claim cited from a
// type declaration is NOT enough, and because #115's own grill twice concluded
// from names and was twice refuted:
//   - once from a wire union's membership (a direction-agnostic union),
//   - once from the absence of a method name on an object whose methods sit on
//     a generic dispatcher (#88).
// So every load-bearing claim here is made by CALLING, and each call is paired
// with a DELIBERATELY BOGUS ARGUMENT as a negative control. Without that
// control, "Electron accepted `mica`" and "Electron accepts literally anything"
// are the same observation. #116 learned this the same way.
//
// PHASE 2 is S4, and is best-effort BY CONSTRUCTION. Read the block above it.
//
// ---------------------------------------------------------------------------
// WHAT THIS SPIKE MAY NOT CONCLUDE
// ---------------------------------------------------------------------------
//
//   - Nothing about what MICA does on blur. Twice refuted during #115's grill;
//     it is an owner call parked on #115. No line below asserts it.
//   - Nothing about whether the flip is worth a dependency. The 2026-07-23 ADR
//     names the OWNER as the judge of exactly that. This file prices; it does
//     not spend.
//   - Nothing from a `page.screenshot()` about backdrop appearance. See phase 2.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

// fileURLToPath, never URL.pathname — this repo's checkout path contains a
// space, and `.pathname` hands back a percent-encoded string that fs rejects.
const HERE = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(HERE, '..')
const DTS = path.join(APP_DIR, 'node_modules/electron/electron.d.ts')
const OUT = path.join(HERE, 'spike-117-findings.json')
const SHOT_DIR = path.join(HERE, 'spike-117-shots')

const PHASES = (process.env.SPIKE117_PHASES ?? '0,1,2')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const runs = (p) => PHASES.includes(String(p))

const log = (label, m) => console.log(String(label).padEnd(14) + JSON.stringify(m))

// Merged onto any previous run rather than replacing it. Without this, a
// diagnostic `SPIKE117_PHASES=3` silently deletes the S1 and S4 sections from
// the committed artifact and the loss is invisible until someone reads the file
// looking for them.
const prior = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
const findings = {
  ...prior,
  spike: 117,
  ticket: 'https://github.com/EstarinAzx/claude-wrapper/issues/117',
  generatedBy: 'scripts/spike-117-backdrop-routes.mjs',
  phasesRun: PHASES,
  phasesRunNote:
    'Sections belonging to phases NOT listed in phasesRun were carried over from an earlier run of this script and are not necessarily contemporaneous with the rest. The committed artifact was produced by a single run of all four phases.',
  platform: { platform: process.platform, release: os.release(), node: process.version }
}

// ===========================================================================
// PHASE 0 — S1 static: the search space, and the platform scope of every hit
// ===========================================================================

// A hand-rolled brace scanner rather than the TypeScript compiler API: this
// repo has no `typescript` runtime dependency for scripts to reach for, and the
// shapes being read (a class body, an options interface) are flat. The scanner
// reports the block's END LINE so a mis-parse is visible in the output instead
// of silently truncating the search space.
const readBlock = (text, headerRe) => {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => headerRe.test(l))
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++
      else if (ch === '}') depth--
    }
    if (depth === 0 && i > start) return { start: start + 1, end: i + 1, lines: lines.slice(start, i + 1) }
  }
  return null
}

// Members at depth 1 of the block. Matches both `name(args): ret;` and
// `name?: type;` / `name: type;`, skipping comment bodies and nested literals.
const membersOf = (block) => {
  if (!block) return []
  const out = []
  let depth = 0
  let inDoc = false
  let doc = []
  let pendingDoc = null
  for (let i = 0; i < block.lines.length; i++) {
    const raw = block.lines[i]
    const line = raw.trim()

    if (inDoc) {
      doc.push(line)
      if (line.includes('*/')) {
        inDoc = false
        pendingDoc = doc.join('\n')
        doc = []
      }
    } else if (line.startsWith('/**')) {
      doc = [line]
      if (line.includes('*/')) {
        pendingDoc = doc.join('\n')
        doc = []
      } else inDoc = true
    } else if (depth === 1 && line && !line.startsWith('//') && !line.startsWith('*')) {
      const m = line.match(/^(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*(\??)\s*(\(|:)/)
      if (m) {
        const platform = pendingDoc?.match(/@platform\s+([\w,]+)/)?.[1] ?? null
        out.push({
          name: m[1],
          kind: m[3] === '(' ? 'method' : 'property',
          optional: m[2] === '?',
          platform,
          line: block.start + i,
          decl: line.replace(/\s+/g, ' ').slice(0, 300),
          doc: pendingDoc
            ? pendingDoc
                .replace(/^\/\*\*|\*\/$/g, '')
                .split('\n')
                .map((l) => l.replace(/^\*\s?/, '').trim())
                .filter(Boolean)
                .join(' ')
                .slice(0, 600)
            : null
        })
        pendingDoc = null
      }
    }

    for (const ch of raw) {
      if (ch === '{') depth++
      else if (ch === '}') depth--
    }
  }
  return out
}

// Two relevance filters, stated so the null results below are readable. A
// member is a HIT if either matches its name, its declaration or its doc.
//
//   MATERIAL — could this member decide what the window is made of?
//   ACTIVITY — could this member decide how appearance tracks focus?
//
// Deliberately loose. #115's grill narrowed to one union, missed
// `visualEffectState`, and was refuted by a wider sweep of this same file.
const MATERIAL_RE = /material|vibrancy|acrylic|mica|tabbed|backdrop|transparen|opacity|composit|glass|blur-?behind|backgroundcolor/i
const ACTIVITY_RE = /visualeffect|stayactive|followwindow|\bfocus|\bblur|\bactive\b|inactive|activation|highlight/i

const classify = (m) => {
  const hay = `${m.name} ${m.decl} ${m.doc ?? ''}`
  return {
    material: MATERIAL_RE.test(hay),
    activity: ACTIVITY_RE.test(hay)
  }
}

if (runs(0)) {
  if (!fs.existsSync(DTS)) throw new Error(`could not sweep: ${DTS} is missing`)
  const text = fs.readFileSync(DTS, 'utf8')

  const surfaces = {
    BaseWindow: readBlock(text, /^\s*class BaseWindow extends NodeEventEmitter \{/),
    BrowserWindow: readBlock(text, /^\s*class BrowserWindow extends BaseWindow \{/),
    App: readBlock(text, /^\s*interface App extends NodeJS\.EventEmitter \{/),
    BaseWindowConstructorOptions: readBlock(text, /^\s*interface BaseWindowConstructorOptions \{/),
    BrowserWindowConstructorOptions: readBlock(
      text,
      /^\s*interface BrowserWindowConstructorOptions extends BaseWindowConstructorOptions \{/
    )
  }

  const s1 = {}
  for (const [name, block] of Object.entries(surfaces)) {
    if (!block) {
      s1[name] = { parsed: false, note: 'declaration not found — the sweep of this surface did not run' }
      continue
    }
    const members = membersOf(block)
    const tagged = members.map((m) => ({ ...m, ...classify(m) }))
    s1[name] = {
      parsed: true,
      declLines: [block.start, block.end],
      // THE SEARCH SPACE. A null result below is only meaningful because this
      // list states what was looked through.
      totalMembers: members.length,
      allMemberNames: members.map((m) => m.name),
      hits: tagged
        .filter((m) => m.material || m.activity)
        .map((m) => ({
          name: m.name,
          kind: m.kind,
          platform: m.platform,
          matched: [m.material && 'material', m.activity && 'activity'].filter(Boolean),
          line: m.line,
          decl: m.decl,
          doc: m.doc
        }))
    }
  }

  // Named absence checks, each with the exact string searched, so "no hits" is
  // reproducible rather than asserted. These are the win32 native-route symbols
  // the 2026-07-23 ADR named.
  const absence = {}
  for (const needle of [
    'SetWindowCompositionAttribute',
    'stayActive',
    'acrylicOpacity',
    'ACCENT_ENABLE_ACRYLICBLURBEHIND',
    'DwmEnableBlurBehindWindow',
    'persistent'
  ]) {
    const re = new RegExp(needle, 'gi')
    absence[needle] = (text.match(re) ?? []).length
  }

  const materialUnion = text.match(/setBackgroundMaterial\(material:\s*([^)]+)\)/)?.[1]?.trim() ?? null

  findings.s1_static = {
    what: 'Every member of BaseWindow / BrowserWindow / App and their constructor options in the INSTALLED electron.d.ts, with the platform scope of each hit. Static: this half owns the search space and the @platform tags, which the runtime does not carry.',
    dts: path.relative(APP_DIR, DTS).replace(/\\/g, '/'),
    electronVersion: JSON.parse(
      fs.readFileSync(path.join(APP_DIR, 'node_modules/electron/package.json'), 'utf8')
    ).version,
    declaredMaterialUnion: materialUnion,
    surfaces: s1,
    absenceCounts: absence,
    absenceNote:
      'Counts are whole-file, case-insensitive, over electron.d.ts. A zero means the symbol is not in the declarations at all — it does NOT mean the underlying Win32 API is unreachable, only that Electron does not surface it.'
  }

  for (const [name, v] of Object.entries(s1)) {
    log('S1', {
      surface: name,
      parsed: v.parsed,
      members: v.totalMembers ?? null,
      hits: v.hits?.length ?? null
    })
  }
  log('S1-ABSENCE', absence)
}

// ===========================================================================
// PHASE 1 — S1 runtime: probe by CALLING, each call with a negative control
// ===========================================================================

if (runs(1)) {
  const { _electron: electron } = await import('playwright-core')
  const electronBin =
    process.platform === 'win32'
      ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
      : process.platform === 'darwin'
        ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
        : path.join(APP_DIR, 'node_modules/electron/dist/electron')

  // Launched WITHOUT --disable-gpu. The recorded trap (gui-69.mjs:9-11) is that
  // the flag flattens acrylic, so a probe that disables the GPU is measuring a
  // window nobody ships. Nothing here reads pixels, but a probe that lies about
  // its own launch conditions is worse than one that does not run.
  const app = await electron.launch({
    executablePath: electronBin,
    args: ['--no-sandbox', '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 45000
  })

  const probe = await app.evaluate(async ({ BrowserWindow, app: a, screen }) => {
    const out = {}

    // The app's OWN window, captured BEFORE this probe creates any of its own.
    // Taking getAllWindows()[0] later returns whichever window the probe just
    // made — measured the hard way: the focus ladder ran against a synthetic
    // 400x300 about:blank window and reported perfectly sane numbers about the
    // wrong window. Nothing in the output would have shown it.
    const appWindow = BrowserWindow.getAllWindows()[0] ?? null
    out.appWindow = appWindow
      ? { id: appWindow.id, bounds: appWindow.getBounds(), url: appWindow.webContents.getURL().slice(0, 120) }
      : null

    // -- the runtime search space, independent of the .d.ts ------------------
    const protoChain = []
    let p = BrowserWindow.prototype
    while (p && p !== Object.prototype) {
      protoChain.push({
        ctor: p.constructor?.name ?? '(anonymous)',
        members: Object.getOwnPropertyNames(p).sort()
      })
      p = Object.getPrototypeOf(p)
    }
    out.browserWindowPrototypeChain = protoChain
    out.appMembers = Object.getOwnPropertyNames(a).sort()

    // -- does the method exist, and is the whitelist real? -------------------
    // A fresh, hidden window so the probe never disturbs the app's own window.
    const w = new BrowserWindow({ show: false, width: 400, height: 300 })
    const call = (fn) => {
      try {
        const value = fn()
        return { threw: false, returned: value === undefined ? '(undefined)' : String(value) }
      } catch (err) {
        return { threw: true, error: String(err?.message ?? err).slice(0, 300) }
      }
    }

    out.setBackgroundMaterial = { exists: typeof w.setBackgroundMaterial === 'function', calls: {} }
    if (out.setBackgroundMaterial.exists) {
      for (const m of ['auto', 'none', 'mica', 'acrylic', 'tabbed']) {
        out.setBackgroundMaterial.calls[m] = call(() => w.setBackgroundMaterial(m))
      }
      // NEGATIVE CONTROLS. Without these, "acrylic was accepted" is compatible
      // with "this method accepts anything", and the union above would be
      // documentation rather than a measured whitelist.
      for (const [label, arg] of [
        ['__bogus__', 'definitely-not-a-material'],
        ['__empty__', ''],
        ['__number__', 7],
        ['__persistent__', 'persistent']
      ]) {
        out.setBackgroundMaterial.calls[label] = call(() => w.setBackgroundMaterial(arg))
      }
    }

    // -- is there ANY read-back? --------------------------------------------
    // A route that cannot be read back cannot be re-asserted on a focus event,
    // which is the shape any "reapply it on blur" workaround would need.
    out.readBack = {
      getBackgroundMaterial: typeof w.getBackgroundMaterial,
      getVibrancy: typeof w.getVibrancy,
      getBackgroundColor: typeof w.getBackgroundColor,
      backgroundMaterialProperty: 'backgroundMaterial' in w
    }

    // -- the darwin stay-active flag, called on THIS platform ----------------
    out.setVibrancy = { exists: typeof w.setVibrancy === 'function', calls: {} }
    if (out.setVibrancy.exists) {
      out.setVibrancy.calls['under-window'] = call(() => w.setVibrancy('under-window'))
      out.setVibrancy.calls.__bogus__ = call(() => w.setVibrancy('definitely-not-a-vibrancy'))
      out.setVibrancy.calls.null = call(() => w.setVibrancy(null))
    }

    // -- does the constructor accept visualEffectState on win32? -------------
    // The literal stay-active flag. Declared @platform darwin and "must be used
    // with the vibrancy property". Asking whether it is merely IGNORED here
    // rather than rejected matters: an ignored option is a dead end that reads
    // like a live one in a diff.
    const ctorProbe = {}
    for (const [label, opts] of [
      ['visualEffectState:active', { visualEffectState: 'active' }],
      ['visualEffectState+vibrancy', { visualEffectState: 'active', vibrancy: 'under-window' }],
      ['visualEffectState:__bogus__', { visualEffectState: 'definitely-not-a-state' }],
      ['backgroundMaterial:acrylic', { backgroundMaterial: 'acrylic' }],
      ['backgroundMaterial:__bogus__', { backgroundMaterial: 'definitely-not-a-material' }]
    ]) {
      try {
        const probeWin = new BrowserWindow({ show: false, width: 200, height: 150, ...opts })
        ctorProbe[label] = { threw: false, created: !probeWin.isDestroyed() }
        probeWin.destroy()
      } catch (err) {
        ctorProbe[label] = { threw: true, error: String(err?.message ?? err).slice(0, 300) }
      }
    }
    out.constructorOptions = ctorProbe
    // Gone before the focus section, so nothing below can accidentally address
    // it instead of the app's window.
    w.destroy()

    // -- the S4 premise: can a window be made HONESTLY unfocused and stay
    //    visible? #75 measured win.blur() as inert and a minimised window as
    //    still reporting focus. Neither leaves a window to photograph. The
    //    untried case is a SECOND window taking focus — what a user does when
    //    they alt-tab, and the only one that keeps window 1 on screen.
    //
    // THE ORDER HERE IS THE WHOLE POINT. A FOCUSED baseline must be ESTABLISHED
    // AND SCORED before any unfocused claim is made. The first version of this
    // probe skipped that, found isFocused() === false at baseline, and would
    // have reported a window that was never focused as "successfully unfocused"
    // — #114's landmine verbatim, an instrument reporting its own setup failure
    // as the phenomenon. So activation is a LADDER, every rung is scored, and if
    // no rung lands the finding is "this could not be driven", not a result.
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

    // The app's OWN window — captured at the top, before this probe made any.
    // It is the window that carries the app's real backdrop and the only one
    // worth photographing.
    const target = appWindow
    if (!target) {
      out.focus = { drivable: false, why: 'the app had no window to probe' }
      return out
    }

    let blurEvents = 0
    let focusEvents = 0
    target.on('blur', () => blurEvents++)
    target.on('focus', () => focusEvents++)

    const sample = (tag) => ({
      tag,
      isFocused: target.isFocused(),
      isVisible: target.isVisible(),
      isMinimized: target.isMinimized(),
      webContentsFocused: target.webContents.isFocused(),
      // The global witness: what Electron itself thinks is focused. A window
      // reporting isFocused() false while getFocusedWindow() names it would be
      // a contradiction worth seeing rather than averaging away.
      focusedWindowId: BrowserWindow.getFocusedWindow()?.id ?? null,
      targetId: target.id,
      blurEvents,
      focusEvents
    })

    const ladder = [
      ['show()+focus()', () => { target.show(); target.focus() }],
      ['moveTop()+focus()', () => { target.moveTop(); target.focus() }],
      ['app.focus({steal:true})', () => a.focus({ steal: true })],
      ['alwaysOnTop+focus()', () => { target.setAlwaysOnTop(true); target.focus(); target.setAlwaysOnTop(false) }],
      ['minimize()+restore()', () => { target.minimize(); target.restore() }]
    ]

    const activation = []
    let focusedBaseline = null
    for (const [tag, fn] of ladder) {
      try {
        fn()
      } catch (err) {
        activation.push({ tag, threw: String(err?.message ?? err).slice(0, 200) })
        continue
      }
      await sleep(900)
      const s = sample(tag)
      activation.push(s)
      if (s.isFocused && s.isVisible && !s.isMinimized) {
        focusedBaseline = s
        break
      }
    }

    const unfocusSteps = []
    let honestUnfocused = null
    let thief = null
    if (focusedBaseline) {
      target.blur()
      await sleep(800)
      unfocusSteps.push(sample('after target.blur()'))

      thief = new BrowserWindow({ show: true, width: 320, height: 220, x: 30, y: 30 })
      await sleep(500)
      thief.focus()
      await sleep(1200)
      const s = sample('after a SECOND window took focus')
      unfocusSteps.push(s)
      if (!s.isFocused && s.isVisible && !s.isMinimized) honestUnfocused = s
    }

    const display = screen.getPrimaryDisplay()
    out.focus = {
      drivable: !!focusedBaseline,
      activationLadder: activation,
      focusedBaselineVia: focusedBaseline?.tag ?? null,
      unfocusSteps,
      honestlyUnfocusedVia: honestUnfocused?.tag ?? null,
      targetBounds: target.getBounds(),
      scaleFactor: display.scaleFactor,
      note: 'A FOCUSED baseline must be scored first: without it, isFocused()===false is indistinguishable from a window that never took focus, and calling that "unfocused" would photograph a setup failure. A window is honestly unfocused only when isFocused() is false while isVisible() is true and isMinimized() is false — the combination #75 could not produce by blur(), minimize() or hide().'
    }

    // Left up for phase 2 to photograph if it runs.
    globalThis.__s117 = { targetId: target.id, thiefId: thief?.id ?? null }

    return out
  })

  findings.s1_runtime = {
    what: 'The same surface MEASURED by calling, inside a real Electron main process. Every acceptance test is paired with a deliberately bogus argument; without that control an accepted value proves nothing about a whitelist.',
    launchedWith: ['--no-sandbox', '.'],
    disableGpu: false,
    disableGpuNote:
      'Deliberately absent — the recorded trap (gui-69.mjs:9-11) is that --disable-gpu flattens acrylic. Nothing in this phase reads pixels, but the launch conditions are stated so no later reader has to guess.',
    ...probe
  }

  log('S1-RT-METHOD', {
    setBackgroundMaterial: probe.setBackgroundMaterial?.exists,
    setVibrancy: probe.setVibrancy?.exists,
    readBack: probe.readBack
  })
  log(
    'S1-RT-CALLS',
    Object.fromEntries(
      Object.entries(probe.setBackgroundMaterial?.calls ?? {}).map(([k, v]) => [k, v.threw ? 'THREW' : 'accepted'])
    )
  )
  log('S1-RT-CTOR', Object.fromEntries(Object.entries(probe.constructorOptions ?? {}).map(([k, v]) => [k, v.threw ? 'THREW' : 'created'])))
  log('S1-RT-WINDOW', probe.appWindow)
  for (const s of probe.focus?.activationLadder ?? []) log('S1-RT-ACTIVATE', s)
  for (const s of probe.focus?.unfocusSteps ?? []) log('S1-RT-UNFOCUS', s)
  log('S1-RT-FOCUS', {
    drivable: probe.focus?.drivable,
    focusedVia: probe.focus?.focusedBaselineVia,
    unfocusedVia: probe.focus?.honestlyUnfocusedVia
  })

  // -------------------------------------------------------------------------
  // PHASE 2 — S4. Read this before reading any image it writes.
  // -------------------------------------------------------------------------
  //
  // A `page.screenshot()` CANNOT show this window's backdrop, and that is not a
  // limitation of automation — it is what the compositor does. The window is
  // `backgroundColor: '#00000000'` with a transparent html/body, so the backdrop
  // is drawn by DWM BEHIND the web contents. A web-contents capture is a capture
  // of the transparent layer: it returns the app's own paint over nothing. Every
  // screenshot in .claude/skills/run-desktop/ is that kind, which is exactly why
  // gui-69 says in its own header that it cannot judge appearance.
  //
  // The only capture that could show a backdrop is a DESKTOP capture — the
  // composited framebuffer, wallpaper included. That is attempted below via
  // GDI CopyFromScreen. It is best-effort and can fail honestly in ways that
  // must be reported rather than photographed around:
  //   - a locked or disconnected session captures black;
  //   - the capture races DWM's own transition after a focus change;
  //   - the result contains whatever is behind the window, which is the point,
  //     and also the reason the shots are described rather than trusted.
  //
  // It runs ONLY if phase 1 proved an honestly-unfocused visible window is
  // producible. Photographing a window that still reports itself focused and
  // captioning it "unfocused" is this repo's most-repeated landmine (#114).
  if (runs(2)) {
    // BOTH halves are preconditions, and they fail for different reasons worth
    // telling apart: without a focused baseline there is no "before" picture,
    // and without an honest unfocus there is no "after". A pair is only a pair
    // if both were measured.
    const canFocus = probe.focus?.drivable === true
    const honestUnfocus = probe.focus?.honestlyUnfocusedVia ?? null
    findings.s4 = {
      what: 'Best-effort captures of the window in both focus states, for the owner to judge in one place.',
      webContentsCaptureIsUseless: true,
      webContentsCaptureNote:
        "page.screenshot() captures the web contents, and this window's contents are transparent over a DWM-drawn backdrop. Such a capture cannot show acrylic or mica at all — not badly, but not at all. This is why no shot under .claude/skills/run-desktop/ is evidence about appearance.",
      focusedBaselineProducible: canFocus,
      focusedBaselineVia: probe.focus?.focusedBaselineVia ?? null,
      honestlyUnfocusedWindowProducible: !!honestUnfocus,
      honestlyUnfocusedVia: honestUnfocus
    }

    if (!canFocus || !honestUnfocus) {
      findings.s4.captures = null
      findings.s4.whyNot = !canFocus
        ? 'No rung of the activation ladder produced a window that reported itself focused, visible and un-minimised. With no focused baseline there is no "before" frame, and an unfocused-looking capture would be indistinguishable from a window that never took focus — which is the failure this spike is most at risk of photographing and captioning as a result.'
        : 'A focused baseline was established, but nothing then produced a window that was simultaneously unfocused, visible and un-minimised. #75 measured the same wall: blur() is inert, a minimised window still reports focus, and hide() removes the window being photographed.'
      log('S4', { attempted: false, canFocus, honestUnfocus })
    } else {
      fs.mkdirSync(SHOT_DIR, { recursive: true })
      const grab = (file, rect) => {
        // GDI CopyFromScreen over the window rect. PowerShell rather than a
        // dependency: S2's whole point is that this ticket installs nothing.
        const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap ${rect.width}, ${rect.height}
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(${rect.x}, ${rect.y}, 0, 0, $bmp.Size)
$bmp.Save('${file.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output 'ok'`
        try {
          const r = execFileSync(
            'powershell.exe',
            ['-NoProfile', '-NonInteractive', '-Command', ps],
            { encoding: 'utf8', timeout: 30000 }
          )
          return { ok: r.trim().endsWith('ok'), bytes: fs.existsSync(file) ? fs.statSync(file).size : 0 }
        } catch (err) {
          return { ok: false, error: String(err?.message ?? err).slice(0, 300) }
        }
      }

      // A capture that is a single flat colour is a failed capture (locked
      // session, or a window that never painted) wearing the costume of a
      // result. Scored, not eyeballed — #114's landmine is an instrument
      // reporting its own setup failure as the phenomenon.
      const scoreImage = (file) => {
        const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap('${file.replace(/\\/g, '\\\\')}')
$colors = @{}
for ($y = 0; $y -lt $bmp.Height; $y += 7) {
  for ($x = 0; $x -lt $bmp.Width; $x += 7) {
    $c = $bmp.GetPixel($x, $y).ToArgb()
    $colors[$c] = 1
  }
}
$bmp.Dispose()
Write-Output $colors.Count`
        try {
          const r = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
            encoding: 'utf8',
            timeout: 30000
          })
          return Number(r.trim())
        } catch {
          return -1
        }
      }

      // ---- the occlusion control, and why a colour count is not one --------
      //
      // The FIRST run of this phase captured four rectangles that scored 595 to
      // 1256 distinct colours, passed `looksBlank`, and were photographs of a
      // TERMINAL WINDOW sitting on top of the app. `moveTop()` did not raise the
      // app above it. Nothing in the output showed this; it was caught by
      // opening the file. A richness score cannot tell "the backdrop" from
      // "someone else's window" — both are colourful.
      //
      // So the capture now has a POSITIVE CONTROL. The renderer paints a pure
      // magenta square into each of the four corners of its own viewport, the
      // rectangle is grabbed, and each corner is searched for that colour. Four
      // corners found = the app's own pixels reached all four corners of the
      // grabbed rectangle, so nothing is covering it. Magenta because this app's
      // palette is near-black neutrals plus one teal accent; it cannot occur by
      // accident.
      //
      // Two passes per state: a MARKED pass that is only ever scored, then a
      // CLEAN pass, taken back-to-back under the same conditions, which is the
      // image the owner actually opens. The markers never appear in a delivered
      // shot, and an unverified shot is never delivered.
      const MARKER = { r: 255, g: 0, b: 255 }
      const setMarkers = (on) =>
        app.evaluate(
          async ({ BrowserWindow }, arg) => {
            const win = BrowserWindow.fromId(arg.id)
            if (!win) return false
            await win.webContents.executeJavaScript(
              arg.on
                ? `(() => {
                     document.querySelectorAll('.__s117m').forEach(n => n.remove())
                     for (const [a, b] of [['top','left'],['top','right'],['bottom','left'],['bottom','right']]) {
                       const d = document.createElement('div')
                       d.className = '__s117m'
                       d.style.cssText = 'position:fixed;width:28px;height:28px;background:#f0f;z-index:2147483647;pointer-events:none;' + a + ':0;' + b + ':0;'
                       document.body.appendChild(d)
                     }
                     return true
                   })()`
                : `(() => { document.querySelectorAll('.__s117m').forEach(n => n.remove()); return true })()`
            )
            return true
          },
          { id: probeIds.targetId, on }
        )

      // Search a 44x44 box at each corner for the marker colour. A box rather
      // than an exact pixel: the grabbed rect is the WINDOW rect and the client
      // area can sit a few pixels inside it, so an exact-pixel test would fail
      // for a reason that has nothing to do with occlusion.
      const cornersFound = (file) => {
        const f = file.replace(/\\/g, '\\\\')
        const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap('${f}')
$w = $bmp.Width; $h = $bmp.Height; $box = 44
$corners = @(@(0,0), @(($w-$box),0), @(0,($h-$box)), @(($w-$box),($h-$box)))
$found = 0
foreach ($c in $corners) {
  $hit = $false
  for ($y = $c[1]; $y -lt ($c[1] + $box) -and -not $hit; $y++) {
    for ($x = $c[0]; $x -lt ($c[0] + $box) -and -not $hit; $x++) {
      if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { continue }
      $p = $bmp.GetPixel($x, $y)
      if ($p.R -gt 200 -and $p.G -lt 80 -and $p.B -gt 200) { $hit = $true }
    }
  }
  if ($hit) { $found++ }
}
$bmp.Dispose()
Write-Output $found`
        try {
          const r = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
            encoding: 'utf8',
            timeout: 60000
          })
          return Number(r.trim())
        } catch (err) {
          return -1
        }
      }

      const probeIds = await app.evaluate(() => globalThis.__s117)

      const setMaterialAndFocus = (material, focused) =>
        app.evaluate(
          async ({ BrowserWindow, app: a }, arg) => {
            const target = BrowserWindow.fromId(arg.targetId)
            const thief = BrowserWindow.fromId(arg.thiefId)
            if (!target) return null
            target.setBackgroundMaterial(arg.material)
            // Raise it so the rectangle grabbed below is actually this window
            // and not whatever is sitting on top of it. `moveTop()` alone was
            // MEASURED to be insufficient — the first run photographed a
            // terminal that stayed above it — so the window is pinned
            // always-on-top for the duration of the captures and released
            // afterwards. z-order is not focus: the sample returned below is
            // taken AFTER this, so if either call stole focus the row records
            // it and is scored dishonest.
            target.setAlwaysOnTop(true, 'screen-saver')
            target.moveTop()
            if (arg.focused) {
              target.focus()
              a.focus({ steal: true })
            } else {
              thief?.focus()
            }
            await new Promise((r) => setTimeout(r, 1400))
            return {
              isFocused: target.isFocused(),
              isVisible: target.isVisible(),
              isMinimized: target.isMinimized(),
              bounds: target.getBounds()
            }
          },
          { ...probeIds, material, focused }
        )

      // Difference between the focused and unfocused capture of the SAME
      // material. Sampled on a 5px grid, reported as mean per-channel delta and
      // the fraction of sampled pixels moving more than 8/255 on any channel.
      //
      // This is DATA, not a verdict. It is here because the alternative is that
      // the colour counts already in the output get read as a proxy for it, and
      // a stated number with its confounds beats an accidental one. What it
      // cannot do is settle whether mica survives blur — that is an owner call
      // parked on #115, and a delta from one machine, one wallpaper and one
      // settle time is not the observation that settles it. It is repeated
      // across rounds so "reproduces" or "does not reproduce" is measured
      // rather than assumed.
      const pairDelta = (a, b) => {
        const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$x1 = New-Object System.Drawing.Bitmap('${a.replace(/\\/g, '\\\\')}')
$x2 = New-Object System.Drawing.Bitmap('${b.replace(/\\/g, '\\\\')}')
if ($x1.Width -ne $x2.Width -or $x1.Height -ne $x2.Height) { Write-Output 'SIZE'; exit }
$sum = 0; $n = 0; $moved = 0
for ($y = 0; $y -lt $x1.Height; $y += 8) {
  for ($x = 0; $x -lt $x1.Width; $x += 8) {
    $p = $x1.GetPixel($x, $y); $q = $x2.GetPixel($x, $y)
    $dr = [Math]::Abs($p.R - $q.R); $dg = [Math]::Abs($p.G - $q.G); $db = [Math]::Abs($p.B - $q.B)
    $sum += ($dr + $dg + $db) / 3
    if ($dr -gt 8 -or $dg -gt 8 -or $db -gt 8) { $moved++ }
    $n++
  }
}
$x1.Dispose(); $x2.Dispose()
Write-Output ("{0:F3} {1:F4} {2}" -f ($sum / $n), ($moved / $n), $n)`
        try {
          const r = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
            encoding: 'utf8',
            timeout: 120000
          }).trim()
          if (r === 'SIZE') return { error: 'captures differ in size — the window was resized between them' }
          const [mean, movedFraction, sampled] = r.split(/\s+/)
          return {
            meanChannelDelta: Number(mean),
            fractionMovedOver8: Number(movedFraction),
            pixelsSampled: Number(sampled)
          }
        } catch (err) {
          return { error: String(err?.message ?? err).slice(0, 200) }
        }
      }

      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const ROUNDS = Number(process.env.SPIKE117_ROUNDS ?? 3)
      const captures = []
      const deltas = []
      for (let round = 1; round <= ROUNDS; round++) {
      for (const material of ['acrylic', 'mica']) {
        for (const focused of [true, false]) {
          const state = await setMaterialAndFocus(material, focused)
          const stem = `spike-117-${material}-${focused ? 'focused' : 'unfocused'}${round > 1 ? `.r${round}` : ''}`
          const markedFile = path.join(SHOT_DIR, `${stem}.marked.png`)
          const file = path.join(SHOT_DIR, `${stem}.png`)

          // Pass 1 — MARKED, scored only, never delivered.
          await setMarkers(true)
          await sleep(400)
          const markedRes = state ? grab(markedFile, state.bounds) : { ok: false, error: 'window gone' }
          const corners = markedRes.ok ? cornersFound(markedFile) : -1
          await setMarkers(false)
          await sleep(400)

          // Pass 2 — CLEAN, same conditions, this is the deliverable.
          const res = state ? grab(file, state.bounds) : { ok: false, error: 'window gone' }
          const distinctColors = res.ok ? scoreImage(file) : -1

          // The marked pass has served its purpose; leaving it behind would
          // hand the owner a second set of images to confuse with the real one.
          try {
            fs.rmSync(markedFile, { force: true })
          } catch {}

          const focusHonest = !!state && state.isFocused === focused && state.isVisible && !state.isMinimized
          const unoccluded = corners === 4
          const row = {
            round,
            material,
            requestedFocused: focused,
            // The measured state at capture time, NOT the requested one. A row
            // whose measured focus disagrees with its request is a failed
            // capture and says so in the file itself.
            measured: state,
            focusHonest,
            cornersFound: corners,
            unoccluded,
            // BOTH must hold. Focus honesty without an occlusion control is
            // what produced four convincing photographs of a terminal.
            usable: focusHonest && unoccluded && res.ok,
            file: res.ok ? path.relative(APP_DIR, file).replace(/\\/g, '/') : null,
            capture: res,
            distinctColorsSampled: distinctColors,
            looksBlank: distinctColors >= 0 && distinctColors <= 2
          }
          captures.push(row)
          log('S4-SHOT', {
            round,
            material,
            focused,
            focusHonest,
            corners,
            usable: row.usable,
            colors: distinctColors
          })
        }

        // The pair for this material in this round, compared only if BOTH
        // halves passed the focus and occlusion controls. Comparing an
        // unusable capture would manufacture a delta out of an occlusion.
        const pair = captures.filter((c) => c.round === round && c.material === material)
        const both = pair.length === 2 && pair.every((c) => c.usable)
        const d = both
          ? pairDelta(path.join(APP_DIR, pair[0].file), path.join(APP_DIR, pair[1].file))
          : { error: 'one or both captures in this pair were not usable' }
        deltas.push({ round, material, comparable: both, ...d })
        log('S4-DELTA', { round, material, ...d })
      }
      }

      // Rounds 2+ exist only to say whether the delta reproduces. Keeping their
      // images would hand the owner twelve near-identical PNGs to compare when
      // four is the question. Deleted, and their rows say so.
      for (const c of captures) {
        if (c.round > 1 && c.file) {
          try {
            fs.rmSync(path.join(APP_DIR, c.file), { force: true })
          } catch {}
          c.file = null
          c.fileNote = 'deleted after its delta was scored — rounds 2+ exist to test reproducibility, not to be looked at'
        }
      }

      // Release the pin. Left set, it would follow the app's next real launch
      // for the owner and read as a bug this ticket caused.
      await app
        .evaluate(({ BrowserWindow }, id) => BrowserWindow.fromId(id)?.setAlwaysOnTop(false), probeIds.targetId)
        .catch(() => {})

      findings.s4.captures = captures
      findings.s4.allUsable = captures.every((c) => c.usable)
      findings.s4.rounds = ROUNDS
      findings.s4.focusedVsUnfocusedDelta = deltas
      findings.s4.deltaConfounds = [
        'n=1 machine, one wallpaper, one theme, one window position, one ~1.4s settle after the focus change.',
        'DWM animates material transitions; a capture taken during that transition is neither end state.',
        'What sits BEHIND the window is what acrylic blurs, and it is whatever the desktop happened to hold.',
        'The window was always-on-top for every capture. That is constant across the pair, so it cannot produce a delta, but it is not the z-order a user has.',
        'This delta is reported so it is not silently inferred from the colour counts. It does NOT settle whether mica survives blur — that stays an owner call on #115.'
      ]
      findings.s4.readThisBeforeTheImages = [
        'These are DESKTOP captures of the window rectangle, not web-contents captures — that is the only kind that can show a DWM backdrop at all.',
        'Each row records the focus state MEASURED at capture time. A row with focusHonest:false did not photograph the state it was asked for and must not be read as if it did.',
        'cornersFound is an occlusion control: the renderer painted magenta squares into its four corners for a throwaway pass, and 4 means the app\'s own pixels reached all four corners of the grabbed rectangle. The first run of this phase scored 595-1256 distinct colours on four photographs of a TERMINAL sitting on top of the app, so a richness score alone is not a control. Only rows with usable:true are evidence of anything.',
        'A row with looksBlank:true sampled <=2 distinct colours, which is what a locked session or an unpainted window returns. It is a failed capture, not a flat backdrop.',
        'The window was pinned always-on-top for the captures and released afterwards. That changes z-order, not material and not focus, and each row\'s measured focus state is recorded after the pin.',
        'What these images CANNOT settle: whether mica survives blur. That is an owner call parked on #115, and a pair of PNGs taken ~1.4s after a focus change, on one machine, over one wallpaper, is not the observation that settles it.'
      ]
    }
  }

  await app.close().catch(() => {})
}

// ===========================================================================
// PHASE 3 — S2 + S3: the native routes, priced from PUBLISHED METADATA
// ===========================================================================
//
// NOTHING IS INSTALLED. The ticket's hard constraint is that S2 is priced from
// published metadata, not from a working tree, so every fact below comes from a
// registry or API read whose exact command is recorded beside its answer. That
// is the difference between a price and an opinion: a later reader can re-run
// the command and see whether the number moved.
//
// Network-dependent by nature. A failed query is recorded as a failed query.
if (runs(3)) {
  const run = (label, file, args, pick) => {
    const cmd = `${file} ${args.join(' ')}`
    try {
      const raw = execFileSync(file, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024 })
      return { label, cmd, ok: true, value: pick ? pick(JSON.parse(raw)) : raw.trim() }
    } catch (err) {
      return { label, cmd, ok: false, error: String(err?.message ?? err).slice(0, 300) }
    }
  }

  // The registry endpoint directly, not `npm view`. Two reasons, both learned
  // here: on Windows `npm` is a .cmd shim that Node 22 refuses to spawn without
  // a shell (EINVAL, the CVE-2024-27980 mitigation), and a plain GET is a more
  // literal reading of "priced from published metadata" than a CLI wrapper.
  const npmPkg = async (name) => {
    const url = `https://registry.npmjs.org/${name}`
    try {
      const res = await fetch(url)
      if (!res.ok) return { label: `npm:${name}`, cmd: `GET ${url}`, ok: false, error: `HTTP ${res.status}` }
      const j = await res.json()
      const latest = j['dist-tags']?.latest ?? null
      const v = latest ? j.versions?.[latest] ?? {} : {}
      const t = j.time ?? {}
      const versions = Object.keys(t).filter((k) => !['created', 'modified'].includes(k))
      return {
        label: `npm:${name}`,
        cmd: `GET ${url}`,
        ok: true,
        value: {
          latest,
          latestPublished: latest ? t[latest] ?? null : null,
          firstPublished: t.created ?? null,
          versionCount: versions.length,
          license: v.license ?? j.license ?? null,
          deprecated: v.deprecated ?? null,
          dependencies: v.dependencies ?? null,
          peerDependencies: v.peerDependencies ?? null,
          engines: v.engines ?? null,
          os: v.os ?? null,
          gypfile: v.gypfile ?? null,
          repository: v.repository?.url ?? j.repository?.url ?? null
        }
      }
    } catch (err) {
      return { label: `npm:${name}`, cmd: `GET ${url}`, ok: false, error: String(err?.message ?? err).slice(0, 300) }
    }
  }

  const ghRepo = (slug) =>
    run(`gh:${slug}`, 'gh', ['api', `repos/${slug}`], (j) => ({
      archived: j.archived,
      stars: j.stargazers_count,
      openIssues: j.open_issues_count,
      lastPush: j.pushed_at,
      license: j.license?.spdx_id ?? null
    }))

  const ghIssues = (q, label) =>
    run(label, 'gh', ['api', `search/issues?q=${q}&per_page=100`], (j) => ({
      totalCount: j.total_count,
      items: (j.items ?? []).map((i) => `${i.state} #${i.number} ${i.created_at.slice(0, 10)} ${i.title}`)
    }))

  const queries = [
    await npmPkg('electron-acrylic-window'),
    await npmPkg('koffi'),
    await npmPkg('mica-electron'),
    await npmPkg('electron'),
    ghRepo('Seo-Rii/electron-acrylic-window'),
    ghRepo('GregVido/mica-electron'),
    ghRepo('Koromix/koffi'),
    ghIssues('repo:Seo-Rii/electron-acrylic-window+is:issue+is:open', 'issues:electron-acrylic-window(open)'),
    ghIssues('repo:GregVido/mica-electron+is:issue+is:open', 'issues:mica-electron(open)'),
    ghIssues('repo:Koromix/koffi+electron', 'issues:koffi+electron'),
    ghIssues('repo:electron/electron+backgroundMaterial+in:title', 'issues:electron+backgroundMaterial'),
    ghIssues('repo:electron/electron+visualEffectState', 'issues:electron+visualEffectState')
  ]

  findings.s2_s3_published = {
    what: 'S2 and S3, priced from published registry and API metadata. NOTHING WAS INSTALLED — the ticket forbids pricing from a working tree, and package.json is unchanged. Every row carries the exact command that produced it so the price can be re-checked rather than believed.',
    collectedOn: '2026-08-05',
    collectedOnNote:
      'Hand-stamped, not read from a clock: this file is committed and a re-run must not produce a spurious diff. Re-running the commands below is how a later reader checks whether any of it has moved.',
    queries
  }
  for (const q of queries) log('S2S3', { label: q.label, ok: q.ok })
}

fs.writeFileSync(OUT, JSON.stringify(findings, null, 2) + '\n')
log('WROTE', path.relative(APP_DIR, OUT).replace(/\\/g, '/'))
