// Empirical human anthropometric & kinematic constants (Dempster 1955 / Winter 2009 BSIP,
// AAOS Joint ROM with Capoeira athletic flexibility margins). Purely deterministic.
import { clamp, DEG, type Vec3 } from '../core/fixedmath';
import { BONES, BONE_INDEX, type BoneId, type ScaledBone } from './skeleton';
import type { FK, Pose } from '../anim/pose';

export interface SegmentBSIP {
  massRatio: number; // fraction of total body mass (sum across SKELETON === 1.0)
  comProximal: number; // COM position along bone segment from proximal joint (0..1)
}

/** Dempster (1955) / Winter (2009) Body Segment Inertial Parameters adapted to 21-bone rig. */
export const BSIP: Record<BoneId, SegmentBSIP> = {
  pelvis: { massRatio: 0.142, comProximal: 0.5 },
  spine: { massRatio: 0.139, comProximal: 0.5 },
  chest: { massRatio: 0.2, comProximal: 0.52 },
  neck: { massRatio: 0.02, comProximal: 0.5 },
  head: { massRatio: 0.061, comProximal: 0.5 },

  clavicleL: { massRatio: 0.008, comProximal: 0.5 },
  upperArmL: { massRatio: 0.028, comProximal: 0.436 },
  foreArmL: { massRatio: 0.016, comProximal: 0.43 },
  handL: { massRatio: 0.006, comProximal: 0.506 },

  clavicleR: { massRatio: 0.008, comProximal: 0.5 },
  upperArmR: { massRatio: 0.028, comProximal: 0.436 },
  foreArmR: { massRatio: 0.016, comProximal: 0.43 },
  handR: { massRatio: 0.006, comProximal: 0.506 },

  thighL: { massRatio: 0.1, comProximal: 0.433 },
  shinL: { massRatio: 0.0465, comProximal: 0.433 },
  footL: { massRatio: 0.011, comProximal: 0.48 },
  toeL: { massRatio: 0.0035, comProximal: 0.45 },

  thighR: { massRatio: 0.1, comProximal: 0.433 },
  shinR: { massRatio: 0.0465, comProximal: 0.433 },
  footR: { massRatio: 0.011, comProximal: 0.48 },
  toeR: { massRatio: 0.0035, comProximal: 0.45 },
};

export interface JointROM {
  rx: [number, number];
  ry: [number, number];
  rz: [number, number];
}

/**
 * AAOS anatomical joint range of motion (radians, Euler XYZ local bone axes),
 * widened within elite Capoeira flexibility envelopes (ponte backbend, high lateral kicks).
 */
export const JOINT_ROM_RAD: Record<BoneId, JointROM> = {
  pelvis: { rx: [-175 * DEG, 175 * DEG], ry: [-180 * DEG, 180 * DEG], rz: [-175 * DEG, 175 * DEG] },
  spine: { rx: [-75 * DEG, 90 * DEG], ry: [-60 * DEG, 60 * DEG], rz: [-50 * DEG, 50 * DEG] },
  chest: { rx: [-65 * DEG, 70 * DEG], ry: [-65 * DEG, 65 * DEG], rz: [-45 * DEG, 45 * DEG] },
  neck: { rx: [-45 * DEG, 48 * DEG], ry: [-68 * DEG, 68 * DEG], rz: [-42 * DEG, 42 * DEG] },
  head: { rx: [-40 * DEG, 42 * DEG], ry: [-82 * DEG, 82 * DEG], rz: [-38 * DEG, 38 * DEG] },

  clavicleL: { rx: [-25 * DEG, 30 * DEG], ry: [-28 * DEG, 28 * DEG], rz: [-20 * DEG, 38 * DEG] },
  upperArmL: { rx: [-178 * DEG, 165 * DEG], ry: [-110 * DEG, 110 * DEG], rz: [-65 * DEG, 172 * DEG] },
  foreArmL: { rx: [-155 * DEG, 8 * DEG], ry: [-95 * DEG, 95 * DEG], rz: [-52 * DEG, 52 * DEG] },
  handL: { rx: [-85 * DEG, 85 * DEG], ry: [-45 * DEG, 45 * DEG], rz: [-38 * DEG, 45 * DEG] },

  clavicleR: { rx: [-25 * DEG, 30 * DEG], ry: [-28 * DEG, 28 * DEG], rz: [-38 * DEG, 20 * DEG] },
  upperArmR: { rx: [-178 * DEG, 165 * DEG], ry: [-110 * DEG, 110 * DEG], rz: [-172 * DEG, 65 * DEG] },
  foreArmR: { rx: [-155 * DEG, 8 * DEG], ry: [-95 * DEG, 95 * DEG], rz: [-52 * DEG, 52 * DEG] },
  handR: { rx: [-85 * DEG, 85 * DEG], ry: [-45 * DEG, 45 * DEG], rz: [-45 * DEG, 38 * DEG] },

  thighL: { rx: [-155 * DEG, 135 * DEG], ry: [-85 * DEG, 85 * DEG], rz: [-55 * DEG, 125 * DEG] },
  shinL: { rx: [-10 * DEG, 155 * DEG], ry: [-28 * DEG, 28 * DEG], rz: [-18 * DEG, 18 * DEG] },
  footL: { rx: [-55 * DEG, 70 * DEG], ry: [-38 * DEG, 38 * DEG], rz: [-40 * DEG, 40 * DEG] },
  toeL: { rx: [-75 * DEG, 38 * DEG], ry: [-12 * DEG, 12 * DEG], rz: [-15 * DEG, 15 * DEG] },

  thighR: { rx: [-155 * DEG, 135 * DEG], ry: [-85 * DEG, 85 * DEG], rz: [-125 * DEG, 55 * DEG] },
  shinR: { rx: [-10 * DEG, 155 * DEG], ry: [-28 * DEG, 28 * DEG], rz: [-18 * DEG, 18 * DEG] },
  footR: { rx: [-50 * DEG, 65 * DEG], ry: [-35 * DEG, 35 * DEG], rz: [-38 * DEG, 38 * DEG] },
  toeR: { rx: [-75 * DEG, 38 * DEG], ry: [-12 * DEG, 12 * DEG], rz: [-15 * DEG, 15 * DEG] },
};

