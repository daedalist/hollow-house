export const rnd=(a,b)=>a+Math.random()*(b-a);
export const pick=a=>a[Math.floor(Math.random()*a.length)];

// Seeded generator (mulberry32) so a house can be reproduced from its seed.
// Returns a function r() in [0,1) with helpers attached.
export function makeRng(seed){
  let s=(seed>>>0)||1;
  const r=()=>{ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^(s>>>15),1|s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
  r.int=(a,b)=>a+Math.floor(r()*(b-a+1));       // inclusive
  r.range=(a,b)=>a+r()*(b-a);
  r.pick=a=>a[Math.floor(r()*a.length)];
  r.chance=p=>r()<p;
  r.shuffle=a=>{ const c=a.slice(); for(let i=c.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; };
  return r;
}
