// 2-bone analytic Inverse Kinematics (IK) & ground pinning for realistic foot/hand contact.
import * as THREE from 'three';
import { BONE_INDEX, type BoneId, type ScaledBone } from '../data/skeleton';
import { clamp, vadd, vdot, vlen, vnorm, vscale, vsub, type Vec3 } from '../core/fixedmath';
import type { FK } from './pose';
import type { FighterState } from '../sim/state';

export interface TwoBoneResult {
  mid: Vec3;
  end: Vec3;
}

/**
 * Analytic 2-bone IK solver preserving exact limb segment lengths `lenA` and `lenB`.
 * `pole` gives the preferred bend direction (e.g., knee forward or elbow back).
 */
export function solveTwoBoneIK(
  root: Vec3,
  lenA: number,
  lenB: number,
  target: Vec3,
  pole: Vec3,
): TwoBoneResult {
  const toTarget = vsub(target, root);
  const rawDist = vlen(toTarget);
  const minD = Math.abs(lenA - lenB) + 0.015;
  const maxD = lenA + lenB - 0.008;
  const dist = clamp(rawDist, minD, maxD);
  const dir = rawDist > 1e-6 ? vscale(toTarget, 1 / rawDist) : ([0, -1, 0] as Vec3);

  // Clamp reachable end position
  const end = vadd(root, vscale(dir, dist));

  // Orthonormalize pole perpendicular to `dir`
  const proj = vscale(dir, vdot(pole, dir));
  let bendDir = vsub(pole, proj);
  if (vlen(bendDir) < 1e-4) {
    bendDir = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [0, 0, 1];
    const p2 = vscale(dir, vdot(bendDir, dir));
    bendDir = vsub(bendDir, p2);
  }
  bendDir = vnorm(bendDir);

  // Law of cosines for triangle (root -> mid -> end)
  const cosA = clamp((lenA * lenA + dist * dist - lenB * lenB) / (2 * lenA * dist), -1, 1);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));

  const mid = vadd(root, vadd(vscale(dir, lenA * cosA), vscale(bendDir, lenA * sinA)));
  return { mid, end };
}

const qFromTo = new THREE.Quaternion();
const qOrig = new THREE.Quaternion();
const mOrig = new THREE.Matrix4();
const vOld = new THREE.Vector3();
const vNew = new THREE.Vector3();

function rotateBoneMatrix(fk: FK, boneIdx: number, oldDir: Vec3, newDir: Vec3): void {
  vOld.set(oldDir[0], oldDir[1], oldDir[2]);
  vNew.set(newDir[0], newDir[1], newDir[2]);
  if (vOld.lengthSq() < 1e-8 || vNew.lengthSq() < 1e-8) return;
  vOld.normalize();
  vNew.normalize();

  const i9 = boneIdx * 9;
  const r = fk.rots;
  mOrig.set(
    r[i9], r[i9 + 1], r[i9 + 2], 0,
    r[i9 + 3], r[i9 + 4], r[i9 + 5], 0,
    r[i9 + 6], r[i9 + 7], r[i9 + 8], 0,
    0, 0, 0, 1,
  );
  qOrig.setFromRotationMatrix(mOrig);
  qFromTo.setFromUnitVectors(vOld, vNew);
  qOrig.premultiply(qFromTo);
  mOrig.makeRotationFromQuaternion(qOrig);
  const e = mOrig.elements; // column-major
  r[i9] = e[0]; r[i9 + 1] = e[4]; r[i9 + 2] = e[8];
  r[i9 + 3] = e[1]; r[i9 + 4] = e[5]; r[i9 + 5] = e[9];
  r[i9 + 6] = e[2]; r[i9 + 7] = e[6]; r[i9 + 8] = e[10];
}

