import { decode } from './png.mjs'
const W = (n,f) => `.gauntlet/waves/core-after-docks/${n}/${f}`
const files = ['titlebar.png','chat.png','window-session.png','window-session-short.png','window-welcome.png','sidebar.png','input-bar.png','welcome.png']
for (const f of files) {
  const a = decode(W(7,f)), b = decode(W(8,f))
  console.log(f, `7=${a.w}x${a.h}`, `8=${b.w}x${b.h}`)
}
