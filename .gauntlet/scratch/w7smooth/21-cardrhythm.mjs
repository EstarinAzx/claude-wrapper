// What the 28px row costs the card's internal grouping.
const w6c1=[[236,249],[261,274],[288,295],[309,316]], w7c1=[[184,197],[209,222],[243,250],[277,284]]
const w6c2=[[450,462],[476,489],[503,510],[524,531]], w7c2=[[424,436],[450,463],[483,490],[517,524]]
const rep=(lbl,b,border)=>{
  const clears=[]
  for(let i=0;i+1<b.length;i++) clears.push(b[i+1][0]-b[i][1]-1)
  console.log(`  ${lbl}  ink bands ${b.map(r=>`y${r[0]}..${r[1]}`).join(' ')}`)
  console.log(`     clears: body->row1 ${clears[1]}px   row1->row2 ${clears[2]}px   ratio ${(clears[2]/clears[1]).toFixed(2)}x`)
  const rows=2, rowH=b[3][0]-b[2][0]
  console.log(`     disclosure-row pitch ${rowH}px;  rows occupy ${rows*(lbl.includes('w7')?28:15)}px of inner ${border}px = ${((rows*(lbl.includes('w7')?28:15))/border*100).toFixed(1)}%`)
}
console.log('CARD 1'); rep('w6',w6c1,108); rep('w7',w7c1,134)
console.log('CARD 2'); rep('w6',w6c2,109); rep('w7',w7c2,135)
console.log('\nThe file\'s own recorded ratio standard (titlebar.css): 1.30x = "far too weak to break the run"; 1.63x = enough.')
