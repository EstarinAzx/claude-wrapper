// GUI eyeball for #80 — type while a turn runs, and the queued send that follows.
//
//   node .claude/skills/run-desktop/gui-80.mjs
//
// Needs `npm run build` first. Costs TWO real CLI turns.
//
// jsdom proves the state machine against a scripted engine, and it proves it
// well: the decision table is pinned row by row and the wiring is mutation-
// verified in both directions. What it CANNOT prove is the number this ticket
// actually turns on — how many prompts reached MAIN. In jsdom a second flush is
// swallowed by `useChat.send`'s own busy guard and leaves no trace, so a queue
// that fires twice and a queue that fires once look identical from the DOM.
// This driver counts the IPC instead: a second listener on `chat:send`, added in
// the MAIN process beside the real one, which is the side effect itself rather
// than a rendering of it.
//
// Two phases, and the second one is free — it rides the turn the first one
// started, so the negative costs no extra CLI time:
//
//   phase 1  queue behind a long turn, let it END → the prompt sends, ONCE.
//   phase 2  queue behind the turn phase 1 just started, press STOP → it does
//            not send, and the words are still in the composer.
//
// Phase 2 is the assertion this whole design exists to make true: Stop clears
// `busy` exactly as a finished turn does, so an implementation that flushed on
// "no longer busy" would resend here — into a turn the user just killed.
//
// Establishes its premise loudly (#65). Every phase checks it was actually in
// the state it claims to measure — busy at the moment of queueing, still busy at
// the moment of stopping — and FAILS naming the setup step rather than passing
// vacuously, which is how a queue assertion that never queued anything would
// otherwise report green.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// The project the app opens into. APP_DIR rather than a fresh temp folder on
// purpose: gui-48 measured a cold CLI in a brand-new workspace taking up to 60s
// to go in flight, and this driver needs two turns inside one watchdog.
const PICK_DIR = APP_DIR

// gui-73's prompt, measured to stay in flight long enough for a driver to work
// underneath it. Both turns need that, so both count.
const TURN_1 = 'Count from 1 to 40, one number per line, with a short pause between each.'
// The QUEUED one. Carries a marker so its user bubble can be counted apart from
// everything else in the pane — "did it send" cannot see a double send, and a
// count is the whole point of this file.
const QUEUED_MARK = 'QUEUED-B'
const TURN_2 = `${QUEUED_MARK}: Count from 1 to 30, one number per line, with a short pause between each.`
// Queued behind turn 2 and never sent — phase 2's subject. It must still be in
// the composer at the end, which is what proves the release was lossless.
const STOPPED_MARK = 'STOPPED-C'
const TURN_3 = `${STOPPED_MARK}: this prompt must never reach the CLI`

// Ten minutes: two real turns.
setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 600000).unref?.()

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

await app.evaluate(async ({ dialog, ipcMain }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  // THE instrument. A SECOND listener on the same channel — `ipcMain.on` appends,
  // so the real handler is untouched and still runs; this only witnesses. (A
  // `handle` channel could not be counted this way: invoke allows one handler and
  // registering a second throws.) Every prompt that leaves the renderer lands
  // here exactly once, which is the side effect the acceptance criterion names.
  globalThis.__sends = []
  ipcMain.on('chat:send', (_e, payload) => {
    globalThis.__sends.push(typeof payload?.text === 'string' ? payload.text : '<no text>')
  })
}, PICK_DIR)

const sends = () => app.evaluate(() => globalThis.__sends.slice())

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// DOM-dispatched: Playwright's actionability wait hangs on the intro animation.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })

const log = (label, m) => console.log(label.padEnd(10) + JSON.stringify(m))

// The in-flight signal every driver in this folder reads (gui-54, gui-73, gui-75).
const isBusy = () => page.evaluate(() => document.querySelector('.model-pill')?.disabled ?? false)

const setDraft = (text) =>
  page.evaluate((text) => {
    const el = document.querySelector('.message-input')
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, text)

const pressEnter = () =>
  page.evaluate(() =>
    document
      .querySelector('.message-input')
      ?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      )
  )

