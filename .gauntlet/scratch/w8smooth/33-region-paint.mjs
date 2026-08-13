import { decode } from './png.mjs'
const A=decode('.gauntlet/waves/core-after-docks/7/chat.png'),B=decode('.gauntlet/waves/core-after-docks/8/chat.png')
const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]
const F=[8,12,14],D=[25,29,31]
const count=(lbl,x0,x1,y0,y1)=>{let same=0,diff=0,fill=0,border=0,other=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const a=A.at(x,y),b=B.at(x,y);if(eq(a,b))same++;else diff++;if(eq(b,F))fill++;else if(eq(b,D))border++;else other++}console.log(`${lbl}: region ${x1-x0+1}x${y1-y0+1}=${(x1-x0+1)*(y1-y0+1)} abs-position diff=${diff}, same=${same}; w8 exact fill=${fill} border=${border} other=${other}`)}
count('whole x251..820 y0..545',251,820,0,545)
count('w8 card1 box',254,817,213,326)
count('w8 card2 box',254,817,431,545)
count('w8 four row boxes union c1',266,805,276,315)
count('w8 four row boxes union c2',266,805,495,534)
