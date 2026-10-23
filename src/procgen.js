// Procedural house plans. Pure: no DOM, deterministic for a given seed and parameters.
//
// How a plan is built (see GEN in data.js for every knob):
//   1. Hall skeleton. A spine runs up from the front door in the bottom wall. Usually a cross
//      corridor meets it (T shape), which may run one way only (L), and the spine may carry on
//      to the back wall (+). Either corridor end can stop short so a room sits across the end.
//   2. The space left over falls into a few rectangles, each one tile clear of the hall.
//      Each is split recursively (binary space partition) into rooms with a wall between them.
//   3. Doors: every room that touches the hall gets one onto it. Rooms that do not get a door
//      into a neighbour that is connected, until all are. A few extra connecting doors are added.
//   4. Closets in some rooms (at most one each, at least closets.min per house), in corners where possible, never in front of a door.
//   5. Names by rule (Kitchen, Dining room beside it, Lounge is the largest) then by size.
//   6. The plan is validated; on failure the next attempt for the seed is tried.
import { GEN, ROOM_NAMES, STREETS } from './data.js';
import { makeRng } from './rng.js';
import { bfsIn } from './house.js';

const HALL=-2, WALL=-1;
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];

export function mergeParams(overrides={}){
  return { ...GEN, ...overrides, room:{ ...GEN.room, ...(overrides.room||{}) }, names:{ ...GEN.names, ...(overrides.names||{}) }, closets:{ ...GEN.closets, ...(overrides.closets||{}) } };
}

// Returns a house {map, rooms, w, h, start, name, seed}. Throws if no attempt produced a valid plan.
export function generateHouse(seed, overrides={}){
  const P=mergeParams(overrides);
  for(let a=0;a<P.attempts;a++){
    const rng=makeRng((seed*2654435761 + a*40503 + 7)>>>0);
    const h=attempt(rng,P,seed);
    if(h && validateHouse(h,P).length===0) return h;
  }
  throw new Error('No valid house for seed '+seed);
}

