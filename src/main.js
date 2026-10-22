import './styles.css';
import { EV, GHOSTS, TOOLS, MAP, ROOMS, W, H, T } from './data.js';
import { isWall, isDoor, isCloset, roomAt, roomTiles, bfs } from './house.js';
import { rnd, pick } from './rng.js';
import { isRuledOut, cycleMark } from './deduction.js';

// ---------- State ----------
const S = { round:1, cash:120, owned:{emf:1,temp:1}, uses:{}, best:0 };
let G=null; // per-round state
const $=id=>document.getElementById(id);
const cv=$('cv'), ctx=cv.getContext('2d');
let readTimer=0;
function say(t,sec=3){ $('readout').textContent=t; readTimer=sec; }

// ---------- Shop ----------
function showShop(msg){
  const o=$('ovShop'); o.hidden=false;
  const items=TOOLS.map(t=>{
    const have=S.owned[t.id]||0, afford=S.cash>=t.cost, can=t.consumable? (have<3&&afford) : (!have&&afford);
    const starter=(t.id==='emf'||t.id==='temp');
    return `<div class="item"><b>${t.n}${starter?' <small>(agency issue)</small>':''}</b><small>${t.desc}</small>
      <div class="row"><span>${starter?'free':'$'+t.cost}${t.consumable?` · held ${have}`:(have?' · owned':'')}</span>
      <button data-buy="${t.id}" ${can?'':'disabled'}>${t.consumable?'Buy one':(have?'Owned':'Buy')}</button></div></div>`;}).join('');
  o.innerHTML=`<div class="card"><div class="eyebrow">Night ${S.round} · purse $${S.cash}</div><h2>${msg||'The agency storeroom'}</h2>
    <p>${S.round===1?'Your first night. The agency issues two instruments; buy what you can with the rest.':'Restock, then go back in.'} Naming the ghost pays $100; every piece of evidence you log pays $20 whatever happens.</p>
    <div class="shop">${items}</div>
    <div class="actions"><button class="btn primary" id="bEnter">Enter the house</button><button class="btn" id="bHelpShop">How to play</button></div></div>`;
  o.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const t=TOOLS.find(x=>x.id===b.dataset.buy); S.cash-=t.cost; S.owned[t.id]=(S.owned[t.id]||0)+1; showShop(msg);});
  $('bEnter').onclick=startRound;
  $('bHelpShop').onclick=()=>showHelp(()=>showShop(msg));
}

