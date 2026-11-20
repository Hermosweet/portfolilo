'use client';
export default function BubbleField({count=28, dense=false}:{count?:number;dense?:boolean}){
  return <div className={`bubble-field ${dense?'dense':''}`} aria-hidden="true">
    {Array.from({length:count},(_,i)=><i key={i} style={{'--i':i,'--x':`${(i*37)%100}%`,'--y':`${(i*61)%100}%`,'--s':`${2+(i%5)*1.7}px`,'--d':`${7+(i%8)*2}s`} as React.CSSProperties}/>) }
  </div>
}
