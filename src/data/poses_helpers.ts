// Reusable biomechanical pose building blocks for Capoeira choreography tracks.
import { blendPose, emptyPose, makePose, type Key, type Pose, type PoseSpec, type Track } from '../anim/pose';
import { DEG } from '../core/fixedmath';
import { BONE_INDEX } from './skeleton';
import { POSE_GINGA_L, POSE_GINGA_MID, POSE_GINGA_R, POSE_HSP_A, POSE_HSP_B, POSE_NEUTRAL, POSE_RLX_A, POSE_RLX_B } from './poses_core';

/** Low tucked squat (Cocorinha base). */
export const POSE_COCORINHA_HOLD: Pose = makePose(POSE_NEUTRAL, {
  root: { rx: 14, ry: -10 },
  bones: {
    pelvis: [16, 0, 0],
    spine: [26, 0, 0],
    chest: [22, 0, 0],
    head: [-34, 8, 0],
    upperArmR: [-82, -28, -16],
    foreArmR: [-112, 0, 35], // shielding temple
    upperArmL: [-40, 10, 20],
    foreArmL: [-95, 0, -20],
    thighL: [-112, 10, 16],
    shinL: [126, 0, 0],
    footL: [-18, 0, 0],
    thighR: [-112, -10, -16],
    shinR: [126, 0, 0],
    footR: [-18, 0, 0],
  },
});

/** Queda de Rins (side elbow-supported kidney balance base). */
export const POSE_QDR_BASE: Pose = makePose(POSE_NEUTRAL, {
  root: { rx: 95, ry: -35, rz: 48 },
  bones: {
    spine: [12, 18, 18],
    chest: [10, 22, 20],
    head: [-25, -35, -15], // watching opponent
    upperArmR: [-110, -25, -45],
    foreArmR: [-105, 0, 0], // elbow tucked under hip/rib
    handR: [75, 0, 0],
    upperArmL: [-155, 0, 22],
    foreArmL: [-15, 0, 0],
    handL: [75, 0, 0],
    thighL: [-55, 0, 35],
    shinL: [95, 0, 0],
    thighR: [-15, 0, -45],
    shinR: [55, 0, 0],
  },
});

/** Tripod headstand base (head + hands on floor). */
export const POSE_HEADSTAND_BASE: Pose = makePose(POSE_HSP_A, {
  root: { rx: 178, ry: 0, rz: 0 },
  bones: {
    head: [-8, 0, 0],
    upperArmL: [-125, 25, 35],
    foreArmL: [-75, 0, -15],
    handL: [70, 0, 0],
    upperArmR: [-125, -25, -35],
    foreArmR: [-75, 0, 15],
    handR: [70, 0, 0],
    thighL: [-4, 0, 8],
    shinL: [6, 0, 0],
    thighR: [4, 0, -8],
    shinR: [6, 0, 0],
  },
});

/** Backward arched bridge (Ponte base). */
export const POSE_BRIDGE_ARCH: Pose = makePose(POSE_NEUTRAL, {
  root: { rx: -88, ry: 0, rz: 0 },
  bones: {
    pelvis: [-12, 0, 0],
    spine: [-28, 0, 0],
    chest: [-32, 0, 0],
    head: [-25, 0, 0],
    upperArmL: [-168, 0, 14],
    foreArmL: [-12, 0, 0],
    handL: [70, 0, 0],
    upperArmR: [-168, 0, -14],
    foreArmR: [-12, 0, 0],
    handR: [70, 0, 0],
    thighL: [-32, 0, 16],
    shinL: [78, 0, 0],
    footL: [-28, 0, 0],
    thighR: [-32, 0, -16],
    shinR: [78, 0, 0],
    footR: [-28, 0, 0],
  },
});

const _I_SHIN_L = 6 + BONE_INDEX.shinL * 3;
const _I_SHIN_R = 6 + BONE_INDEX.shinR * 3;
const _I_THIGH_L = 6 + BONE_INDEX.thighL * 3;
const _I_THIGH_R = 6 + BONE_INDEX.thighR * 3;
const _I_F_ARM_L = 6 + BONE_INDEX.foreArmL * 3;
const _I_F_ARM_R = 6 + BONE_INDEX.foreArmR * 3;