// ---------- Welcome and help ----------
function showWelcome(){
  const o=$('ovWelcome'); o.hidden=false;
  o.innerHTML=`<div class="card welcome">
    <div class="eyebrow">A game of ghost deduction</div>
    <h2 class="title">Hollow House</h2>
    <p class="lede">The house on Marrow Lane has something in it. The agency does not want it gone. It wants it <i>named</i>.</p>
    <p>Go in with the instruments you can afford. Gather evidence. Work out which of eight spirits you are dealing with and write its name in your journal. The longer you take, the less patient it becomes, and when its patience runs out it will come looking for you.</p>
    <div class="actions"><button class="btn primary" id="bBegin">Begin</button><button class="btn" id="bHelpWelcome">How to play</button></div>
    <p class="stat">Keyboard or touch. Nothing is saved between visits.</p></div>`;
  $('bBegin').onclick=()=>{ o.hidden=true; showShop(); };
  $('bHelpWelcome').onclick=()=>showHelp(showWelcome);
}
function showHelp(back){
  const o=$('ovHelp'); o.hidden=false; $('ovWelcome').hidden=true; $('ovShop').hidden=true;
  const tools=TOOLS.map(t=>`<li><b>${t.n}</b> <span class="price">${t.id==='emf'||t.id==='temp'?'issued free':'$'+t.cost}</span><br>${t.desc}</li>`).join('');
  const evs=Object.values(EV).map(e=>e.name).join(' · ');
  o.innerHTML=`<div class="card help">
    <div class="eyebrow">Field manual</div><h2>How to play</h2>
    <h3>The job</h3>
    <p>Each night you enter the house, find out which ghost is in it, and name it in your journal. A correct name pays $100 plus a bonus for leaving early. Every piece of evidence you log pays $20 even if you guess wrong or flee. Money carries over; instruments are kept; salt and charms are used up.</p>
    <h3>Moving about</h3>
    <ul>
      <li><b>Desktop:</b> <code>WASD</code> or arrow keys to walk · <code>E</code> or <code>Space</code> to use the equipped tool · <code>1</code>–<code>8</code> to switch tools · <code>J</code> for the journal.</li>
      <li><b>Touch:</b> drag anywhere on the house to walk (further drag, faster walk) · tap <b>USE</b> for the tool · the tool strip scrolls sideways.</li>
    </ul>
    <h3>Evidence</h3>
    <p>There are six kinds: ${evs}. Each ghost leaves exactly three, and every ghost's three are different, so three confirmed kinds always name it. Evidence only shows up in the ghost's own room, which it mostly stays in. Find the room first: the EMF reader climbs as you get near it, and the thermometer drops.</p>
    <h3>Instruments</h3>
    <ul class="tools">${tools}</ul>
    <h3>The journal</h3>
    <p>Instruments log what they see automatically. Tap a line once to mark it as seen, twice to mark it <b>ruled out</b>; the list of ghosts shrinks either way. Ruling out is the trick when you can't afford every instrument: if the thermometer never drops below zero in its room, it is not one of the cold ghosts. Each ghost's note hints at how it behaves. Name a ghost to end the night.</p>
    <h3>Patience and the hunt</h3>
    <p>The bar under the house shows how patient the ghost is. It drains with time, faster while you stand in its room, and the spirit box costs a few seconds each use. When it empties the ghost hunts: the lantern gutters, the house shakes, and it walks the rooms toward you. A hunt lasts fifteen to thirty seconds and each night's hunts are a little longer and faster. If it reaches you, the night is over and you are dead.</p>
    <h3>Staying alive</h3>
    <ul>
      <li><b>Closets.</b> Every room has one, the cupboard with brass handles. Press USE on it to hide. If the ghost did not see you go in, it loses you and wanders until the hunt ends. If it did, it is still coming.</li>
      <li><b>Salt.</b> Lay a line in a doorway; a hunting ghost stops on it for three seconds.</li>
      <li><b>Hearth charm.</b> Burn one to restore thirty seconds of patience.</li>
      <li><b>Flee.</b> You can leave at any time and keep your tools and evidence pay.</li>
    </ul>
    <div class="actions"><button class="btn primary" id="bHelpBack">Back</button></div></div>`;
  $('bHelpBack').onclick=()=>{ o.hidden=true; back(); };
}

// ---------- Objects (things to throw) ----------
const OBJ_KINDS=[['vase','#b9a27a'],['chair','#6b4a2e'],['book','#8a3a3a'],['plate','#cfcfc4'],['lamp','#d9b86a'],['doll','#c48fb0']];
function spawnObjects(){ const o=[]; for(const r of ROOMS){ const tiles=roomTiles(r.n).filter(([x,y])=>!isCloset(x,y)&&!isDoor(x,y)); for(let i=0;i<3;i++){ const t=pick(tiles); const k=pick(OBJ_KINDS); o.push({x:t[0]+.5,y:t[1]+.5,room:r.n,kind:k[0],col:k[1],vx:0,vy:0,shake:0}); } } return o; }
function throwSomething(){ const inRoom=G.objs.filter(o=>o.room===G.room); if(!inRoom.length) return; const o=pick(inRoom);
  const a=Math.random()*Math.PI*2, pow=rnd(3,6); o.vx=Math.cos(a)*pow; o.vy=Math.sin(a)*pow; o.shake=0.6;
  const near=dist(G.player,o)<5; if(near) say(pick(['Something smashes against the wall.','A '+o.kind+' flies across the room on its own.','Glass. Breaking.','The '+o.kind+' hurls itself at you.']),3); }
function updateObjects(dt){ for(const o of G.objs){ if(o.shake>0) o.shake-=dt; if(!o.vx&&!o.vy) continue;
  const nx=o.x+o.vx*dt, ny=o.y+o.vy*dt; if(isWall(Math.floor(nx),Math.floor(o.y))) o.vx=-o.vx*0.3; else o.x=nx; if(isWall(Math.floor(o.x),Math.floor(ny))) o.vy=-o.vy*0.3; else o.y=ny;
  o.vx*=1-dt*4; o.vy*=1-dt*4; if(Math.abs(o.vx)<0.05&&Math.abs(o.vy)<0.05){o.vx=o.vy=0;} } }

