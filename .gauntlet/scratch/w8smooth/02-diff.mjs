import { decode } from './png.mjs'
const W = (n,f) => `.gauntlet/waves/core-after-docks/${n}/${f}`

export const diffMap = (A,B) => {
  if (A.w!==B.w||A.h!==B.h) throw new Error('size mismatch')
  const m = new Uint8Array(A.w*A.h)
  let n=0
  for (let y=0;y<A.h;y++) for (let x=0;x<A.w;x++) {
    const p=(y*A.w+x)*A.ch
    if (A.px[p]!==B.px[p]||A.px[p+1]!==B.px[p+1]||A.px[p+2]!==B.px[p+2]) { m[y*A.w+x]=1; n++ }
  }
  return {m,n,w:A.w,h:A.h}
}

export const comps = (d, minPx=1) => {
  const {m,w,h}=d
  const seen=new Uint8Array(w*h)
  const out=[]
  const stack=new Int32Array(w*h)
  for (let i=0;i<w*h;i++) {
    if (!m[i]||seen[i]) continue
    let sp=0; stack[sp++]=i; seen[i]=1
    let x0=1e9,y0=1e9,x1=-1,y1=-1,c=0
    while(sp){
      const j=stack[--sp]; c++
      const jx=j%w, jy=(j-jx)/w
      if(jx<x0)x0=jx; if(jx>x1)x1=jx; if(jy<y0)y0=jy; if(jy>y1)y1=jy
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=jx+dx, ny=jy+dy
        if(nx<0||ny<0||nx>=w||ny>=h)continue
        const k=ny*w+nx
        if(m[k]&&!seen[k]){seen[k]=1;stack[sp++]=k}
      }
    }
    if(c>=minPx) out.push({x0,y0,x1,y1,c,w:x1-x0+1,h:y1-y0+1})
  }
  out.sort((a,b)=>b.c-a.c)
  return out
}

if (process.argv[2]) {
  const f=process.argv[2]
  const a=decode(W(process.argv[4]||7,f)), b=decode(W(process.argv[5]||8,f))
  const d=diffMap(a,b)
  console.log(`${f}: ${d.n} changed px of ${d.w*d.h}`)
  const cs=comps(d, Number(process.argv[3]||1))
  console.log(`components: ${cs.length}`)
  for (const c of cs.slice(0,40)) console.log(`  x${c.x0}-${c.x1} y${c.y0}-${c.y1}  ${c.w}x${c.h}  px=${c.c}`)
  if (cs.length>40) console.log(`  ... +${cs.length-40} more, px=${cs.slice(40).reduce((s,c)=>s+c.c,0)}`)
}