function attempt(rng,P,seed){
  const {w,h}=P, hw=P.hallWidth, R=P.room;
  const own=Array.from({length:h},()=>new Array(w).fill(WALL)); // owner of each tile: WALL, HALL or a room index
  const hall=[], regions=[];
  const fillHall=(x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){ own[y][x]=HALL; hall.push([x,y]); } };

  // 1. hall skeleton
  const mid=Math.floor((w-hw)/2);
  const sx=clamp(rng.int(mid-P.spineSpread,mid+P.spineSpread), R.minW+2, w-2-hw-R.minW); // spine columns sx..sx+hw-1
  const spineUp=rng.chance(P.spineUpChance);
  if(rng.chance(P.corridorChance)){
    const cy=rng.int(R.minH+2, h-2-hw-R.minH);               // corridor rows cy..cy+hw-1
    // each end: runs to the outer wall, stops short with a room across the end (cap), or does not exist (L)
    const sideMode=maxCap=>{ if(!rng.chance(P.capChance)) return ['wall',0]; const lo=P.capWidth[0], hi=Math.min(P.capWidth[1],maxCap); return hi<lo?['wall',0]:['cap',rng.int(lo,hi)]; };
    let left=sideMode(sx-3-R.minW), right=sideMode((w-2)-(sx+hw)-1-R.minW); // a cap must leave room for a room between it and the spine
    // an L leaves one whole side as a column of rooms off the hall, so only when that column is at most a room wide
    if(rng.chance(P.lChance)){ if(rng.chance(0.5)){ if(sx-2<=R.maxW) left=['none',0]; } else if(w-2-sx-hw<=R.maxW) right=['none',0]; }
    const cx0= left[0]==='none'?sx : left[0]==='cap'?left[1]+2 : 1;
    const cx1= right[0]==='none'?sx+hw-1 : right[0]==='cap'?w-3-right[1] : w-2;
    fillHall(sx,cy,sx+hw-1,h-2); fillHall(cx0,cy,cx1,cy+hw-1); if(spineUp) fillHall(sx,1,sx+hw-1,cy-1);
    if(left[0]!=='wall') regions.push([1,1,cx0-2,h-2]);   // the column beside a cap or a missing corridor arm
    if(right[0]!=='wall') regions.push([cx1+2,1,w-2,h-2]);
    if(spineUp){ regions.push([cx0,1,sx-2,cy-2]); regions.push([sx+hw+1,1,cx1,cy-2]); }
    else regions.push([cx0,1,cx1,cy-2]);
    regions.push([cx0,cy+hw+1,sx-2,h-2]); regions.push([sx+hw+1,cy+hw+1,cx1,h-2]);
  } else {
    // straight hall from the front door to the back wall, rooms stacked along both sides
    const cx=clamp(sx, w-2-hw-R.maxW, R.maxW+2);     // keep each side at most a room wide
    fillHall(cx,1,cx+hw-1,h-2);
    regions.push([1,1,cx-2,h-2]); regions.push([cx+hw+1,1,w-2,h-2]);
  }

  // 2. rooms by binary space partition
  const rooms=[];
  const touchesHall={ N:(x0,y0,x1)=>rangeHas(own,x0,x1,y0-2,y0-2), S:(x0,y0,x1,y1)=>rangeHas(own,x0,x1,y1+2,y1+2),
                      W:(x0,y0,x1,y1)=>rangeHas(own,x0-2,x0-2,y0,y1), E:(x0,y0,x1,y1)=>rangeHas(own,x1+2,x1+2,y0,y1) };
  for(const [x0,y0,x1,y1] of regions){ if(x1-x0+1<R.minW||y1-y0+1<R.minH) continue; bsp(rng,P,touchesHall,x0,y0,x1,y1,rooms); }
  if(rooms.length<P.rooms[0]||rooms.length>P.rooms[1]) return null;
  rooms.forEach((r,i)=>{ for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++) own[y][x]=i; });

  // 3. doors. A door is a wall tile with floor on two opposite sides and wall on the other two.
  const doors=new Set(), key=(x,y)=>y*w+x;
  const tiles=new Map(); // "a,b" -> [[x,y,dir]] candidate door tiles between owners a and b (a<b), dir 'h' or 'v'
  const pairKey=(a,b)=>a<b?`${a},${b}`:`${b},${a}`;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){ if(own[y][x]!==WALL) continue;
    const l=own[y][x-1], r=own[y][x+1], u=own[y-1][x], d=own[y+1][x];
    if(l!==WALL&&r!==WALL&&l!==r&&u===WALL&&d===WALL) push(tiles,pairKey(l,r),[x,y,'h']);
    if(u!==WALL&&d!==WALL&&u!==d&&l===WALL&&r===WALL) push(tiles,pairKey(u,d),[x,y,'v']);
  }
  // group each pair's candidates into straight runs (one run per shared stretch of wall)
  const cand=new Map();
  for(const [k,list] of tiles){ const runs=[]; for(const t of list){ const prev=runs.at(-1)?.at(-1);
      if(prev&&prev[2]===t[2]&&((t[2]==='v'&&prev[1]===t[1]&&prev[0]===t[0]-1)||(t[2]==='h'&&prev[0]===t[0]&&prev[1]===t[1]-1))) runs.at(-1).push(t); else runs.push([t]); }
    cand.set(k,runs); }
  const canPlace=(x,y)=>!DIRS.some(([dx,dy])=>doors.has(key(x+dx,y+dy)));
  // a door goes in the middle stretch of a shared wall, not at its ends, and never beside another door
  const placeDoor=(a,b,avoidRun)=>{ const runs=(cand.get(pairKey(a,b))||[]).filter(r=>r!==avoidRun&&r.some(([x,y])=>canPlace(x,y)));
    if(!runs.length) return null; const run=rng.pick(runs); let c=run.length>=3?run.slice(1,-1):run; c=c.filter(([x,y])=>canPlace(x,y)); if(!c.length) c=run.filter(([x,y])=>canPlace(x,y));
    const t=rng.pick(c); doors.add(key(t[0],t[1])); return {t,run}; };
  const hallDoor=new Array(rooms.length).fill(null);
  rooms.forEach((r,i)=>{ hallDoor[i]=placeDoor(HALL,i); });
  const connected=new Set(rooms.map((r,i)=>i).filter(i=>hallDoor[i]));
  if(!connected.size) return null;
  const neighbours=i=>rooms.map((r,j)=>j).filter(j=>j!==i&&cand.has(pairKey(i,j)));
  for(let guard=0;guard<rooms.length;guard++){
    const todo=rng.shuffle(rooms.map((r,i)=>i).filter(i=>!connected.has(i))); if(!todo.length) break;
    let progress=false;
    for(const i of todo){ const via=neighbours(i).filter(j=>connected.has(j)); if(!via.length) continue;
      if(placeDoor(i,rng.pick(via))){ connected.add(i); progress=true; } }
    if(!progress) return null;
  }
  if(connected.size<rooms.length) return null;
  for(let i=0;i<rooms.length;i++)for(const j of neighbours(i)){ if(j<i) continue; const hasDoor=(cand.get(pairKey(i,j))||[]).flat().some(([x,y])=>doors.has(key(x,y)));
    if(!hasDoor&&rng.chance(P.extraRoomDoorChance)) placeDoor(i,j); }
  rooms.forEach((r,i)=>{ if(hallDoor[i]&&rng.chance(P.secondHallDoorChance)) placeDoor(HALL,i,hallDoor[i].run); });

  // 4. closets: some rooms, at most one each; corners first, never beside a door
  const map=own.map(row=>row.map(o=>o===WALL?'#':'.'));
  for(const k of doors){ map[Math.floor(k/w)][k%w]='D'; }
  const besideDoor=(x,y)=>DIRS.some(([dx,dy])=>map[y+dy][x+dx]==='D');
  const hasCloset=rooms.map(()=>rng.chance(P.closets.chance));
  for(const i of rng.shuffle(rooms.map((r,i)=>i))){ if(hasCloset.filter(Boolean).length>=Math.min(P.closets.min,rooms.length)) break; hasCloset[i]=true; }
  for(const [i,r] of rooms.entries()){ if(!hasCloset[i]) continue; const corners=[], edges=[];
    for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){ if(besideDoor(x,y)) continue;
      const ex=(x===r.x||x===r.x+r.w-1), ey=(y===r.y||y===r.y+r.h-1);
      if(ex&&ey) corners.push([x,y]); else if(ex||ey) edges.push([x,y]); }
    const pool=(corners.length&&(!edges.length||rng.chance(P.closetCornerBias)))?corners:(edges.length?edges:corners);
    if(!pool.length) return null;
    const [cx,cy]=rng.pick(pool); map[cy][cx]='C'; }

  // 5. names
  nameRooms(rng,P,rooms,hallDoor,neighbours);

  const n=rng.int(1,89), street=rng.pick(STREETS);
  return { map:map.map(row=>row.join('')), rooms:rooms.map(r=>({n:r.n,x:r.x,y:r.y,w:r.w,h:r.h})), w, h,
           start:[hall[0][0]+Math.floor((hw-1)/2),h-2], name:`No. ${n} ${street}`, seed };
}

