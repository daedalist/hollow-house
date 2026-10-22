import { describe, it, expect } from 'vitest';
import { GHOSTS, EV } from '../src/data.js';
import { isRuledOut, candidates, cycleMark } from '../src/deduction.js';

describe('ghost roster', () => {
  it('every ghost leaves exactly three known kinds of evidence', () => {
    for (const g of GHOSTS) {
      expect(g.ev).toHaveLength(3);
      for (const e of g.ev) expect(EV[e]).toBeDefined();
    }
  });
  it('no two ghosts share the same evidence set', () => {
    const keys = GHOSTS.map(g => [...g.ev].sort().join(','));
    expect(new Set(keys).size).toBe(GHOSTS.length);
  });
  it('every ghost can be singled out by its own three pieces of evidence', () => {
    for (const g of GHOSTS) {
      const marks = Object.fromEntries(g.ev.map(e => [e, 'yes']));
      expect(candidates(GHOSTS, marks).map(x => x.n)).toEqual([g.n]);
    }
  });
});

describe('isRuledOut', () => {
  const wraith = GHOSTS.find(g => g.n === 'Wraith');
  it('keeps a ghost with no marks', () => expect(isRuledOut(wraith, {})).toBe(false));
  it('rules out a ghost that lacks seen evidence', () => expect(isRuledOut(wraith, { orbs: 'yes' })).toBe(true));
  it('rules out a ghost that leaves evidence the player ruled out', () => expect(isRuledOut(wraith, { emf: 'no' })).toBe(true));
  it('keeps a ghost consistent with mixed marks', () => expect(isRuledOut(wraith, { emf: 'yes', orbs: 'no' })).toBe(false));
});

describe('cycleMark', () => {
  it('cycles blank → yes → no → blank', () => {
    expect(cycleMark(undefined)).toBe('yes');
    expect(cycleMark('yes')).toBe('no');
    expect(cycleMark('no')).toBeUndefined();
  });
});