function softLimit(v: number, lo: number, hi: number): number {
  const margin = 0.08;
  if (v < lo) {
    const excess = lo - v;
    return lo - (excess * margin) / (excess + margin);
  }
  if (v > hi) {
    const excess = v - hi;
    return hi + (excess * margin) / (excess + margin);
  }
  return v;
}

/** Gently compress hyperextension / impossible joint angles while preserving athletic expressiveness. */
export function softClampPoseROM(pose: Pose): Pose {
  for (let b = 0; b < BONES.length; b++) {
    const id = BONES[b];
    if (id === 'pelvis') continue;
    const rom = JOINT_ROM_RAD[id];
    const i = 6 + b * 3;
    pose[i] = clamp(softLimit(pose[i], rom.rx[0], rom.rx[1]), rom.rx[0] - 0.08, rom.rx[1] + 0.08);
    pose[i + 1] = clamp(softLimit(pose[i + 1], rom.ry[0], rom.ry[1]), rom.ry[0] - 0.08, rom.ry[1] + 0.08);
    pose[i + 2] = clamp(softLimit(pose[i + 2], rom.rz[0], rom.rz[1]), rom.rz[0] - 0.08, rom.rz[1] + 0.08);
  }
  return pose;
}

/**
 * Compute whole-body Center of Mass (world space) from solved FK using Dempster/Winter BSIP.
 * Scales consistently with per-character ScaledBone lengths.
 */
export function computeBodyCOM(fk: FK, _bones?: ScaledBone[]): Vec3 {
  let cx = 0, cy = 0, cz = 0;
  let totalM = 0;
  for (let b = 0; b < BONES.length; b++) {
    const p = BSIP[BONES[b]];
    const i3 = b * 3;
    const w = p.comProximal;
    const omt = 1 - w;
    const sx = fk.joints[i3] * omt + fk.tips[i3] * w;
    const sy = fk.joints[i3 + 1] * omt + fk.tips[i3 + 1] * w;
    const sz = fk.joints[i3 + 2] * omt + fk.tips[i3 + 2] * w;
    cx += sx * p.massRatio;
    cy += sy * p.massRatio;
    cz += sz * p.massRatio;
    totalM += p.massRatio;
  }
  const inv = totalM > 1e-6 ? 1 / totalM : 1;
  return [cx * inv, cy * inv, cz * inv];
}

export function getBSIPMassSum(): number {
  let s = 0;
  for (let b = 0; b < BONES.length; b++) s += BSIP[BONES[b]].massRatio;
  return s;
}

export function getBoneMass(id: BoneId): number {
  return BSIP[id].massRatio;
}

export { BONE_INDEX };