// Split a rectangle into rooms. A split keeps both halves on the hall when it runs away from the hall
// (stacked rooms along a hall beside them, side-by-side rooms along a hall below). The other way makes an
// inner room reached through its neighbour, which is allowed with innerRoomChance or when nothing else fits.
function bsp(rng,P,touches,x0,y0,x1,y1,out){
  const R=P.room, w=x1-x0+1, h=y1-y0+1, area=w*h, leaf=()=>out.push({x:x0,y:y0,w,h});
  const canV=w>=2*R.minW+1, canH=h>=2*R.minH+1;
  if(!canV&&!canH) return leaf();
  const ns=touches.N(x0,y0,x1,y1)||touches.S(x0,y0,x1,y1), ew=touches.E(x0,y0,x1,y1)||touches.W(x0,y0,x1,y1);
  const inner=rng.chance(P.innerRoomChance);
  const okV=canV&&(ns||!ew||inner), okH=canH&&(ew||!ns||inner);   // splits we are willing to make
  const needV=w>R.maxW&&canV, needH=h>R.maxH&&canH;               // splits we must make (too wide / too tall)
  if(!needV&&!needH){ if(!(area>R.maxArea||rng.chance(P.splitChance)) || !(okV||okH)) return leaf(); }
  let vertical;
  if(needV&&!needH&&!okH) vertical=true; else if(needH&&!needV&&!okV) vertical=false;
  else if(okV&&!okH) vertical=true; else if(okH&&!okV) vertical=false;
  else if(!okV&&!okH) vertical=needV;
  else if(needV&&!needH) vertical=true; else if(needH&&!needV) vertical=false;
  else vertical= w>h*1.3?true : h>w*1.3?false : rng.chance(0.5);
  if(vertical){ const s=splitAt(rng,P,x0+R.minW,x1-R.minW); bsp(rng,P,touches,x0,y0,s-1,y1,out); bsp(rng,P,touches,s+1,y0,x1,y1,out); }
  else { const s=splitAt(rng,P,y0+R.minH,y1-R.minH); bsp(rng,P,touches,x0,y0,x1,s-1,out); bsp(rng,P,touches,x0,s+1,x1,y1,out); }
}
// Where to put the wall, between lo and hi inclusive. splitBias 0 is uniform; 1 always picks the middle.
function splitAt(rng,P,lo,hi){ const u=rng(), f=u*(1-P.splitBias)+0.5*P.splitBias; return lo+Math.round(f*(hi-lo)); }
function rangeHas(own,x0,x1,y0,y1){ for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) if(own[y]&&own[y][x]===HALL) return true; return false; }

