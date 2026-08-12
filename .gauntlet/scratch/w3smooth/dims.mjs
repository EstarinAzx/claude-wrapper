import { decode } from './png.mjs'
const B='D:/.claude/claude projects/playground/4/.gauntlet/waves/core-after-docks/'
const files=['welcome','welcome-min-window','titlebar','sidebar','chat','input-bar','window-welcome','window-session','agents-dock','appearance-dock','commands-dock']
for (const f of files) {
  const r = []
  for (const w of ['1','2','3']) {
    try { const d = decode(B+w+'/'+f+'.png'); r.push(`w${w}=${d.w}x${d.h}/ct${d.colorType}`) } catch(e){ r.push(`w${w}=ERR ${e.message}`) }
  }
  console.log(f.padEnd(20), r.join('  '))
}
