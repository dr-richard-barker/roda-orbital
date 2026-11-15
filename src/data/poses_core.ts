// Core Capoeira stance, locomotion, guard, hitstun, and knockdown pose tracks.
// Coordinates: +Z = forward toward opponent, +X = character's left, +Y = up.
import { makePose, mirrorPose, type Pose, type Track } from '../anim/pose';

/** Neutral upright ready pose (used as base/reference for composition). */
export const POSE_NEUTRAL: Pose = makePose(null, {
  bones: {
    pelvis: [4, 0, 0],
    spine: [6, 0, 0],
    chest: [4, 0, 0],
    upperArmL: [-30, 0, 18],
    foreArmL: [-80, 0, -20],
    upperArmR: [-30, 0, -18],
    foreArmR: [-80, 0, 20],
    thighL: [-18, 8, 6],
    shinL: [30, 0, 0],
    footL: [-12, 0, 0],
    thighR: [12, -8, -6],
    shinR: [18, 0, 0],
    footR: [-10, 0, 0],
  },
});

/** Ginga back-step (deep front knee bend, guarding forearm across face). */
export const POSE_GINGA_R: Pose = makePose(null, {
  root: { dx: -0.08, dy: 0, ry: -24 },
  bones: {
    pelvis: [10, -14, 6],
    spine: [14, 16, -5],
    chest: [10, 22, -6],
    head: [-14, -18, 2],
    upperArmR: [-72, -25, -28],
    foreArmR: [-102, 0, 42],
    upperArmL: [28, 12, 26],
    foreArmL: [-52, 0, -14],
    thighL: [-42, 12, 10],
    shinL: [62, 0, 0],
    footL: [-20, 0, 0],
    thighR: [32, -12, -10],
    shinR: [28, 0, 0],
    footR: [18, 0, 0],
  },
});

/** Ginga center pass (cadeira / base squat). */
export const POSE_GINGA_MID: Pose = makePose(null, {
  root: { dx: 0, dy: 0, ry: 0 },
  bones: {
    pelvis: [8, 0, 0],
    spine: [10, 0, 0],
    chest: [8, 0, 0],
    head: [-10, 0, 0],
    upperArmL: [-46, 18, 30],
    foreArmL: [-82, 0, -28],
    upperArmR: [-46, -18, -30],
    foreArmR: [-82, 0, 28],
    thighL: [-36, 14, 15],
    shinL: [58, 0, 0],
    footL: [-22, 0, 0],
    thighR: [-36, -14, -15],
    shinR: [58, 0, 0],
    footR: [-22, 0, 0],
  },
});

export const POSE_GINGA_L: Pose = mirrorPose(POSE_GINGA_R);

export const TRACK_GINGA: Track = {
  loop: 64,
  keys: [
    { f: 0, pose: POSE_GINGA_R },
    { f: 16, pose: POSE_GINGA_MID },
    { f: 32, pose: POSE_GINGA_L },
    { f: 48, pose: POSE_GINGA_MID },
  ],
};

/** Bananeira (Handstand - HSP): inverted body, hands planted, legs split/tucked. */
export const POSE_HSP_A: Pose = makePose(null, {
  root: { rx: 175, ry: 0, rz: 4 },
  bones: {
    pelvis: [-8, 0, 0],
    spine: [-6, 0, 0],
    chest: [-6, 0, 0],
    head: [28, 0, 0],
    upperArmL: [-170, 0, 12],
    foreArmL: [-8, 0, 0],
    handL: [75, 0, 0],
    upperArmR: [-170, 0, -12],
    foreArmR: [-8, 0, 0],
    handR: [75, 0, 0],
    thighL: [-25, 0, 14],
    shinL: [55, 0, 0],
    thighR: [15, 0, -14],
    shinR: [35, 0, 0],
  },
});

export const POSE_HSP_B: Pose = makePose(POSE_HSP_A, {
  root: { rx: 175, ry: 0, rz: -4 },
  bones: {
    thighL: [15, 0, 18],
    shinL: [35, 0, 0],
    thighR: [-28, 0, -18],
    shinR: [60, 0, 0],
  },
});

export const TRACK_HSP: Track = {
  loop: 48,
  keys: [
    { f: 0, pose: POSE_HSP_A },
    { f: 24, pose: POSE_HSP_B },
  ],
};

/** Negativa / Cocorinha (Low Ground Stance - RLX): low crouch, one leg extended, hand on floor. */
export const POSE_RLX_A: Pose = makePose(null, {
  root: { dy: 0, rx: 14, ry: -22 },
  bones: {
    pelvis: [18, 0, 0],
    spine: [20, 10, 6],
    chest: [18, 12, 4],
    head: [-25, -18, 0],
    upperArmR: [-10, 0, -28],
    foreArmR: [-15, 0, 0],
    handR: [60, 0, 0],
    upperArmL: [-75, 15, 18],
    foreArmL: [-90, 0, -15],
    thighL: [-105, 12, 18],
    shinL: [118, 0, 0],
    footL: [-18, 0, 0],
    thighR: [-65, -8, -10],
    shinR: [18, 0, 0],
    footR: [20, 0, 0],
  },
});

