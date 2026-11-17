// Pose representation, keyframe tracks and forward kinematics.
// Shared by the simulation (hit/hurt capsules) and the renderer (meshes), so what
// you see is exactly what can hit and be hit.
import { BONES, BONE_INDEX, type BoneId, type ScaledBone } from '../data/skeleton';
import {
  ease,
  m3apply,
  m3euler,
  m3mul,
  m3yawFromDir,
  qFromEulerXYZ,
  qSlerp,
  qToEulerXYZ,
  type Mat3,
  type Vec3,
} from '../core/fixedmath';

export const NB = BONES.length;
export const POSE_LEN = 6 + NB * 3;
/** Flat pose: [rootDx, rootDy, rootDz, rootRx, rootRy, rootRz, bone0x, bone0y, bone0z, ...] */
export type Pose = Float64Array;

export type BoneRot = [number, number, number];
export interface PoseSpec {
  root?: Partial<{ dx: number; dy: number; dz: number; rx: number; ry: number; rz: number }>;
  bones?: Partial<Record<BoneId, BoneRot>>;
}

export function emptyPose(): Pose {
  return new Float64Array(POSE_LEN);
}

/** Build a pose from a base pose with overrides (degrees in, radians stored). */
export function makePose(base: Pose | null, spec: PoseSpec): Pose {
  const p = base ? new Float64Array(base) : emptyPose();
  const D = Math.PI / 180;
  if (spec.root) {
    const r = spec.root;
    if (r.dx !== undefined) p[0] = r.dx;
    if (r.dy !== undefined) p[1] = r.dy;
    if (r.dz !== undefined) p[2] = r.dz;
    if (r.rx !== undefined) p[3] = r.rx * D;
    if (r.ry !== undefined) p[4] = r.ry * D;
    if (r.rz !== undefined) p[5] = r.rz * D;
  }
  if (spec.bones) {
    for (const k of Object.keys(spec.bones) as BoneId[]) {
      const v = spec.bones[k]!;
      const i = 6 + BONE_INDEX[k] * 3;
      p[i] = v[0] * D;
      p[i + 1] = v[1] * D;
      p[i + 2] = v[2] * D;
    }
  }
  return p;
}

/** Mirror a pose left<->right (for mirrored versions of moves). */
export function mirrorPose(src: Pose): Pose {
  const p = new Float64Array(src);
  p[0] = -src[0];
  p[4] = -src[4];
  p[5] = -src[5];
  for (let b = 0; b < NB; b++) {
    const name = BONES[b];
    let other = name as string;
    if (name.endsWith('L')) other = name.slice(0, -1) + 'R';
    else if (name.endsWith('R')) other = name.slice(0, -1) + 'L';
    const j = BONE_INDEX[other as BoneId];
    const i = 6 + b * 3, o = 6 + j * 3;
    p[i] = src[o];
    p[i + 1] = -src[o + 1];
    p[i + 2] = -src[o + 2];
  }
  return p;
}

export type EasingMode = 'ease' | 'snap' | 'coil' | 'linear';

export interface Key {
  f: number;
  pose: Pose;
  linear?: boolean; // legacy shorthand for easing: 'linear'
  easing?: EasingMode;
}
export interface Track {
  keys: Key[];
  loop?: number; // loop length in frames (for idle/stance cycles)
}

function applyEasing(u: number, k: Key): number {
  const mode: EasingMode = k.easing ?? (k.linear ? 'linear' : 'ease');
  if (mode === 'linear') return u;
  if (mode === 'snap') {
    // Explosive SF2 startup: rapid extension right into the impact pose
    const inv = 1 - u;
    return 1 - inv * inv * inv * inv;
  }
  if (mode === 'coil') {
    // Slow wind-up anticipation before explosion
    return u * u * u;
  }
  return ease(u);
}

/** Sample a track at (possibly fractional) frame t into `out`. */
/**
 * Interpolate two poses using shortest-arc deterministic quaternion SLERP per joint.
 * Root yaw jumps larger than 170° (or multi-turn unwrapped spins) interpolate linearly
 * along root[4] so continuous 360° tornado/armada spins never reverse direction.
 */
function interpPoseQuat(a: Pose, b: Pose, t: number, out: Pose): Pose {
  if (t <= 0) {
    out.set(a);
    return out;
  }
  if (t >= 1) {
    out.set(b);
    return out;
  }
  // Root translation
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;

  // Root orientation: unwrap intentional >170° or +/-360° flips/spins along the same turn sign
  let linearRoot = false;
  for (let k = 3; k <= 5; k++) {
    const ak = a[k], bk = b[k];
    const diff = Math.abs(bk - ak);
    const sameSide = ak * bk >= 0;
    if ((sameSide && (Math.abs(bk) > Math.PI + 0.05 || (Math.abs(ak) > Math.PI + 0.05 && Math.abs(bk) > 0.1))) || (diff > 2.97 && sameSide)) {
      linearRoot = true;
      break;
    }
  }
  if (linearRoot) {
    out[3] = a[3] + (b[3] - a[3]) * t;
    out[4] = a[4] + (b[4] - a[4]) * t;
    out[5] = a[5] + (b[5] - a[5]) * t;
  } else if (a[3] === b[3] && a[4] === b[4] && a[5] === b[5]) {
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
  } else {
    const rq = qSlerp(qFromEulerXYZ(a[3], a[4], a[5]), qFromEulerXYZ(b[3], b[4], b[5]), t);
    const re = qToEulerXYZ(rq);
    out[3] = re[0];
    out[4] = re[1];
    out[5] = re[2];
  }

  // Articulated joints
  for (let i = 6; i < POSE_LEN; i += 3) {
    const ax = a[i], ay = a[i + 1], az = a[i + 2];
    const bx = b[i], by = b[i + 1], bz = b[i + 2];
    if (ax === bx && ay === by && az === bz) {
      out[i] = ax;
      out[i + 1] = ay;
      out[i + 2] = az;
    } else {
      const e = qToEulerXYZ(qSlerp(qFromEulerXYZ(ax, ay, az), qFromEulerXYZ(bx, by, bz), t));
      out[i] = e[0];
      out[i + 1] = e[1];
      out[i + 2] = e[2];
    }
  }
  return out;
}

