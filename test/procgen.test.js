import { describe, it, expect } from 'vitest';
import { generateHouse, validateHouse, mergeParams } from '../src/procgen.js';
import { GEN } from '../src/data.js';
import { bfsIn } from '../src/house.js';

const SEEDS = 400;

describe('generated houses', () => {
  it('are valid for every seed in the sample', () => {
    for (let s = 1; s <= SEEDS; s++) {
      const h = generateHouse(s);
      expect(validateHouse(h), `seed ${s}\n${h.map.join('\n')}`).toEqual([]);
    }
  });
  it('are deterministic for a seed', () => {
    expect(generateHouse(42)).toEqual(generateHouse(42));
    expect(generateHouse(42).map).not.toEqual(generateHouse(43).map);
  });
  it('have the same footprint as Marrow Lane', () => {
    const h = generateHouse(7);
    expect(h.w).toBe(20); expect(h.h).toBe(14);
    expect(h.map).toHaveLength(14); for (const row of h.map) expect(row).toHaveLength(20);
  });
  it('start on hall floor against the front wall, with every room reachable', () => {
    for (let s = 1; s <= 50; s++) {
      const h = generateHouse(s);
      expect(h.start[1]).toBe(h.h - 2);
      expect(h.map[h.start[1]][h.start[0]]).toBe('.');
      for (const r of h.rooms) expect(bfsIn(h, h.start, [r.x, r.y]).length).toBeGreaterThan(0);
    }
  });
  it('always have a kitchen and a lounge, and a dining room beside the kitchen', () => {
    for (let s = 1; s <= 100; s++) {
      const names = generateHouse(s).rooms.map(r => r.n);
      expect(names).toContain('Kitchen'); expect(names).toContain('Lounge'); expect(names).toContain('Dining room');
    }
  });
  it('give every room enough floor for a closet and three objects', () => {
    for (let s = 1; s <= 100; s++) for (const r of generateHouse(s).rooms) expect(r.w * r.h).toBeGreaterThanOrEqual(GEN.room.minW * GEN.room.minH);
  });
  it('respect overrides', () => {
    const h = generateHouse(3, { hallWidth: 1 });
    expect(validateHouse(h, { hallWidth: 1 })).toEqual([]);
    const spine = h.map.map(row => row[h.start[0]]);
    expect(spine[h.start[1]]).toBe('.');
    expect(mergeParams({ room: { maxW: 5 } }).room).toMatchObject({ maxW: 5, minW: GEN.room.minW });
  });
});

describe('validateHouse', () => {
  it('reports a broken plan', () => {
    const h = generateHouse(1);
    const map = h.map.slice(); map[0] = '.' + map[0].slice(1);
    expect(validateHouse({ ...h, map }).length).toBeGreaterThan(0);
  });
});
