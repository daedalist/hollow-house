// Geometry of the house: walls, doors, closets, rooms, and pathfinding.
// The helpers read from the *current* house, which is Marrow Lane by default and can be
// swapped for a generated plan with setHouse(). A house is {map, rooms, w, h, start, name}.
import { MAP, ROOMS, W, H } from './data.js';

export const MARROW_LANE={ map:MAP, rooms:ROOMS, w:W, h:H, start:[7,12], name:'Marrow Lane', seed:null };
let cur=MARROW_LANE;
export const house=()=>cur;
export function setHouse(h){ cur=h; }

export const isWallIn=(h,x,y)=> x<0||y<0||x>=h.w||y>=h.h||h.map[y][x]==='#';
export const isWall=(x,y)=> isWallIn(cur,x,y);
export const isDoor=(x,y)=> cur.map[y] && cur.map[y][x]==='D';
export const isCloset=(x,y)=> cur.map[y] && cur.map[y][x]==='C';
export const roomAt=(x,y)=>{ for(const r of cur.rooms) if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h) return r.n; return 'Hall'; };
export const roomTiles=name=>{const a=[];for(let y=0;y<cur.h;y++)for(let x=0;x<cur.w;x++)if(!isWall(x,y)&&roomAt(x,y)===name)a.push([x,y]);return a;};

// Breadth-first path on a house's tile grid. Returns the tiles to step through, excluding the start.
export function bfsIn(h,from,to){
  const key=(x,y)=>y*h.w+x, prev=new Map(), q=[[from[0],from[1]]]; prev.set(key(...from),null);
  while(q.length){ const [x,y]=q.shift(); if(x===to[0]&&y===to[1]) break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(isWallIn(h,nx,ny)||prev.has(key(nx,ny))) continue; prev.set(key(nx,ny),[x,y]); q.push([nx,ny]); } }
  if(!prev.has(key(...to))) return []; const path=[]; let c=to; while(c){ path.unshift(c); c=prev.get(key(...c)); } return path.slice(1);
}
export const bfs=(from,to)=>bfsIn(cur,from,to);