const composer = () =>
  page.evaluate(() => {
    const el = document.querySelector('.message-input')
    const note = document.querySelector('.queued-note')
    const cancel = document.querySelector('.queued-note-cancel')
    const sendBtn = document.querySelector('.send-btn')
    return {
      // AC 2, and only a real window can say it: the field is not disabled AND
      // it is not read-only, which is the other way to be dead while looking live.
      disabled: el?.disabled ?? null,
      readOnly: el?.readOnly ?? null,
      value: el?.value ?? null,
      queued: !!note,
      noteText: note?.textContent ?? null,
      // The affordance has to be reachable, not merely present: a control that
      // collapsed to nothing passes every querySelector above.
      cancelName: cancel?.getAttribute('aria-label') ?? null,
      cancelBox: cancel
        ? { w: cancel.getBoundingClientRect().width, h: cancel.getBoundingClientRect().height }
        : null,
      // While busy the send slot IS Stop — the design hole the ticket names.
      // Queueing must not grow a second send button beside it.
      sendLabel: sendBtn?.getAttribute('aria-label') ?? null,
      sendButtons: [...document.querySelectorAll('button')].filter(
        (b) => b.getAttribute('aria-label') === 'Send'
      ).length
    }
  })

// User bubbles carrying a marker. This is the RENDERED count, kept beside the
// IPC count deliberately: they answer different questions, and a disagreement
// between them is itself informative.
const bubbles = (mark) =>
  page.evaluate(
    (mark) =>
      [...document.querySelectorAll('.msg-user')].filter((n) => (n.textContent ?? '').includes(mark))
        .length,
    mark
  )

const waitBusy = async () => {
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000)
    if (await isBusy()) return true
  }
  return false
}

const waitIdle = async () => {
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(2000)
    if (!(await isBusy())) return true
  }
  return false
}

// Wait for the flush by watching the SIDE EFFECT, never the busy edge.
//
// Measured, and it cost a run: turn 1 ending and the flushed turn 2 starting are
// one React commit apart, so a poll that samples `busy` steps straight over the
// boundary — the first run of this driver reported "the flushed prompt never put
// the app back in flight" for a prompt that had already sent, run and finished.
// An edge between two samples is not observable by sampling. The send count is,
// because it only ever goes up, and catching it at 500ms puts us inside the turn
// it started rather than somewhere after it.
const waitForSends = async (n) => {
  for (let i = 0; i < 720; i++) {
    if ((await sends()).length >= n) return true
    await page.waitForTimeout(500)
  }
  return false
}

const fails = []

// ── phase 1: queue behind a running turn, let it finish ─────────────────────

await setDraft(TURN_1)
await pressEnter()
const wentBusy = await waitBusy()
const userMsgsAfterFirst = await page.evaluate(
  () => document.querySelectorAll('.msg-user').length
)
log('TURN1', { wentBusy, userMsgs: userMsgsAfterFirst, sends: (await sends()).length })

// The composer AS IT IS while a turn streams — the ticket's whole premise.
const liveWhileBusy = wentBusy ? await composer() : null
if (wentBusy) log('LIVE', liveWhileBusy)

// Type into it while the turn runs, then commit.
let queuedState = null
let busyAtQueue = false
let sendsAtQueue = []
if (wentBusy) {
  await setDraft(TURN_2)
  const typed = await composer()
  busyAtQueue = await isBusy()
  await pressEnter()
  await page.waitForTimeout(500)
  queuedState = await composer()
  sendsAtQueue = await sends()
  log('QUEUE', {
    typedWhileBusy: typed.value === TURN_2,
    busyAtQueue,
    queued: queuedState.queued,
    note: queuedState.noteText,
    cancelName: queuedState.cancelName,
    sendLabel: queuedState.sendLabel,
    sendButtons: queuedState.sendButtons,
    sends: sendsAtQueue.length
  })
}

