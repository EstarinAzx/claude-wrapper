import { decode } from './png.mjs'
const cmp=(f,aBox,bBox)=>{const A=decode(`.gauntlet/waves/core-after-docks/7/${f}`),B=decode(`.gauntlet/waves/core-after-docks/8/${f}`);let n=0,t=0;const [ax0,ay0,ax1,ay1]=aBox,[bx0,by0]=bBox;for(let y=ay0;y<=ay1;y++)for(let x=ax0;x<=ax1;x++){const a=A.at(x,y),b=B.at(bx0+x-ax0,by0+y-ay0);t++;if(a[0]!==b[0]||a[1]!==b[1]||a[2]!==b[2])n++}return [n,t]}
console.log('titlebar',cmp('titlebar.png',[14,13,35,34],[14,13,35,34]))
console.log('welcome',cmp('welcome.png',[513,242,556,285],[513,242,556,285]))
console.log('welcome-min entire',cmp('welcome-min-window.png',[0,0,639,431],[0,0,639,431]))
console.log('chat avatar1 reflow',cmp('chat.png',[211,59,238,86],[211,103,238,130]))
console.log('chat avatar2 fixed',cmp('chat.png',[211,660,238,687],[211,660,238,687]))
