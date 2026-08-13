import { decode } from './png.mjs'

const target = [25, 30, 32]
const files = ['commands-dock.png', 'appearance-dock.png', 'agents-dock.png', 'sidebar.png']

for (const file of files) {
  const image = decode(`.gauntlet/waves/core-after-docks/9/${file}`)
  const mask = new Uint8Array(image.w * image.h)
  for (let y = 44; y < image.h; y++) {
    for (let x = 0; x < image.w; x++) {
      const color = image.at(x, y)
      if (color[0] === target[0] && color[1] === target[1] && color[2] === target[2]) {
        mask[y * image.w + x] = 1
      }
    }
  }

  const seen = new Uint8Array(mask.length)
  const components = []
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue
    const stack = [i]
    seen[i] = 1
    let x0 = Infinity
    let x1 = -1
    let y0 = Infinity
    let y1 = -1
    let n = 0
    while (stack.length) {
      const j = stack.pop()
      const x = j % image.w
      const y = (j - x) / image.w
      n++
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
      y0 = Math.min(y0, y)
      y1 = Math.max(y1, y)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          const yy = y + dy
          if (xx < 0 || yy < 0 || xx >= image.w || yy >= image.h) continue
          const k = yy * image.w + xx
          if (mask[k] && !seen[k]) {
            seen[k] = 1
            stack.push(k)
          }
        }
      }
    }
    if (n >= 20) components.push({ x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, n })
  }
  components.sort((a, b) => a.y0 - b.y0)
  console.log(file, components)
}