// Let turn 1 end. THE flush — detected by the prompt reaching main, which is
// both the acceptance criterion and the only thing here that cannot be raced.
const turn1Ended = wentBusy ? await waitForSends(2) : false
// Sampled immediately after, so this lands INSIDE the turn the flush started
// rather than after it: evidence the prompt reached the engine and became a turn
// rather than merely crossing IPC.
const flushedIntoATurn = turn1Ended ? await isBusy() : false
const afterFlush = await composer()
const sendsAfterFlush = await sends()
const bubblesB = await bubbles(QUEUED_MARK)
log('FLUSH', {
  turn1Ended,
  flushedIntoATurn,
  sends: sendsAfterFlush.length,
  queuedSends: sendsAfterFlush.filter((t) => t.includes(QUEUED_MARK)).length,
  bubbles: bubblesB,
  composerValue: afterFlush.value,
  stillQueued: afterFlush.queued
})

// ── phase 2: queue behind THAT turn, then press Stop ────────────────────────
//
// Free: it rides the turn the flush just started. This is the negative — Stop
// clears busy exactly as turn-end does, and nothing may be sent.

let busyAtStop = false
let stoppedState = null
let sendsAfterStop = []
if (flushedIntoATurn) {
  await setDraft(TURN_3)
  await pressEnter()
  await page.waitForTimeout(500)
  const queuedAgain = await composer()
  busyAtStop = await isBusy()
  log('QUEUE2', { queued: queuedAgain.queued, busyAtStop })

  if (busyAtStop && queuedAgain.queued) {
    await page.evaluate(() => {
      const btn = document.querySelector('.send-btn')
      if (btn?.getAttribute('aria-label') === 'Stop') btn.click()
    })
    await waitIdle()
    await page.waitForTimeout(1500)
    stoppedState = await composer()
    sendsAfterStop = await sends()
    log('STOP', {
      sends: sendsAfterStop.length,
      stoppedSends: sendsAfterStop.filter((t) => t.includes(STOPPED_MARK)).length,
      stillQueued: stoppedState.queued,
      composerValue: stoppedState.value,
      bubbles: await bubbles(STOPPED_MARK)
    })
  }
}

const shot = path.join(SHOT_DIR, 'queued-send.png')
await page.screenshot({ path: shot })
console.log('SHOT ' + shot)

// ── verdict ────────────────────────────────────────────────────────────────

