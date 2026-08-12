import { readFileSync } from 'node:fs'

const p = 'C:/Users/S.D/.claude/projects/D---claude-claude-projects-playground-4/1cbc34b1-0127-4209-a93a-b6eaa381afcf/subagents/workflows/wf_61f47af4-7ee/journal.jsonl'
const lines = readFileSync(p, 'utf8').trim().split('\n')

for (const l of lines) {
  let j
  try { j = JSON.parse(l) } catch { continue }
  if (j.type !== 'result') continue
  const r = j.result
  if (!r || typeof r !== 'object') continue
  if (r.verdict) {
    console.log('\n' + '='.repeat(78))
    console.log(`PIECE: ${r.piece}`)
    console.log(`VERDICT: ${r.verdict}`)
    console.log(`SPEC BREAK: ${r.specBreak}`)
    console.log(`GAP: ${r.gap}`)
  } else {
    console.log('\n' + '#'.repeat(78))
    console.log('SMOOTHING PASS')
    for (const k of ['seams', 'identityFloor', 'typeScale', 'seamResult', 'markDepth', 'railControl', 'ownershipControl', 'scrollState', 'centring', 'newPieceProposal']) {
      if (r[k]) console.log(`\n--- ${k} ---\n${r[k]}`)
    }
    for (const k of ['findings', 'notFindings']) {
      if (Array.isArray(r[k])) {
        console.log(`\n--- ${k} (${r[k].length}) ---`)
        r[k].forEach((f, i) => console.log(`  [${i + 1}] ${f}`))
      }
    }
  }
}