// ---------- Round ----------
function startRound(){
  $('ovShop').hidden=true; $('ovResult').hidden=true; $('ovJournal').hidden=true;
  const ghost=pick(GHOSTS), room=pick(ROOMS).n, tiles=roomTiles(room), home=pick(tiles);
  const basePat = Math.max(45, 95 - (S.round-1)*8) * (ghost.patience||1);
  G={ ghost, room, tiles, t:0, player:{x:7.5,y:12.5}, g:{x:home[0]+.5,y:home[1]+.5,tx:home[0],ty:home[1],wander:3,flicker:0},
      patience:basePat, patienceMax:basePat, hunting:false, huntT:0, hunts:0, path:[], pathT:0, stall:0,
      tool:null, found:{}, shots:5, book:null, salts:[], uvPrints:null, boxAsked:0, dead:false, over:false, hidden:false, seen:false, lostT:0, throwT:6, objs:[] };
  G.objs=spawnObjects();
  S.uses={salt:S.owned.salt||0, charm:S.owned.charm||0};
  if(ghost.ev.includes('uv')){ const doors=[]; for(const [x,y] of tiles) for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(isDoor(x+dx,y+dy)) doors.push([x,y]); G.uvPrints=doors.length?pick(doors):pick(tiles); }
  const first=TOOLS.find(t=>S.owned[t.id]); G.tool=first?first.id:null; marks={};
  cam.init=false; buildToolbar(); updateHeader(); say('The front door shuts behind you. Begin.',4);
}
function buildToolbar(){
  const bar=$('toolbar'); bar.innerHTML='';
  TOOLS.forEach((t,i)=>{ if(!S.owned[t.id]) return;
    const b=document.createElement('button'); b.className='tool'+(G.tool===t.id?' on':''); b.id='tool_'+t.id;
    const count=t.consumable?` ×${S.uses[t.id]}`:(t.id==='cam'?` ${G.shots} left`:'');
    b.innerHTML=`<b>${i+1}. ${t.n}</b><span>${count||'&nbsp;'}</span>`;
    b.onclick=()=>{G.tool=t.id; buildToolbar();}; bar.appendChild(b); });
}
function updateHeader(){ $('hRound').textContent=S.round; $('hCash').textContent='$'+S.cash; }