function synthesizeChamberPose(windup: Pose, impact: Pose): Pose {
  const chamber = blendPose(windup, impact, 0.62, emptyPose());
  // Keep raised kicking shin(s) flexed in high chamber so proximal hips/thighs lead before terminal whip
  const lKicking = impact[_I_THIGH_L] < -0.7 || Math.abs(impact[_I_THIGH_L + 2]) > 0.85;
  const rKicking = impact[_I_THIGH_R] < -0.7 || Math.abs(impact[_I_THIGH_R + 2]) > 0.85;
  if (lKicking && impact[_I_SHIN_L] < 0.45) {
    chamber[_I_SHIN_L] = Math.max(windup[_I_SHIN_L], 88 * DEG);
  }
  if (rKicking && impact[_I_SHIN_R] < 0.45) {
    chamber[_I_SHIN_R] = Math.max(windup[_I_SHIN_R], 88 * DEG);
  }
  return chamber;
}

function synthesizeRetractPose(impact: Pose, endPose: Pose): Pose {
  const retract = blendPose(impact, endPose, 0.46, emptyPose());
  // Fold extended leg sharply on eccentric recovery instead of stiff straight drop
  if ((impact[_I_THIGH_L] < -0.75 || Math.abs(impact[_I_THIGH_L + 2]) > 0.85) && impact[_I_SHIN_L] < 0.45) {
    retract[_I_THIGH_L] = impact[_I_THIGH_L] * 0.65 + endPose[_I_THIGH_L] * 0.35;
    retract[_I_SHIN_L] = Math.max(retract[_I_SHIN_L], 78 * DEG);
  }
  if ((impact[_I_THIGH_R] < -0.75 || Math.abs(impact[_I_THIGH_R + 2]) > 0.85) && impact[_I_SHIN_R] < 0.45) {
    retract[_I_THIGH_R] = impact[_I_THIGH_R] * 0.65 + endPose[_I_THIGH_R] * 0.35;
    retract[_I_SHIN_R] = Math.max(retract[_I_SHIN_R], 78 * DEG);
  }
  if (Math.abs(impact[_I_F_ARM_L]) < 0.35 && impact[_I_F_ARM_L] > endPose[_I_F_ARM_L] + 0.3) {
    retract[_I_F_ARM_L] = -85 * DEG;
  }
  if (Math.abs(impact[_I_F_ARM_R]) < 0.35 && impact[_I_F_ARM_R] > endPose[_I_F_ARM_R] + 0.3) {
    retract[_I_F_ARM_R] = -85 * DEG;
  }
  return retract;
}

/**
 * Build a 4-phase Capoeira ballistic strike track:
 *   1) Preparation / weight-shift windup
 *   2) Proximal hip-lead chamber (explicit or auto-synthesized)
 *   3) Terminal ballistic impact + hold
 *   4) Eccentric re-chamber recovery
 */
