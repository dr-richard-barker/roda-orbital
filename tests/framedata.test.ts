import { describe, expect, it } from 'vitest';
import { MOVE_BY_ID, MOVES } from '../src/data/moves';
import { POSE_TRACKS } from '../src/data/poses';

const VALID_STANCES = new Set(['GINGA', 'HSP', 'RLX']);

describe('Move & Frame Data Integrity', () => {
  it('every move has a valid pose track, valid hit windows, and valid cancel targets', () => {
    expect(MOVES.length).toBeGreaterThanOrEqual(15);

    for (const m of MOVES) {
      expect(POSE_TRACKS[m.poseId], `Missing poseTrack for ${m.id}`).toBeDefined();
      expect(m.totalFrames).toBeGreaterThan(5);
      expect(VALID_STANCES.has(m.endStance)).toBe(true);

      for (const h of m.hits) {
        expect(h.frames[0]).toBeGreaterThan(0);
        expect(h.frames[1]).toBeGreaterThanOrEqual(h.frames[0]);
        expect(h.frames[1]).toBeLessThanOrEqual(m.totalFrames);
        expect(h.capsules.length).toBeGreaterThan(0);
      }

      for (const c of m.cancels) {
        expect(c.window[0]).toBeGreaterThanOrEqual(1);
        expect(c.window[1]).toBeLessThanOrEqual(m.totalFrames);
        const isStance = VALID_STANCES.has(c.into);
        const isMove = Boolean(MOVE_BY_ID[c.into]);
        expect(isStance || isMove, `Invalid cancel target ${c.into} in ${m.id}`).toBe(true);
      }
    }
  });
});