// ---------- Input ----------
const keys={}; let padDir=[0,0];
addEventListener('keydown',e=>{ if(e.repeat) return; const k=e.key.toLowerCase(); keys[k]=true;
  if(!G||G.over) return;
  if(k==='e'||k===' '){e.preventDefault();useTool();}
  if(k==='j'){toggleJournal();}
  if(/^[1-8]$/.test(k)){const t=TOOLS[+k-1]; if(S.owned[t.id]){G.tool=t.id;buildToolbar();}}
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
// thumbstick: touch anywhere on the house and drag
const stick={id:null,ox:0,oy:0,x:0,y:0};
function canvasPt(e){ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]; }
cv.addEventListener('pointerdown',e=>{ if(stick.id!==null) return; e.preventDefault(); const [x,y]=canvasPt(e); stick.id=e.pointerId; stick.ox=stick.x=x; stick.oy=stick.y=y; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove',e=>{ if(e.pointerId!==stick.id) return; const [x,y]=canvasPt(e); stick.x=x; stick.y=y;
  let dx=x-stick.ox, dy=y-stick.oy; const l=Math.hypot(dx,dy); if(l<10){padDir=[0,0];return;} const m=Math.min(1,l/40); padDir=[dx/l*m,dy/l*m]; });
const stickEnd=e=>{ if(e.pointerId!==stick.id) return; stick.id=null; padDir=[0,0]; };
cv.addEventListener('pointerup',stickEnd); cv.addEventListener('pointercancel',stickEnd);
$('bUse2').addEventListener('pointerdown',e=>e.preventDefault());
$('bUse').onclick=useTool; $('bUse2').addEventListener('click',useTool); $('bJournal').onclick=toggleJournal;
$('bLeave').onclick=()=>{ if(G&&!G.over) endRound('fled'); };
$('bHelp').onclick=()=>{ const wasShop=!$('ovShop').hidden; if(G&&!G.over) G.paused=true; showHelp(()=>{ if(G) G.paused=false; if(wasShop) showShop(); }); };

// ---------- Tools ----------
function inGhostRoom(){ return roomAt(Math.floor(G.player.x),Math.floor(G.player.y))===G.room; }
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function log(ev){ if(!G.found[ev]){ G.found[ev]=true; say('Evidence logged: '+EV[ev].name,4); } }
function useTool(){
  if(!G||G.over) return;
  const px=Math.floor(G.player.x), py=Math.floor(G.player.y);
  if(G.hidden){ G.hidden=false; say('You step out of the closet.',2); return; }
  if(isCloset(px,py)){ G.hidden=true; G.player.x=px+.5; G.player.y=py+.5; G.seen=G.hunting&&dist(G.player,G.g)<3.5; say(G.seen?'You hide. It saw you go in.':'You pull the closet door shut and hold your breath.',3); return; }
  const t=G.tool; if(!t) { say('You brought nothing. Flee and buy a tool.'); return; }
  const here=inGhostRoom();
  if(t==='box'){ G.boxAsked++; G.patience-=6;
    if(here && G.ghost.ev.includes('box') && Math.random()<0.65){ log('box'); say(pick(['"...leave..."','A voice, through static: "cold"','"...here... here..."','It says your name. You never gave it.']),4); }
    else if(here && G.ghost.liar && Math.random()<0.5){ say('Static. Then a laugh that is not a reply.',3); }
    else say(pick(['Static.','Nothing but hiss.','Someone breathing. Or the box.']),2);
  }
  else if(t==='uv'){ const p=G.uvPrints;
    if(p && dist(G.player,{x:p[0]+.5,y:p[1]+.5})<2.2){ log('uv'); say('Six fingers on the doorframe, glowing.',4); }
    else say(here?'Nothing glows here. Try the doorways.':'The torch shows only dust.',2);
  }
  else if(t==='cam'){ if(G.shots<=0){say('No shots left.');return;} G.shots--; buildToolbar();
    if(here && G.ghost.ev.includes('orbs') && Math.random()<0.75){ log('orbs'); say('The photo is full of pale orbs.',4); }
    else say(here?'The photo shows an empty room. Mostly.':'A photo of a hallway.',2);
    if(here) G.g.flicker=0.4;
  }
  else if(t==='book'){ if(G.book){ if(dist(G.player,G.book)<1.3){ readBook(); } else say('The book is in the '+G.book.room+'.'); return; }
    G.book={x:Math.floor(G.player.x)+.5,y:Math.floor(G.player.y)+.5,room:roomAt(Math.floor(G.player.x),Math.floor(G.player.y)),t:0,written:false};
    say('You lay the book open on the floor.',3);
  }
  else if(t==='salt'){ if(S.uses.salt<=0){say('No salt left.');return;} S.uses.salt--; G.salts.push({x:Math.floor(G.player.x),y:Math.floor(G.player.y),used:false}); buildToolbar(); say('A line of salt across the floor.',2); }
  else if(t==='charm'){ if(S.uses.charm<=0){say('No charm left.');return;} S.uses.charm--; G.patience=Math.min(G.patienceMax,G.patience+30); buildToolbar(); say('The charm burns blue. The house settles, for now.',3); }
  else if(t==='emf'||t==='temp'){ say('It reads on its own. Walk the rooms. Press Use on a closet to hide.',3); }
}
function readBook(){ const b=G.book;
  if(b.written){ log('book'); say('Scrawl across every page: GET OUT.',4); }
  else if(b.t>25){ say('The pages are blank. '+(b.room===G.room?'It will not write.':'Perhaps it is not in this room.'),4); }
  else say('Nothing yet. Give it time.',2);
}

// ---------- Hunting ----------
function startHunt(){ G.hunting=true; G.hunts++; G.huntT=14+G.hunts*4+Math.random()*4; G.path=[]; G.pathT=0; G.seen=!G.hidden; G.lostT=0; say('The lantern gutters. Something is coming.',3); }
function endHunt(){ G.hunting=false; G.patience=G.patienceMax*0.5; say('Silence. It has lost you, for now.',3); const h=pick(G.tiles); G.g.x=h[0]+.5; G.g.y=h[1]+.5; }

// ---------- Update ----------
function movePlayer(dt){
  let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0), dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  dx+=padDir[0]; dy+=padDir[1]; if(!dx&&!dy) return;
  const l=Math.hypot(dx,dy), mag=Math.min(1,l); dx/=l; dy/=l; const sp=4.2*dt*mag, r=0.3, p=G.player;
  const nx=p.x+dx*sp; if(!blocked(nx,p.y,r)) p.x=nx;
  const ny=p.y+dy*sp; if(!blocked(p.x,ny,r)) p.y=ny;
}
function blocked(x,y,r){ for(const [ox,oy] of [[-r,-r],[r,-r],[-r,r],[r,r]]) if(isWall(Math.floor(x+ox),Math.floor(y+oy))) return true; return false; }
function update(dt){
  if(!G||G.over||G.paused) return; G.t+=dt; if(readTimer>0){readTimer-=dt; if(readTimer<=0) $('readout').textContent='';}
  if(!G.hidden) movePlayer(dt);
  const p=G.player, g=G.g, here=inGhostRoom();
  updateObjects(dt);
  G.throwT-=dt; if(G.throwT<=0){ G.throwT=G.ghost.n==='Poltergeist'?rnd(2,5):rnd(14,30); throwSomething(); }
  $('hRoom').textContent=roomAt(Math.floor(p.x),Math.floor(p.y));
  // passive tools
  const d=dist(p,g);
  if(G.tool==='emf' && readTimer<=0 && !G.hidden){ let lvl=1; if(d<5) lvl=2; if(d<3.5) lvl=3; if(d<2.5) lvl=4; if(here&&d<3&&G.ghost.ev.includes('emf')) lvl=5; if(lvl===5) log('emf');
    $('readout').textContent='EMF  '+'▮'.repeat(lvl)+'▯'.repeat(5-lvl)+'  level '+lvl; }
  if(G.tool==='temp' && readTimer<=0 && !G.hidden){ const base=here?(G.ghost.ev.includes('cold')?-2.5:4.5):13.5; const tc=base+Math.sin(G.t*2.1)*1.2; if(here&&G.ghost.ev.includes('cold')&&tc<0) log('cold');
    $('readout').textContent='TEMP  '+tc.toFixed(1)+' °C'; }
  // book
  if(G.book){ G.book.t+=dt; if(!G.book.written && G.book.room===G.room && G.ghost.ev.includes('book') && G.book.t>10+Math.random()*2){ G.book.written=true; } }
  // ghost behaviour
  if(!G.hunting){
    G.patience-=dt*(here?1.25:1); if(G.patience<=0) startHunt();
    g.wander-=dt; if(g.wander<=0){ g.wander=rnd(3,7); const t=pick(G.tiles); g.tx=t[0]; g.ty=t[1]; }
    const sp=1.2*dt, tx=g.tx+.5, ty=g.ty+.5; g.x+=Math.sign(tx-g.x)*Math.min(sp,Math.abs(tx-g.x)); g.y+=Math.sign(ty-g.y)*Math.min(sp,Math.abs(ty-g.y));
    if(here && d<3 && Math.random()<dt*0.25) g.flicker=0.35;
  } else {
    G.huntT-=dt; if(G.huntT<=0){ endHunt(); return; }
    if(G.stall>0){ G.stall-=dt; }
    else {
      // can it see you?
      if(!G.hidden){ G.seen=true; G.lastX=Math.floor(p.x); G.lastY=Math.floor(p.y); }
      else if(G.seen && d>2.5){ G.lostT+=dt; if(G.lostT>2.5){ G.seen=false; say('It paces past the closet, searching.',2); } }
      G.pathT-=dt; if(G.pathT<=0 || !G.path.length){ G.pathT=0.35;
        let target; if(G.seen) target=[Math.floor(p.x),Math.floor(p.y)]; else { if(!G.path.length||Math.random()<0.1){ const t=pick(roomTiles(roomAt(Math.floor(g.x),Math.floor(g.y)))); G.roam=Math.random()<0.5?t:pick(roomTiles(pick(ROOMS).n)); } target=G.roam||[Math.floor(g.x),Math.floor(g.y)]; }
        G.path=bfs([Math.floor(g.x),Math.floor(g.y)],target); }
      if(G.path.length){ const [nx,ny]=G.path[0], tx=nx+.5, ty=ny+.5; let sp=3.1*(G.ghost.speed||1)*(1+G.hunts*0.06); if(G.ghost.chase && d<4) sp*=G.ghost.chase; sp*=dt;
        const ddx=tx-g.x, ddy=ty-g.y, l=Math.hypot(ddx,ddy); if(l<=sp){ g.x=tx; g.y=ty; G.path.shift();
          const s=G.salts.find(s=>!s.used&&s.x===nx&&s.y===ny); if(s){ s.used=true; G.stall=3; say('It stops at the salt, hissing.',2); } }
        else { g.x+=ddx/l*sp; g.y+=ddy/l*sp; } }
    }
    if(d<0.55 && (!G.hidden || G.seen)){ die(); }
  }
  if(g.flicker>0) g.flicker-=dt;
  const pat=$('patience').firstElementChild; const f=G.hunting?G.huntT/(14+G.hunts*4+4):G.patience/G.patienceMax;
  pat.style.width=Math.max(0,Math.min(1,f))*100+'%'; pat.style.background=G.hunting?'var(--blood)':(f<0.25?'#c9772b':'var(--lamp)');
  $('patience').classList.toggle('hunt',G.hunting);
  $('patLabel').textContent=G.hunting?('HUNT · '+Math.ceil(G.huntT)+'s'+(G.hidden?(G.seen?' · it knows where you are':' · hidden'):'')):(f>0.6?'The house is quiet':f>0.25?'The house is restless':'It is about to hunt');
}

