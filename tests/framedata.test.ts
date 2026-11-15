import { describe, expect, it } from 'vitest';
import { newFK } from '../src/anim/pose';
import { ROSTER } from '../src/data/characters';
import { getCoverageSummary, MINHOQUINHO_MOVES, MUDROJUB_MOVES } from '../src/data/moveCatalog';
import { MOVE_BY_ID, MOVES } from '../src/data/moves';
import { POSE_TRACKS } from '../src/data/poses';
import { createMatchState } from '../src/sim/state';
import { computeFighterFK, triggerShowcaseAction } from '../src/sim/step';

const VALID_STANCES = new Set(['GINGA', 'HSP', 'RLX']);

describe('Move & Frame Data Integrity', () => {
  it('every move has a valid pose track, valid hit windows, and valid cancel targets', () => {
    expect(MOVES.length).toBeGreaterThanOrEqual(100);
    const seenIds = new Set<string>();

    for (const m of MOVES) {
      expect(seenIds.has(m.id), `Duplicate move id ${m.id}`).toBe(false);
      seenIds.add(m.id);

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

  it('has zero duplicate (stance, input) collisions across all moves', () => {
    const bindings = new Map<string, string>();
    for (const m of MOVES) {
      for (const stance of m.from) {
        const key = `${stance}:${m.input}`;
        const existing = bindings.get(key);
        expect(existing, `Input collision ${key} between ${existing} and ${m.id}`).toBeUndefined();
        bindings.set(key, m.id);
      }
    }
  });

  it('covers 100% of Mudroljub (90 active + 3 archived) and Minhoquinho (52 videos)', () => {
    expect(MUDROJUB_MOVES.filter((e) => !e.commented).length).toBe(90);
    expect(MUDROJUB_MOVES.length).toBe(93);
    expect(MINHOQUINHO_MOVES.length).toBe(52);

    const summary = getCoverageSummary();
    expect(summary.mudroljubActiveCovered).toBe(summary.mudroljubActiveTotal);
    expect(summary.mudroljubAllCovered).toBe(summary.mudroljubAllTotal);
    expect(summary.minhoquinhoCovered).toBe(summary.minhoquinhoTotal);

    for (const mEntry of MUDROJUB_MOVES) {
      const m = MOVE_BY_ID[mEntry.moveId];
      expect(m, `Unmapped Mudroljub move ${mEntry.slug} -> ${mEntry.moveId}`).toBeDefined();
      expect(POSE_TRACKS[m.poseId], `Missing pose for ${mEntry.slug}`).toBeDefined();
    }
    for (const nEntry of MINHOQUINHO_MOVES) {
      const m = MOVE_BY_ID[nEntry.moveId];
      expect(m, `Unmapped Minhoquinho move ${nEntry.slug} -> ${nEntry.moveId}`).toBeDefined();
      expect(POSE_TRACKS[m.poseId], `Missing pose for ${nEntry.slug}`).toBeDefined();
    }
  });

  it('allows all 10 Capoeira fighters to perform every move with finite 3D FK poses', () => {
    expect(ROSTER.length).toBe(10);
    expect(ROSTER.every((c) => c.playable)).toBe(true);

    const fk = newFK();
    const state = createMatchState({ p1Char: ROSTER[0].id, p2Char: ROSTER[1].id, trainingMode: true });
    for (const char of ROSTER) {
      state.fighters[0].charId = char.id;
      for (const move of MOVES) {
        expect(triggerShowcaseAction(state, 0, move.id)).toBe(true);
        state.fighters[0].moveFrame = Math.floor(move.totalFrames / 2);
        computeFighterFK(state.fighters[0], state.frame, fk);
        for (let i = 0; i < fk.joints.length; i++) {
          expect(Number.isFinite(fk.joints[i]), `NaN joint in ${char.id}/${move.id}`).toBe(true);
          expect(Number.isFinite(fk.tips[i]), `NaN tip in ${char.id}/${move.id}`).toBe(true);
        }
      }
    }
  });
});
