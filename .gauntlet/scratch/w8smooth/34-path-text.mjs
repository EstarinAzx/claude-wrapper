import { decode } from './png.mjs'
const S=decode('.gauntlet/waves/core-after-docks/8/sidebar.png')
const T=decode('.gauntlet/waves/core-after-docks/8/titlebar.png')
const near=(c,t,k)=>Math.abs(c[0]-t[0])+Math.abs(c[1]-t[1])+Math.abs(c[2]-t[2])<=k
const G=[11,15,17]
// Better heading ink: use chromatic-neutral text brighter than ground, exclude border/fill pixels by minimum brightness.
let x0=1e9,x1=-1,y0=1e9,y1=-1,n=0
for(let y=186;y<=197;y++)for(let x=0;x<247;x++){const [r,g,b]=S.at(x,y);if(r+g+b>80){n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
console.log(`rail heading bright ink x${x0}..${x1} w${x1-x0+1} y${y0}..${y1} h${y1-y0+1} px${n}`)
// title text
let a=1e9,b=-1,c=1e9,d=-1,m=0
for(let y=10;y<=38;y++)for(let x=400;x<=1000;x++){const [r,g,bl]=T.at(x,y);if(r+g+bl>80){m++;if(x<a)a=x;if(x>b)b=x;if(y<c)c=y;if(y>d)d=y}}
console.log(`titlebar title bright ink x${a}..${b} w${b-a+1} y${c}..${d} h${d-c+1} px${m}`)
console.log(`capture cwd textual source C:\Users\S.D\AppData\Local\Temp\inspect-ws = 48 chars incl backslashes; basename inspect-ws = 10 chars; ratio 4.8x`)
console.log(`rail content box x16..231 w216; bright ink occupies x16..228 w213 = ${(213/216*100).toFixed(1)}%; titlebar basename ink x685..754 w70`)