function getJ(fk: FK, idx: number): Vec3 {
  const i = idx * 3;
  return [fk.joints[i], fk.joints[i + 1], fk.joints[i + 2]];
}
function getT(fk: FK, idx: number): Vec3 {
  const i = idx * 3;
  return [fk.tips[i], fk.tips[i + 1], fk.tips[i + 2]];
}
function setJ(fk: FK, idx: number, v: Vec3): void {
  const i = idx * 3;
  fk.joints[i] = v[0]; fk.joints[i + 1] = v[1]; fk.joints[i + 2] = v[2];
}
function setT(fk: FK, idx: number, v: Vec3): void {
  const i = idx * 3;
  fk.tips[i] = v[0]; fk.tips[i + 1] = v[1]; fk.tips[i + 2] = v[2];
}

function pinChain(fk: FK, bones: ScaledBone[], aId: BoneId, bId: BoneId, cId: BoneId, targetAnkleY: number): void {
  const ia = BONE_INDEX[aId];
  const ib = BONE_INDEX[bId];
  const ic = BONE_INDEX[cId];

  const root = getJ(fk, ia);
  const oldMid = getJ(fk, ib);
  const oldEnd = getJ(fk, ic);
  const oldTip = getT(fk, ic);

  const lenA = vlen(bones[ia].seg);
  const lenB = vlen(bones[ib].seg);

  const pole = vsub(oldMid, root);
  const target: Vec3 = [oldEnd[0], targetAnkleY, oldEnd[2]];
  const solved = solveTwoBoneIK(root, lenA, lenB, target, pole);

  const oldDirA = vsub(oldMid, root);
  const oldDirB = vsub(oldEnd, oldMid);
  const newDirA = vsub(solved.mid, root);
  const newDirB = vsub(solved.end, solved.mid);

  rotateBoneMatrix(fk, ia, oldDirA, newDirA);
  rotateBoneMatrix(fk, ib, oldDirB, newDirB);

  setT(fk, ia, solved.mid);
  setJ(fk, ib, solved.mid);
  setT(fk, ib, solved.end);
  setJ(fk, ic, solved.end);
  const footOffset = vsub(oldTip, oldEnd);
  setT(fk, ic, vadd(solved.end, footOffset));
}

/**
 * Renderer-side ground pinning: keeps planted support feet/hands locked cleanly
 * onto y = 0 so fighters never hover or sink during stances, walks, or kicks.
 */
export function applyGroundPinning(fk: FK, bones: ScaledBone[], f: FighterState): void {
  if (f.pos[1] > 0.03) return;
  if (f.mode === 'JUGGLE' || f.mode === 'KNOCKDOWN' || f.mode === 'KO') return;

  // Handstand / floor spin: pin support hands close to ground
  if (f.stance === 'HSP' || f.moveId === 'meia_lua_compasso') {
    for (const [ua, fa, ha] of [
      ['upperArmL', 'foreArmL', 'handL'],
      ['upperArmR', 'foreArmR', 'handR'],
    ] as [BoneId, BoneId, BoneId][]) {
      const ih = BONE_INDEX[ha];
      const wrist = getJ(fk, ih);
      const tip = getT(fk, ih);
      const minHandY = Math.min(wrist[1], tip[1]) - fk.radii[ih];
      if (minHandY < 0.14 && minHandY > -0.08) {
        const delta = -minHandY;
        pinChain(fk, bones, ua, fa, ha, wrist[1] + delta);
      }
    }
    return;
  }

  // Grounded stances & kicks: pin any support foot whose sole is within 12 cm of ground
  for (const [th, sh, ft] of [
    ['thighL', 'shinL', 'footL'],
    ['thighR', 'shinR', 'footR'],
  ] as [BoneId, BoneId, BoneId][]) {
    const ift = BONE_INDEX[ft];
    const ankle = getJ(fk, ift);
    const toe = getT(fk, ift);
    const minSoleY = Math.min(ankle[1], toe[1]) - fk.radii[ift];
    if (minSoleY < 0.14 && minSoleY > -0.15) {
      const delta = -minSoleY;
      pinChain(fk, bones, th, sh, ft, ankle[1] + delta);
    }
  }
}
