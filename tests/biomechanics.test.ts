import { describe, expect, it } from 'vitest';
import { applyGroundPinning } from '../src/anim/ik';
import { applyBiomechanicalKinetics } from '../src/anim/kinetics';
import { computeFK, emptyPose, newFK, sampleTrack } from '../src/anim/pose';
import { DEG, m3apply, m3euler, qFromEulerXYZ, qSlerp, qToEulerXYZ, qToMat3 } from '../src/core/fixedmath';
import { computeBodyCOM, getBSIPMassSum, JOINT_ROM_RAD } from '../src/data/biomechanics';
import { MOVES } from '../src/data/moves';
import { POSE_TRACKS } from '../src/data/poses';
import { BONES, BONE_INDEX, DEFAULT_SCALE, scaleSkeleton, SKELETON } from '../src/data/skeleton';
import { createMatchState } from '../src/sim/state';

describe('Biomechanical Physics, Skeleton & Quaternions', () => {
  it('expanded 21-bone skeleton satisfies strict parent-before-child FK topology', () => {
    expect(BONES.length).toBe(21);
    for (let i = 0; i < SKELETON.length; i++) {
      const p = SKELETON[i].parent;
      if (p === null) expect(i).toBe(0);
      else expect(BONE_INDEX[p]).toBeLessThan(i);
    }
  });

  it('Dempster/Winter BSIP mass ratios sum to 1.000 and yield physical standing COM', () => {
    expect(getBSIPMassSum()).toBeCloseTo(1.0, 6);
    const skel = scaleSkeleton(DEFAULT_SCALE);
    const fk = computeFK(emptyPose(), skel, [0, 0, 0], 0, 1, newFK());
    const com = computeBodyCOM(fk, skel);
    expect(com[1]).toBeGreaterThan(0.85);
    expect(com[1]).toBeLessThan(1.15);
    expect(Math.abs(com[0])).toBeLessThan(0.05);
  });

  it('deterministic quaternion SLERP and Euler XYZ roundtrip match m3euler identically', () => {
    const qa = qFromEulerXYZ(20 * DEG, -35 * DEG, 15 * DEG);
    const qb = qFromEulerXYZ(-40 * DEG, 70 * DEG, -25 * DEG);
    const qMid = qSlerp(qa, qb, 0.5);
    const eMid = qToEulerXYZ(qMid);
    const mFromQ = qToMat3(qMid);
    const mFromEuler = m3euler(eMid[0], eMid[1], eMid[2]);
    const vFromQ = m3apply(mFromQ, [0.3, -0.7, 0.5]);
    const vFromE = m3apply(mFromEuler, [0.3, -0.7, 0.5]);
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(vFromQ[i] - vFromE[i])).toBeLessThan(1e-5);
    }
  });

  it('clavicle & cervical kinetics engage automatically during high overhead reach and head turns', () => {
    const s = createMatchState({ trainingMode: true });
    const skel = scaleSkeleton(DEFAULT_SCALE);
    const pose = emptyPose();
    pose[6 + BONE_INDEX.upperArmL * 3] = -140 * DEG; // high overhead forward reach
    pose[6 + BONE_INDEX.head * 3 + 1] = 40 * DEG;
    applyBiomechanicalKinetics(pose, skel, s.fighters[0], s.fighters[1]);
    expect(Math.abs(pose[6 + BONE_INDEX.clavicleL * 3 + 2])).toBeGreaterThan(0.15);
    expect(Math.abs(pose[6 + BONE_INDEX.neck * 3 + 1])).toBeGreaterThan(0.1);
  });

  it('ground pinning keeps planted feet/toes and handstand palms cleanly on y = 0', () => {
    const s = createMatchState({ trainingMode: true });
    const skel = scaleSkeleton(DEFAULT_SCALE);

    // Inverted Bananeira handstand check
    s.fighters[0].stance = 'HSP';
    const hspPose = sampleTrack(POSE_TRACKS.HSP, 0, emptyPose());
    applyBiomechanicalKinetics(hspPose, skel, s.fighters[0]);
    const hspFK = computeFK(hspPose, skel, [0, 0, 0], 1, 0, newFK());
    applyGroundPinning(hspFK, skel, s.fighters[0]);
    const ihl = BONE_INDEX.handL;
    const minHandY = Math.min(hspFK.joints[ihl * 3 + 1], hspFK.tips[ihl * 3 + 1]) - hspFK.radii[ihl];
    expect(Math.abs(minHandY)).toBeLessThan(0.025);

    // Standing Martelo support foot + toe check
    s.fighters[0].stance = 'GINGA';
    s.fighters[0].mode = 'ATTACK';
    s.fighters[0].moveId = 'martelo';
    const kPose = sampleTrack(POSE_TRACKS.martelo, 10, emptyPose());
    applyBiomechanicalKinetics(kPose, skel, s.fighters[0]);
    const kFK = computeFK(kPose, skel, [0, 0, 0], 1, 0, newFK());
    applyGroundPinning(kFK, skel, s.fighters[0]);
    const itoel = BONE_INDEX.toeL;
    const minToeY = kFK.tips[itoel * 3 + 1] - kFK.radii[itoel];
    expect(minToeY).toBeGreaterThanOrEqual(-0.015);
  });

  it('all 114 move pose tracks respect realistic athletic ROM without major joint clipping', () => {
    const clipViolations: string[] = [];
    const pose = emptyPose();
    for (const move of MOVES) {
      const tr = POSE_TRACKS[move.poseId];
      for (const f of [0, Math.floor(move.totalFrames * 0.25), Math.floor(move.totalFrames * 0.5), move.totalFrames]) {
        sampleTrack(tr, f, pose);
        for (let b = 1; b < BONES.length; b++) {
          const id = BONES[b];
          const rom = JOINT_ROM_RAD[id];
          const i = 6 + b * 3;
          // Allow small 0.35 rad soft buffer above nominal AAOS before flagging extreme outlier
          if (
            pose[i] < rom.rx[0] - 0.35 || pose[i] > rom.rx[1] + 0.35 ||
            pose[i + 1] < rom.ry[0] - 0.35 || pose[i + 1] > rom.ry[1] + 0.35 ||
            pose[i + 2] < rom.rz[0] - 0.35 || pose[i + 2] > rom.rz[1] + 0.35
          ) {
            clipViolations.push(`${move.id}@f${f}:${id}`);
          }
        }
      }
    }
    expect(clipViolations).toEqual([]);
  });

  it('distinguishes Angola low crouch Ginga posture from Regional upright Ginga within AAOS ROM', () => {
    const skel = scaleSkeleton(DEFAULT_SCALE);
    const sAngola = createMatchState({ p1Char: 'jacare', trainingMode: true });
    const sRegional = createMatchState({ p1Char: 'faisca', trainingMode: true });

    const pAngola = sampleTrack(POSE_TRACKS.GINGA, 16, emptyPose());
    const pRegional = sampleTrack(POSE_TRACKS.GINGA, 16, emptyPose());
    applyBiomechanicalKinetics(pAngola, skel, sAngola.fighters[0], sAngola.fighters[1]);
    applyBiomechanicalKinetics(pRegional, skel, sRegional.fighters[0], sRegional.fighters[1]);

    // Angola flexes knees deeper (+shinL rx) and leans forward slightly more (+spine rx) than upright Regional
    const iShinL = 6 + BONE_INDEX.shinL * 3;
    const iSpine = 6 + BONE_INDEX.spine * 3;
    expect(pAngola[iShinL]).toBeGreaterThan(pRegional[iShinL] + 0.15);
    expect(pAngola[iSpine]).toBeGreaterThan(pRegional[iSpine] + 0.08);
  });
});
