import { describe, expect, it } from 'vitest';
import { applyGroundPinning, solveTwoBoneIK } from '../src/anim/ik';
import { computeFK, newFK } from '../src/anim/pose';
import { vlen, vsub } from '../src/core/fixedmath';
import { POSE_GINGA_MID } from '../src/data/poses';
import { BONE_INDEX, scaleSkeleton } from '../src/data/skeleton';
import { DEFAULT_SCALE } from '../src/data/skeleton';
import { createMatchState } from '../src/sim/state';

describe('2-Bone Analytic IK & Ground Pinning', () => {
  it('solveTwoBoneIK preserves exact bone lengths and reaches reachable targets', () => {
    const root: [number, number, number] = [0, 0.9, 0];
    const lenA = 0.44;
    const lenB = 0.44;
    const target: [number, number, number] = [0.1, 0.25, 0.25];
    const res = solveTwoBoneIK(root, lenA, lenB, target, [0, 0, 1]);

    expect(vlen(vsub(res.mid, root))).toBeCloseTo(lenA, 4);
    expect(vlen(vsub(res.end, res.mid))).toBeCloseTo(lenB, 4);
    expect(vlen(vsub(res.end, target))).toBeCloseTo(0, 4);
  });

  it('applyGroundPinning keeps support foot soles grounded cleanly near y=0', () => {
    const state = createMatchState({ trainingMode: true });
    const skel = scaleSkeleton(DEFAULT_SCALE);
    const fk = newFK();
    computeFK(POSE_GINGA_MID, skel, [0, 0, 0], 1, 0, fk);

    applyGroundPinning(fk, skel, state.fighters[0]);

    const ifl = BONE_INDEX.footL;
    const ifr = BONE_INDEX.footR;
    const minL = Math.min(fk.joints[ifl * 3 + 1], fk.tips[ifl * 3 + 1]) - fk.radii[ifl];
    const minR = Math.min(fk.joints[ifr * 3 + 1], fk.tips[ifr * 3 + 1]) - fk.radii[ifr];
    expect(Math.abs(minL)).toBeLessThan(0.02);
    expect(Math.abs(minR)).toBeLessThan(0.02);
  });
});