// ---------- Render ----------
const cam={x:0,y:0,init:false};
function draw(){
  const p=G?G.player:{x:7.5,y:12.5}, g=G?G.g:null;
  // camera follows the player, clamped to the house
  const tx=Math.max(0,Math.min(W*T-cv.width,p.x*T-cv.width/2)), ty=Math.max(0,Math.min(H*T-cv.height,p.y*T-cv.height/2));
  if(!cam.init){cam.x=tx;cam.y=ty;cam.init=true;} else {cam.x+=(tx-cam.x)*0.12; cam.y+=(ty-cam.y)*0.12;}
  if(G&&G.hunting){ cam.x+=rnd(-1.5,1.5); cam.y+=rnd(-1.5,1.5); }
  ctx.fillStyle='#000'; ctx.fillRect(0,0,cv.width,cv.height);
  ctx.save(); ctx.translate(-Math.round(cam.x),-Math.round(cam.y));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){ const c=MAP[y][x];
    if(c==='#'){ ctx.fillStyle='#2a2330'; ctx.fillRect(x*T,y*T,T,T); ctx.fillStyle='#1b161f'; ctx.fillRect(x*T+2,y*T+2,T-4,T-4); }
    else { ctx.fillStyle=((x+y)&1)?'#3b2f27':'#352a23'; ctx.fillRect(x*T,y*T,T,T); if(c==='D'){ ctx.fillStyle='#5a4330'; ctx.fillRect(x*T+4,y*T+4,T-8,T-8);} if(c==='C'){ ctx.fillStyle='#4a3522'; ctx.fillRect(x*T+3,y*T+3,T-6,T-6); ctx.fillStyle='#2b1d12'; ctx.fillRect(x*T+T/2-1,y*T+5,2,T-10); ctx.fillStyle='#c9a34d'; ctx.fillRect(x*T+T/2-5,y*T+T/2-1,3,3); ctx.fillRect(x*T+T/2+2,y*T+T/2-1,3,3);} } }
  // room labels
  ctx.font='12px "IM Fell English SC", serif'; ctx.fillStyle='rgba(217,207,191,.35)'; ctx.textAlign='left';
  for(const r of ROOMS) ctx.fillText(r.n, r.x*T+4, r.y*T+13);
  if(G){
    for(const o of G.objs){ const sx=o.shake>0?Math.sin(G.t*60)*2:0; ctx.fillStyle=o.col; if(o.kind==='chair'){ctx.fillRect(o.x*T-5+sx,o.y*T-6,10,12);} else if(o.kind==='book'){ctx.fillRect(o.x*T-6+sx,o.y*T-4,12,8);} else {ctx.beginPath(); ctx.arc(o.x*T+sx,o.y*T,5,0,7); ctx.fill();} }
    for(const s of G.salts){ ctx.fillStyle=s.used?'rgba(230,230,230,.25)':'rgba(240,240,240,.8)'; ctx.fillRect(s.x*T+3,s.y*T+T/2-2,T-6,4); }
    if(G.book){ ctx.fillStyle='#d6c7a1'; ctx.fillRect(G.book.x*T-7,G.book.y*T-5,14,10); ctx.fillStyle='#000'; ctx.fillRect(G.book.x*T-1,G.book.y*T-5,2,10); }
    if(G.uvPrints && G.found.uv){ ctx.fillStyle='rgba(120,90,220,.7)'; ctx.beginPath(); ctx.arc(G.uvPrints[0]*T+T/2,G.uvPrints[1]*T+T/2,5,0,7); ctx.fill(); }
    // ghost
    const vis=G.hunting||g.flicker>0||G.over;
    if(vis){ ctx.save(); ctx.globalAlpha=G.hunting?0.6+0.4*Math.abs(Math.sin(G.t*18)):0.55;
      ctx.fillStyle=G.hunting?'#dfe8ea':'#9fd3d6'; ctx.beginPath(); ctx.arc(g.x*T,g.y*T-6,9,Math.PI,0); ctx.lineTo(g.x*T+9,g.y*T+10); ctx.lineTo(g.x*T+3,g.y*T+6); ctx.lineTo(g.x*T-3,g.y*T+10); ctx.lineTo(g.x*T-9,g.y*T+6); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#0b0a0d'; ctx.fillRect(g.x*T-5,g.y*T-8,3,4); ctx.fillRect(g.x*T+2,g.y*T-8,3,4); ctx.restore(); }
  }
  // player
  if(G&&G.hidden){ ctx.fillStyle='rgba(233,216,166,.35)'; ctx.beginPath(); ctx.arc(p.x*T,p.y*T,5,0,7); ctx.fill(); }
  else { ctx.fillStyle='#e9d8a6'; ctx.beginPath(); ctx.arc(p.x*T,p.y*T,7,0,7); ctx.fill(); ctx.fillStyle='#5b3b2a'; ctx.fillRect(p.x*T-4,p.y*T-9,8,4); }
  // lantern darkness
  const rad=G&&G.hidden?1.6*T:(G&&G.hunting?(2.6+Math.sin(G.t*25)*0.3)*T:4.2*T);
  const grd=ctx.createRadialGradient(p.x*T,p.y*T,rad*0.3,p.x*T,p.y*T,rad); grd.addColorStop(0,'rgba(0,0,0,0)'); grd.addColorStop(0.7,'rgba(0,0,0,.55)'); grd.addColorStop(1,'rgba(0,0,0,.96)');
  ctx.fillStyle=grd; ctx.fillRect(cam.x-4,cam.y-4,cv.width+8,cv.height+8);
  ctx.restore();
  if(stick.id!==null){ ctx.strokeStyle='rgba(226,169,79,.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(stick.ox,stick.oy,40,0,7); ctx.stroke();
    const dx=stick.x-stick.ox, dy=stick.y-stick.oy, l=Math.hypot(dx,dy)||1, m=Math.min(l,40); ctx.fillStyle='rgba(226,169,79,.75)'; ctx.beginPath(); ctx.arc(stick.ox+dx/l*m,stick.oy+dy/l*m,14,0,7); ctx.fill(); }
  if(G&&G.dead){ ctx.fillStyle='rgba(120,20,20,.55)'; ctx.fillRect(0,0,cv.width,cv.height); }
}
let last=performance.now();
function loop(now){ const dt=Math.min(0.05,(now-last)/1000); last=now; update(dt); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

// ---------- Journal ----------
function toggleJournal(){ const o=$('ovJournal'); if(!o.hidden){o.hidden=true;return;} if(!G||G.over) return; renderJournal(); o.hidden=false; }
let marks={};
function renderJournal(){
  const o=$('ovJournal'); Object.keys(G.found).forEach(k=>marks[k]='yes');
  const evs=Object.keys(EV).map(k=>{ const m=marks[k]; return `<button type="button" class="chip ${m==='yes'?'found':m==='no'?'ruled':''}" id="ev_${k}" data-ev="${k}">${m==='yes'?'✓ ':m==='no'?'✗ ':'· '}${EV[k].name}</button>`;}).join('');
    const gs=GHOSTS.map(g=>{ const out=isRuledOut(g,marks); return `<button class="g ${out?'out':''}" data-g="${g.n}" ${out?'disabled':''}><b>${g.n}</b><small>${g.ev.map(e=>EV[e].short).join(' · ')}</small><small><i>${g.note}</i></small></button>`;}).join('');
  o.innerHTML=`<div class="card"><div class="eyebrow">Field journal · night ${S.round}</div><h2>What haunts Marrow Lane?</h2>
    <p>Tap a line once for <b>seen</b>, twice for <b>ruled out</b>, again to clear. Green is logged by your instruments. Name a ghost to end the night.</p>
    <div class="ev">${evs}</div><div class="ghosts">${gs}</div>
    <p style="margin-top:14px"><button class="btn" id="bClose">Back to the house</button></p></div>`;
  o.querySelectorAll('[data-ev]').forEach(c=>c.onclick=()=>{const k=c.dataset.ev; if(G.found[k]) return; marks[k]=cycleMark(marks[k]); renderJournal();});
  o.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>guess(b.dataset.g));
  $('bClose').onclick=toggleJournal;
}
function guess(name){ $('ovJournal').hidden=true; marks={}; endRound(name===G.ghost.n?'right':'wrong',name); }

