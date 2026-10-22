// Geometry of the house: walls, doors, closets, rooms, and pathfinding.
import { MAP, ROOMS, W, H } from './data.js';
export const isWall=(x,y)=> x<0||y<0||x>=W||y>=H||MAP[y][x]==='#';
export const isDoor=(x,y)=> MAP[y] && MAP[y][x]==='D';
export const isCloset=(x,y)=> MAP[y] && MAP[y][x]==='C';
export const roomAt=(x,y)=>{ for(const r of ROOMS) if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h) return r.n; return 'Hall'; };
export const roomTiles=name=>{const a=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!isWall(x,y)&&roomAt(x,y)===name)a.push([x,y]);return a;};

// Breadth-first path on the tile grid. Returns the tiles to step through, excluding the start.
export function bfs(from,to){
  const key=(x,y)=>y*W+x, prev=new Map(), q=[[from[0],from[1]]]; prev.set(key(...from),null);
  while(q.length){ const [x,y]=q.shift(); if(x===to[0]&&y===to[1]) break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(isWall(nx,ny)||prev.has(key(nx,ny))) continue; prev.set(key(nx,ny),[x,y]); q.push([nx,ny]); } }
  if(!prev.has(key(...to))) return []; const path=[]; let c=to; while(c){ path.unshift(c); c=prev.get(key(...c)); } return path.slice(1);
}
