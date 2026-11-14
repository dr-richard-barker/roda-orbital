import { describe, expect, it } from 'vitest';
import { createAiMemory, stepAi } from '../src/ai/cpu';
import { rngNext } from '../src/core/fixedmath';
import { createMatchState, hashMatchState, type InputFrame } from '../src/sim/state';
import { step } from '../src/sim/step';

function runSim(frames: number): number[] {
  const s = createMatchState({ p1Char: 'faisca', p2Char: 'faisca', trainingMode: false });
  const ai0 = createAiMemory(0xabcdef01);
  const ai1 = createAiMemory(0x10fedcba);
  let seed = 0x42424242;
  const hashes: number[] = [];

  for (let f = 0; f < frames; f++) {
    let i0: InputFrame;
    if (f % 7 === 0) {
      const [r, ns] = rngNext(seed);
      seed = ns;
      i0 = { dir: 1 + Math.floor(r * 9), buttons: Math.floor(r * 32) };
    } else {
      i0 = stepAi(s, 0, ai0, 'HARD');
    }
    const i1 = stepAi(s, 1, ai1, 'MEDIUM');
    step(s, [i0, i1]);
    hashes.push(hashMatchState(s));
  }
  return hashes;
}

describe('Simulation Determinism', () => {
  it('produces bit-identical hashes across two independent 3000-frame runs', () => {
    const a = runSim(3000);
    const b = runSim(3000);
    expect(a.length).toBe(3000);
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        throw new Error(`Determinism divergence at frame ${i}: ${a[i]} !== ${b[i]}`);
      }
    }
  });

  it('snapshot/restore mid-match produces identical continuation (rollback safety)', () => {
    const s = createMatchState({ p1Char: 'faisca', p2Char: 'faisca', trainingMode: true });
    const ai0 = createAiMemory(0x1111);
    const ai1 = createAiMemory(0x2222);

    for (let f = 0; f < 300; f++) {
      step(s, [stepAi(s, 0, ai0, 'MEDIUM'), stepAi(s, 1, ai1, 'MEDIUM')]);
    }
    const snap = structuredClone(s);
    const ai0Snap = structuredClone(ai0);
    const ai1Snap = structuredClone(ai1);

    const h1: number[] = [];
    for (let f = 0; f < 300; f++) {
      step(s, [stepAi(s, 0, ai0, 'MEDIUM'), stepAi(s, 1, ai1, 'MEDIUM')]);
      h1.push(hashMatchState(s));
    }

    const h2: number[] = [];
    for (let f = 0; f < 300; f++) {
      step(snap, [stepAi(snap, 0, ai0Snap, 'MEDIUM'), stepAi(snap, 1, ai1Snap, 'MEDIUM')]);
      h2.push(hashMatchState(snap));
    }

    expect(h2).toEqual(h1);
  });
});