// Premise first, and loudly: every assertion below is about what happens WHILE a
// turn runs, so a run that never got one measured nothing.
if (!wentBusy) {
  fails.push(
    userMsgsAfterFirst === 0
      ? 'could not drive: the first prompt never reached the pane (no .msg-user), so the send itself failed and nothing was ever streaming'
      : 'could not drive: the prompt is in the pane but the turn never went in flight within 60s (.model-pill never disabled) — the CLI did not start, so nothing could be queued behind it'
  )
} else {
  // AC 2, against the real window.
  if (liveWhileBusy.disabled !== false) {
    fails.push('the composer is still disabled while a turn runs — the ticket\'s entire premise')
  }
  if (liveWhileBusy.readOnly === true) {
    fails.push('the composer is readOnly while a turn runs — live-looking and just as dead')
  }
  if (queuedState === null) {
    fails.push('could not drive: never reached the queueing step')
  } else {
    if (!busyAtQueue) {
      fails.push(
        'could not drive: the turn had already ended when the prompt was committed, so nothing was queued — re-run; every assertion below would have been vacuous'
      )
    }
    if (queuedState.value !== TURN_2) {
      fails.push(
        `typing while busy did not land: composer holds ${JSON.stringify(queuedState.value)}`
      )
    }
    // AC 3: a pending prompt is VISIBLE and cancellable.
    if (!queuedState.queued) {
      fails.push(
        'Enter while busy showed no pending state — the user pressed Enter into silence, which is the failure this ticket exists to fix'
      )
    }
    if (queuedState.cancelName !== 'Cancel queued prompt') {
      fails.push(
        `the queued prompt has no cancel control with an accessible name (got ${JSON.stringify(queuedState.cancelName)}) — a commitment with no way out`
      )
    }
    if (
      queuedState.cancelBox &&
      (queuedState.cancelBox.w < 8 || queuedState.cancelBox.h < 8)
    ) {
      fails.push(`the cancel control has collapsed: ${JSON.stringify(queuedState.cancelBox)}`)
    }
    // The design hole, answered: Stop stays the button, and no second send
    // affordance appears beside it to race the queue.
    if (queuedState.sendLabel !== 'Stop') {
      fails.push(
        `the send slot reads ${JSON.stringify(queuedState.sendLabel)} during a turn, expected Stop`
      )
    }
    if (queuedState.sendButtons !== 0) {
      fails.push(
        `${queuedState.sendButtons} Send button(s) appeared while a turn was running with a prompt queued`
      )
    }
    // The queue is a payload WAITING on the turn: committing must not send.
    if (sendsAtQueue.length !== 1) {
      fails.push(
        `${sendsAtQueue.length} prompt(s) had reached main at queue time, expected 1 — committing while busy SENT instead of queueing`
      )
    }
  }

  if (!turn1Ended) {
    fails.push(
      'the queued prompt never reached main within 6 minutes of being committed — either the first turn never ended, or its ending did not flush the queue'
    )
  } else {
    // ── AC 4, the whole point of this file ──
    const queuedSends = sendsAfterFlush.filter((t) => t.includes(QUEUED_MARK)).length
    if (queuedSends !== 1) {
      fails.push(
        queuedSends === 0
          ? 'the queued prompt NEVER reached main after the turn ended — it was silently dropped, and the user watched their words disappear'
          : `the queued prompt reached main ${queuedSends} times, expected exactly 1 — a queue that fires twice is the sharpest failure in this ticket, and a "did it send" assertion cannot see it`
      )
    }
    if (sendsAfterFlush.length !== 2) {
      fails.push(
        `${sendsAfterFlush.length} prompts reached main in total, expected exactly 2: ${JSON.stringify(sendsAfterFlush.map((t) => t.slice(0, 30)))}`
      )
    }
    if (bubblesB !== 1) {
      fails.push(`${bubblesB} user bubbles carry the queued prompt, expected exactly 1`)
    }
    if (afterFlush.queued) {
      fails.push('the pending state survived its own flush — the commitment was never discharged')
    }
    if (afterFlush.value !== '') {
      fails.push(
        `the composer still holds ${JSON.stringify(afterFlush.value)} after the queued prompt sent`
      )
    }
    if (!flushedIntoATurn) {
      fails.push(
        'the flushed prompt never put the app back in flight — it reached main without starting a turn'
      )
    }
  }

  // ── AC 1's negative, driven for real ──
  if (!flushedIntoATurn) {
    fails.push('could not drive phase 2: no second turn to queue behind')
  } else if (!busyAtStop || stoppedState === null) {
    fails.push(
      'could not drive phase 2: the second turn ended before Stop could be pressed with a prompt queued — re-run; the no-flush-after-Stop assertion would have been vacuous'
    )
  } else {
    const stoppedSends = sendsAfterStop.filter((t) => t.includes(STOPPED_MARK)).length
    if (stoppedSends !== 0) {
      fails.push(
        `a prompt queued behind a STOPPED turn was sent anyway (${stoppedSends}×) — Stop and turn-end both clear busy, and this is what flushing on "no longer busy" costs the user`
      )
    }
    if (sendsAfterStop.length !== 2) {
      fails.push(
        `${sendsAfterStop.length} prompts have reached main after the Stop, expected still 2`
      )
    }
    if (stoppedState.queued) {
      fails.push('the pending state survived a Stop — a commitment with nothing left to fire on')
    }
    // The positive half of the negative, and the reason Stop is safe to leave
    // under the user's cursor: releasing the commitment must not cost the words.
    if (stoppedState.value !== TURN_3) {
      fails.push(
        `Stop ate the queued text: the composer holds ${JSON.stringify(stoppedState.value)}, expected it untouched — an unqueue releases the commitment, never the draft`
      )
    }
  }
}

console.log(fails.length ? 'FAIL ' + fails.join(' | ') : 'PASS all #80 criteria')

// `app.close()` can hang after a clean run, and the watchdog then reports
// TIMEOUT over a verdict that already printed. Arm the exit BEFORE awaiting it.
const exit = () => process.exit(fails.length ? 1 : 0)
setTimeout(exit, 3000).unref?.()
await app.close().catch(() => {})
console.log('DONE')
exit()
