import { describe, expect, it } from 'vitest';
import { createShowAiMemory, stepShowAi } from '../src/ai/showAi';
import { MOVE_BY_ID, MOVES } from '../src/data/moves';
import {
  getShowcasePairReply,
  MOVE_SPECIFIC_ANSWERS,
  RODA_SEQUENCES,
  SHOW_CALL_MOVES,
} from '../src/data/rodaDialogues';
import { BTN_RK, createMatchState, hashMatchState } from '../src/sim/state';
import { step } from '../src/sim/step';

describe('Capoeira Play / Show Mode (Jogar na Roda)', () => {
  it('references valid move IDs across every dialogue dictionary and showcase pair', () => {
    for (const [callerId, answers] of Object.entries(MOVE_SPECIFIC_ANSWERS)) {
      expect(MOVE_BY_ID[callerId]).toBeDefined();
      for (const a of answers) {
        expect(MOVE_BY_ID[a.moveId]).toBeDefined();
        if (a.followUpId) expect(MOVE_BY_ID[a.followUpId]).toBeDefined();
      }
    }
    for (const seq of RODA_SEQUENCES) {
      for (const s of seq.steps) {
        expect(MOVE_BY_ID[s.callMoveId]).toBeDefined();
        if (s.preferredAnswerId) expect(MOVE_BY_ID[s.preferredAnswerId]).toBeDefined();
      }
    }
    for (const group of [SHOW_CALL_MOVES.close, SHOW_CALL_MOVES.mid, SHOW_CALL_MOVES.advance]) {
      for (const id of group) expect(MOVE_BY_ID[id]).toBeDefined();
    }
    for (const m of MOVES) {
      const reply = getShowcasePairReply(m.id);
      expect(reply).not.toBeNull();
      expect(MOVE_BY_ID[reply!.moveId]).toBeDefined();
    }
  });

  it('synchronizes calls and evades across a 60-second duet with zero KO/damage', () => {
    const s = createMatchState({ playMode: 'SHOW', p1Char: 'faisca', p2Char: 'jacare' });
    const m0 = createShowAiMemory(0x11223344);
    const m1 = createShowAiMemory(0x55667788);

    let hostileEvents = 0;
    for (let f = 0; f < 3600; f++) {
      const in0 = stepShowAi(s, 0, m0);
      const in1 = stepShowAi(s, 1, m1);
      step(s, [in0, in1]);
      for (const ev of s.events) {
        if (ev.type === 'HIT' || ev.type === 'COUNTER' || ev.type === 'BLOCK' || ev.type === 'KO') {
          hostileEvents++;
        }
      }
    }

    expect(hostileEvents).toBe(0);
    expect(s.roundPhase).toBe('FIGHT');
    expect(s.wins).toEqual([0, 0]);
    expect(s.fighters[0].health).toBe(s.fighters[0].maxHealth);
    expect(s.fighters[1].health).toBe(s.fighters[1].maxHealth);
    expect(s.harmony.nearMisses).toBeGreaterThanOrEqual(15);
    expect(s.harmony.bestStreak).toBeGreaterThanOrEqual(10);
    expect(s.harmony.grazes).toBeLessThanOrEqual(5);
    expect(s.harmony.nearMisses).toBeGreaterThan(s.harmony.grazes * 4);
  });

  it('protects human players from damage/hitstun on accidental contact in SHOW mode', () => {
    const s = createMatchState({ playMode: 'SHOW' });
    s.fighters[0].pos = [-0.55, 0, 0];
    s.fighters[1].pos = [0.55, 0, 0];

    let maxStun = 0;
    for (let f = 0; f < 180; f++) {
      // Human walks forward throwing kicks repeatedly into a stationary dummy
      const in0 = { dir: 6, buttons: f % 32 === 1 ? BTN_RK : 0 };
      const in1 = { dir: 5, buttons: 0 };
      step(s, [in0, in1]);
      maxStun = Math.max(maxStun, s.fighters[0].stunFrames, s.fighters[1].stunFrames);
      expect(s.fighters[0].mode).not.toBe('HITSTUN');
      expect(s.fighters[1].mode).not.toBe('HITSTUN');
      expect(s.fighters[1].mode).not.toBe('JUGGLE');
      expect(s.fighters[1].mode).not.toBe('KO');
    }

    expect(maxStun).toBe(0);
    expect(s.fighters[0].health).toBe(s.fighters[0].maxHealth);
    expect(s.fighters[1].health).toBe(s.fighters[1].maxHealth);
  });

  it('is 100% deterministic across identical Show Mode runs', () => {
    const run = () => {
      const s = createMatchState({ playMode: 'SHOW' });
      const m0 = createShowAiMemory(0xabcdef01);
      const m1 = createShowAiMemory(0x10fedcba);
      for (let f = 0; f < 600; f++) {
        step(s, [stepShowAi(s, 0, m0), stepShowAi(s, 1, m1)]);
      }
      return hashMatchState(s);
    };

    expect(run()).toBe(run());
  });
});
