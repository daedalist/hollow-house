import { describe, it, expect } from 'vitest';
import { MAP, ROOMS, W, H } from '../src/data.js';
import { isWall, isCloset, roomAt, roomTiles, bfs } from '../src/house.js';

describe('house plan', () => {
  it('is a sealed rectangle of the declared size', () => {
    expect(MAP).toHaveLength(H);
    for (const row of MAP) expect(row).toHaveLength(W);
    for (let x = 0; x < W; x++) { expect(isWall(x, 0)).toBe(true); expect(isWall(x, H - 1)).toBe(true); }
    for (let y = 0; y < H; y++) { expect(isWall(0, y)).toBe(true); expect(isWall(W - 1, y)).toBe(true); }
  });
  it('every room has floor and a closet', () => {
    for (const r of ROOMS) {
      const tiles = roomTiles(r.n);
      expect(tiles.length).toBeGreaterThan(0);
      expect(tiles.some(([x, y]) => isCloset(x, y))).toBe(true);
    }
  });
  it('every room is reachable from the front door', () => {
    for (const r of ROOMS) {
      const [tx, ty] = roomTiles(r.n)[0];
      expect(bfs([7, 12], [tx, ty]).length).toBeGreaterThan(0);
    }
  });
  it('rooms do not overlap', () => {
    const seen = new Map();
    for (const r of ROOMS) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      if (isWall(x, y)) continue;
      expect(seen.has(`${x},${y}`)).toBe(false); seen.set(`${x},${y}`, r.n);
      expect(roomAt(x, y)).toBe(r.n);
    }
  });
});

describe('bfs', () => {
  it('returns an empty path when start equals goal', () => expect(bfs([7, 12], [7, 12])).toEqual([]));
  it('returns a path of adjacent floor tiles ending at the goal', () => {
    const path = bfs([7, 12], [2, 2]);
    expect(path.at(-1)).toEqual([2, 2]);
    let prev = [7, 12];
    for (const [x, y] of path) {
      expect(Math.abs(x - prev[0]) + Math.abs(y - prev[1])).toBe(1);
      expect(isWall(x, y)).toBe(false);
      prev = [x, y];
    }
  });
  it('returns an empty path to a wall', () => expect(bfs([7, 12], [0, 0])).toEqual([]));
});