// ---------- End of round ----------
function die(){ G.dead=true; setTimeout(()=>endRound('dead'),900); G.over=true; }
function endRound(kind,name){
  G.over=true; marks={}; const o=$('ovResult'); let cls='',title='',body='',pay=0;
  const truth=`It was a <b>${G.ghost.n}</b> in the ${G.room.toLowerCase()}.`;
  const evPay=Object.keys(G.found).length*20;
  if(kind==='right'){ cls='won'; const bonus=Math.round(G.patience/G.patienceMax*40); pay=100+bonus+evPay; title='Named, and bound.';
    body=`${truth} You called it in ${Math.round(G.t)} seconds. The agency pays $100, $${evPay} for evidence, and $${bonus} for leaving early.`; }
  else if(kind==='wrong'){ pay=evPay; title='You named the wrong thing.'; body=`${truth} You said ${name}. The ${G.ghost.n} laughed when you left. The agency pays $${evPay} for the evidence you did log.`; }
  else if(kind==='fled'){ pay=evPay; title='You fled.'; body=`${truth} You kept your skin, your tools, and $${evPay} for the evidence you logged.`; }
  else { cls='dead'; title='You died.'; body=`${truth} It caught you in the ${roomAt(Math.floor(G.player.x),Math.floor(G.player.y)).toLowerCase()} after ${Math.round(G.t)} seconds. The agency recovers your instruments. Your salt and charms are gone.`;
    S.owned.salt=0; S.owned.charm=0; }
  if(kind!=='dead'){ S.owned.salt=S.uses.salt; S.owned.charm=S.uses.charm; }
  S.cash+=pay; S.round++; updateHeader();
  o.className='overlay '+cls; o.hidden=false;
  o.innerHTML=`<div class="card ${cls}"><div class="eyebrow">Night ${S.round-1} · ${kind}</div><h2>${title}</h2><p>${body}</p>
    <p class="stat">Purse now $${S.cash}.</p>
    <p style="margin-top:14px"><button class="btn primary" id="bNext">Next night</button></p></div>`;
  $('bNext').onclick=()=>{ o.hidden=true; showShop(); };
}
showWelcome();