export const POSE_RLX_B: Pose = makePose(POSE_RLX_A, {
  root: { dy: 0, rx: 16, ry: -16 },
  bones: {
    spine: [24, 14, 8],
    thighR: [-70, -12, -14],
  },
});

export const TRACK_RLX: Track = {
  loop: 56,
  keys: [
    { f: 0, pose: POSE_RLX_A },
    { f: 28, pose: POSE_RLX_B },
  ],
};

// ---------------------------------------------------------------------------
// Locomotion & Combat Reaction Tracks
// ---------------------------------------------------------------------------

const WALK_STEP_A: Pose = makePose(POSE_GINGA_MID, {
  root: { ry: -12, dy: 0 },
  bones: {
    spine: [14, 10, 0],
    chest: [12, 14, 0],
    head: [-14, -12, 0],
    upperArmL: [-55, 18, 22],
    foreArmL: [-95, 0, -20],
    upperArmR: [-38, -10, -24],
    foreArmR: [-85, 0, 25],
    thighL: [-46, 8, 8],
    shinL: [62, 0, 0],
    footL: [-16, 0, 0],
    thighR: [22, -8, -8],
    shinR: [24, 0, 0],
    footR: [12, 0, 0],
  },
});
const WALK_STEP_B: Pose = mirrorPose(WALK_STEP_A);

export const TRACK_WALK_FWD: Track = {
  loop: 24,
  keys: [
    { f: 0, pose: WALK_STEP_A },
    { f: 6, pose: POSE_GINGA_MID },
    { f: 12, pose: WALK_STEP_B },
    { f: 18, pose: POSE_GINGA_MID },
  ],
};

export const TRACK_WALK_BACK: Track = {
  loop: 26,
  keys: [
    { f: 0, pose: WALK_STEP_B },
    { f: 13, pose: WALK_STEP_A },
  ],
};

export const TRACK_GUARD_HIGH: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_GINGA_MID, {
        root: { rx: -4, ry: -12 },
        bones: {
          spine: [14, 8, 0],
          chest: [14, 10, 0],
          head: [-12, -10, 0],
          upperArmL: [-82, 32, 10],
          foreArmL: [-115, 0, -28],
          upperArmR: [-82, -32, -10],
          foreArmR: [-115, 0, 28],
        },
      }),
    },
  ],
};

export const TRACK_GUARD_LOW: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_RLX_A, {
        bones: {
          upperArmL: [-72, 24, 10],
          foreArmL: [-110, 0, -22],
          upperArmR: [-72, -24, -10],
          foreArmR: [-110, 0, 22],
        },
      }),
    },
  ],
};

export const TRACK_HITSTUN_HIGH: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -24, ry: 12 },
        bones: {
          spine: [-22, 10, -6],
          chest: [-24, 12, -6],
          head: [-34, 8, 0],
          upperArmL: [-15, 0, 52],
          foreArmL: [-35, 0, 0],
          upperArmR: [-15, 0, -52],
          foreArmR: [-35, 0, 0],
          thighL: [-28, 6, 8],
          shinL: [42, 0, 0],
        },
      }),
    },
    {
      f: 12,
      easing: 'ease',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: -8 },
        bones: { spine: [-6, 0, 0], chest: [-6, 0, 0], head: [-8, 0, 0] },
      }),
    },
  ],
};

export const TRACK_HITSTUN_MID: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 22, ry: -10 },
        bones: {
          spine: [28, -8, 0],
          chest: [24, -10, 0],
          head: [18, 0, 0],
          upperArmL: [-55, 25, 10],
          foreArmL: [-95, 0, -30],
          upperArmR: [-55, -25, -10],
          foreArmR: [-95, 0, 30],
          thighL: [-42, 8, 10],
          shinL: [65, 0, 0],
          thighR: [-28, -8, -10],
          shinR: [50, 0, 0],
        },
      }),
    },
    {
      f: 12,
      easing: 'ease',
      pose: makePose(POSE_NEUTRAL, {
        root: { rx: 6 },
        bones: { spine: [8, 0, 0], chest: [8, 0, 0] },
      }),
    },
  ],
};

export const TRACK_HITSTUN = TRACK_HITSTUN_MID;

export const TRACK_AIR: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(POSE_NEUTRAL, {
        bones: {
          upperArmL: [-110, 0, 35],
          foreArmL: [-45, 0, 0],
          upperArmR: [-110, 0, -35],
          foreArmR: [-45, 0, 0],
          thighL: [-55, 0, 12],
          shinL: [85, 0, 0],
          thighR: [-30, 0, -12],
          shinR: [65, 0, 0],
        },
      }),
    },
  ],
};

export const TRACK_KNOCKDOWN: Track = {
  keys: [
    {
      f: 0,
      pose: makePose(null, {
        root: { rx: -85, ry: 0, rz: 0 },
        bones: {
          upperArmL: [-30, 0, 45],
          upperArmR: [-30, 0, -45],
          thighL: [-20, 0, 12],
          shinL: [35, 0, 0],
          thighR: [-10, 0, -12],
          shinR: [20, 0, 0],
        },
      }),
    },
  ],
};