export function sampleTrack(track: Track, t: number, out: Pose): Pose {
  const keys = track.keys;
  if (track.loop) t = t - Math.floor(t / track.loop) * track.loop;
  if (t <= keys[0].f || keys.length === 1) {
    out.set(keys[0].pose);
    return out;
  }
  for (let i = 1; i < keys.length; i++) {
    const k1 = keys[i];
    if (t <= k1.f) {
      const k0 = keys[i - 1];
      let u = (t - k0.f) / Math.max(1e-5, k1.f - k0.f);
      u = applyEasing(u, k1);
      return interpPoseQuat(k0.pose, k1.pose, u, out);
    }
  }
  if (track.loop) {
    // wrap from last key back to first
    const k0 = keys[keys.length - 1];
    let u = (t - k0.f) / Math.max(1e-5, track.loop - k0.f);
    u = applyEasing(u, keys[0]);
    return interpPoseQuat(k0.pose, keys[0].pose, u, out);
  }
  out.set(keys[keys.length - 1].pose);
  return out;
}

/** Blend two poses via deterministic per-joint quaternion SLERP. */
export function blendPose(a: Pose, b: Pose, w: number, out: Pose): Pose {
  return interpPoseQuat(a, b, w, out);
}

// ---------------------------------------------------------------------------
// Forward kinematics
// ---------------------------------------------------------------------------
export interface FK {
  joints: Float64Array; // NB*3 world joint positions
  tips: Float64Array;   // NB*3 world tip positions
  rots: Float64Array;   // NB*9 world rotation matrices
  radii: Float64Array;  // NB
  lift: number;         // vertical offset applied by ground clamp
}

export function newFK(): FK {
  return {
    joints: new Float64Array(NB * 3),
    tips: new Float64Array(NB * 3),
    rots: new Float64Array(NB * 9),
    radii: new Float64Array(NB),
    lift: 0,
  };
}

const tmpYaw: Mat3 = new Float64Array(9);
const tmpE: Mat3 = new Float64Array(9);
const tmpR: Mat3 = new Float64Array(9);
const rotStore: Mat3[] = Array.from({ length: NB }, () => new Float64Array(9));

/**
 * Compute world-space joints. The lowest point of the body is placed at `pos.y`
 * (ground clamp), then the pose's root dy is added. `up` (optional) is reserved for
 * surface-anchored fighters in microgravity (M5).
 */
export function computeFK(pose: Pose, bones: ScaledBone[], pos: Vec3, fx: number, fz: number, out: FK): FK {
  m3yawFromDir(fx, fz, tmpYaw);
  for (let b = 0; b < NB; b++) {
    const def = bones[b];
    const i3 = b * 3;
    m3euler(pose[6 + i3], pose[7 + i3], pose[8 + i3], tmpE);
    let jx: number, jy: number, jz: number;
    if (def.parent < 0) {
      m3euler(pose[3], pose[4], pose[5], tmpR);
      m3mul(tmpYaw, tmpR, tmpR);
      m3mul(tmpR, tmpE, rotStore[b]);
      const o = m3apply(tmpYaw, [pose[0], 0, pose[2]]);
      jx = o[0]; jy = 0; jz = o[2];
    } else {
      const pr = rotStore[def.parent];
      const po = def.parent * 3;
      const o = m3apply(pr, def.offset);
      jx = out.joints[po] + o[0];
      jy = out.joints[po + 1] + o[1];
      jz = out.joints[po + 2] + o[2];
      m3mul(pr, tmpE, rotStore[b]);
    }
    out.joints[i3] = jx; out.joints[i3 + 1] = jy; out.joints[i3 + 2] = jz;
    const s = m3apply(rotStore[b], def.seg);
    out.tips[i3] = jx + s[0]; out.tips[i3 + 1] = jy + s[1]; out.tips[i3 + 2] = jz + s[2];
    out.rots.set(rotStore[b], b * 9);
    out.radii[b] = def.radius;
  }
  // ground clamp: lowest surface point sits at pos.y
  let minY = Infinity;
  for (let b = 0; b < NB; b++) {
    const r = out.radii[b];
    const a = out.joints[b * 3 + 1] - r, t = out.tips[b * 3 + 1] - r;
    if (a < minY) minY = a;
    if (t < minY) minY = t;
  }
  const lift = pos[1] - minY + pose[1];
  out.lift = lift;
  for (let b = 0; b < NB; b++) {
    const i3 = b * 3;
    out.joints[i3] += pos[0]; out.joints[i3 + 1] += lift; out.joints[i3 + 2] += pos[2];
    out.tips[i3] += pos[0]; out.tips[i3 + 1] += lift; out.tips[i3 + 2] += pos[2];
  }
  return out;
}

export function jointOf(fk: FK, b: BoneId): Vec3 {
  const i = BONE_INDEX[b] * 3;
  return [fk.joints[i], fk.joints[i + 1], fk.joints[i + 2]];
}
export function tipOf(fk: FK, b: BoneId): Vec3 {
  const i = BONE_INDEX[b] * 3;
  return [fk.tips[i], fk.tips[i + 1], fk.tips[i + 2]];
}
