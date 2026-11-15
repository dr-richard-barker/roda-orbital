// Reusable biomechanical pose building blocks for Capoeira choreography tracks.
import { makePose, type Key, type Pose, type PoseSpec, type Track } from '../anim/pose';
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

/** Build a crisp SF2 kick track with anticipation coil, snap hit, hold frames, and recovery. */
export function buildSnapKickTrack(opts: {
  start?: Pose;
  end?: Pose;
  windupFrame: number;
  windup: PoseSpec;
  impactFrame: number;
  holdFrame: number;
  impact: PoseSpec;
  retractFrame?: number;
  retract?: PoseSpec;
  totalFrames: number;
}): Track {
  const impactPose = makePose(POSE_NEUTRAL, opts.impact);
  const keys: Key[] = [
    { f: 0, pose: opts.start ?? POSE_GINGA_R },
    { f: opts.windupFrame, easing: 'coil', pose: makePose(POSE_NEUTRAL, opts.windup) },
    { f: opts.impactFrame, easing: 'snap', pose: impactPose },
    { f: opts.holdFrame, linear: true, pose: impactPose },
  ];
  if (opts.retractFrame && opts.retract) {
    keys.push({ f: opts.retractFrame, pose: makePose(POSE_NEUTRAL, opts.retract) });
  }
  keys.push({ f: opts.totalFrames, pose: opts.end ?? POSE_GINGA_MID });
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

export { POSE_GINGA_L, POSE_GINGA_MID, POSE_GINGA_R, POSE_HSP_A, POSE_HSP_B, POSE_NEUTRAL, POSE_RLX_A, POSE_RLX_B };