function nameRooms(rng,P,rooms,hallDoor,neighbours){
  const N=P.names, area=r=>r.w*r.h, left=new Set(rooms.map((r,i)=>i));
  const take=(i,name)=>{ rooms[i].n=name; left.delete(i); };
  const largestOf=ids=>ids.slice().sort((a,b)=>area(rooms[b])-area(rooms[a]))[0];
  const onHall=()=>[...left].filter(i=>hallDoor[i]);
  take(largestOf(onHall().length?onHall():[...left]),'Lounge');
  let kFit=onHall().filter(i=>area(rooms[i])>=N.kitchenMinArea);
  const withNeighbour=kFit.filter(i=>neighbours(i).some(j=>left.has(j)&&j!==i)); if(withNeighbour.length) kFit=withNeighbour; // so a dining room can sit beside it
  const k= kFit.length?rng.pick(kFit) : largestOf(onHall().length?onHall():[...left]);
  take(k,'Kitchen');
  const dining=neighbours(k).filter(i=>left.has(i)&&area(rooms[i])>=N.diningMinArea);
  if(dining.length) take(largestOf(dining),'Dining room');
  const lists={ large:rng.shuffle(ROOM_NAMES.large), medium:rng.shuffle(ROOM_NAMES.medium), small:rng.shuffle(ROOM_NAMES.small) };
  const order={ large:['large','medium','small'], medium:['medium','large','small'], small:['small','medium','large'] };
  for(const i of [...left].sort((a,b)=>area(rooms[b])-area(rooms[a]))){
    const a=area(rooms[i]), cls=a>=N.largeArea?'large':a<=N.smallArea?'small':'medium';
    const src=order[cls].find(c=>lists[c].length); if(!src) return; take(i,lists[src].pop());
  }
}

// Structural checks a plan must pass. Returns a list of problems; empty means valid.
export function validateHouse(house,params){
  const P=mergeParams(params), out=[], {map,rooms,w,h}=house;
  if(map.length!==h) out.push('height');
  if(map.some(r=>r.length!==w)) out.push('width');
  for(let x=0;x<w;x++) if(map[0][x]!=='#'||map[h-1][x]!=='#') out.push('open top/bottom wall');
  for(let y=0;y<h;y++) if(map[y][0]!=='#'||map[y][w-1]!=='#') out.push('open side wall');
  if(rooms.length<P.rooms[0]||rooms.length>P.rooms[1]) out.push('room count '+rooms.length);
  if(new Set(rooms.map(r=>r.n)).size!==rooms.length) out.push('duplicate room names');
  const owner=new Map(); const at=(x,y)=>(map[y]||'')[x]||'#'; let totalClosets=0;
  for(const r of rooms){ let closets=0;
    if(r.w<P.room.minW||r.h<P.room.minH) out.push(r.n+' too small');
    for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){ const k=x+','+y;
      if(owner.has(k)) out.push('overlap at '+k); owner.set(k,r.n);
      const c=at(x,y); if(c==='#'||c==='D') out.push(r.n+' has a wall/door inside'); if(c==='C') closets++; }
    if(closets>1) out.push(r.n+' has '+closets+' closets'); totalClosets+=closets;
    if(bfsIn(house,house.start,[r.x,r.y]).length===0) out.push(r.n+' unreachable');
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const c=at(x,y);
    if(c==='D'){ const lr=at(x-1,y)!=='#'&&at(x+1,y)!=='#'&&at(x,y-1)==='#'&&at(x,y+1)==='#', ud=at(x,y-1)!=='#'&&at(x,y+1)!=='#'&&at(x-1,y)==='#'&&at(x+1,y)==='#';
      if(!lr&&!ud) out.push('bad door at '+x+','+y);
      if(at(x+1,y)==='D'||at(x,y+1)==='D') out.push('adjacent doors at '+x+','+y); }
    if(c==='C'&&!owner.has(x+','+y)) out.push('closet in the hall at '+x+','+y);
  }
  if(totalClosets<Math.min(P.closets.min,rooms.length)) out.push('only '+totalClosets+' closets');
  if(at(...house.start)!=='.') out.push('start is not hall floor');
  return out;
}

// ASCII rendering for the terminal and tests.
export function houseToString(house){
  return house.map.join('\n')+'\n'+house.rooms.map(r=>`${r.n} ${r.w}x${r.h} @${r.x},${r.y}`).join(' · ');
}

function push(m,k,v){ if(!m.has(k)) m.set(k,[]); m.get(k).push(v); }
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
