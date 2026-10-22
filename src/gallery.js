// Tuning page for procedural houses: open the game with ?gallery to see a sheet of generated plans,
// change the knobs, and click a plan to play it. Development aid; not linked from the game.
import { GEN, T } from './data.js';
import { generateHouse, mergeParams } from './procgen.js';

const $=id=>document.getElementById(id);
// [path into the params object, label]
const KNOBS=[['hallWidth','hall width'],['corridorChance','corridor chance'],['lChance','L-shape chance'],['spineUpChance','hall to back wall'],
  ['capChance','room across corridor end'],['splitChance','split chance'],['splitBias','split near middle'],['innerRoomChance','inner room chance'],
  ['extraRoomDoorChance','extra room door'],['secondHallDoorChance','second hall door'],['rooms.0','min rooms'],['rooms.1','max rooms'],
  ['room.maxW','room max width'],['room.maxH','room max height'],['room.maxArea','room max area'],['names.largeArea','large room area'],['names.smallArea','small room area']];
const get=(o,path)=>path.split('.').reduce((v,k)=>v[k],o);
const set=(o,path,v)=>{ const ks=path.split('.'); const last=ks.pop(); const t=ks.reduce((a,k)=>(a[k]=Array.isArray(a[k])?a[k].slice():{...a[k]}),o); t[last]=v; };

export function showGallery(){
  const o=$('ovWelcome'); o.hidden=false; o.className='overlay';
  let first=+(new URLSearchParams(location.search).get('gallery'))||1, count=12;
  const knobs=KNOBS.map(([k,label])=>`<label>${label}<input data-knob="${k}" type="number" step="any" value="${get(GEN,k)}"></label>`).join('');
  o.innerHTML=`<div class="card wide"><div class="eyebrow">Procedural houses · tuning sheet</div><h2>House gallery</h2>
    <p>Defaults come from <code>GEN</code> in <code>src/data.js</code>. Change a knob and redraw; click a plan to play from that seed. Pale floor is the hall.</p>
    <div class="knobs">${knobs}<label>first seed<input id="gFirst" type="number" value="${first}"></label><label>count<input id="gCount" type="number" value="${count}"></label></div>
    <div class="actions"><button class="btn primary" id="gDraw">Redraw</button><button class="btn" id="gPrev">Previous</button><button class="btn" id="gNext">Next</button><button class="btn" id="gReset">Reset knobs</button><a class="btn" href="./">Back to the game</a></div>
    <div class="gallery" id="gGrid"></div></div>`;
  const overrides=()=>{ const P={}; o.querySelectorAll('[data-knob]').forEach(i=>{ const v=+i.value; if(Number.isFinite(v)) set(P,i.dataset.knob,v); }); return P; };
  const draw=()=>{ first=+$('gFirst').value||1; count=Math.max(1,Math.min(60,+$('gCount').value||12)); const grid=$('gGrid'); grid.innerHTML='';
    const P=mergeParams(overrides());
    for(let s=first;s<first+count;s++){ const fig=document.createElement('figure'); grid.appendChild(fig);
      try{ const h=generateHouse(s,P); const c=document.createElement('canvas'); c.width=h.w*T; c.height=h.h*T; drawPlan(c.getContext('2d'),h);
        const a=document.createElement('a'); a.href='?seed='+s; a.title='Play from this house'; a.appendChild(c); fig.appendChild(a);
        fig.insertAdjacentHTML('beforeend',`<figcaption>${s} · ${h.name} · ${h.rooms.length} rooms</figcaption>`); }
      catch(e){ fig.innerHTML=`<figcaption>${s} · no valid plan (${e.message})</figcaption>`; } } };
  $('gDraw').onclick=draw; $('gNext').onclick=()=>{ $('gFirst').value=first+count; draw(); }; $('gPrev').onclick=()=>{ $('gFirst').value=Math.max(1,first-count); draw(); };
  $('gReset').onclick=()=>{ o.querySelectorAll('[data-knob]').forEach(i=>i.value=get(GEN,i.dataset.knob)); draw(); };
  draw();
}

function drawPlan(ctx,h){
  const inRoom=(x,y)=>h.rooms.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
  for(let y=0;y<h.h;y++)for(let x=0;x<h.w;x++){ const c=h.map[y][x];
    if(c==='#'){ ctx.fillStyle='#2a2330'; ctx.fillRect(x*T,y*T,T,T); ctx.fillStyle='#1b161f'; ctx.fillRect(x*T+2,y*T+2,T-4,T-4); continue; }
    ctx.fillStyle=inRoom(x,y)?(((x+y)&1)?'#3b2f27':'#352a23'):'#4d4036'; ctx.fillRect(x*T,y*T,T,T);
    if(c==='D'){ ctx.fillStyle='#8a6a48'; ctx.fillRect(x*T+4,y*T+4,T-8,T-8); }
    if(c==='C'){ ctx.fillStyle='#c9a34d'; ctx.fillRect(x*T+6,y*T+6,T-12,T-12); } }
  ctx.fillStyle='#e2a94f'; ctx.fillRect(h.start[0]*T+T/2-4,h.start[1]*T+T/2-4,8,8);
  ctx.font='12px "IM Fell English SC", serif'; ctx.fillStyle='rgba(217,207,191,.8)';
  for(const r of h.rooms) ctx.fillText(r.n, r.x*T+3, r.y*T+13);
}
