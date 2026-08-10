// Wave-5 Chat probe: measure the RENDERED transcript intervals in Electron's
// own Chromium against the shipped stylesheet. Isolated user-data-dir so it
// cannot collide with another builder's app run.
//
//   node .gauntlet/scratch/measure-transcript.mjs

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../..')
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'cw-probe-'))

const app = await electron.launch({
  executablePath: path.join(APP_DIR, 'node_modules/electron/dist/electron.exe'),
  args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=${PROFILE}`, '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})
const page = await app.firstWindow()
await page.waitForSelector('#root', { timeout: 15000 })

const out = await page.evaluate(() => {
  const html = `
  <main class="chat" id="probe-chat">
    <div class="chat-column">
      <div class="date-divider"><span class="date-divider-line"></span><span class="date-divider-label">TODAY</span><span class="date-divider-line"></span></div>
      <div class="msg msg-user" id="u1"><div class="bubble">Read the config file.</div></div>
      <div class="msg msg-assistant" id="a1">
        <span class="avatar" aria-hidden="true"></span>
        <div class="assistant-body" id="ab1"><p id="p1">First paragraph of the answer.</p><p id="p2">Let me read the file.</p></div>
      </div>
      <div class="tool-card" id="t1"><div class="tool-card-header"><span class="tool-card-name">Read</span><span class="tool-card-key">src/config.ts</span></div><div class="tool-card-result">42 lines</div></div>
      <div class="tool-card" id="t2"><div class="tool-card-header"><span class="tool-card-name">Grep</span><span class="tool-card-key">port</span></div><div class="tool-card-result">3 matches</div></div>
      <div class="msg msg-assistant" id="a2">
        <span class="avatar" aria-hidden="true"></span>
        <div class="assistant-body" id="ab2"><p id="p3">The port is 5173.</p></div>
      </div>
      <div class="msg msg-user" id="u2"><div class="bubble">Change it to 3000.</div></div>
      <div class="msg msg-assistant" id="a3">
        <span class="avatar" aria-hidden="true"></span>
        <div class="assistant-body" id="ab3"><p id="p4">Editing now.</p></div>
      </div>
      <div class="tool-card" id="t3"><div class="tool-card-header"><span class="tool-card-name">Edit</span></div></div>
      <div class="msg msg-user" id="u3"><div class="bubble">Thanks.</div></div>
      <div class="msg msg-user" id="u4"><div class="bubble">No preamble case.</div></div>
      <div class="tool-card" id="t4"><div class="tool-card-header"><span class="tool-card-name">Bash</span></div></div>
    </div>
  </main>`
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;top:0;left:0;width:1440px;height:900px;'
  host.innerHTML = html
  document.body.appendChild(host)

  const R = (id) => document.getElementById(id).getBoundingClientRect()
  const cs = (id, p) => getComputedStyle(document.getElementById(id))[p]

  // Ink-ish extent of the last paragraph: the inline box of its text, which is
  // the font's content area (ascent+descent), NOT the 1.6 line box.
  const inkBottom = (pid) => {
    const el = document.getElementById(pid)
    const r = document.createRange()
    r.selectNodeContents(el)
    const rects = [...r.getClientRects()]
    return rects[rects.length - 1].bottom
  }

  const res = {
    columnGap: cs('probe-chat', 'rowGap') || getComputedStyle(document.querySelector('#probe-chat .chat-column')).rowGap,
    lastP_marginBottom: cs('p2', 'marginBottom'),
    firstP_marginBottom: cs('p1', 'marginBottom'),
    p_lineHeight: cs('p2', 'lineHeight'),
    p_fontSize: cs('p2', 'fontSize'),
    toolCard_marginTop_first: cs('t1', 'marginTop'),
    toolCard_marginTop_second: cs('t2', 'marginTop'),
    userMsg_marginTop_afterCard: cs('u2', 'marginTop'),

    // BOX measures
    para_to_card_BOX: R('t1').top - R('a1').bottom,
    assistantBody_vs_msg_bottom: R('a1').bottom - R('ab1').bottom,
    lastP_box_to_card: R('t1').top - R('p2').bottom,
    card_to_card: R('t2').top - R('t1').bottom,
    card_to_assistant: R('a2').top - R('t2').bottom,
    completedTurn_msg_to_user: R('u2').top - R('a2').bottom,
    completedTurn_CARD_to_user_DIRECT: R('u3').top - R('t3').bottom,
    assistantMsg_to_card: R('t3').top - R('a3').bottom,
    USERbubble_to_card_must_stay_24: R('t4').top - R('u4').bottom,
    columnGapReal: getComputedStyle(document.querySelector('#probe-chat .chat-column')).rowGap,

    // INK measure — what a critic reading pixels off a screenshot sees
    para_to_card_INK: R('t1').top - inkBottom('p2'),
    inkOffset_below_text: R('p2').bottom - inkBottom('p2'),

    // sanity
    p1_to_p2_box: R('p2').top - R('p1').bottom,
    p2_height: R('p2').height,
    p2_inkHeight: (() => {
      const r = document.createRange()
      r.selectNodeContents(document.getElementById('p2'))
      const rects = [...r.getClientRects()]
      return rects[rects.length - 1].height
    })()
  }
  host.remove()
  return res
})

console.log(JSON.stringify(out, null, 2))
await app.close()
fs.rmSync(PROFILE, { recursive: true, force: true })
console.log('DONE')