export function buildSnapKickTrack(opts: {
  start?: Pose;
  end?: Pose;
  windupFrame: number;
  windup: PoseSpec;
  chamberFrame?: number;
  chamber?: PoseSpec;
  impactFrame: number;
  holdFrame: number;
  impact: PoseSpec;
  retractFrame?: number;
  retract?: PoseSpec;
  totalFrames: number;
}): Track {
  const startPose = opts.start ?? POSE_GINGA_R;
  const endPose = opts.end ?? POSE_GINGA_MID;
  const windupPose = makePose(POSE_NEUTRAL, opts.windup);
  const impactPose = makePose(POSE_NEUTRAL, opts.impact);

  const keys: Key[] = [
    { f: 0, pose: startPose },
    { f: opts.windupFrame, easing: 'coil', pose: windupPose },
  ];

  if (opts.chamberFrame && opts.chamber) {
    keys.push({ f: opts.chamberFrame, easing: 'coil', pose: makePose(POSE_NEUTRAL, opts.chamber) });
  } else if (opts.impactFrame - opts.windupFrame >= 3) {
    const chF = Math.floor((opts.windupFrame + opts.impactFrame) * 0.55);
    if (chF > opts.windupFrame && chF < opts.impactFrame) {
      keys.push({ f: chF, easing: 'coil', pose: synthesizeChamberPose(windupPose, impactPose) });
    }
  }

  keys.push({ f: opts.impactFrame, easing: 'snap', pose: impactPose });
  keys.push({ f: opts.holdFrame, linear: true, pose: impactPose });

  if (opts.retractFrame && opts.retract) {
    keys.push({ f: opts.retractFrame, pose: makePose(POSE_NEUTRAL, opts.retract) });
  } else if (opts.totalFrames - opts.holdFrame >= 6) {
    const retF = opts.holdFrame + Math.round((opts.totalFrames - opts.holdFrame) * 0.42);
    if (retF > opts.holdFrame && retF < opts.totalFrames) {
      keys.push({ f: retF, pose: synthesizeRetractPose(impactPose, endPose) });
    }
  }

  keys.push({ f: opts.totalFrames, pose: endPose });
  return { keys };
}

/** Build a continuous spinning track from keyframes. */
export function buildSpinTrack(start: Pose, steps: { f: number; spec: PoseSpec; base?: Pose }[], end: Pose, totalFrames: number): Track {
  return {
    keys: [
      { f: 0, pose: start },
      ...steps.map((s) => ({
        f: s.f,
        linear: true,
        pose: makePose(s.base ?? POSE_NEUTRAL, s.spec),
      })),
      { f: totalFrames, pose: end },
    ],
  };
}

/** Build a low-center-of-gravity sweeping track (coiled drop -> planted hand pivot -> follow-through). */
export function buildSweepTrack(opts: {
  start?: Pose;
  end?: Pose;
  dropFrame: number;
  drop: PoseSpec;
  sweepFrame: number;
  sweep: PoseSpec;
  followFrame?: number;
  follow?: PoseSpec;
  totalFrames: number;
}): Track {
  const keys: Key[] = [
    { f: 0, pose: opts.start ?? POSE_RLX_A },
    { f: opts.dropFrame, easing: 'coil', pose: makePose(POSE_RLX_A, opts.drop) },
    { f: opts.sweepFrame, easing: 'snap', pose: makePose(POSE_NEUTRAL, opts.sweep) },
  ];
  if (opts.followFrame && opts.follow) {
    keys.push({ f: opts.followFrame, linear: true, pose: makePose(POSE_NEUTRAL, opts.follow) });
  }
  keys.push({ f: opts.totalFrames, pose: opts.end ?? POSE_RLX_A });
  return { keys };
}

/** Build an inverted vault / cartwheel track (plant -> apex inversion -> soft landing cushion). */
export function buildVaultTrack(opts: {
  start?: Pose;
  end?: Pose;
  plantFrame: number;
  plant: PoseSpec;
  apexFrame: number;
  apex: PoseSpec;
  landFrame?: number;
  land?: PoseSpec;
  totalFrames: number;
}): Track {
  const keys: Key[] = [
    { f: 0, pose: opts.start ?? POSE_GINGA_MID },
    { f: opts.plantFrame, easing: 'coil', pose: makePose(POSE_NEUTRAL, opts.plant) },
    { f: opts.apexFrame, easing: 'snap', pose: makePose(POSE_HSP_A, opts.apex) },
  ];
  if (opts.landFrame && opts.land) {
    keys.push({ f: opts.landFrame, pose: makePose(POSE_NEUTRAL, opts.land) });
  }
  keys.push({ f: opts.totalFrames, pose: opts.end ?? POSE_GINGA_L });
  return { keys };
}

export { POSE_GINGA_L, POSE_GINGA_MID, POSE_GINGA_R, POSE_HSP_A, POSE_HSP_B, POSE_NEUTRAL, POSE_RLX_A, POSE_RLX_B };
